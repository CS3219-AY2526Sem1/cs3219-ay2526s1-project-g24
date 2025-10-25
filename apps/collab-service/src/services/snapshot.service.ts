import { prisma } from '../utils/prisma';
import { YjsService } from './yjs.service';
import { config } from '../config';
import { ErrorHandler, withRetry } from '../utils/errors';

/**
 * SnapshotService handles periodic saving of Y.Doc state to PostgreSQL
 * for long-term durability beyond Redis TTL
 */
export class SnapshotService {
    private static snapshotInterval: NodeJS.Timeout | null = null;
    private static readonly SNAPSHOT_INTERVAL_MS = config.snapshotIntervalMs;

    /**
     * Start periodic snapshot job
     */
    static startPeriodicSnapshots(): void {
        if (this.snapshotInterval) {
            console.log('⚠️  Snapshot job already running');
            return;
        }

        console.log(`📸 Starting periodic snapshots (every ${this.SNAPSHOT_INTERVAL_MS / 1000}s)`);

        // Run immediately on start
        void this.saveAllActiveSnapshots();

        // Then run periodically
        this.snapshotInterval = setInterval(() => {
            void this.saveAllActiveSnapshots();
        }, this.SNAPSHOT_INTERVAL_MS);
    }

    /**
     * Stop periodic snapshot job
     */
    static stopPeriodicSnapshots(): void {
        if (this.snapshotInterval) {
            clearInterval(this.snapshotInterval);
            this.snapshotInterval = null;
            console.log('✓ Stopped periodic snapshots');
        }
    }

    /**
     * Save snapshots for all active sessions
     */
    static async saveAllActiveSnapshots(): Promise<void> {
        try {
            const stats = YjsService.getStats();
            const activeSessions = stats.documents
                .filter(doc => doc.clients > 0) // Only save sessions with connected clients
                .map(doc => doc.sessionId);

            if (activeSessions.length === 0) {
                console.log('[Snapshot] No active sessions to snapshot');
                return;
            }

            console.log(`[Snapshot] Saving ${activeSessions.length} active session(s)...`);

            const results = await Promise.allSettled(
                activeSessions.map(sessionId => this.saveSnapshot(sessionId))
            );

            const succeeded = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            console.log(`[Snapshot] ✓ Saved ${succeeded} snapshot(s)${failed > 0 ? `, ${failed} failed` : ''}`);

        } catch (error) {
            console.error('[Snapshot] Error in saveAllActiveSnapshots:', error);
        }
    }

    /**
     * Save a single session snapshot to PostgreSQL
     */
    static async saveSnapshot(sessionId: string): Promise<void> {
        try {
            const state = YjsService.getState(sessionId);
            if (!state || state.length === 0) {
                console.warn(`[Snapshot] No state found for session ${sessionId}`);
                return;
            }

            // Get session from database with retry
            const session = await withRetry(
                async () => {
                    return await prisma.session.findUnique({
                        where: { sessionId },
                        select: { id: true },
                    });
                },
                3,
                `Find session ${sessionId}`
            );

            if (!session) {
                console.warn(`[Snapshot] Session ${sessionId} not found in database`);
                return;
            }

            // Get current version number (latest snapshot + 1)
            const latestSnapshot = await prisma.snapshot.findFirst({
                where: { sessionId: session.id },
                orderBy: { version: 'desc' },
                select: { version: true },
            });

            const nextVersion = latestSnapshot ? latestSnapshot.version + 1 : 1;

            // Save snapshot with retry
            await withRetry(
                async () => {
                    await prisma.snapshot.create({
                        data: {
                            sessionId: session.id,
                            yjsState: Buffer.from(state),
                            version: nextVersion,
                        },
                    });
                },
                3,
                `Save snapshot for ${sessionId}`
            );

            console.log(`[Snapshot] ✓ Saved snapshot for ${sessionId} (version ${nextVersion}, ${state.length} bytes)`);

            // Clean up old snapshots (keep only last 5)
            await this.cleanupOldSnapshots(session.id, 5);

        } catch (error) {
            ErrorHandler.logError(error, 'Snapshot save failed', { sessionId });
            throw ErrorHandler.handleSnapshotError(error, 'save', sessionId);
        }
    }

    /**
     * Load the latest snapshot for a session from PostgreSQL
     */
    static async loadLatestSnapshot(sessionId: string): Promise<Uint8Array | null> {
        try {
            // Get session from database
            const session = await prisma.session.findUnique({
                where: { sessionId },
                select: { id: true },
            });

            if (!session) {
                return null;
            }

            // Get latest snapshot
            const snapshot = await prisma.snapshot.findFirst({
                where: { sessionId: session.id },
                orderBy: { createdAt: 'desc' },
                select: { yjsState: true, version: true, createdAt: true },
            });

            if (!snapshot) {
                return null;
            }

            console.log(`[Snapshot] ✓ Loaded snapshot for ${sessionId} (version ${snapshot.version}, ${snapshot.yjsState.length} bytes, saved ${new Date(snapshot.createdAt).toISOString()})`);

            return new Uint8Array(snapshot.yjsState);

        } catch (error) {
            ErrorHandler.logError(error, 'Snapshot load failed', { sessionId });
            // Return null instead of throwing - document can start empty
            return null;
        }
    }

    /**
     * Clean up old snapshots, keeping only the most recent N
     */
    static async cleanupOldSnapshots(sessionIdPk: string, keepCount: number = 5): Promise<void> {
        try {
            // Get all snapshot IDs ordered by creation time
            const snapshots = await prisma.snapshot.findMany({
                where: { sessionId: sessionIdPk },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            });

            // If we have more than keepCount, delete the oldest ones
            if (snapshots.length > keepCount) {
                const toDelete = snapshots.slice(keepCount);
                const deleteIds = toDelete.map(s => s.id);

                await prisma.snapshot.deleteMany({
                    where: { id: { in: deleteIds } },
                });

                console.log(`[Snapshot] 🗑️  Cleaned up ${deleteIds.length} old snapshot(s) for session`);
            }

        } catch (error) {
            console.error('[Snapshot] Error cleaning up old snapshots:', error);
        }
    }

    /**
     * Get snapshot statistics
     */
    static async getStats(): Promise<{
        totalSnapshots: number;
        snapshotsBySessions: number;
        oldestSnapshot: Date | null;
        newestSnapshot: Date | null;
        totalSize: number;
    }> {
        try {
            const [totalSnapshots, sessionCount, oldestSnapshot, newestSnapshot] = await Promise.all([
                prisma.snapshot.count(),
                prisma.snapshot.groupBy({
                    by: ['sessionId'],
                    _count: true,
                }).then(result => result.length),
                prisma.snapshot.findFirst({
                    orderBy: { createdAt: 'asc' },
                    select: { createdAt: true },
                }),
                prisma.snapshot.findFirst({
                    orderBy: { createdAt: 'desc' },
                    select: { createdAt: true },
                }),
            ]);

            // Get total size (approximate, since Buffer.length might not be exact bytes)
            const snapshots = await prisma.snapshot.findMany({
                select: { yjsState: true },
            });
            const totalSize = snapshots.reduce((sum, s) => sum + s.yjsState.length, 0);

            return {
                totalSnapshots,
                snapshotsBySessions: sessionCount,
                oldestSnapshot: oldestSnapshot?.createdAt || null,
                newestSnapshot: newestSnapshot?.createdAt || null,
                totalSize,
            };

        } catch (error) {
            console.error('[Snapshot] Error getting stats:', error);
            return {
                totalSnapshots: 0,
                snapshotsBySessions: 0,
                oldestSnapshot: null,
                newestSnapshot: null,
                totalSize: 0,
            };
        }
    }

    /**
     * Manually trigger a snapshot save for a specific session
     */
    static async saveSnapshotManually(sessionId: string): Promise<boolean> {
        try {
            await this.saveSnapshot(sessionId);
            return true;
        } catch (error) {
            console.error(`[Snapshot] Manual snapshot failed for ${sessionId}:`, error);
            return false;
        }
    }
}

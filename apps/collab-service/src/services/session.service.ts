// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: October 20 - November 5, 2025
// Scope: Generated session management service with CRUD operations:
//   - SessionService.createSession(): Create new collaboration session
//   - SessionService.getSession(): Retrieve session by ID
//   - SessionService.updateSession(): Update session details
//   - SessionService.deleteSession(): Soft delete session
//   - SessionService.endSession(): Mark session as ended
//   - SessionService.getActiveSessions(): List active sessions by user
//   Database operations with Prisma ORM, validation, error handling
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added comprehensive validation for session creation
//   - Enhanced error handling and logging
//   - Integrated with YjsService for document initialization

import { prisma } from '../utils/prisma.js';
import { Session, CreateSessionRequest, AppError } from '../types/index.js';
import { YjsService } from './yjs.service.js';

/**
 * SessionService handles CRUD operations for collaboration sessions
 */
export class SessionService {
    /**
     * Create a new collaboration session
     */
    static async createSession(data: CreateSessionRequest): Promise<Session> {
        console.log(`[SessionService] Creating session:`, {
            sessionId: data.sessionId,
            user1Id: data.user1Id,
            user2Id: data.user2Id,
            questionId: data.questionId,
            difficulty: data.difficulty,
            topic: data.topic,
            language: data.language || 'python',
        });

        try {
            // Validate that sessionId doesn't already exist
            const existing = await prisma.session.findUnique({
                where: { sessionId: data.sessionId },
            });

            if (existing) {
                console.warn(`[SessionService] ⚠️  Session already exists: ${data.sessionId}`);
                throw new AppError('Session already exists', 409);
            }

            // Create session in database
            const session = await prisma.session.create({
                data: {
                    sessionId: data.sessionId,
                    user1Id: data.user1Id,
                    user2Id: data.user2Id,
                    questionId: data.questionId,
                    difficulty: data.difficulty,
                    topic: data.topic,
                    language: data.language || 'python',
                    status: 'ACTIVE',
                    lastActivityAt: new Date(),
                },
            });

            console.log(`[SessionService] ✓ Created session ${data.sessionId} for users ${data.user1Id} and ${data.user2Id}`);

            // Initialize Y.Doc for this session
            YjsService.getDocument(data.sessionId);
            console.log(`[SessionService] ✓ Initialized Y.Doc for session ${data.sessionId}`);

            // Schedule ghost session cleanup (delete if no one connects within 60 seconds)
            this.scheduleGhostSessionCleanup(data.sessionId);

            return session as Session;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('[SessionService] ❌ Failed to create session:', {
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
                data,
            });
            throw new AppError('Failed to create session', 500);
        }
    }

    /**
     * Get session by sessionId
     */
    static async getSession(sessionId: string): Promise<Session | null> {
        try {
            const session = await prisma.session.findUnique({
                where: { sessionId },
            });

            if (session) {
                console.log(`[SessionService] ✓ Found session ${sessionId}, status: ${session.status}`);
            } else {
                console.log(`[SessionService] ℹ️  Session not found: ${sessionId}`);
            }

            return session as Session | null;
        } catch (error) {
            console.error('[SessionService] ❌ Failed to get session:', {
                sessionId,
                error: error instanceof Error ? error.message : String(error),
            });
            throw new AppError('Failed to get session', 500);
        }
    }

    /**
     * Get session by ID (UUID)
     */
    static async getSessionById(id: string): Promise<Session | null> {
        try {
            const session = await prisma.session.findUnique({
                where: { id },
            });

            return session as Session | null;
        } catch (error) {
            console.error('Failed to get session by ID:', error);
            throw new AppError('Failed to get session', 500);
        }
    }

    /**
     * Check if user is a participant in the session
     */
    static async isParticipant(sessionId: string, userId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        if (!session) {
            console.log(`[SessionService] ℹ️  isParticipant check failed: session ${sessionId} not found`);
            return false;
        }

        const isParticipant = session.user1Id === userId || session.user2Id === userId;

        console.log(`[SessionService] isParticipant check: session=${sessionId}, userId=${userId}, result=${isParticipant}`, {
            user1Id: session.user1Id,
            user2Id: session.user2Id,
        });

        return isParticipant;
    }

    /**
     * Update session activity timestamp
     */
    static async updateActivity(sessionId: string): Promise<void> {
        try {
            await prisma.session.update({
                where: { sessionId },
                data: { lastActivityAt: new Date() },
            });
        } catch (error) {
            console.error('Failed to update session activity:', error);
            // Don't throw - this is not critical
        }
    }

    /**
     * Terminate a session
     * - Marks session as TERMINATED (prevents reconnection)
     * - Cleans up in-memory Y.Doc
     * - Clears Redis cache
     * - Keeps DB record for history
     */
    static async terminateSession(sessionId: string, userId: string): Promise<Session> {
        try {
            // Verify user is participant
            const isParticipant = await this.isParticipant(sessionId, userId);
            if (!isParticipant) {
                throw new AppError('User is not a participant in this session', 403);
            }

            // Update session status
            const session = await prisma.session.update({
                where: { sessionId },
                data: {
                    status: 'TERMINATED',
                    terminatedAt: new Date(),
                },
            });

            console.log(`❌ Session ${sessionId} terminated by ${userId}`);

            // Clean up Y.Doc from memory and Redis cache
            await YjsService.deleteDocument(sessionId);

            return session as Session;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Failed to terminate session:', error);
            throw new AppError('Failed to terminate session', 500);
        }
    }

    /**
     * Completely delete a session
     * - Removes from database (and cascades to snapshots)
     * - Cleans up in-memory Y.Doc
     * - Clears Redis cache
     * Used for cleanup/rollback scenarios
     */
    static async deleteSession(sessionId: string): Promise<void> {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                console.log(`[SessionService] ℹ️  Session ${sessionId} not found, already deleted`);
                return; // Idempotent - already deleted
            }

            console.log(`🗑️  Deleting session ${sessionId} completely`);

            // Clean up Y.Doc from memory and Redis cache
            await YjsService.deleteDocument(sessionId);

            // Delete from database (cascades to snapshots)
            await prisma.session.delete({
                where: { sessionId },
            });

            console.log(`✓ Session ${sessionId} completely removed from database`);
        } catch (error) {
            console.error('[SessionService] Failed to delete session:', error);
            throw new AppError('Failed to delete session', 500);
        }
    }

    /**
     * Mark a user as disconnected from the session
     * If both users disconnect, terminate the session
     * Uses transaction to prevent race conditions during simultaneous disconnects
     */
    static async leaveSession(sessionId: string, userId: string): Promise<Session> {
        try {
            // Use a transaction to atomically check and delete if both users disconnect
            // This prevents race conditions where both users disconnect simultaneously
            const result = await prisma.$transaction(async (tx) => {
                // Get session with lock (prevents concurrent modifications)
                const session = await tx.session.findUnique({
                    where: { sessionId },
                });

                if (!session) {
                    throw new AppError('Session not found', 404);
                }

                const isUser1 = session.user1Id === userId;
                const isUser2 = session.user2Id === userId;

                if (!isUser1 && !isUser2) {
                    throw new AppError('User is not a participant in this session', 403);
                }

                // Mark the user as disconnected
                const updateData: { user1Connected?: boolean; user2Connected?: boolean; lastActivityAt?: Date } = {};
                if (isUser1) {
                    updateData.user1Connected = false;
                } else {
                    updateData.user2Connected = false;
                }

                // Update lastActivityAt to enable grace period for rejoin prevention
                updateData.lastActivityAt = new Date();

                const updatedSession = await tx.session.update({
                    where: { sessionId },
                    data: updateData,
                });

                console.log(`👋 User ${userId} left session ${sessionId}`);

                // Check if both users have disconnected
                // Type assertion needed as Prisma types may not be up to date
                const sessionWithConnections = updatedSession as any;
                const bothDisconnected = !sessionWithConnections.user1Connected && !sessionWithConnections.user2Connected;

                if (bothDisconnected) {
                    console.log(`🔚 Both users disconnected from session ${sessionId}, deleting session...`);

                    // Delete the session from the database within transaction
                    await tx.session.delete({
                        where: { sessionId },
                    });

                    console.log(`🗑️  Session ${sessionId} completely removed from database`);
                }

                return { session: updatedSession as Session, wasDeleted: bothDisconnected };
            });

            // Clean up Y.Doc from memory after transaction commits
            if (result.wasDeleted) {
                await YjsService.deleteDocument(sessionId);
            }

            return result.session;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Failed to leave session:', error);
            throw new AppError('Failed to leave session', 500);
        }
    }

    /**
     * Mark a user as reconnected to the session
     */
    static async rejoinSession(sessionId: string, userId: string): Promise<Session> {
        try {
            const session = await this.getSession(sessionId);
            if (!session) {
                throw new AppError('Session not found', 404);
            }

            const isUser1 = session.user1Id === userId;
            const isUser2 = session.user2Id === userId;

            if (!isUser1 && !isUser2) {
                throw new AppError('User is not a participant in this session', 403);
            }

            // Can't rejoin a terminated session
            if (session.status === 'TERMINATED') {
                throw new AppError('Cannot rejoin a terminated session', 400);
            }

            // Prevent race condition: If partner recently disconnected, don't allow rejoin
            // Check if the OTHER user is still connected
            const partnerConnected = isUser1
                ? (session as any).user2Connected
                : (session as any).user1Connected;

            if (!partnerConnected) {
                // Partner has disconnected - check how recently
                const lastActivityTime = new Date(session.lastActivityAt).getTime();
                const now = Date.now();
                const timeSinceActivity = now - lastActivityTime;

                // If partner disconnected recently (within 10 seconds), prevent rejoin
                // This prevents the race where user disconnects then immediately reconnects
                // before partner disconnects, which would prevent session deletion
                const REJOIN_GRACE_PERIOD_MS = 10000; // 10 seconds

                if (timeSinceActivity < REJOIN_GRACE_PERIOD_MS) {
                    console.warn(`[SessionService] ⚠️ Partner recently disconnected, preventing rejoin to allow session cleanup`, {
                        sessionId,
                        userId,
                        timeSinceActivity,
                        gracePeriod: REJOIN_GRACE_PERIOD_MS,
                    });
                    throw new AppError('Partner has disconnected. Please wait before rejoining or start a new session.', 400);
                }
            }

            // Mark the user as connected
            const updateData: { user1Connected?: boolean; user2Connected?: boolean } = {};
            if (isUser1) {
                updateData.user1Connected = true;
            } else {
                updateData.user2Connected = true;
            }

            const updatedSession = await prisma.session.update({
                where: { sessionId },
                data: updateData,
            });

            console.log(`🔄 User ${userId} rejoined session ${sessionId}`);

            return updatedSession as Session;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Failed to rejoin session:', error);
            throw new AppError('Failed to rejoin session', 500);
        }
    }

    /**
     * Check if session can be rejoined (within timeout period)
     * Users have 10 minutes to rejoin after disconnect before session becomes inaccessible
     */
    static async canRejoin(sessionId: string, userId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        if (!session) return false;

        // Check if user is participant
        const isParticipant = session.user1Id === userId || session.user2Id === userId;
        if (!isParticipant) return false;

        // Check if session is still active
        if (session.status !== 'ACTIVE') return false;

        // Check if within timeout period (10 minutes)
        const now = Date.now();
        const lastActivity = new Date(session.lastActivityAt).getTime();
        const timeoutMs = 600000; // 10 minutes

        return (now - lastActivity) < timeoutMs;
    }

    /**
     * Get active sessions for a user
     */
    static async getUserActiveSessions(userId: string): Promise<Session[]> {
        try {
            const sessions = await prisma.session.findMany({
                where: {
                    OR: [
                        { user1Id: userId },
                        { user2Id: userId },
                    ],
                    status: 'ACTIVE',
                },
                orderBy: { createdAt: 'desc' },
            });

            return sessions as Session[];
        } catch (error) {
            console.error('Failed to get user sessions:', error);
            throw new AppError('Failed to get user sessions', 500);
        }
    }

    /**
     * Get session statistics
     */
    static async getStats(): Promise<{
        total: number;
        active: number;
        terminated: number;
        expired: number;
    }> {
        try {
            const [total, active, terminated, expired] = await Promise.all([
                prisma.session.count(),
                prisma.session.count({ where: { status: 'ACTIVE' } }),
                prisma.session.count({ where: { status: 'TERMINATED' } }),
                prisma.session.count({ where: { status: 'EXPIRED' } }),
            ]);

            return { total, active, terminated, expired };
        } catch (error) {
            console.error('Failed to get session stats:', error);
            throw new AppError('Failed to get session stats', 500);
        }
    }

    /**
     * Find and expire stale sessions (no activity for > timeout period)
     * This handles AFK scenarios where users leave the session open but inactive
     */
    static async expireStaleSessions(): Promise<number> {
        try {
            const timeoutMs = 1800000; // 30 minutes of inactivity
            const cutoffTime = new Date(Date.now() - timeoutMs);

            const result = await prisma.session.updateMany({
                where: {
                    status: 'ACTIVE',
                    lastActivityAt: {
                        lt: cutoffTime,
                    },
                },
                data: {
                    status: 'EXPIRED',
                    terminatedAt: new Date(),
                },
            });

            if (result.count > 0) {
                console.log(`⏱️  Expired ${result.count} stale session(s) (inactive > 30 minutes)`);
            }

            return result.count;
        } catch (error) {
            console.error('Failed to expire stale sessions:', error);
            return 0;
        }
    }

    // Periodic cleanup state
    private static cleanupInterval: NodeJS.Timeout | null = null;
    private static readonly CLEANUP_INTERVAL_MS = 300000; // Check every 5 minutes

    /**
     * Start periodic session cleanup
     * Runs expireStaleSessions every 5 minutes to clean up inactive sessions
     */
    static startPeriodicCleanup(): void {
        if (this.cleanupInterval) {
            console.log('⚠️  Session cleanup already running');
            return;
        }

        console.log(`🧹 Starting periodic session cleanup (every ${this.CLEANUP_INTERVAL_MS / 1000}s)`);

        // Run immediately on start
        this.expireStaleSessions();

        // Then run periodically
        this.cleanupInterval = setInterval(() => {
            this.expireStaleSessions();
        }, this.CLEANUP_INTERVAL_MS);
    }

    /**
     * Stop periodic session cleanup
     */
    static stopPeriodicCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
            console.log('✓ Stopped periodic session cleanup');
        }
    }

    /**
     * Get partner user ID in a session
     */
    static async getPartner(sessionId: string, userId: string): Promise<string | null> {
        const session = await this.getSession(sessionId);
        if (!session) return null;

        if (session.user1Id === userId) return session.user2Id;
        if (session.user2Id === userId) return session.user1Id;

        return null;
    }

    /**
     * Schedule automatic cleanup of ghost sessions (sessions where no one connects).
     * After 60 seconds, if the session still exists and has had no WebSocket connections,
     * it will be automatically deleted.
     */
    private static scheduleGhostSessionCleanup(sessionId: string): void {
        const GHOST_SESSION_TIMEOUT_MS = 60000; // 60 seconds

        setTimeout(async () => {
            try {
                const session = await this.getSession(sessionId);
                
                // Session already deleted or terminated - nothing to do
                if (!session || session.status !== 'ACTIVE') {
                    return;
                }

                // Check if anyone has connected (by checking if Y.Doc has any clients)
                const hasConnections = YjsService.hasActiveClients(sessionId);
                
                if (!hasConnections) {
                    console.warn(`👻 Ghost session detected: ${sessionId} (no connections after ${GHOST_SESSION_TIMEOUT_MS}ms)`);
                    console.log(`🗑️  Deleting ghost session ${sessionId}`);
                    
                    await this.deleteSession(sessionId);
                    
                    console.log(`✅ Ghost session ${sessionId} cleaned up`);
                } else {
                    // If someone connected, schedule solo session cleanup check
                    this.scheduleSoloSessionCleanup(sessionId);
                }
            } catch (error) {
                console.error(`Failed to cleanup ghost session ${sessionId}:`, error);
            }
        }, GHOST_SESSION_TIMEOUT_MS);
    }

    /**
     * Schedule automatic cleanup of solo sessions (where only 1 user is connected).
     * After 5 minutes, if still only 1 user, terminate the session.
     * User receives a warning after 4 minutes.
     */
    private static scheduleSoloSessionCleanup(sessionId: string): void {
        const SOLO_WARNING_MS = 240000; // 4 minutes
        const SOLO_TIMEOUT_MS = 300000; // 5 minutes

        // Warning after 4 minutes
        setTimeout(async () => {
            try {
                const session = await this.getSession(sessionId);
                if (!session || session.status !== 'ACTIVE') return;

                const clientCount = YjsService.getClientCount(sessionId);
                if (clientCount === 1) {
                    console.warn(`⚠️  Solo session warning: ${sessionId} (1 user for 4 minutes)`);
                    // The warning will be handled by the frontend via WebSocket awareness
                }
            } catch (error) {
                console.error(`Failed to warn solo session ${sessionId}:`, error);
            }
        }, SOLO_WARNING_MS);

        // Terminate after 5 minutes
        setTimeout(async () => {
            try {
                const session = await this.getSession(sessionId);
                if (!session || session.status !== 'ACTIVE') return;

                const clientCount = YjsService.getClientCount(sessionId);
                if (clientCount === 1) {
                    console.warn(`⏱️  Solo session timeout: ${sessionId} (only 1 user after 5 minutes)`);
                    await this.terminateSessionBySystem(sessionId, 'Partner never joined - session expired');
                    console.log(`✅ Solo session ${sessionId} terminated`);
                }
            } catch (error) {
                console.error(`Failed to terminate solo session ${sessionId}:`, error);
            }
        }, SOLO_TIMEOUT_MS);
    }

    /**
     * System-initiated session termination (no user authorization needed)
     * Used for timeouts and cleanup operations
     */
    private static async terminateSessionBySystem(sessionId: string, reason: string): Promise<void> {
        try {
            const session = await this.getSession(sessionId);
            if (!session || session.status !== 'ACTIVE') return;

            await prisma.session.update({
                where: { sessionId },
                data: {
                    status: 'TERMINATED',
                    terminatedAt: new Date(),
                },
            });

            console.log(`🔚 Session ${sessionId} terminated by system: ${reason}`);

            // Clean up Y.Doc and notify via WebSocket
            await YjsService.deleteDocument(sessionId);

            // Import and notify via WebSocket
            try {
                const { getWebSocketHandler } = await import('../websocket/handler.js');
                const wsHandler = getWebSocketHandler();
                if (wsHandler) {
                    wsHandler.closeSessionConnections(sessionId, reason);
                }
            } catch (error) {
                console.error('Failed to notify WebSocket clients:', error);
            }
        } catch (error) {
            console.error(`Failed to terminate session ${sessionId}:`, error);
        }
    }
}

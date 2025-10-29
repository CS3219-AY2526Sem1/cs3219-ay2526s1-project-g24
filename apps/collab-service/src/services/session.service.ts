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

            // Clean up Y.Doc from memory
            YjsService.deleteDocument(sessionId);

            return session as Session;
        } catch (error) {
            if (error instanceof AppError) throw error;
            console.error('Failed to terminate session:', error);
            throw new AppError('Failed to terminate session', 500);
        }
    }

    /**
     * Check if session can be rejoined (within timeout period)
     */
    static async canRejoin(sessionId: string, userId: string): Promise<boolean> {
        const session = await this.getSession(sessionId);
        if (!session) return false;

        // Check if user is participant
        const isParticipant = session.user1Id === userId || session.user2Id === userId;
        if (!isParticipant) return false;

        // Check if session is still active
        if (session.status !== 'ACTIVE') return false;

        // Check if within timeout period
        const now = Date.now();
        const lastActivity = new Date(session.lastActivityAt).getTime();
        const timeoutMs = 120000; // 2 minutes

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
     */
    static async expireStaleSessions(): Promise<number> {
        try {
            const timeoutMs = 120000; // 2 minutes
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
                console.log(`⏱️  Expired ${result.count} stale session(s)`);
            }

            return result.count;
        } catch (error) {
            console.error('Failed to expire stale sessions:', error);
            return 0;
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
}

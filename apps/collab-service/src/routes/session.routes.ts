import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { SessionService } from '../services/session.service.js';
import { YjsService } from '../services/yjs.service.js';
import { CreateSessionRequest, AppError } from '../types/index.js';
import { z, ZodError } from 'zod';
import { validate as validateUuid } from 'uuid';
import { getRedisClient } from '../utils/redis.js';
import * as Y from 'yjs';

const router: Router = Router();

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
    };
}

const NON_UUID_USER_ID_REGEX = /^[A-Za-z0-9_.:@\-|]+$/;

// Accept UUIDs (preferred) and fall back to service-issued identifiers that use safe characters
const userIdSchema = z.string().trim().min(1).max(128).refine((value) => {
    if (validateUuid(value)) return true;
    return NON_UUID_USER_ID_REGEX.test(value);
}, {
    message: 'Invalid user ID format. Expected UUID or service-issued identifier.',
});

// Validation schemas
const createSessionSchema = z.object({
    user1Id: userIdSchema,
    user2Id: userIdSchema,
    questionId: z.string(),
    difficulty: z.string(),
    topic: z.string().optional(),
    language: z.string().optional(),
});

// Create a new collaboration session
router.post('/sessions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('[POST /sessions] Creating new session, body:', JSON.stringify(req.body, null, 2));

        const validatedData = createSessionSchema.parse(req.body);

        if (!validateUuid(validatedData.user1Id) || !validateUuid(validatedData.user2Id)) {
            console.warn('[POST /sessions] ℹ️  Non-UUID user IDs detected (accepted)', {
                user1Id: validatedData.user1Id,
                user2Id: validatedData.user2Id,
            });
        }
        const authReq = req as AuthenticatedRequest;

        console.log('[POST /sessions] Validated data:', validatedData);
        console.log('[POST /sessions] Authenticated user:', authReq.user?.userId);

        // Ensure the requesting user is one of the participants
        if (authReq.user.userId !== validatedData.user1Id && authReq.user.userId !== validatedData.user2Id) {
            console.warn('[POST /sessions] ⚠️  Unauthorized: user is not a participant', {
                userId: authReq.user.userId,
                user1Id: validatedData.user1Id,
                user2Id: validatedData.user2Id,
            });
            throw new AppError('Unauthorized: You must be a participant in the session', 403);
        }

        // Generate a unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        console.log('[POST /sessions] Generated sessionId:', sessionId);

        const session = await SessionService.createSession({
            sessionId,
            user1Id: validatedData.user1Id,
            user2Id: validatedData.user2Id,
            questionId: validatedData.questionId,
            difficulty: validatedData.difficulty,
            topic: validatedData.topic || validatedData.questionId,
            language: validatedData.language,
        } as CreateSessionRequest);

        console.log('[POST /sessions] ✓ Session created successfully:', sessionId);

        res.status(201).json({
            message: 'Session created successfully',
            data: session,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            console.warn('[POST /sessions] ❌ Validation failed:', error.issues);
            return next(new AppError('Invalid session payload', 400));
        }

        console.error('[POST /sessions] ❌ Error:', {
            error: error instanceof Error ? error.message : String(error),
            body: req.body,
        });
        next(error);
    }
});

// Get session details
router.get('/sessions/:sessionId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const authReq = req as AuthenticatedRequest;

        console.log('[GET /sessions/:sessionId] Request:', {
            sessionId,
            userId: authReq.user?.userId,
        });

        const session = await SessionService.getSession(sessionId);
        if (!session) {
            console.warn('[GET /sessions/:sessionId] ⚠️  Session not found:', sessionId);
            throw new AppError('Session not found', 404);
        }

        // Verify user is a participant
        const isParticipant = await SessionService.isParticipant(sessionId, authReq.user.userId);
        if (!isParticipant) {
            console.warn('[GET /sessions/:sessionId] ⚠️  Unauthorized access attempt:', {
                sessionId,
                userId: authReq.user.userId,
            });
            throw new AppError('Unauthorized: You are not a participant in this session', 403);
        }

        console.log('[GET /sessions/:sessionId] ✓ Session retrieved:', sessionId);

        res.status(200).json({
            message: 'Session retrieved successfully',
            data: session,
        });
    } catch (error) {
        console.error('[GET /sessions/:sessionId] ❌ Error:', {
            error: error instanceof Error ? error.message : String(error),
            sessionId: req.params.sessionId,
        });
        next(error);
    }
});

// Terminate a session
router.post('/sessions/:sessionId/terminate', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const authReq = req as AuthenticatedRequest;

        await SessionService.terminateSession(sessionId, authReq.user.userId);

        res.status(200).json({
            message: 'Session terminated successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Rejoin a session after disconnection
router.post('/sessions/:sessionId/rejoin', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const authReq = req as AuthenticatedRequest;

        const canRejoin = await SessionService.canRejoin(sessionId, authReq.user.userId);

        if (!canRejoin) {
            throw new AppError('Cannot rejoin session: Session expired or you are not a participant', 403);
        }

        const session = await SessionService.getSession(sessionId);

        res.status(200).json({
            message: 'Rejoin authorized',
            data: session,
        });
    } catch (error) {
        next(error);
    }
});

// Get session snapshot (current Y.Doc state)
router.get('/sessions/:sessionId/snapshot', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const authReq = req as AuthenticatedRequest;

        // Verify session exists and user is participant
        const session = await SessionService.getSession(sessionId);
        if (!session) {
            throw new AppError('Session not found', 404);
        }

        const isParticipant = await SessionService.isParticipant(sessionId, authReq.user.userId);
        if (!isParticipant) {
            throw new AppError('Unauthorized: You are not a participant in this session', 403);
        }

        // Get current Y.Doc state if document exists in memory
        const hasDocument = YjsService.hasDocument(sessionId);
        let state = YjsService.getState(sessionId);
        let code = YjsService.getCode(sessionId);
        let metadata = YjsService.getMetadata(sessionId);

        // If no in-memory document, try to load from Redis cache
        if (!hasDocument) {
            try {
                const redis = getRedisClient();
                const stateKey = `session:${sessionId}:state`;
                const cachedState = await redis.get(stateKey);

                if (cachedState) {
                    const stateBuffer = Buffer.from(cachedState, 'base64');

                    // Create temporary Y.Doc to extract code and metadata
                    const tempDoc = new Y.Doc();
                    Y.applyUpdate(tempDoc, new Uint8Array(stateBuffer));

                    const text = tempDoc.getText('code');
                    code = text.toString();

                    const map = tempDoc.getMap('metadata');
                    metadata = map.toJSON();

                    state = new Uint8Array(stateBuffer);

                    console.log(`[Redis] ✓ Retrieved snapshot for ${sessionId} from cache`);
                } else {
                    throw new AppError('No active document found for this session', 404);
                }
            } catch (err) {
                if (err instanceof AppError) throw err;
                console.warn(`[Redis] Failed to retrieve snapshot for ${sessionId}:`, err);
                throw new AppError('No active document found for this session', 404);
            }
        }

        res.status(200).json({
            message: 'Snapshot retrieved successfully',
            data: {
                sessionId,
                code,
                metadata,
                stateVector: state ? Array.from(state) : [], // Convert Uint8Array to regular array for JSON
                timestamp: new Date().toISOString(),
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get user's active sessions
router.get('/sessions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthenticatedRequest;
        const sessions = await SessionService.getUserActiveSessions(authReq.user.userId);

        res.status(200).json({
            message: 'Active sessions retrieved successfully',
            data: sessions,
        });
    } catch (error) {
        next(error);
    }
});

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { SessionService } from '../services/session.service';
import { YjsService } from '../services/yjs.service';
import { CreateSessionRequest, AppError } from '../types';
import { z } from 'zod';

const router: Router = Router();

interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
    };
}

// Validation schemas
const createSessionSchema = z.object({
    user1Id: z.string().uuid(),
    user2Id: z.string().uuid(),
    questionId: z.string(),
    difficulty: z.string(),
    topic: z.string().optional(),
    language: z.string().optional(),
});

// Create a new collaboration session
router.post('/sessions', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validatedData = createSessionSchema.parse(req.body);
        const authReq = req as AuthenticatedRequest;

        // Ensure the requesting user is one of the participants
        if (authReq.user.userId !== validatedData.user1Id && authReq.user.userId !== validatedData.user2Id) {
            throw new AppError('Unauthorized: You must be a participant in the session', 403);
        }

        // Generate a unique session ID
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        const session = await SessionService.createSession({
            sessionId,
            user1Id: validatedData.user1Id,
            user2Id: validatedData.user2Id,
            questionId: validatedData.questionId,
            difficulty: validatedData.difficulty,
            topic: validatedData.topic || validatedData.questionId,
            language: validatedData.language,
        } as CreateSessionRequest);

        res.status(201).json({
            message: 'Session created successfully',
            data: session,
        });
    } catch (error) {
        next(error);
    }
});

// Get session details
router.get('/sessions/:sessionId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sessionId } = req.params;
        const authReq = req as AuthenticatedRequest;

        const session = await SessionService.getSession(sessionId);
        if (!session) {
            throw new AppError('Session not found', 404);
        }

        // Verify user is a participant
        const isParticipant = await SessionService.isParticipant(sessionId, authReq.user.userId);
        if (!isParticipant) {
            throw new AppError('Unauthorized: You are not a participant in this session', 403);
        }

        res.status(200).json({
            message: 'Session retrieved successfully',
            data: session,
        });
    } catch (error) {
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

        // Get current Y.Doc state if document exists
        const hasDocument = YjsService.hasDocument(sessionId);
        if (!hasDocument) {
            throw new AppError('No active document found for this session', 404);
        }

        const state = YjsService.getState(sessionId);
        const code = YjsService.getCode(sessionId);
        const metadata = YjsService.getMetadata(sessionId);

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

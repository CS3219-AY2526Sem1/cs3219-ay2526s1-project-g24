/**
 * Unit tests for session routes
 */

import request from 'supertest';
import express, { Express } from 'express';
import sessionRoutes from '../session.routes.js';
import { createMockSession } from '../../__tests__/helpers/test-utils.js';
import { AppError } from '../../types/index.js';

// Mock the services
jest.mock('../../services/session.service.js', () => ({
    SessionService: {
        createSession: jest.fn(),
        getSession: jest.fn(),
        isParticipant: jest.fn(),
        terminateSession: jest.fn(),
        canRejoin: jest.fn(),
        getUserActiveSessions: jest.fn(),
    },
}));

jest.mock('../../services/yjs.service.js', () => ({
    YjsService: {
        hasDocument: jest.fn(),
        getState: jest.fn(),
        getCode: jest.fn(),
        getMetadata: jest.fn(),
    },
}));

jest.mock('../../utils/redis.js', () => ({
    getRedisClient: jest.fn(() => ({
        get: jest.fn(),
    })),
}));

// Mock authentication middleware
jest.mock('../../middleware/auth.js', () => ({
    authenticate: (req: any, _res: any, next: any) => {
        req.user = { userId: 'user-1', email: 'user1@test.com' };
        next();
    },
}));

import { SessionService } from '../../services/session.service.js';
import { YjsService } from '../../services/yjs.service.js';

describe('Session Routes', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api', sessionRoutes);
        jest.clearAllMocks();
    });

    describe('POST /api/sessions', () => {
        it('should create a new session', async () => {
            const mockSession = createMockSession({
                sessionId: 'session_123',
                user1Id: 'user-1',
                user2Id: 'user-2',
            });

            (SessionService.createSession as jest.Mock).mockResolvedValue(mockSession);

            const response = await request(app)
                .post('/api/sessions')
                .send({
                    user1Id: 'user-1',
                    user2Id: 'user-2',
                    questionId: 'question-1',
                    difficulty: 'MEDIUM',
                    topic: 'Arrays',
                    language: 'python',
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Session created successfully');
            expect(response.body.data).toBeDefined();
            expect(SessionService.createSession).toHaveBeenCalled();
        });

        it('should reject if user is not a participant', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .send({
                    user1Id: 'user-2',
                    user2Id: 'user-3',
                    questionId: 'question-1',
                    difficulty: 'MEDIUM',
                });

            expect(response.status).toBe(403);
            expect(SessionService.createSession).not.toHaveBeenCalled();
        });

        it('should reject invalid payload', async () => {
            const response = await request(app)
                .post('/api/sessions')
                .send({
                    user1Id: 'user-1',
                    // Missing required fields
                });

            expect(response.status).toBe(400);
            expect(SessionService.createSession).not.toHaveBeenCalled();
        });
    });

    describe('GET /api/sessions/:sessionId', () => {
        it('should retrieve session details', async () => {
            const mockSession = createMockSession({
                sessionId: 'session_123',
                user1Id: 'user-1',
            });

            (SessionService.getSession as jest.Mock).mockResolvedValue(mockSession);
            (SessionService.isParticipant as jest.Mock).mockResolvedValue(true);

            const response = await request(app).get('/api/sessions/session_123');

            expect(response.status).toBe(200);
            expect(response.body.data).toBeDefined();
            expect(SessionService.getSession).toHaveBeenCalledWith('session_123');
        });

        it('should return 404 if session not found', async () => {
            (SessionService.getSession as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/api/sessions/nonexistent');

            expect(response.status).toBe(404);
        });

        it('should reject unauthorized access', async () => {
            const mockSession = createMockSession({
                sessionId: 'session_123',
                user1Id: 'user-2',
                user2Id: 'user-3',
            });

            (SessionService.getSession as jest.Mock).mockResolvedValue(mockSession);
            (SessionService.isParticipant as jest.Mock).mockResolvedValue(false);

            const response = await request(app).get('/api/sessions/session_123');

            expect(response.status).toBe(403);
        });
    });

    describe('POST /api/sessions/:sessionId/terminate', () => {
        it('should terminate session', async () => {
            const mockSession = createMockSession({
                sessionId: 'session_123',
                status: 'TERMINATED',
            });

            (SessionService.terminateSession as jest.Mock).mockResolvedValue(mockSession);

            const response = await request(app).post('/api/sessions/session_123/terminate');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Session terminated successfully');
            expect(SessionService.terminateSession).toHaveBeenCalledWith('session_123', 'user-1');
        });

        it('should handle errors', async () => {
            (SessionService.terminateSession as jest.Mock).mockRejectedValue(
                new AppError('Cannot terminate session', 500)
            );

            const response = await request(app)
                .post('/api/sessions/session_123/terminate')
                .set('Authorization', 'Bearer valid-token');

            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/sessions/:sessionId/rejoin', () => {
        it('should allow rejoin for valid session', async () => {
            const mockSession = createMockSession({ sessionId: 'session_123' });

            (SessionService.canRejoin as jest.Mock).mockResolvedValue(true);
            (SessionService.getSession as jest.Mock).mockResolvedValue(mockSession);

            const response = await request(app).post('/api/sessions/session_123/rejoin');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Rejoin authorized');
            expect(SessionService.canRejoin).toHaveBeenCalledWith('session_123', 'user-1');
        });

        it('should reject if cannot rejoin', async () => {
            (SessionService.canRejoin as jest.Mock).mockResolvedValue(false);

            const response = await request(app).post('/api/sessions/session_123/rejoin');

            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/sessions/:sessionId/snapshot', () => {
        it('should retrieve session snapshot', async () => {
            const mockSession = createMockSession({ sessionId: 'session_123' });

            (SessionService.getSession as jest.Mock).mockResolvedValue(mockSession);
            (SessionService.isParticipant as jest.Mock).mockResolvedValue(true);
            (YjsService.hasDocument as jest.Mock).mockReturnValue(true);
            (YjsService.getState as jest.Mock).mockReturnValue(new Uint8Array([1, 2, 3]));
            (YjsService.getCode as jest.Mock).mockReturnValue('console.log("test")');
            (YjsService.getMetadata as jest.Mock).mockReturnValue({ language: 'python' });

            const response = await request(app).get('/api/sessions/session_123/snapshot');

            expect(response.status).toBe(200);
            expect(response.body.data.code).toBe('console.log("test")');
            expect(response.body.data.metadata).toEqual({ language: 'python' });
        });

        it('should return 404 if session not found', async () => {
            (SessionService.getSession as jest.Mock).mockResolvedValue(null);

            const response = await request(app).get('/api/sessions/nonexistent/snapshot');

            expect(response.status).toBe(404);
        });

        it('should reject unauthorized access', async () => {
            const mockSession = createMockSession();
            (SessionService.getSession as jest.Mock).mockResolvedValue(mockSession);
            (SessionService.isParticipant as jest.Mock).mockResolvedValue(false);

            const response = await request(app).get('/api/sessions/session_123/snapshot');

            expect(response.status).toBe(403);
        });
    });

    describe('GET /api/sessions', () => {
        it('should retrieve user active sessions', async () => {
            const mockSessions = [
                createMockSession({ sessionId: 'session_1' }),
                createMockSession({ sessionId: 'session_2' }),
            ];

            (SessionService.getUserActiveSessions as jest.Mock).mockResolvedValue(mockSessions);

            const response = await request(app).get('/api/sessions');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(2);
            expect(SessionService.getUserActiveSessions).toHaveBeenCalledWith('user-1');
        });

        it('should return empty array if no active sessions', async () => {
            (SessionService.getUserActiveSessions as jest.Mock).mockResolvedValue([]);

            const response = await request(app).get('/api/sessions');

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveLength(0);
        });
    });
});

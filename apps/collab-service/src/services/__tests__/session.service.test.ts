/**
 * Unit tests for SessionService
 */

import { mockPrismaClient, resetPrismaMocks } from '../../__mocks__/prisma.js';
import { createMockSession } from '../../__tests__/helpers/test-utils.js';
import { AppError } from '../../types/index.js';

// Mock Prisma client
jest.mock('../../utils/prisma.js', () => ({
  prisma: mockPrismaClient,
}));

// Mock the YjsService
jest.mock('../yjs.service.js', () => ({
  YjsService: {
    getDocument: jest.fn(),
    deleteDocument: jest.fn(),
  },
}));

import { SessionService } from '../session.service.js';
import { YjsService } from '../yjs.service.js';

describe('SessionService', () => {
  beforeEach(() => {
    resetPrismaMocks();
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a new session successfully', async () => {
      const sessionData = {
        sessionId: 'session_123',
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
        difficulty: 'MEDIUM',
        topic: 'Arrays',
        language: 'python',
      };

      const mockSession = createMockSession(sessionData);

      mockPrismaClient.session.findUnique.mockResolvedValue(null);
      mockPrismaClient.session.create.mockResolvedValue(mockSession);

      const result = await SessionService.createSession(sessionData);

      expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
        where: { sessionId: sessionData.sessionId },
      });
      expect(mockPrismaClient.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          sessionId: sessionData.sessionId,
          user1Id: sessionData.user1Id,
          user2Id: sessionData.user2Id,
          questionId: sessionData.questionId,
          difficulty: sessionData.difficulty,
          topic: sessionData.topic,
          language: sessionData.language,
          status: 'ACTIVE',
        }),
      });
      expect(YjsService.getDocument).toHaveBeenCalledWith(sessionData.sessionId);
      expect(result).toEqual(mockSession);
    });

    it('should throw error if session already exists', async () => {
      const sessionData = {
        sessionId: 'session_123',
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
        difficulty: 'MEDIUM',
        topic: 'Arrays',
      };

      const existingSession = createMockSession(sessionData);
      mockPrismaClient.session.findUnique.mockResolvedValue(existingSession);

      await expect(SessionService.createSession(sessionData)).rejects.toThrow(AppError);
      await expect(SessionService.createSession(sessionData)).rejects.toThrow('Session already exists');

      expect(mockPrismaClient.session.create).not.toHaveBeenCalled();
    });

    it('should use default language if not provided', async () => {
      const sessionData = {
        sessionId: 'session_123',
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
        difficulty: 'MEDIUM',
        topic: 'Arrays',
      };

      const mockSession = createMockSession({ ...sessionData, language: 'python' });

      mockPrismaClient.session.findUnique.mockResolvedValue(null);
      mockPrismaClient.session.create.mockResolvedValue(mockSession);

      await SessionService.createSession(sessionData);

      expect(mockPrismaClient.session.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          language: 'python',
        }),
      });
    });

    it('should handle database errors gracefully', async () => {
      const sessionData = {
        sessionId: 'session_123',
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
        difficulty: 'MEDIUM',
        topic: 'Arrays',
      };

      mockPrismaClient.session.findUnique.mockResolvedValue(null);
      mockPrismaClient.session.create.mockRejectedValue(new Error('Database error'));

      await expect(SessionService.createSession(sessionData)).rejects.toThrow(AppError);
      await expect(SessionService.createSession(sessionData)).rejects.toThrow('Failed to create session');
    });
  });

  describe('getSession', () => {
    it('should retrieve session by sessionId', async () => {
      const mockSession = createMockSession();
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.getSession('session_123');

      expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
        where: { sessionId: 'session_123' },
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null if session not found', async () => {
      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await SessionService.getSession('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrismaClient.session.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(SessionService.getSession('session_123')).rejects.toThrow(AppError);
      await expect(SessionService.getSession('session_123')).rejects.toThrow('Failed to get session');
    });
  });

  describe('getSessionById', () => {
    it('should retrieve session by UUID', async () => {
      const mockSession = createMockSession();
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.getSessionById('test-session-uuid');

      expect(mockPrismaClient.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-session-uuid' },
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null if session not found', async () => {
      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await SessionService.getSessionById('nonexistent-uuid');

      expect(result).toBeNull();
    });
  });

  describe('isParticipant', () => {
    it('should return true if user is participant (user1)', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.isParticipant('session_123', 'user-1');

      expect(result).toBe(true);
    });

    it('should return true if user is participant (user2)', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.isParticipant('session_123', 'user-2');

      expect(result).toBe(true);
    });

    it('should return false if user is not a participant', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.isParticipant('session_123', 'user-3');

      expect(result).toBe(false);
    });

    it('should return false if session not found', async () => {
      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await SessionService.isParticipant('nonexistent', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('updateActivity', () => {
    it('should update session activity timestamp', async () => {
      mockPrismaClient.session.update.mockResolvedValue(createMockSession());

      await SessionService.updateActivity('session_123');

      expect(mockPrismaClient.session.update).toHaveBeenCalledWith({
        where: { sessionId: 'session_123' },
        data: { lastActivityAt: expect.any(Date) },
      });
    });

    it('should not throw error on database failure', async () => {
      mockPrismaClient.session.update.mockRejectedValue(new Error('Database error'));

      await expect(SessionService.updateActivity('session_123')).resolves.not.toThrow();
    });
  });

  describe('terminateSession', () => {
    it('should terminate session for authorized participant', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      const terminatedSession = { ...mockSession, status: 'TERMINATED' as const, terminatedAt: new Date() };

      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaClient.session.update.mockResolvedValue(terminatedSession);

      const result = await SessionService.terminateSession('session_123', 'user-1');

      expect(mockPrismaClient.session.update).toHaveBeenCalledWith({
        where: { sessionId: 'session_123' },
        data: {
          status: 'TERMINATED',
          terminatedAt: expect.any(Date),
        },
      });
      expect(YjsService.deleteDocument).toHaveBeenCalledWith('session_123');
      expect(result.status).toBe('TERMINATED');
    });

    it('should throw error if user is not a participant', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      await expect(SessionService.terminateSession('session_123', 'user-3')).rejects.toThrow(AppError);
      await expect(SessionService.terminateSession('session_123', 'user-3')).rejects.toThrow('not a participant');

      expect(mockPrismaClient.session.update).not.toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);
      mockPrismaClient.session.update.mockRejectedValue(new Error('Database error'));

      await expect(SessionService.terminateSession('session_123', 'user-1')).rejects.toThrow(AppError);
      await expect(SessionService.terminateSession('session_123', 'user-1')).rejects.toThrow('Failed to terminate session');
    });
  });

  describe('canRejoin', () => {
    it('should allow rejoin for active session within timeout', async () => {
      const recentActivity = new Date();
      const mockSession = createMockSession({
        user1Id: 'user-1',
        status: 'ACTIVE',
        lastActivityAt: recentActivity,
      });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.canRejoin('session_123', 'user-1');

      expect(result).toBe(true);
    });

    it('should not allow rejoin for non-participant', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.canRejoin('session_123', 'user-3');

      expect(result).toBe(false);
    });

    it('should not allow rejoin for terminated session', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', status: 'TERMINATED' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.canRejoin('session_123', 'user-1');

      expect(result).toBe(false);
    });

    it('should not allow rejoin after timeout period', async () => {
      const oldActivity = new Date(Date.now() - 130000); // 2+ minutes ago
      const mockSession = createMockSession({
        user1Id: 'user-1',
        status: 'ACTIVE',
        lastActivityAt: oldActivity,
      });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.canRejoin('session_123', 'user-1');

      expect(result).toBe(false);
    });

    it('should return false if session not found', async () => {
      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await SessionService.canRejoin('nonexistent', 'user-1');

      expect(result).toBe(false);
    });
  });

  describe('getUserActiveSessions', () => {
    it('should retrieve all active sessions for a user', async () => {
      const mockSessions = [
        createMockSession({ sessionId: 'session_1', user1Id: 'user-1' }),
        createMockSession({ sessionId: 'session_2', user2Id: 'user-1' }),
      ];
      mockPrismaClient.session.findMany.mockResolvedValue(mockSessions);

      const result = await SessionService.getUserActiveSessions('user-1');

      expect(mockPrismaClient.session.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { user1Id: 'user-1' },
            { user2Id: 'user-1' },
          ],
          status: 'ACTIVE',
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockSessions);
    });

    it('should return empty array if no active sessions', async () => {
      mockPrismaClient.session.findMany.mockResolvedValue([]);

      const result = await SessionService.getUserActiveSessions('user-1');

      expect(result).toEqual([]);
    });
  });

  describe('getStats', () => {
    it('should return session statistics', async () => {
      mockPrismaClient.session.count
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(50)  // active
        .mockResolvedValueOnce(30)  // terminated
        .mockResolvedValueOnce(20); // expired

      const result = await SessionService.getStats();

      expect(result).toEqual({
        total: 100,
        active: 50,
        terminated: 30,
        expired: 20,
      });
    });
  });

  describe('expireStaleSessions', () => {
    it('should expire stale sessions', async () => {
      mockPrismaClient.session.updateMany.mockResolvedValue({ count: 5 });

      const result = await SessionService.expireStaleSessions();

      expect(mockPrismaClient.session.updateMany).toHaveBeenCalledWith({
        where: {
          status: 'ACTIVE',
          lastActivityAt: {
            lt: expect.any(Date),
          },
        },
        data: {
          status: 'EXPIRED',
          terminatedAt: expect.any(Date),
        },
      });
      expect(result).toBe(5);
    });

    it('should return 0 if no sessions expired', async () => {
      mockPrismaClient.session.updateMany.mockResolvedValue({ count: 0 });

      const result = await SessionService.expireStaleSessions();

      expect(result).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaClient.session.updateMany.mockRejectedValue(new Error('Database error'));

      const result = await SessionService.expireStaleSessions();

      expect(result).toBe(0);
    });
  });

  describe('getPartner', () => {
    it('should return partner userId when current user is user1', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.getPartner('session_123', 'user-1');

      expect(result).toBe('user-2');
    });

    it('should return partner userId when current user is user2', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.getPartner('session_123', 'user-2');

      expect(result).toBe('user-1');
    });

    it('should return null if user is not a participant', async () => {
      const mockSession = createMockSession({ user1Id: 'user-1', user2Id: 'user-2' });
      mockPrismaClient.session.findUnique.mockResolvedValue(mockSession);

      const result = await SessionService.getPartner('session_123', 'user-3');

      expect(result).toBeNull();
    });

    it('should return null if session not found', async () => {
      mockPrismaClient.session.findUnique.mockResolvedValue(null);

      const result = await SessionService.getPartner('nonexistent', 'user-1');

      expect(result).toBeNull();
    });
  });
});

/**
 * Integration tests for SessionService
 * Tests the service with real database connections
 */

import { SessionService } from '../../services/session.service.js';
import { TestDatabase } from '../helpers/test-db.js';

describe('SessionService Integration Tests', () => {
  beforeAll(async () => {
    await TestDatabase.setup();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('createSession', () => {
    it('should create a new session in the database', async () => {
      const sessionData = {
        sessionId: 'integration-session-1',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Medium',
        topic: 'Algorithms',
        language: 'javascript',
      };

      const session = await SessionService.createSession(sessionData);

      expect(session).toBeDefined();
      expect(session.sessionId).toBe(sessionData.sessionId);
      expect(session.questionId).toBe(sessionData.questionId);
      expect(session.user1Id).toBe(sessionData.user1Id);
      expect(session.user2Id).toBe(sessionData.user2Id);
      expect(session.language).toBe(sessionData.language);
      expect(session.status).toBe('ACTIVE');

      // Verify it was actually saved to database
      const prisma = TestDatabase.getPrisma();
      const savedSession = await prisma.session.findUnique({
        where: { sessionId: sessionData.sessionId },
      });

      expect(savedSession).toBeDefined();
      expect(savedSession?.questionId).toBe(sessionData.questionId);
    });

    it('should prevent duplicate session creation', async () => {
      const sessionData = {
        sessionId: 'duplicate-session',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Easy',
        topic: 'Arrays',
      };

      await SessionService.createSession(sessionData);

      // Try to create again
      await expect(SessionService.createSession(sessionData)).rejects.toThrow();
    });
  });

  describe('getSession', () => {
    it('should retrieve an existing session', async () => {
      // Create a session first
      await TestDatabase.createSession({
        sessionId: 'get-session-1',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Medium',
        topic: 'Strings',
      });

      const session = await SessionService.getSession('get-session-1');

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe('get-session-1');
      expect(session?.user1Id).toBe('user-1');
      expect(session?.user2Id).toBe('user-2');
    });

    it('should return null for non-existent session', async () => {
      const session = await SessionService.getSession('non-existent-session');
      expect(session).toBeNull();
    });
  });

  describe('isParticipant', () => {
    beforeEach(async () => {
      await TestDatabase.createSession({
        sessionId: 'participant-test',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Hard',
        topic: 'Trees',
      });
    });

    it('should return true for user1', async () => {
      const result = await SessionService.isParticipant('participant-test', 'user-1');
      expect(result).toBe(true);
    });

    it('should return true for user2', async () => {
      const result = await SessionService.isParticipant('participant-test', 'user-2');
      expect(result).toBe(true);
    });

    it('should return false for non-participant', async () => {
      const result = await SessionService.isParticipant('participant-test', 'user-3');
      expect(result).toBe(false);
    });

    it('should return false for non-existent session', async () => {
      const result = await SessionService.isParticipant('non-existent', 'user-1');
      expect(result).toBe(false);
    });
  });

  describe('terminateSession', () => {
    it('should terminate an active session', async () => {
      await TestDatabase.createSession({
        sessionId: 'terminate-test',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Easy',
        topic: 'Sorting',
        status: 'ACTIVE',
      });

      await SessionService.terminateSession('terminate-test');

      const prisma = TestDatabase.getPrisma();
      const session = await prisma.session.findUnique({
        where: { sessionId: 'terminate-test' },
      });

      expect(session?.status).toBe('TERMINATED');
      expect(session?.terminatedAt).toBeDefined();
    });
  });

  describe('getUserActiveSessions', () => {
    it('should return all active sessions for a user', async () => {
      await TestDatabase.createSession({
        sessionId: 'active-1',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Easy',
        topic: 'Arrays',
        status: 'ACTIVE',
      });

      await TestDatabase.createSession({
        sessionId: 'active-2',
        questionId: 'question-2',
        user1Id: 'user-1',
        user2Id: 'user-3',
        difficulty: 'Medium',
        topic: 'Strings',
        status: 'ACTIVE',
      });

      await TestDatabase.createSession({
        sessionId: 'terminated-1',
        questionId: 'question-3',
        user1Id: 'user-1',
        user2Id: 'user-4',
        difficulty: 'Hard',
        topic: 'Trees',
        status: 'TERMINATED',
      });

      const sessions = await SessionService.getUserActiveSessions('user-1');

      expect(sessions).toHaveLength(2);
      expect(sessions.every(s => s.status === 'ACTIVE')).toBe(true);
      expect(sessions.every(s => s.user1Id === 'user-1' || s.user2Id === 'user-1')).toBe(true);
    });

    it('should return empty array when user has no active sessions', async () => {
      const sessions = await SessionService.getUserActiveSessions('user-with-no-sessions');
      expect(sessions).toHaveLength(0);
    });
  });

  describe('updateActivity', () => {
    it('should update the lastActivityAt timestamp', async () => {
      await TestDatabase.createSession({
        sessionId: 'activity-test',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Easy',
        topic: 'Arrays',
      });

      const prisma = TestDatabase.getPrisma();
      const before = await prisma.session.findUnique({
        where: { sessionId: 'activity-test' },
      });

      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      await SessionService.updateActivity('activity-test');

      const after = await prisma.session.findUnique({
        where: { sessionId: 'activity-test' },
      });

      expect(after?.lastActivityAt.getTime()).toBeGreaterThan(
        before?.lastActivityAt.getTime() || 0
      );
    });
  });

  describe('Concurrent session operations', () => {
    it('should handle concurrent session creation attempts', async () => {
      const sessionData = {
        sessionId: 'concurrent-test',
        questionId: 'question-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        difficulty: 'Medium',
        topic: 'Algorithms',
      };

      // Try to create the same session concurrently
      const results = await Promise.allSettled([
        SessionService.createSession(sessionData),
        SessionService.createSession(sessionData),
        SessionService.createSession(sessionData),
      ]);

      // Only one should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');

      expect(successful).toHaveLength(1);
      expect(failed).toHaveLength(2);
    });
  });
});

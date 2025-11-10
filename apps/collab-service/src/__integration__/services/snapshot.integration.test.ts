/**
 * Integration tests for SnapshotService
 * Tests snapshot creation and loading with real database
 */

import { SnapshotService } from '../../services/snapshot.service.js';
import { TestDatabase } from '../helpers/test-db.js';

describe('SnapshotService Integration Tests', () => {
  beforeAll(async () => {
    await TestDatabase.setup();
  });

  beforeEach(async () => {
    await TestDatabase.cleanup();
  });

  afterAll(async () => {
    await TestDatabase.teardown();
  });

  describe('saveSnapshot', () => {
    it('should save a snapshot to the database', async () => {
      // First create a session
      await TestDatabase.createSession({
        sessionId: 'snapshot-test-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
      });

      const sessionId = 'snapshot-test-1';
      
      // Mock YjsService to return a state
      const mockState = new Uint8Array([1, 2, 3, 4, 5]);
      jest.spyOn(require('../../services/yjs.service.js').YjsService, 'getState')
        .mockReturnValue(mockState);

      await SnapshotService.saveSnapshot(sessionId);

      const prisma = TestDatabase.getPrisma();
      const snapshots = await prisma.snapshot.findMany({
        where: {
          session: {
            sessionId,
          },
        },
      });

      expect(snapshots).toHaveLength(1);
      expect(Buffer.from(snapshots[0].yjsState)).toEqual(Buffer.from(mockState));
    });
  });

  describe('loadLatestSnapshot', () => {
    it('should load the most recent snapshot', async () => {
      const sessionId = 'load-test-1';
      
      // Create session
      await TestDatabase.createSession({
        sessionId,
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
      });

      // Create multiple snapshots
      await TestDatabase.createSnapshot({
        sessionId,
        yjsState: Buffer.from([1, 2, 3]),
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await TestDatabase.createSnapshot({
        sessionId,
        yjsState: Buffer.from([4, 5, 6]),
      });

      const snapshot = await SnapshotService.loadLatestSnapshot(sessionId);

      expect(snapshot).toBeDefined();
      expect(Buffer.from(snapshot!)).toEqual(Buffer.from([4, 5, 6]));
    });

    it('should return null when no snapshot exists', async () => {
      const snapshot = await SnapshotService.loadLatestSnapshot('non-existent-session');
      expect(snapshot).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return accurate statistics', async () => {
      // Create sessions
      const session1 = await TestDatabase.createSession({
        sessionId: 'session-1',
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
      });

      const session2 = await TestDatabase.createSession({
        sessionId: 'session-2',
        user1Id: 'user-3',
        user2Id: 'user-4',
        questionId: 'question-2',
      });

      // Create snapshots
      await TestDatabase.createSnapshot({
        sessionId: 'session-1',
        yjsState: Buffer.from([1, 2, 3]),
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await TestDatabase.createSnapshot({
        sessionId: 'session-1',
        yjsState: Buffer.from([4, 5, 6, 7]),
      });
      
      await TestDatabase.createSnapshot({
        sessionId: 'session-2',
        yjsState: Buffer.from([8, 9]),
      });

      const stats = await SnapshotService.getStats();

      expect(stats.totalSnapshots).toBe(3);
      expect(stats.snapshotsBySessions).toBe(2);
      expect(stats.oldestSnapshot).toBeDefined();
      expect(stats.newestSnapshot).toBeDefined();
    });

    it('should return zero stats when no snapshots exist', async () => {
      const stats = await SnapshotService.getStats();

      expect(stats.totalSnapshots).toBe(0);
      expect(stats.snapshotsBySessions).toBe(0);
      expect(stats.oldestSnapshot).toBeNull();
      expect(stats.newestSnapshot).toBeNull();
    });
  });
});

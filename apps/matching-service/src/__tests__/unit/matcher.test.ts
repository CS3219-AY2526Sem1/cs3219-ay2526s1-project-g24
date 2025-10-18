/**
 * Unit tests for matcher worker logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockRedis, createMockRequest, createMockFetch } from "../utils/test-helpers.js";
import type { StoredMatchRequest } from "../../types.js";
import { isCompatible } from "../../workers/matcher.js";

describe('Matcher Worker Logic', () => {
  describe('isCompatible', () => {
    it('should match requests with overlapping topics and languages', () => {
      const req1 = createMockRequest({
        topics: 'arrays,strings',
        languages: 'python,javascript',
      });

      const req2 = createMockRequest({
        topics: 'arrays,sorting',
        languages: 'python',
      });

      expect(isCompatible(req1, req2)).toBe(true);
    });

    it('should not match requests with no topic overlap', () => {
      const req1 = createMockRequest({
        topics: 'arrays,strings',
        languages: 'python',
      });

      const req2 = createMockRequest({
        topics: 'graphs,trees',
        languages: 'python',
      });

      expect(isCompatible(req1, req2)).toBe(false);
    });

    it('should not match requests with no language overlap', () => {
      const req1 = createMockRequest({
        topics: 'arrays',
        languages: 'python',
      });

      const req2 = createMockRequest({
        topics: 'arrays',
        languages: 'java',
      });

      expect(isCompatible(req1, req2)).toBe(false);
    });

    it('should match requests with multiple overlapping topics', () => {
      const req1 = createMockRequest({
        topics: 'arrays,strings,sorting',
        languages: 'python',
      });

      const req2 = createMockRequest({
        topics: 'strings,graphs',
        languages: 'python',
      });

      expect(isCompatible(req1, req2)).toBe(true);
    });

    it('should match requests with multiple overlapping languages', () => {
      const req1 = createMockRequest({
        topics: 'arrays',
        languages: 'python,javascript,java',
      });

      const req2 = createMockRequest({
        topics: 'arrays',
        languages: 'java,cpp',
      });

      expect(isCompatible(req1, req2)).toBe(true);
    });

    it('should handle whitespace in CSV values', () => {
      const req1 = createMockRequest({
        topics: 'arrays, strings , sorting',
        languages: 'python , javascript',
      });

      const req2 = createMockRequest({
        topics: 'strings,graphs',
        languages: 'javascript, java',
      });

      expect(isCompatible(req1, req2)).toBe(true);
    });

    it('should require both topic AND language overlap', () => {
      const req1 = createMockRequest({
        topics: 'arrays',
        languages: 'python',
      });

      const req2 = createMockRequest({
        topics: 'graphs', // No topic overlap
        languages: 'python', // Has language overlap
      });

      expect(isCompatible(req1, req2)).toBe(false);

      const req3 = createMockRequest({
        topics: 'arrays', // Has topic overlap
        languages: 'java', // No language overlap
      });

      expect(isCompatible(req1, req3)).toBe(false);
    });
  });

  describe('Matching Workflow', () => {
    let mockRedis: ReturnType<typeof createMockRedis>;
    let mockFetch: jest.Mock;

    beforeEach(() => {
      mockRedis = createMockRedis();
      mockFetch = createMockFetch() as jest.Mock;
      global.fetch = mockFetch as any;
    });

    it('should successfully match two compatible requests', async () => {
      const difficulty = 'easy';
      const reqId1 = 'req1';
      const reqId2 = 'req2';

      // Setup: Add two requests to queue
      const req1 = createMockRequest({
        userId: 'alice',
        topics: 'arrays,strings',
        languages: 'python',
        createdAt: Date.now(),
      });

      const req2 = createMockRequest({
        userId: 'bob',
        topics: 'arrays,sorting',
        languages: 'python,java',
        createdAt: Date.now() + 1000,
      });

      // Store requests
      mockRedis.store.set(`match:req:${reqId1}`, {
        ...req1,
        createdAt: req1.createdAt.toString(),
      });
      mockRedis.store.set(`match:req:${reqId2}`, {
        ...req2,
        createdAt: req2.createdAt.toString(),
      });

      // Add to queue
      await mockRedis.zadd(`queue:${difficulty}`, req1.createdAt, reqId1);
      await mockRedis.zadd(`queue:${difficulty}`, req2.createdAt, reqId2);

      // Simulate matcher workflow
      // 1. Pop 2 requests
      const reqIds = await mockRedis.zpopmin(`queue:${difficulty}`, 2);
      expect(reqIds).toEqual([reqId1, req1.createdAt, reqId2, req2.createdAt]);

      // 2. Load requests
      const loadedReq1 = await mockRedis.hgetall(`match:req:${reqId1}`);
      const loadedReq2 = await mockRedis.hgetall(`match:req:${reqId2}`);

      // 3. Check compatibility
      const compatible = isCompatible(
        { ...loadedReq1, createdAt: parseInt(loadedReq1.createdAt) },
        { ...loadedReq2, createdAt: parseInt(loadedReq2.createdAt) }
      );
      expect(compatible).toBe(true);

      // 4. Create session
      const sessionResponse = await mockFetch('http://localhost:4000/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ difficulty, userIds: [req1.userId, req2.userId] }),
      }) as { json: () => Promise<{ sessionId: string }> };
      const sessionData = await sessionResponse.json();
      expect(sessionData.sessionId).toBe('mock-session-id');

      // 5. Update requests
      await mockRedis.hset(`match:req:${reqId1}`, {
        status: 'matched',
        sessionId: sessionData.sessionId,
      });
      await mockRedis.hset(`match:req:${reqId2}`, {
        status: 'matched',
        sessionId: sessionData.sessionId,
      });

      // 6. Verify final state
      const finalReq1 = await mockRedis.hgetall(`match:req:${reqId1}`);
      const finalReq2 = await mockRedis.hgetall(`match:req:${reqId2}`);

      expect(finalReq1.status).toBe('matched');
      expect(finalReq1.sessionId).toBe('mock-session-id');
      expect(finalReq2.status).toBe('matched');
      expect(finalReq2.sessionId).toBe('mock-session-id');
    });

    it('should requeue incompatible requests', async () => {
      const difficulty = 'easy';
      const reqId1 = 'req1';
      const reqId2 = 'req2';

      const req1 = createMockRequest({
        topics: 'arrays',
        languages: 'python',
        createdAt: Date.now(),
      });

      const req2 = createMockRequest({
        topics: 'graphs', // No overlap
        languages: 'java', // No overlap
        createdAt: Date.now() + 1000,
      });

      // Store requests
      mockRedis.store.set(`match:req:${reqId1}`, {
        ...req1,
        createdAt: req1.createdAt.toString(),
      });
      mockRedis.store.set(`match:req:${reqId2}`, {
        ...req2,
        createdAt: req2.createdAt.toString(),
      });

      // Add to queue
      await mockRedis.zadd(`queue:${difficulty}`, req1.createdAt, reqId1);
      await mockRedis.zadd(`queue:${difficulty}`, req2.createdAt, reqId2);

      // Pop requests
      await mockRedis.zpopmin(`queue:${difficulty}`, 2);

      // Load and check compatibility
      const loadedReq1 = await mockRedis.hgetall(`match:req:${reqId1}`);
      const loadedReq2 = await mockRedis.hgetall(`match:req:${reqId2}`);

      const compatible = isCompatible(
        { ...loadedReq1, createdAt: parseInt(loadedReq1.createdAt) },
        { ...loadedReq2, createdAt: parseInt(loadedReq2.createdAt) }
      );
      expect(compatible).toBe(false);

      // Requeue both
      await mockRedis.zadd(`queue:${difficulty}`, req1.createdAt, reqId1);
      await mockRedis.zadd(`queue:${difficulty}`, req2.createdAt, reqId2);

      // Verify both back in queue
      const queueLength = await mockRedis.zcard(`queue:${difficulty}`);
      expect(queueLength).toBe(2);
    });

    it('should handle only one request in queue', async () => {
      const difficulty = 'easy';
      const reqId1 = 'req1';
      const createdAt = Date.now();

      // Add only one request
      await mockRedis.zadd(`queue:${difficulty}`, createdAt, reqId1);

      // Try to pop 2
      const reqIds = await mockRedis.zpopmin(`queue:${difficulty}`, 2);

      // Should only get 1
      expect(reqIds).toEqual([reqId1, createdAt]);
      expect(reqIds.length).toBe(2); // [member, score]

      // Should requeue the single request
      await mockRedis.zadd(`queue:${difficulty}`, createdAt, reqId1);

      const queueLength = await mockRedis.zcard(`queue:${difficulty}`);
      expect(queueLength).toBe(1);
    });
  });
});

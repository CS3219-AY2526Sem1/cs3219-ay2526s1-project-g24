/**
 * Unit tests for Redis service
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { createMockRedis, createMockRequest } from "../utils/test-helpers.js";
import type { Difficulty } from "../../types.js";

describe('Redis Operations', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    jest.clearAllMocks();
  });

  describe('createRequest', () => {
    it('should create a request in Redis with TTL', async () => {
      const reqId = 'test-req-id';
      const request = createMockRequest();

      await mockRedis.hset(`match:req:${reqId}`, {
        userId: request.userId,
        difficulty: request.difficulty,
        topics: request.topics,
        languages: request.languages,
        status: 'queued',
        createdAt: request.createdAt.toString(),
      });

      await mockRedis.expire(`match:req:${reqId}`, 60);

      expect(mockRedis.hset).toHaveBeenCalledWith(
        `match:req:${reqId}`,
        expect.objectContaining({
          userId: request.userId,
          difficulty: request.difficulty,
          status: 'queued',
        })
      );
      expect(mockRedis.expire).toHaveBeenCalledWith(`match:req:${reqId}`, 60);
    });
  });

  describe('getRequest', () => {
    it('should retrieve a request from Redis', async () => {
      const reqId = 'test-req-id';
      const request = createMockRequest();

      mockRedis.store.set(`match:req:${reqId}`, {
        userId: request.userId,
        difficulty: request.difficulty,
        topics: request.topics,
        languages: request.languages,
        status: request.status,
        createdAt: request.createdAt.toString(),
      });

      const result = await mockRedis.hgetall(`match:req:${reqId}`);

      expect(result).toEqual(
        expect.objectContaining({
          userId: request.userId,
          difficulty: request.difficulty,
        })
      );
    });

    it('should return empty object for non-existent request', async () => {
      const result = await mockRedis.hgetall('match:req:non-existent');
      expect(result).toEqual({});
    });
  });

  describe('queue operations', () => {
    it('should add request to queue with score', async () => {
      const reqId = 'test-req-id';
      const difficulty: Difficulty = 'easy';
      const createdAt = Date.now();

      await mockRedis.zadd(`queue:${difficulty}`, createdAt, reqId);

      expect(mockRedis.zadd).toHaveBeenCalledWith(
        `queue:${difficulty}`,
        createdAt,
        reqId
      );

      const queueSet = mockRedis.sortedSets.get(`queue:${difficulty}`);
      expect(queueSet?.has(reqId)).toBe(true);
      expect(queueSet?.get(reqId)).toBe(createdAt);
    });

    it('should remove request from queue', async () => {
      const reqId = 'test-req-id';
      const difficulty: Difficulty = 'easy';

      // Add to queue first
      await mockRedis.zadd(`queue:${difficulty}`, Date.now(), reqId);

      // Remove from queue
      const result = await mockRedis.zrem(`queue:${difficulty}`, reqId);

      expect(result).toBe(1);
      expect(mockRedis.sortedSets.get(`queue:${difficulty}`)?.has(reqId)).toBe(false);
    });

    it('should pop multiple requests from queue in FIFO order', async () => {
      const difficulty: Difficulty = 'easy';
      const now = Date.now();

      // Add 3 requests with different timestamps
      await mockRedis.zadd(`queue:${difficulty}`, now, 'req1');
      await mockRedis.zadd(`queue:${difficulty}`, now + 1000, 'req2');
      await mockRedis.zadd(`queue:${difficulty}`, now + 2000, 'req3');

      // Pop 2 requests
      const result = await mockRedis.zpopmin(`queue:${difficulty}`, 2);

      // Should return [member1, score1, member2, score2]
      expect(result).toEqual(['req1', now, 'req2', now + 1000]);

      // Queue should have 1 item left
      const remaining = await mockRedis.zcard(`queue:${difficulty}`);
      expect(remaining).toBe(1);
    });

    it('should return empty array when popping from empty queue', async () => {
      const result = await mockRedis.zpopmin('queue:easy', 2);
      expect(result).toEqual([]);
    });

    it('should get queue length', async () => {
      const difficulty: Difficulty = 'medium';

      // Add 3 requests
      await mockRedis.zadd(`queue:${difficulty}`, Date.now(), 'req1');
      await mockRedis.zadd(`queue:${difficulty}`, Date.now(), 'req2');
      await mockRedis.zadd(`queue:${difficulty}`, Date.now(), 'req3');

      const length = await mockRedis.zcard(`queue:${difficulty}`);
      expect(length).toBe(3);
    });
  });

  describe('pub/sub operations', () => {
    it('should publish event to channel', async () => {
      const reqId = 'test-req-id';
      const event = { status: 'matched', sessionId: 'session123' };

      const result = await mockRedis.publish(
        `events:${reqId}`,
        JSON.stringify(event)
      );

      expect(mockRedis.publish).toHaveBeenCalledWith(
        `events:${reqId}`,
        JSON.stringify(event)
      );
    });

    it('should subscribe to channel', async () => {
      const reqId = 'test-req-id';
      const channel = `events:${reqId}`;

      await mockRedis.subscribe(channel);

      expect(mockRedis.subscribe).toHaveBeenCalledWith(channel);
      expect(mockRedis.subscribers.has(channel)).toBe(true);
    });
  });

  describe('updateRequestStatus', () => {
    it('should update request status without sessionId', async () => {
      const reqId = 'test-req-id';

      await mockRedis.hset(`match:req:${reqId}`, { status: 'timeout' });

      const request = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(request.status).toBe('timeout');
    });

    it('should update request status with sessionId', async () => {
      const reqId = 'test-req-id';
      const sessionId = 'session123';

      await mockRedis.hset(`match:req:${reqId}`, {
        status: 'matched',
        sessionId,
      });

      const request = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(request.status).toBe('matched');
      expect(request.sessionId).toBe(sessionId);
    });
  });

  describe('healthCheck', () => {
    it('should return PONG on successful ping', async () => {
      const result = await mockRedis.ping();
      expect(result).toBe('PONG');
    });
  });
});

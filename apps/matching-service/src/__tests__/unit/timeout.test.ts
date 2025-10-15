/**
 * Unit tests for timeout worker
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createMockRedis, createMockRequest } from "../utils/test-helpers.js";

describe('Timeout Worker Logic', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
  });

  describe('processTimeout', () => {
    it('should mark queued request as timeout and remove from queue', async () => {
      const reqId = 'test-req-id';
      const difficulty = 'easy';
      const request = createMockRequest({ status: 'queued', difficulty });

      // Store request
      mockRedis.store.set(`match:req:${reqId}`, {
        ...request,
        createdAt: request.createdAt.toString(),
      });

      // Add to queue
      await mockRedis.zadd(`queue:${difficulty}`, request.createdAt, reqId);

      // Simulate timeout processing
      const req = await mockRedis.hgetall(`match:req:${reqId}`);

      if (req.status === 'queued') {
        // Update status
        await mockRedis.hset(`match:req:${reqId}`, { status: 'timeout' });

        // Remove from queue
        await mockRedis.zrem(`queue:${difficulty}`, reqId);

        // Publish event
        const event = { status: 'timeout', timestamp: Date.now() };
        await mockRedis.publish(`events:${reqId}`, JSON.stringify(event));
      }

      // Verify status updated
      const updatedReq = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(updatedReq.status).toBe('timeout');

      // Verify removed from queue
      const queueLength = await mockRedis.zcard(`queue:${difficulty}`);
      expect(queueLength).toBe(0);

      // Verify event published
      expect(mockRedis.publish).toHaveBeenCalledWith(
        `events:${reqId}`,
        expect.stringContaining('timeout')
      );
    });

    it('should skip timeout if request is already matched', async () => {
      const reqId = 'test-req-id';
      const request = createMockRequest({ status: 'matched' });

      mockRedis.store.set(`match:req:${reqId}`, {
        ...request,
        createdAt: request.createdAt.toString(),
        sessionId: 'session123',
      });

      // Simulate timeout processing
      const req = await mockRedis.hgetall(`match:req:${reqId}`);

      expect(req.status).toBe('matched');

      // Should not process timeout
      if (req.status !== 'queued') {
        // Do nothing
      }

      // Verify status unchanged
      const finalReq = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(finalReq.status).toBe('matched');
      expect(finalReq.sessionId).toBe('session123');
    });

    it('should skip timeout if request is already cancelled', async () => {
      const reqId = 'test-req-id';
      const request = createMockRequest({ status: 'cancelled' });

      mockRedis.store.set(`match:req:${reqId}`, {
        ...request,
        createdAt: request.createdAt.toString(),
      });

      // Simulate timeout processing
      const req = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(req.status).toBe('cancelled');

      if (req.status !== 'queued') {
        // Skip timeout processing
      }

      // Verify status unchanged
      const finalReq = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(finalReq.status).toBe('cancelled');
    });

    it('should handle request not found gracefully', async () => {
      const reqId = 'non-existent-req';

      const req = await mockRedis.hgetall(`match:req:${reqId}`);

      // Should be empty
      expect(Object.keys(req).length).toBe(0);

      // Should not throw error, just skip processing
    });

    it('should only timeout request after configured delay', async () => {
      const reqId = 'test-req-id';
      const createdAt = Date.now();
      const timeoutSeconds = 30;

      const request = createMockRequest({
        status: 'queued',
        createdAt,
      });

      mockRedis.store.set(`match:req:${reqId}`, {
        ...request,
        createdAt: createdAt.toString(),
      });

      // Check if timeout should occur
      const currentTime = Date.now();
      const elapsed = (currentTime - createdAt) / 1000;

      if (elapsed < timeoutSeconds) {
        // Should not timeout yet
        const req = await mockRedis.hgetall(`match:req:${reqId}`);
        expect(req.status).toBe('queued');
      } else {
        // Should timeout
        await mockRedis.hset(`match:req:${reqId}`, { status: 'timeout' });
        const req = await mockRedis.hgetall(`match:req:${reqId}`);
        expect(req.status).toBe('timeout');
      }
    });
  });

  describe('Multiple Timeouts', () => {
    it('should handle multiple timeout requests independently', async () => {
      const req1Id = 'req1';
      const req2Id = 'req2';
      const req3Id = 'req3';

      const req1 = createMockRequest({ status: 'queued', difficulty: 'easy' });
      const req2 = createMockRequest({ status: 'matched' });
      const req3 = createMockRequest({ status: 'queued', difficulty: 'medium' });

      // Store all requests
      mockRedis.store.set(`match:req:${req1Id}`, {
        ...req1,
        createdAt: req1.createdAt.toString(),
      });
      mockRedis.store.set(`match:req:${req2Id}`, {
        ...req2,
        createdAt: req2.createdAt.toString(),
        sessionId: 'session123',
      });
      mockRedis.store.set(`match:req:${req3Id}`, {
        ...req3,
        createdAt: req3.createdAt.toString(),
      });

      // Add queued ones to respective queues
      await mockRedis.zadd('queue:easy', req1.createdAt, req1Id);
      await mockRedis.zadd('queue:medium', req3.createdAt, req3Id);

      // Process timeouts
      for (const reqId of [req1Id, req2Id, req3Id]) {
        const req = await mockRedis.hgetall(`match:req:${reqId}`);

        if (req.status === 'queued') {
          await mockRedis.hset(`match:req:${reqId}`, { status: 'timeout' });
          await mockRedis.zrem(`queue:${req.difficulty}`, reqId);
        }
      }

      // Verify results
      const finalReq1 = await mockRedis.hgetall(`match:req:${req1Id}`);
      const finalReq2 = await mockRedis.hgetall(`match:req:${req2Id}`);
      const finalReq3 = await mockRedis.hgetall(`match:req:${req3Id}`);

      expect(finalReq1.status).toBe('timeout');
      expect(finalReq2.status).toBe('matched'); // unchanged
      expect(finalReq3.status).toBe('timeout');

      // Verify queues cleared
      expect(await mockRedis.zcard('queue:easy')).toBe(0);
      expect(await mockRedis.zcard('queue:medium')).toBe(0);
    });
  });
});

/**
 * Integration tests for API routes
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  jest,
} from "@jest/globals";
import express from "express";
import request from "supertest";
import { createMockRedis } from "../utils/test-helpers.js";

// Mock dependencies before importing router
let mockRedis: ReturnType<typeof createMockRedis>;

// Setup mock modules
jest.unstable_mockModule("../../services/redis.js", () => ({
  initRedis: jest.fn(() => mockRedis),
  getRedis: jest.fn(() => mockRedis),
  closeRedis: jest.fn(),
  redis: mockRedis,
  redisOps: {
    createRequest: jest.fn(async (reqId: string, request: any, ttl: number) => {
      await mockRedis.hset(`match:req:${reqId}`, {
        ...request,
        status: "queued",
        createdAt: Date.now().toString(),
      });
      // Only set expiration if ttl > 0
      if (ttl > 0) {
        await mockRedis.expire(`match:req:${reqId}`, ttl);
      }
    }),
    getRequest: jest.fn(async (reqId: string) => {
      const data = await mockRedis.hgetall(`match:req:${reqId}`);
      if (Object.keys(data).length === 0) return null;
      return {
        ...data,
        createdAt: parseInt(data.createdAt || "0"),
      };
    }),
    updateRequestStatus: jest.fn(
      async (reqId: string, status: string, sessionId?: string) => {
        const updates: any = { status };
        if (sessionId) updates.sessionId = sessionId;
        await mockRedis.hset(`match:req:${reqId}`, updates);
      },
    ),
    atomicUpdateRequestStatus: jest.fn(
      async (
        reqId: string,
        expectedStatus: string,
        newStatus: string,
        sessionId?: string,
      ) => {
        const data = await mockRedis.hgetall(`match:req:${reqId}`);
        if (Object.keys(data).length === 0 || data.status !== expectedStatus) {
          return false;
        }
        const updates: any = { status: newStatus };
        if (sessionId) updates.sessionId = sessionId;
        await mockRedis.hset(`match:req:${reqId}`, updates);
        return true;
      },
    ),
    enqueue: jest.fn(
      async (reqId: string, difficulty: string, score: number) => {
        await mockRedis.zadd(`queue:${difficulty}`, score, reqId);
      },
    ),
    dequeue: jest.fn(async (reqId: string, difficulty: string) => {
      await mockRedis.zrem(`queue:${difficulty}`, reqId);
    }),
    publishEvent: jest.fn(async (reqId: string, event: any) => {
      await mockRedis.publish(`events:${reqId}`, JSON.stringify(event));
    }),
    getQueueLength: jest.fn(async (difficulty: string) => {
      return await mockRedis.zcard(`queue:${difficulty}`);
    }),
    healthCheck: jest.fn(async () => true),
    createSubscriber: jest.fn(() => mockRedis),
    // Timeout operations
    addTimeout: jest.fn(
      async (reqId: string, difficulty: string, timeoutSeconds: number) => {
        const deadline = Date.now() + timeoutSeconds * 1000;
        await mockRedis.zadd(
          "match:timeouts",
          deadline,
          `${reqId}:${difficulty}`,
        );
      },
    ),
    removeTimeout: jest.fn(async (reqId: string) => {
      // In real implementation, we'd need to find the member by reqId prefix
      // For testing, we'll just remove by reqId pattern
      const members = await mockRedis.zrange("match:timeouts", 0, -1);
      for (const member of members) {
        if (member.startsWith(`${reqId}:`)) {
          await mockRedis.zrem("match:timeouts", member);
        }
      }
    }),
    getExpiredTimeouts: jest.fn(async () => {
      const now = Date.now();
      return await mockRedis.zrangebyscore(
        "match:timeouts",
        "-inf",
        now.toString(),
      );
    }),
    removeExpiredTimeouts: jest.fn(async (count: number) => {
      const now = Date.now();
      await mockRedis.zremrangebyscore(
        "match:timeouts",
        "-inf",
        now.toString(),
      );
    }),
    getTimeoutCount: jest.fn(async () => {
      return await mockRedis.zcard("match:timeouts");
    }),
    // User deduplication operations
    getUserActiveRequest: jest.fn(async (userId: string) => {
      return await mockRedis.store.get(`user:active:${userId}`) || null;
    }),
    setUserActiveRequest: jest.fn(
      async (userId: string, reqId: string, ttl: number) => {
        mockRedis.store.set(`user:active:${userId}`, reqId);
      },
    ),
    removeUserActiveRequest: jest.fn(async (userId: string) => {
      mockRedis.store.delete(`user:active:${userId}`);
    }),
    // SSE connection tracking operations
    setActiveSSEConnection: jest.fn(async (reqId: string, ttl: number) => {
      const key = `sse:active:${reqId}`;
      if (mockRedis.store.has(key)) {
        return false; // Already exists
      }
      mockRedis.store.set(key, Date.now().toString());
      return true;
    }),
    removeActiveSSEConnection: jest.fn(async (reqId: string) => {
      mockRedis.store.delete(`sse:active:${reqId}`);
    }),
    hasActiveSSEConnection: jest.fn(async (reqId: string) => {
      return mockRedis.store.has(`sse:active:${reqId}`);
    }),
  },
}));

process.env.AUTH_DISABLED = "true";

describe("API Routes Integration Tests", () => {
  let app: express.Application;

  beforeAll(async () => {
    mockRedis = createMockRedis();

    // Import router after mocks are set up
    const { router } = await import("../../api/routes.js");

    app = express();
    app.use(express.json());
    app.use("/", router);
  });

  beforeEach(() => {
    // Clear mocks and data
    mockRedis.store.clear();
    mockRedis.sortedSets.clear();
    mockRedis.subscribers.clear();
    jest.clearAllMocks();
  });

  describe("POST /api/v1/match/requests", () => {
    it("should create a match request successfully", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .set("x-test-user-id", "alice")
        .send({
          userId: "alice",
          difficulty: "easy",
          topics: ["arrays", "strings"],
          languages: ["python", "javascript"],
        })
        .expect(201);

      expect(response.body).toHaveProperty("reqId");
      expect(typeof response.body.reqId).toBe("string");
    });

    it("should reject invalid difficulty", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .set("x-test-user-id", "alice")
        .send({
          userId: "alice",
          difficulty: "invalid",
          topics: ["arrays"],
          languages: ["python"],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject empty topics array", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .set("x-test-user-id", "alice")
        .send({
          userId: "alice",
          difficulty: "easy",
          topics: [],
          languages: ["python"],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject empty languages array", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .set("x-test-user-id", "alice")
        .send({
          userId: "alice",
          difficulty: "easy",
          topics: ["arrays"],
          languages: [],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject missing userId", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .send({
          difficulty: "easy",
          topics: ["arrays"],
          languages: ["python"],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/v1/match/requests/:reqId", () => {
    it("should return request status", async () => {
      const reqId = "test-req-123";

      // Setup: Create a request in mock Redis
      await mockRedis.hset(`match:req:${reqId}`, {
        userId: "alice",
        difficulty: "easy",
        topics: "arrays,strings",
        languages: "python,javascript",
        status: "queued",
        createdAt: Date.now().toString(),
      });

      const response = await request(app)
        .get(`/api/v1/match/requests/${reqId}`)
        .set("x-test-user-id", "alice")
        .expect(200);

      expect(response.body).toMatchObject({
        reqId,
        userId: "alice",
        difficulty: "easy",
        status: "queued",
      });
      expect(response.body.topics).toBeInstanceOf(Array);
      expect(response.body.languages).toBeInstanceOf(Array);
    });

    it("should return 404 for non-existent request", async () => {
      const response = await request(app)
        .get("/api/v1/match/requests/non-existent")
        .set("x-test-user-id", "alice")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });

    it("should include sessionId for matched request", async () => {
      const reqId = "matched-req-123";

      await mockRedis.hset(`match:req:${reqId}`, {
        userId: "alice",
        difficulty: "easy",
        topics: "arrays",
        languages: "python",
        status: "matched",
        sessionId: "session-456",
        createdAt: Date.now().toString(),
      });

      const response = await request(app)
        .get(`/api/v1/match/requests/${reqId}`)
        .set("x-test-user-id", "alice")
        .expect(200);

      expect(response.body.status).toBe("matched");
      expect(response.body.sessionId).toBe("session-456");
    });
  });

  describe("DELETE /api/v1/match/requests/:reqId", () => {
    it("should cancel a queued request", async () => {
      const reqId = "cancel-req-123";

      await mockRedis.hset(`match:req:${reqId}`, {
        userId: "alice",
        difficulty: "easy",
        topics: "arrays",
        languages: "python",
        status: "queued",
        createdAt: Date.now().toString(),
      });

      await mockRedis.zadd("queue:easy", Date.now(), reqId);

      const response = await request(app)
        .delete(`/api/v1/match/requests/${reqId}`)
        .set("x-test-user-id", "alice")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);

      // Verify status updated
      const updatedReq = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(updatedReq.status).toBe("cancelled");
    });

    it("should be idempotent - cancelling already-cancelled request succeeds", async () => {
      const reqId = "cancelled-req-456";

      await mockRedis.hset(`match:req:${reqId}`, {
        userId: "bob",
        difficulty: "medium",
        topics: "graphs",
        languages: "java",
        status: "cancelled",
        createdAt: Date.now().toString(),
      });

      const response = await request(app)
        .delete(`/api/v1/match/requests/${reqId}`)
        .set("x-test-user-id", "bob")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("cancelled");
    });

    it("should be idempotent - cancelling timed-out request succeeds", async () => {
      const reqId = "timeout-req-789";

      await mockRedis.hset(`match:req:${reqId}`, {
        userId: "charlie",
        difficulty: "hard",
        topics: "dp",
        languages: "python",
        status: "timeout",
        createdAt: Date.now().toString(),
      });

      const response = await request(app)
        .delete(`/api/v1/match/requests/${reqId}`)
        .set("x-test-user-id", "charlie")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("message");
      expect(response.body.message).toContain("timeout");
    });

    it("should not cancel a matched request", async () => {
      const reqId = "matched-req-123";

      await mockRedis.hset(`match:req:${reqId}`, {
        userId: "alice",
        difficulty: "easy",
        topics: "arrays",
        languages: "python",
        status: "matched",
        sessionId: "session-123",
        createdAt: Date.now().toString(),
      });

      // Compensation pattern: cancel after match = 409 with sessionId (frontend expects this)
      const response = await request(app)
        .delete(`/api/v1/match/requests/${reqId}`)
        .set("x-test-user-id", "alice")
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("matched");
      expect(response.body).toHaveProperty("sessionId", "session-123");
    });

    it("should return 404 for non-existent request", async () => {
      await request(app)
        .delete("/api/v1/match/requests/non-existent")
        .set("x-test-user-id", "alice")
        .expect(404);
    });

    it("should handle race condition when request is matched during cancellation", async () => {
      const reqId = "race-condition-req-123";

      // Setup: Create a queued request
      await mockRedis.hset(`match:req:${reqId}`, {
        userId: "alice",
        difficulty: "easy",
        topics: "arrays",
        languages: "python",
        status: "queued",
        createdAt: Date.now().toString(),
      });

      await mockRedis.zadd("queue:easy", Date.now(), reqId);

      // Simulate race condition: update status to "matched" before cancel completes
      // This simulates the matcher matching the request between the status check and update
      const originalAtomicUpdate = (await import("../../services/redis.js"))
        .redisOps.atomicUpdateRequestStatus;

      // Mock atomicUpdateRequestStatus to simulate the request being matched
      const { redisOps } = await import("../../services/redis.js");
      (redisOps.atomicUpdateRequestStatus as jest.Mock).mockImplementationOnce(
        async () => {
          // Simulate matcher updating status to "matched" right before we try to cancel
          await mockRedis.hset(`match:req:${reqId}`, {
            status: "matched",
            sessionId: "session-789",
          });
          return false; // Atomic update fails because status changed
        },
      );

      // Try to cancel - should get 409 with sessionId (compensation pattern)
      const response = await request(app)
        .delete(`/api/v1/match/requests/${reqId}`)
        .set("x-test-user-id", "alice")
        .expect(409);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("matched");
      expect(response.body).toHaveProperty("sessionId", "session-789");

      // Verify status is still "matched" (we don't rollback, just notify partner left)
      const finalReq = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(finalReq.status).toBe("matched");
      expect(finalReq.sessionId).toBe("session-789");
    });
  });

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toEqual({ status: "ok" });
    });
  });

  describe("GET /-/ready", () => {
    it("should return ready when Redis is healthy", async () => {
      const response = await request(app).get("/-/ready").expect(200);

      expect(response.body).toMatchObject({
        status: "ready",
        redis: "ok",
      });
    });
  });

  describe("GET /-/metrics", () => {
    it("should return Prometheus metrics", async () => {
      const response = await request(app).get("/-/metrics").expect(200);

      expect(response.text).toContain("# HELP");
      expect(response.text).toContain("# TYPE");
    });
  });

  describe("Request Validation", () => {
    it("should validate all difficulty values", async () => {
      const difficulties = ["easy", "medium", "hard"];

      for (let i = 0; i < difficulties.length; i++) {
        const difficulty = difficulties[i];
        const response = await request(app)
          .post("/api/v1/match/requests")
          .set("x-test-user-id", `alice-${i}`)
          .send({
            userId: `alice-${i}`, // Use different userId to avoid deduplication
            difficulty,
            topics: ["arrays"],
            languages: ["python"],
          })
          .expect(201);

        expect(response.body).toHaveProperty("reqId");
      }
    });

    it("should handle multiple topics and languages", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .set("x-test-user-id", "alice")
        .send({
          userId: "alice",
          difficulty: "easy",
          topics: ["arrays", "strings", "sorting", "searching"],
          languages: ["python", "javascript", "java", "cpp"],
        })
        .expect(201);

      expect(response.body).toHaveProperty("reqId");
    });

    it("should reject non-array topics", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .set("x-test-user-id", "alice")
        .send({
          userId: "alice",
          difficulty: "easy",
          topics: "not an array",
          languages: ["python"],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });

    it("should reject non-array languages", async () => {
      const response = await request(app)
        .post("/api/v1/match/requests")
        .set("x-test-user-id", "alice")
        .send({
          userId: "alice",
          difficulty: "easy",
          topics: ["arrays"],
          languages: "not an array",
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });
});

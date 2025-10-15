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
  },
}));

// Mock BullMQ
jest.unstable_mockModule("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(async () => ({ id: "job-id" })),
    close: jest.fn(),
  })),
}));

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

  describe("POST /v1/match/requests", () => {
    it("should create a match request successfully", async () => {
      const response = await request(app)
        .post("/v1/match/requests")
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
        .post("/v1/match/requests")
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
        .post("/v1/match/requests")
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
        .post("/v1/match/requests")
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
        .post("/v1/match/requests")
        .send({
          difficulty: "easy",
          topics: ["arrays"],
          languages: ["python"],
        })
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /v1/match/requests/:reqId", () => {
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
        .get(`/v1/match/requests/${reqId}`)
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
        .get("/v1/match/requests/non-existent")
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
        .get(`/v1/match/requests/${reqId}`)
        .expect(200);

      expect(response.body.status).toBe("matched");
      expect(response.body.sessionId).toBe("session-456");
    });
  });

  describe("DELETE /v1/match/requests/:reqId", () => {
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
        .delete(`/v1/match/requests/${reqId}`)
        .expect(200);

      expect(response.body).toHaveProperty("message");

      // Verify status updated
      const updatedReq = await mockRedis.hgetall(`match:req:${reqId}`);
      expect(updatedReq.status).toBe("cancelled");
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

      const response = await request(app)
        .delete(`/v1/match/requests/${reqId}`)
        .expect(400);

      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("matched");
    });

    it("should return 404 for non-existent request", async () => {
      await request(app).delete("/v1/match/requests/non-existent").expect(404);
    });
  });

  describe("GET /-/health", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/-/health").expect(200);

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

      for (const difficulty of difficulties) {
        const response = await request(app)
          .post("/v1/match/requests")
          .send({
            userId: "alice",
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
        .post("/v1/match/requests")
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
        .post("/v1/match/requests")
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
        .post("/v1/match/requests")
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

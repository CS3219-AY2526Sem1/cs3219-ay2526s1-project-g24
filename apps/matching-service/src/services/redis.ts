import { Redis } from "ioredis";
import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import type { StoredMatchRequest, Difficulty } from "../types.js";
import { RedisKeys } from "../types.js";

export let redis: Redis;

export function initRedis() {
  const config = {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  };

  redis = new Redis(config);

  redis.on("connect", () => {
    logger.info({ host: config.host, port: config.port }, "Redis connected");
  });

  redis.on("error", (error: Error) => {
    logger.error({ error }, "Redis connection error");
    metrics.recordError("redis_error", "connection");
  });

  redis.on("close", () => {
    logger.warn("Redis connection closed");
  });

  return redis;
}

export function getRedis(): Redis {
  if (!redis) {
    throw new Error("Redis client not initialized. Call initRedis() first.");
  }
  return redis;
}

export async function closeRedis() {
  if (redis) {
    await redis.quit();
    logger.info("Redis connection closed");
  }
}

/**
 * Wrapper for Redis operations with latency tracking
 */
function trackLatency<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  return fn()
    .then((result) => {
      const duration = (Date.now() - start) / 1000;
      metrics.recordRedisOperation(operation, duration);
      return result;
    })
    .catch((error) => {
      const duration = (Date.now() - start) / 1000;
      metrics.recordRedisOperation(operation, duration);
      metrics.recordError("redis_error", operation);
      throw error;
    });
}

/**
 * Redis operations for match requests
 */
export const redisOps = {
  /**
   * Create a match request in Redis
   */
  async createRequest(
    reqId: string,
    request: Omit<StoredMatchRequest, "status" | "createdAt">,
    ttlSeconds: number = 60,
  ): Promise<void> {
    const redis = getRedis();
    const key = RedisKeys.request(reqId);
    const createdAt = Date.now();

    const data: StoredMatchRequest = {
      ...request,
      status: "queued",
      createdAt,
    };

    await trackLatency("hset", () =>
      redis.hset(key, {
        userId: data.userId,
        difficulty: data.difficulty,
        topics: data.topics,
        languages: data.languages,
        status: data.status,
        createdAt: data.createdAt.toString(),
      }),
    );

    // Only set expiration if ttlSeconds > 0
    if (ttlSeconds > 0) {
      await trackLatency("expire", () => redis.expire(key, ttlSeconds));
    }
  },

  /**
   * Get a match request from Redis
   */
  async getRequest(reqId: string): Promise<StoredMatchRequest | null> {
    const redis = getRedis();
    const key = RedisKeys.request(reqId);

    const data = await trackLatency("hgetall", () => redis.hgetall(key)) as Record<string, string>;

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    return {
      userId: data.userId,
      difficulty: data.difficulty as Difficulty,
      topics: data.topics,
      languages: data.languages,
      status: data.status as StoredMatchRequest["status"],
      createdAt: parseInt(data.createdAt, 10),
      sessionId: data.sessionId,
    };
  },

  async updateRequestStatus(
    reqId: string,
    status: StoredMatchRequest["status"],
    sessionId?: string,
  ): Promise<void> {
    const redis = getRedis();
    const key = RedisKeys.request(reqId);

    const updates: Record<string, string> = { status };
    if (sessionId) {
      updates.sessionId = sessionId;
    }

    await trackLatency("hset", () => redis.hset(key, updates));
  },

  async enqueue(
    reqId: string,
    difficulty: Difficulty,
    score: number,
  ): Promise<void> {
    const redis = getRedis();
    const queueKey = RedisKeys.queue(difficulty);

    await trackLatency("zadd", () => redis.zadd(queueKey, score, reqId));
  },

  async dequeue(reqId: string, difficulty: Difficulty): Promise<void> {
    const redis = getRedis();
    const queueKey = RedisKeys.queue(difficulty);

    await trackLatency("zrem", () => redis.zrem(queueKey, reqId));
  },

  /**
   * Pop multiple requests from queue (FIFO)
   */
  async popFromQueue(
    difficulty: Difficulty,
    count: number,
  ): Promise<Array<{ reqId: string; score: number }>> {
    const redis = getRedis();
    const queueKey = RedisKeys.queue(difficulty);

    // ZPOPMIN returns [member1, score1, member2, score2, ...]
    const results = await trackLatency("zpopmin", () =>
      redis.zpopmin(queueKey, count),
    ) as string[];

    // Extract reqId and score pairs
    const items: Array<{ reqId: string; score: number }> = [];
    for (let i = 0; i < results.length; i += 2) {
      items.push({
        reqId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }

    return items;
  },

  async getQueueLength(difficulty: Difficulty): Promise<number> {
    const redis = getRedis();
    const queueKey = RedisKeys.queue(difficulty);

    return trackLatency("zcard", () => redis.zcard(queueKey));
  },

  /**
   * Publish event to request channel
   */
  async publishEvent(reqId: string, event: Record<string, any>): Promise<void> {
    const redis = getRedis();
    const channel = RedisKeys.events(reqId);

    await trackLatency("publish", () =>
      redis.publish(channel, JSON.stringify(event)),
    );
  },

  /**
   * Subscribe to request events
   */
  createSubscriber(): Redis {
    const config = {
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      password: process.env.REDIS_PASSWORD || undefined,
    };

    return new Redis(config);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const redis = getRedis();
      const result = await redis.ping();
      return result === "PONG";
    } catch (error) {
      logger.error({ error }, "Redis health check failed");
      return false;
    }
  },
};

/**
 * Test utilities and helpers
 */

import { jest } from "@jest/globals";
import type { StoredMatchRequest, Difficulty } from "../../types.js";

/**
 * Create a mock stored request for testing
 */
export function createMockRequest(
  overrides?: Partial<StoredMatchRequest>,
): StoredMatchRequest {
  return {
    userId: "test-user-1",
    difficulty: "easy",
    topics: "arrays,strings",
    languages: "python,javascript",
    status: "queued",
    createdAt: Date.now(),
    ...overrides,
  };
}

/**
 * Create multiple mock requests
 */
export function createMockRequests(
  count: number,
  difficulty: Difficulty = "easy",
): StoredMatchRequest[] {
  return Array.from({ length: count }, (_, i) =>
    createMockRequest({
      userId: `test-user-${i + 1}`,
      difficulty,
      topics: i % 2 === 0 ? "arrays,strings" : "arrays,sorting",
      languages: i % 2 === 0 ? "python" : "python,java",
    }),
  );
}

/**
 * Sleep for testing async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create mock Redis client
 */
export function createMockRedis() {
  const store = new Map<string, any>();
  const sortedSets = new Map<string, Map<string, number>>();
  const subscribers = new Map<string, Set<Function>>();

  return {
    store,
    sortedSets,
    subscribers,

    // Hash operations
    hset: jest.fn(async (key: string, ...args: any[]) => {
      if (!store.has(key)) {
        store.set(key, {});
      }
      const hash = store.get(key);

      if (typeof args[0] === "object") {
        Object.assign(hash, args[0]);
      } else {
        for (let i = 0; i < args.length; i += 2) {
          hash[args[i]] = args[i + 1];
        }
      }
      return 1;
    }),

    hgetall: jest.fn(async (key: string) => {
      return store.get(key) || {};
    }),

    // Sorted set operations
    zadd: jest.fn(async (key: string, score: number, member: string) => {
      if (!sortedSets.has(key)) {
        sortedSets.set(key, new Map());
      }
      sortedSets.get(key)!.set(member, score);
      return 1;
    }),

    zrem: jest.fn(async (key: string, member: string) => {
      const set = sortedSets.get(key);
      if (set) {
        return set.delete(member) ? 1 : 0;
      }
      return 0;
    }),

    zpopmin: jest.fn(async (key: string, count: number) => {
      const set = sortedSets.get(key);
      if (!set || set.size === 0) {
        return [];
      }

      const entries = Array.from(set.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(0, count);

      const result: (string | number)[] = [];
      entries.forEach(([member, score]) => {
        result.push(member, score);
        set.delete(member);
      });

      return result;
    }),

    zcard: jest.fn(async (key: string) => {
      return sortedSets.get(key)?.size || 0;
    }),

    zrange: jest.fn(async (key: string, start: number, stop: number) => {
      const set = sortedSets.get(key);
      if (!set || set.size === 0) {
        return [];
      }
      const members = Array.from(set.keys());
      if (stop === -1) {
        return members.slice(start);
      }
      return members.slice(start, stop + 1);
    }),

    zrangebyscore: jest.fn(async (key: string, min: string, max: string) => {
      const set = sortedSets.get(key);
      if (!set || set.size === 0) {
        return [];
      }
      
      const minScore = min === "-inf" ? -Infinity : parseFloat(min);
      const maxScore = max === "+inf" ? Infinity : parseFloat(max);
      
      return Array.from(set.entries())
        .filter(([_, score]) => score >= minScore && score <= maxScore)
        .sort((a, b) => a[1] - b[1])
        .map(([member]) => member);
    }),

    zremrangebyscore: jest.fn(async (key: string, min: string, max: string) => {
      const set = sortedSets.get(key);
      if (!set || set.size === 0) {
        return 0;
      }
      
      const minScore = min === "-inf" ? -Infinity : parseFloat(min);
      const maxScore = max === "+inf" ? Infinity : parseFloat(max);
      
      let removed = 0;
      for (const [member, score] of set.entries()) {
        if (score >= minScore && score <= maxScore) {
          set.delete(member);
          removed++;
        }
      }
      return removed;
    }),

    // Pub/Sub
    publish: jest.fn(async (channel: string, message: string) => {
      const subs = subscribers.get(channel);
      if (subs) {
        subs.forEach((fn) => fn(channel, message));
      }
      return subs?.size || 0;
    }),

    subscribe: jest.fn(async (channel: string) => {
      if (!subscribers.has(channel)) {
        subscribers.set(channel, new Set());
      }
      return 1;
    }),

    on: jest.fn((_event: string, _handler: Function) => {
      // Mock event handler
    }),

    // Other operations
    expire: jest.fn(async (_key: string, _ttl: number) => 1),
    ping: jest.fn(async () => "PONG"),
    quit: jest.fn(async () => "OK"),
  };
}

/**
 * Mock fetch for collaboration service
 */
export function createMockFetch() {
  return jest.fn(async (url: string, options?: any) => {
    if (url.includes("/api/sessions") && options?.method === "POST") {
      return {
        ok: true,
        status: 201,
        json: async () => ({
          sessionId: "mock-session-id",
          questionId: "mock-question-id",
        }),
      };
    }

    if (url.includes("/health")) {
      return {
        ok: true,
        status: 200,
      };
    }

    return {
      ok: false,
      status: 404,
      text: async () => "Not found",
    };
  });
}

import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { Difficulty, StoredMatchRequest } from "../../types";

  const mockGetRequest = jest.fn<() => Promise<StoredMatchRequest | null>>();
const mockUpdateRequestStatus = jest.fn<() => Promise<void>>();
const mockDequeue = jest.fn<() => Promise<void>>();
const mockPublishEvent = jest.fn<() => Promise<void>>();
const mockGetExpiredTimeouts = jest.fn<() => Promise<Array<{ reqId: string; difficulty: Difficulty }>>>();
const mockRemoveExpiredTimeouts = jest.fn<() => Promise<number>>();
const mockRecordTimeout = jest.fn<() => void>();

// Use unstable_mockModule for ES modules
jest.unstable_mockModule("../../services/redis.js", () => ({
  redisOps: {
    getRequest: mockGetRequest,
    updateRequestStatus: mockUpdateRequestStatus,
    dequeue: mockDequeue,
    publishEvent: mockPublishEvent,
    getExpiredTimeouts: mockGetExpiredTimeouts,
    removeExpiredTimeouts: mockRemoveExpiredTimeouts,
  },
}));

jest.unstable_mockModule("../../observability/metrics.js", () => ({
  metrics: {
    recordTimeout: mockRecordTimeout,
  },
}));

// Import after mocking
const { handleTimeout, scanExpiredTimeouts } = await import("../../workers/timeout.js");

describe("timeout worker (sorted set scanning)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("handleTimeout", () => {
    it("should process timeout for queued request", async () => {
      const mockRequest = {
        userId: "user1",
        difficulty: "easy" as Difficulty,
        topics: "arrays",
        languages: "python",
        status: "queued" as const,
        createdAt: Date.now(),
      };
      mockGetRequest.mockResolvedValue(mockRequest);
      mockUpdateRequestStatus.mockResolvedValue(undefined);
      mockDequeue.mockResolvedValue(undefined);
      mockPublishEvent.mockResolvedValue(undefined);

      await handleTimeout("req-1", "easy");

      expect(mockGetRequest).toHaveBeenCalledWith("req-1");
      expect(mockUpdateRequestStatus).toHaveBeenCalledWith("req-1", "timeout");
      expect(mockDequeue).toHaveBeenCalledWith("req-1", "easy");
      expect(mockPublishEvent).toHaveBeenCalledWith("req-1", expect.objectContaining({
        status: "timeout",
        timestamp: expect.any(Number),
      }));
      expect(mockRecordTimeout).toHaveBeenCalledWith("easy");
    });

    it("skips timeout if request not found", async () => {
      mockGetRequest.mockResolvedValue(null);

      await handleTimeout("req_notfound", "easy");

      expect(mockGetRequest).toHaveBeenCalledWith("req_notfound");
      expect(mockUpdateRequestStatus).not.toHaveBeenCalled();
      expect(mockRecordTimeout).not.toHaveBeenCalled();
    });

    it("skips timeout if request already matched", async () => {
      const mockRequest = {
        userId: "user2",
        difficulty: "hard" as Difficulty,
        topics: "graphs",
        languages: "java",
        status: "matched" as const,
        createdAt: Date.now(),
      };

      mockGetRequest.mockResolvedValue(mockRequest);

      await handleTimeout("req_matched", "hard");

      expect(mockGetRequest).toHaveBeenCalledWith("req_matched");
      expect(mockUpdateRequestStatus).not.toHaveBeenCalled();
      expect(mockRecordTimeout).not.toHaveBeenCalled();
    });

    it("records timeout with correct difficulty label", async () => {
      const mockRequest = {
        userId: "user3",
        difficulty: "medium" as Difficulty,
        topics: "strings",
        languages: "cpp",
        status: "queued" as const,
        createdAt: Date.now(),
      };

      mockGetRequest.mockResolvedValue(mockRequest);
      mockUpdateRequestStatus.mockResolvedValue(undefined);
      mockDequeue.mockResolvedValue(undefined);
      mockPublishEvent.mockResolvedValue(undefined);

      await handleTimeout("req-medium", "medium");

      expect(mockRecordTimeout).toHaveBeenCalledWith("medium");
    });
  });

  describe("scanExpiredTimeouts", () => {
    it("returns 0 when no expired timeouts", async () => {
      mockGetExpiredTimeouts.mockResolvedValue([]);

      const count = await scanExpiredTimeouts();

      expect(count).toBe(0);
      expect(mockGetExpiredTimeouts).toHaveBeenCalled();
    });

    it("processes multiple expired timeouts", async () => {
      const expired = [
        { reqId: "req-1", difficulty: "easy" as Difficulty },
        { reqId: "req-2", difficulty: "hard" as Difficulty },
      ];

      mockGetExpiredTimeouts.mockResolvedValue(expired);
      mockGetRequest.mockResolvedValue({
        userId: "user1",
        difficulty: "easy" as Difficulty,
        topics: "arrays",
        languages: "python",
        status: "queued" as const,
        createdAt: Date.now(),
      });
      mockUpdateRequestStatus.mockResolvedValue(undefined);
      mockDequeue.mockResolvedValue(undefined);
      mockPublishEvent.mockResolvedValue(undefined);
      mockRemoveExpiredTimeouts.mockResolvedValue(2);

      const count = await scanExpiredTimeouts();

      expect(count).toBe(2);
      expect(mockRemoveExpiredTimeouts).toHaveBeenCalled();
    });
  });
});

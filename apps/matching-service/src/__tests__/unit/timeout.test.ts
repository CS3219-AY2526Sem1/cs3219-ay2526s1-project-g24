import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { Difficulty, StoredMatchRequest } from "../../types";

const mockGetRequest = jest.fn<() => Promise<StoredMatchRequest | null>>();
const mockUpdateRequestStatus = jest.fn<() => Promise<void>>();
const mockAtomicUpdateRequestStatus = jest.fn<() => Promise<boolean>>();
const mockDequeue = jest.fn<() => Promise<void>>();
const mockPublishEvent = jest.fn<() => Promise<void>>();
const mockRemoveUserActiveRequest = jest.fn<() => Promise<void>>();
const mockPopExpiredTimeouts =
  jest.fn<() => Promise<Array<{ reqId: string; difficulty: Difficulty }>>>();
const mockRecordTimeout = jest.fn<() => void>();

// Use unstable_mockModule for ES modules
jest.unstable_mockModule("../../services/redis.js", () => ({
  redisOps: {
    getRequest: mockGetRequest,
    updateRequestStatus: mockUpdateRequestStatus,
    atomicUpdateRequestStatus: mockAtomicUpdateRequestStatus,
    dequeue: mockDequeue,
    publishEvent: mockPublishEvent,
    removeUserActiveRequest: mockRemoveUserActiveRequest,
    popExpiredTimeouts: mockPopExpiredTimeouts,
  },
}));

jest.unstable_mockModule("../../observability/metrics.js", () => ({
  metrics: {
    recordTimeout: mockRecordTimeout,
  },
}));

// Import after mocking
const { handleTimeout, scanExpiredTimeouts } = await import(
  "../../workers/timeout.js"
);

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
      mockAtomicUpdateRequestStatus.mockResolvedValue(true); // Atomic update succeeds
      mockDequeue.mockResolvedValue(undefined);
      mockPublishEvent.mockResolvedValue(undefined);

      await handleTimeout("req-1", "easy");

      expect(mockGetRequest).toHaveBeenCalledWith("req-1");
      expect(mockAtomicUpdateRequestStatus).toHaveBeenCalledWith(
        "req-1",
        "queued",
        "timeout",
      );
      expect(mockDequeue).toHaveBeenCalledWith("req-1", "easy");
      expect(mockPublishEvent).toHaveBeenCalledWith(
        "req-1",
        expect.objectContaining({
          status: "timeout",
          timestamp: expect.any(Number),
        }),
      );
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

    it("handles race condition when request is matched during timeout processing", async () => {
      const mockRequest = {
        userId: "user4",
        difficulty: "medium" as Difficulty,
        topics: "trees",
        languages: "python",
        status: "queued" as const,
        createdAt: Date.now(),
      };

      const matchedRequest = {
        ...mockRequest,
        status: "matched" as const,
        sessionId: "session-123",
      };

      // First call returns queued, second call (after atomic update fails) returns matched
      mockGetRequest
        .mockResolvedValueOnce(mockRequest)
        .mockResolvedValueOnce(matchedRequest);
      mockAtomicUpdateRequestStatus.mockResolvedValue(false); // Atomic update fails (already matched)

      await handleTimeout("req-race", "medium");

      // Should check status and try atomic update
      expect(mockGetRequest).toHaveBeenCalledWith("req-race");
      expect(mockAtomicUpdateRequestStatus).toHaveBeenCalledWith(
        "req-race",
        "queued",
        "timeout",
      );

      // Should NOT proceed with timeout since atomic update failed
      expect(mockDequeue).not.toHaveBeenCalled();
      expect(mockPublishEvent).not.toHaveBeenCalled();
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
      mockAtomicUpdateRequestStatus.mockResolvedValue(true); // Atomic update succeeds
      mockDequeue.mockResolvedValue(undefined);
      mockPublishEvent.mockResolvedValue(undefined);

      await handleTimeout("req-medium", "medium");

      expect(mockRecordTimeout).toHaveBeenCalledWith("medium");
    });
  });

  describe("scanExpiredTimeouts", () => {
    it("returns 0 when no expired timeouts", async () => {
      mockPopExpiredTimeouts.mockResolvedValue([]);

      const count = await scanExpiredTimeouts();

      expect(count).toBe(0);
      expect(mockPopExpiredTimeouts).toHaveBeenCalled();
    });

    it("processes multiple expired timeouts", async () => {
      const expired = [
        { reqId: "req-1", difficulty: "easy" as Difficulty },
        { reqId: "req-2", difficulty: "hard" as Difficulty },
      ];

      mockPopExpiredTimeouts.mockResolvedValue(expired);
      mockGetRequest.mockResolvedValue({
        userId: "user1",
        difficulty: "easy" as Difficulty,
        topics: "arrays",
        languages: "python",
        status: "queued" as const,
        createdAt: Date.now(),
      });
      mockAtomicUpdateRequestStatus.mockResolvedValue(true); // Atomic update succeeds
      mockDequeue.mockResolvedValue(undefined);
      mockPublishEvent.mockResolvedValue(undefined);

      const count = await scanExpiredTimeouts();

      expect(count).toBe(2);
    });
  });
});

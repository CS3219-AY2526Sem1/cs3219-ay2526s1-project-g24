/**
 * Timeout Worker - Handles request timeouts using Redis Sorted Set scanning
 * 
 * Uses Sorted Set with Periodic Scanning
 * - Requests are tracked in a sorted set with deadline timestamps as scores
 * - Worker scans periodically for expired items (score < current time)
 * - Accurate difficulty tracking without relying on keyspace notifications
 */

import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { redisOps } from "../services/redis.js";
import type { Difficulty } from "../types.js";

/**
 * Handle a single expired timeout
 */
export async function handleTimeout(
  reqId: string,
  difficulty: Difficulty,
): Promise<void> {
  try {
    // Check if request still exists and is queued
    const request = await redisOps.getRequest(reqId);
    
    if (!request) {
      logger.debug({ reqId }, "Request not found (already cleaned up)");
      return;
    }

    if (request.status !== "queued") {
      logger.debug(
        { reqId, status: request.status },
        "Request no longer queued, skipping timeout",
      );
      return;
    }

    logger.info({ reqId, difficulty }, "Request timed out");

    // Update request status to timeout
    await redisOps.updateRequestStatus(reqId, "timeout");

    // Remove from matching queue
    await redisOps.dequeue(reqId, difficulty);

    // Publish timeout event to notify SSE subscribers
    await redisOps.publishEvent(reqId, {
      status: "timeout",
      timestamp: Date.now(),
    });

    // Record timeout metric with accurate difficulty
    metrics.recordTimeout(difficulty);
  } catch (error) {
    logger.error({ error, reqId, difficulty }, "Error handling timeout");
  }
}

/**
 * Scan for and process all expired timeouts
 */
export async function scanExpiredTimeouts(): Promise<number> {
  try {
    // Get all expired timeouts
    const expired = await redisOps.getExpiredTimeouts();

    if (expired.length === 0) {
      return 0;
    }

    logger.debug({ count: expired.length }, "Processing expired timeouts");

    // Process each timeout
    await Promise.all(
      expired.map(({ reqId, difficulty }) => handleTimeout(reqId, difficulty)),
    );

    // Remove processed timeouts from sorted set
    await redisOps.removeExpiredTimeouts();

    return expired.length;
  } catch (error) {
    logger.error({ error }, "Error scanning expired timeouts");
    return 0;
  }
}

/**
 * Start the timeout worker with periodic scanning
 */
export function startTimeoutWorker(): void {
  const scanIntervalMs = parseInt(
    process.env.TIMEOUT_SCAN_INTERVAL_MS || "5000",
    10,
  );

  logger.info(
    { scanIntervalMs },
    "Starting timeout worker with periodic scanning",
  );

  // Scan immediately on start
  scanExpiredTimeouts().catch((error) => {
    logger.error({ error }, "Initial timeout scan failed");
  });

  // Set up periodic scanning
  const intervalId = setInterval(() => {
    scanExpiredTimeouts().catch((error) => {
      logger.error({ error }, "Timeout scan failed");
    });
  }, scanIntervalMs);

  // Cleanup on process termination
  process.on("SIGTERM", () => {
    clearInterval(intervalId);
    logger.info("Timeout worker stopped");
  });

  process.on("SIGINT", () => {
    clearInterval(intervalId);
    logger.info("Timeout worker stopped");
  });

  logger.info("Timeout worker started");
}


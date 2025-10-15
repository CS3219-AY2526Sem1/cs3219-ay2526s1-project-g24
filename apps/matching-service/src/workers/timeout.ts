/**
 * Timeout Worker - Handles 30-second timeouts using Redis key expiration
 */

import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { redisOps, redis } from "../services/redis.js";

/**
 * Start the timeout worker
 */
export function startTimeoutWorker(): void {
  // Subscribe to key expiration events
  const subscriber = redis.duplicate();

  // Enable keyspace notifications for expired events
  redis.config("SET", "notify-keyspace-events", "Ex");

  // Subscribe to expired key events
  subscriber.psubscribe("__keyevent@0__:expired", (err?: Error | null) => {
    if (err) {
      logger.error({ error: err }, "Failed to subscribe to expired events");
      return;
    }
    logger.info("Timeout worker subscribed to key expiration events");
  });

  subscriber.on(
    "pmessage",
    async (_pattern: string, _channel: string, expiredKey: string) => {
      // expiredKey format: "match:req:{reqId}"
      if (!expiredKey.startsWith("match:req:")) return;

      const reqId = expiredKey.replace("match:req:", "");

      try {
        // Note: Key is already expired/deleted, so we can't get the request
        // We rely on the fact that if key expired, it timed out
        logger.info({ reqId }, "Request timed out (key expired)");

        // Publish timeout event
        await redisOps.publishEvent(reqId, {
          status: "timeout",
          timestamp: Date.now(),
        });

        // Record metric (we don't know difficulty after expiration)
        metrics.recordTimeout("easy" as any);
      } catch (error) {
        logger.error({ error, reqId }, "Error handling timeout");
      }
    },
  );

  logger.info("Timeout worker started");
}

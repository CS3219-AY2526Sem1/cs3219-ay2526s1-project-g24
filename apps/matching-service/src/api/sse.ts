import type { Request, Response } from "express";
import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { redisOps } from "../services/redis.js";
import { cancelMatchRequest } from "./routes.js";
import type { AuthContext } from "../auth/types.js";

/**
 * Handle SSE connection for a match request
 */
export async function handleSSE(req: Request, res: Response) {
  const auth = (req as Request & { auth?: AuthContext }).auth;
  if (!auth) {
    res.status(401).write(
      `event: error\ndata: ${JSON.stringify({ error: "Unauthorized" })}\n\n`,
    );
    res.end();
    return;
  }

  const { reqId } = req.params;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  logger.info({ reqId }, "SSE connection requested");

  let timerInterval: NodeJS.Timeout | null = null;
  let subscriber: any = null;
  let connectionMarked = false;
  let metricsAdjusted = false;

  // Cleanup function to prevent leaks
  const cleanup = async () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (subscriber) {
      subscriber.quit();
      subscriber = null;
    }
    if (connectionMarked) {
      await redisOps.removeActiveSSEConnection(reqId);
      connectionMarked = false;
    }
    if (!metricsAdjusted) {
      metrics.decrementSseConnections();
      metricsAdjusted = true;
    }
  };

  try {
    // Check if there's already an active SSE connection for this request
    const hasExistingConnection = await redisOps.hasActiveSSEConnection(reqId);
    if (hasExistingConnection) {
      logger.warn({ reqId }, "Rejecting duplicate SSE connection");
      res.status(409).write(
        `event: error\ndata: ${JSON.stringify({ 
          error: "Another SSE connection already exists for this request",
          code: "DUPLICATE_SSE"
        })}\n\n`,
      );
      res.end();
      return;
    }

    // Mark this connection as active (with TTL for auto-cleanup)
    const marked = await redisOps.setActiveSSEConnection(reqId, 300); // 5 min TTL
    if (!marked) {
      // Race condition: another connection was established just now
      logger.warn({ reqId }, "Race: SSE connection established concurrently");
      res.status(409).write(
        `event: error\ndata: ${JSON.stringify({ 
          error: "Another SSE connection was just established",
          code: "DUPLICATE_SSE"
        })}\n\n`,
      );
      res.end();
      return;
    }
    connectionMarked = true;

  metrics.incrementSseConnections();
  metricsAdjusted = false;

    // Load request to verify it exists
    const request = await redisOps.getRequest(reqId);
    if (!request) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: "Request not found" })}\n\n`,
      );
      res.end();
      await cleanup();
      return;
    }

    if (request.userId !== auth.userId) {
      res.write(
        `event: error\ndata: ${JSON.stringify({ error: "Forbidden" })}\n\n`,
      );
      res.end();
      await cleanup();
      return;
    }

    // Send initial status immediately
    const initialEvent = {
      status: request.status,
      timestamp: Date.now(),
      elapsed: Math.floor((Date.now() - request.createdAt) / 1000),
      ...(request.sessionId && { sessionId: request.sessionId }),
    };
    res.write(`data: ${JSON.stringify(initialEvent)}\n\n`);

    // If already in terminal state, close connection
    if (request.status !== "queued") {
      res.end();
      await cleanup();
      return;
    }

    // Store createdAt for client-side elapsed calculation
    const requestCreatedAt = request.createdAt;

    // Create Redis subscriber for this request
    subscriber = redisOps.createSubscriber();
    const channel = `events:${reqId}`;

    // Subscribe to events
    await subscriber.subscribe(channel);

    // Handle incoming messages
    subscriber.on("message", async (ch: string, message: string) => {
      if (ch === channel) {
        try {
          const event = JSON.parse(message);
          res.write(`data: ${JSON.stringify(event)}\n\n`);

          // Close connection if terminal state reached
          if (
            event.status === "matched" ||
            event.status === "cancelled" ||
            event.status === "timeout"
          ) {
            logger.info(
              { reqId, status: event.status },
              "Terminal state reached, closing SSE",
            );
            await cleanup();
            res.end();
          }
        } catch (error) {
          logger.error({ error, message }, "Failed to parse SSE event");
        }
      }
    });

    // Send periodic timer updates (every 1 second)
    // Calculate elapsed time from initial createdAt to avoid Redis calls
    timerInterval = setInterval(() => {
      try {
        const elapsed = Math.floor((Date.now() - requestCreatedAt) / 1000);
        const timerEvent = {
          status: "queued",
          timestamp: Date.now(),
          elapsed,
        };

        res.write(`data: ${JSON.stringify(timerEvent)}\n\n`);
      } catch (error) {
        logger.error({ error, reqId }, "Error sending timer update");
        cleanup();
      }
    }, 1000);

    // Handle client disconnect - cancel immediately
    req.on("close", async () => {
      logger.info({ reqId }, "SSE connection closed by client");

      // Check current status
      const currentRequest = await redisOps.getRequest(reqId);
      if (currentRequest && currentRequest.status === "queued") {
        // Still queued, cancel it
        logger.info({ reqId }, "Cancelling queued request on disconnect");
        await cancelMatchRequest(reqId, auth.userId, "client disconnected");
      } else {
        // Already matched/cancelled/timed out
        logger.info(
          { reqId, status: currentRequest?.status },
          "Request already in terminal state on disconnect",
        );
      }

      await cleanup();
    });

    // Handle errors - cancel immediately
    res.on("error", async (error) => {
      logger.error({ error, reqId }, "SSE connection error");

      const currentRequest = await redisOps.getRequest(reqId);
      if (currentRequest && currentRequest.status === "queued") {
        await cancelMatchRequest(reqId, auth.userId, "connection error");
      }

      await cleanup();
    });
  } catch (error) {
    logger.error({ error, reqId }, "Error setting up SSE connection");
    await cleanup();
    res.end();
  }
}

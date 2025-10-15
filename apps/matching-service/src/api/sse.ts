import type { Request, Response } from "express";
import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { redisOps } from "../services/redis.js";

/**
 * Handle SSE connection for a match request
 */
export async function handleSSE(req: Request, res: Response) {
  const { reqId } = req.params;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

  logger.info({ reqId }, "SSE connection opened");
  metrics.incrementSseConnections();

  // Load request to verify it exists
  const request = await redisOps.getRequest(reqId);
  if (!request) {
    res.write(
      `event: error\ndata: ${JSON.stringify({ error: "Request not found" })}\n\n`,
    );
    res.end();
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
    metrics.decrementSseConnections();
    return;
  }

  // Create Redis subscriber for this request
  const subscriber = redisOps.createSubscriber();
  const channel = `events:${reqId}`;

  // Subscribe to events
  await subscriber.subscribe(channel);

  // Handle incoming messages
  subscriber.on("message", (ch: string, message: string) => {
    if (ch === channel) {
      try {
        const event = JSON.parse(message);
        res.write(`data: ${JSON.stringify(event)}\n\n`);

        // Close connection if terminal state reached
        if (
          event.status === "matched" ||
          event.status === "timeout" ||
          event.status === "cancelled"
        ) {
          logger.info(
            { reqId, status: event.status },
            "Terminal state reached, closing SSE",
          );
          subscriber.quit();
          res.end();
        }
      } catch (error) {
        logger.error({ error, message }, "Failed to parse SSE event");
      }
    }
  });

  // Send periodic timer updates (every 1 second)
  const timerInterval = setInterval(async () => {
    try {
      const currentReq = await redisOps.getRequest(reqId);
      if (!currentReq || currentReq.status !== "queued") {
        clearInterval(timerInterval);
        return;
      }

      const elapsed = Math.floor((Date.now() - currentReq.createdAt) / 1000);
      const timerEvent = {
        status: "queued",
        timestamp: Date.now(),
        elapsed,
      };

      res.write(`data: ${JSON.stringify(timerEvent)}\n\n`);
    } catch (error) {
      logger.error({ error, reqId }, "Error sending timer update");
      clearInterval(timerInterval);
    }
  }, 1000);

  // Handle client disconnect
  req.on("close", () => {
    clearInterval(timerInterval);
    subscriber.quit();
    metrics.decrementSseConnections();
    logger.info({ reqId }, "SSE connection closed by client");
  });

  // Handle errors
  res.on("error", (error) => {
    clearInterval(timerInterval);
    subscriber.quit();
    metrics.decrementSseConnections();
    logger.error({ error, reqId }, "SSE connection error");
  });
}

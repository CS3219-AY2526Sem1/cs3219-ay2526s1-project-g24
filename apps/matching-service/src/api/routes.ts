import express, { Request, Response, NextFunction, Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { logger } from "../observability/logger.js";
import { metrics, register } from "../observability/metrics.js";
import { withSpan } from "../observability/tracing.js";
import { redisOps, redis } from "../services/redis.js";
import { handleSSE } from "../api/sse.js";
import type {
  MatchRequest,
  MatchRequestResponse,
  MatchRequestStatusResponse,
} from "../types.js";

// Load OpenAPI spec
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const openapiPath = join(__dirname, "../../openapi/spec.yaml");
const openapiSpec = YAML.load(openapiPath);

const router: Router = express.Router();

// Request validation schema
const createRequestSchema = z.object({
  userId: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z.array(z.string().min(1)).min(1),
  languages: z.array(z.string().min(1)).min(1),
});

/**
 * Middleware to track HTTP request metrics
 */
function trackMetrics(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    metrics.recordHttpRequest(req.method, route, res.statusCode, duration);
  });

  next();
}

/**
 * GET /docs
 * Swagger UI for API documentation
 */
router.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));

router.use(trackMetrics);

/**
 * POST /v1/match/requests
 * Create a new match request
 */
router.post("/v1/match/requests", async (req: Request, res: Response) => {
  const reqId = uuidv4();

  try {
    await withSpan("create_match_request", { reqId }, async (span) => {
      // Validate request body
      const validation = createRequestSchema.safeParse(req.body);
      if (!validation.success) {
        res.status(400).json({
          error: "Invalid request",
          details: validation.error.errors,
        });
        return;
      }

      const data = validation.data as MatchRequest;

      span.setAttribute("user_id", data.userId);
      span.setAttribute("difficulty", data.difficulty);

      logger.info(
        {
          reqId,
          userId: data.userId,
          difficulty: data.difficulty,
          topics: data.topics,
          languages: data.languages,
        },
        "Creating match request",
      );

      // Store request in Redis (no TTL - persists until matched or cancelled)
      await redisOps.createRequest(
        reqId,
        {
          userId: data.userId,
          difficulty: data.difficulty,
          topics: data.topics.join(","),
          languages: data.languages.join(","),
        },
        0, // 0 = no expiration
      );

      // Add to queue
      const createdAt = Date.now();
      await redisOps.enqueue(reqId, data.difficulty, createdAt);

      // Add to timeout tracking (sorted set with deadline)
      const timeoutSeconds = parseInt(
        process.env.MATCH_TIMEOUT_SECONDS || "30",
        10,
      );
      await redisOps.addTimeout(reqId, data.difficulty, timeoutSeconds);

      // Trigger matcher via pub/sub
      await redis.publish(
        "match:trigger",
        JSON.stringify({ difficulty: data.difficulty }),
      );

      logger.info({ reqId, userId: data.userId }, "Match request created");

      const response: MatchRequestResponse = { reqId };
      res.status(201).json(response);
    });
  } catch (error) {
    logger.error({ error, reqId }, "Failed to create match request");
    metrics.recordError("request_creation_error", "create_match_request");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /v1/match/requests/:reqId
 * Get status of a match request
 */
router.get("/v1/match/requests/:reqId", async (req: Request, res: Response) => {
  const { reqId } = req.params;

  try {
    await withSpan("get_match_request", { reqId }, async () => {
      const request = await redisOps.getRequest(reqId);

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      const response: MatchRequestStatusResponse = {
        reqId,
        userId: request.userId,
        difficulty: request.difficulty,
        topics: request.topics.split(","),
        languages: request.languages.split(","),
        status: request.status,
        createdAt: request.createdAt,
        ...(request.sessionId && { sessionId: request.sessionId }),
      };

      res.json(response);
    });
  } catch (error) {
    logger.error({ error, reqId }, "Failed to get match request");
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Cancel a match request (internal function)
 * Used by both DELETE endpoint and SSE disconnect
 */
export async function cancelMatchRequest(
  reqId: string,
  reason: string = "user requested",
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  try {
    const request = await redisOps.getRequest(reqId);

    if (!request) {
      return { success: false, error: "Request not found", statusCode: 404 };
    }

    if (request.status !== "queued") {
      return {
        success: false,
        error: `Cannot cancel request - already ${request.status}`,
        statusCode: 400,
      };
    }

    // Update status
    await redisOps.updateRequestStatus(reqId, "cancelled");

    // Remove from queue
    await redisOps.dequeue(reqId, request.difficulty);

    // Remove from timeout tracking
    await redisOps.removeTimeout(reqId, request.difficulty);

    // Notify via pub/sub
    const event = {
      status: "cancelled",
      timestamp: Date.now(),
    };
    await redisOps.publishEvent(reqId, event);

    // Record metrics
    metrics.recordCancellation(request.difficulty);

    logger.info(
      { reqId, userId: request.userId, reason },
      "Match request cancelled",
    );

    return { success: true };
  } catch (error) {
    logger.error({ error, reqId }, "Failed to cancel match request");
    return {
      success: false,
      error: "Internal server error",
      statusCode: 500,
    };
  }
}

/**
 * DELETE /v1/match/requests/:reqId
 * Cancel a match request
 */
router.delete(
  "/v1/match/requests/:reqId",
  async (req: Request, res: Response) => {
    const { reqId } = req.params;

    try {
      await withSpan("cancel_match_request", { reqId }, async () => {
        const result = await cancelMatchRequest(reqId, "user requested");

        if (!result.success) {
          res
            .status(result.statusCode || 500)
            .json({ error: result.error || "Failed to cancel" });
          return;
        }

        res.status(200).json({ message: "Request cancelled" });
      });
    } catch (error) {
      logger.error({ error, reqId }, "Failed to cancel match request");
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

/**
 * GET /v1/match/requests/:reqId/events
 * Server-Sent Events endpoint for real-time updates
 */
router.get("/v1/match/requests/:reqId/events", handleSSE);

/**
 * GET /-/health
 * Health check endpoint (liveness probe)
 */
router.get("/-/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

/**
 * GET /-/ready
 * Readiness check endpoint (verifies Redis connection)
 */
router.get("/-/ready", async (_req: Request, res: Response) => {
  try {
    const redisHealthy = await redisOps.healthCheck();

    if (redisHealthy) {
      res.status(200).json({ status: "ready", redis: "ok" });
    } else {
      res.status(503).json({ status: "not ready", redis: "error" });
    }
  } catch (error) {
    logger.error({ error }, "Readiness check failed");
    res.status(503).json({ status: "not ready", error: "Internal error" });
  }
});

/**
 * GET /-/metrics
 * Prometheus metrics endpoint
 */
router.get("/-/metrics", async (_req: Request, res: Response) => {
  try {
    // Update queue length metrics before serving
    const difficulties: ("easy" | "medium" | "hard")[] = [
      "easy",
      "medium",
      "hard",
    ];
    await Promise.all(
      difficulties.map(async (difficulty) => {
        const length = await redisOps.getQueueLength(difficulty);
        metrics.setQueueLength(difficulty, length);
      }),
    );

    res.setHeader("Content-Type", register.contentType);
    res.send(await register.metrics());
  } catch (error) {
    logger.error({ error }, "Failed to generate metrics");
    res.status(500).send("Error generating metrics");
  }
});

export { router };

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
import { authenticate } from "../middleware/auth.js";
import type { AuthContext } from "../auth/types.js";

// Load OpenAPI spec (lazy-loaded to avoid issues in test environment)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const openapiPath = join(__dirname, "../../openapi/spec.yaml");

let openapiSpec: any = null;
function getOpenapiSpec() {
  if (!openapiSpec) {
    try {
      openapiSpec = YAML.load(openapiPath);
    } catch (error) {
      // In test environment, OpenAPI spec might not be available
      openapiSpec = { info: { title: "Matching Service API", version: "1.0.0" } };
    }
  }
  return openapiSpec;
}

const router: Router = express.Router();

// Request validation schema
const createRequestSchema = z.object({
  userId: z.string().min(1).max(100),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topics: z
    .array(z.string().min(1).max(50))
    .min(1)
    .max(10)
    .refine((topics) => new Set(topics).size === topics.length, {
      message: "Topics must be unique (no duplicates)",
    }),
  languages: z
    .array(z.string().min(1).max(20))
    .min(1)
    .max(10)
    .refine((languages) => new Set(languages).size === languages.length, {
      message: "Languages must be unique (no duplicates)",
    }),
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
router.use("/docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  swaggerUi.setup(getOpenapiSpec())(req, res, next);
});

router.use(trackMetrics);

type RequestWithAuth = Request & { auth?: AuthContext };

function ensureAuthenticated(
  req: Request,
  res: Response,
): AuthContext | undefined {
  const auth = (req as RequestWithAuth).auth;
  if (!auth) {
    res.status(401).json({ error: "Unauthorized" });
    return undefined;
  }
  return auth;
}

router.use("/v1/match", authenticate);

/**
 * POST /v1/match/requests
 * Create a new match request
 */
router.post("/v1/match/requests", async (req: Request, res: Response) => {
  const auth = ensureAuthenticated(req, res);
  if (!auth) return;

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
      if (data.userId && data.userId !== auth.userId) {
        res.status(403).json({ error: "User mismatch" });
        return;
      }

      const userId = auth.userId;

      span.setAttribute("user_id", userId);
      span.setAttribute("difficulty", data.difficulty);

      // Check if user already has an active match request (deduplication)
      const existingReqId = await redisOps.getUserActiveRequest(userId);
      if (existingReqId) {
        // Check if the existing request is still valid
        const existingReq = await redisOps.getRequest(existingReqId);
        if (existingReq && existingReq.status === "queued") {
          logger.info(
            { userId, existingReqId },
            "User already has active match request",
          );
          res.status(409).json({
            error: "User already has an active match request",
            reqId: existingReqId,
          });
          return;
        }
        // Existing request is no longer active, clean up marker
        await redisOps.removeUserActiveRequest(userId);
      }

      logger.info(
        {
          reqId,
          userId,
          difficulty: data.difficulty,
          topics: data.topics,
          languages: data.languages,
        },
        "Creating match request",
      );

      // Get timeout configuration
      const timeoutSeconds = parseInt(
        process.env.MATCH_TIMEOUT_SECONDS || "30",
        10,
      );
      
      // Store request in Redis with TTL to prevent memory leaks
      // TTL = timeout + buffer to allow for processing and cleanup
      const ttlSeconds = timeoutSeconds + 300; // 5 minute buffer after timeout
      
      await redisOps.createRequest(
        reqId,
        {
          userId,
          difficulty: data.difficulty,
          topics: data.topics.join(","),
          languages: data.languages.join(","),
        },
        ttlSeconds,
      );

      // Add to queue
      const createdAt = Date.now();
      await redisOps.enqueue(reqId, data.difficulty, createdAt);

      // Add to timeout tracking (sorted set with deadline)
      await redisOps.addTimeout(reqId, data.difficulty, timeoutSeconds);

      // Mark user as having an active request (for deduplication)
  await redisOps.setUserActiveRequest(userId, reqId, ttlSeconds);

      // Trigger matcher via pub/sub
      await redis.publish(
        "match:trigger",
        JSON.stringify({ difficulty: data.difficulty }),
      );

      logger.info({ reqId, userId }, "Match request created");

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
  const auth = ensureAuthenticated(req, res);
  if (!auth) return;

  const { reqId } = req.params;

  try {
    await withSpan("get_match_request", { reqId }, async () => {
      const request = await redisOps.getRequest(reqId);

      if (!request) {
        res.status(404).json({ error: "Request not found" });
        return;
      }

      if (request.userId !== auth.userId) {
        res.status(403).json({ error: "Forbidden" });
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
 *
 * Uses atomic status update to prevent race conditions with matching operations
 */
export async function cancelMatchRequest(
  reqId: string,
  userId: string,
  reason: string = "user requested",
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
  statusCode?: number;
  sessionId?: string;
}> {
  try {
    const request = await redisOps.getRequest(reqId);

    if (!request) {
      return { success: false, error: "Request not found", statusCode: 404 };
    }

    if (request.userId !== userId) {
      return { success: false, error: "Forbidden", statusCode: 403 };
    }

    // If already matched, return 409 with session info
    // The user should join the session - collaboration service handles if they don't
    if (request.status === "matched") {
      logger.info(
        { reqId, userId: request.userId, sessionId: request.sessionId, reason },
        "Request already matched - user should join session",
      );

      // Remove user's active request marker (cleanup)
      await redisOps.removeUserActiveRequest(request.userId);

      // Return 409 Conflict with session info (frontend redirects to session)
      // Collaboration service will handle if user never joins
      return {
        success: false,
        error: "Request already matched",
        statusCode: 409,
        sessionId: request.sessionId,
      };
    }

    // Terminal states - idempotent
    if (request.status === "cancelled" || request.status === "timeout") {
      logger.info(
        { reqId, status: request.status, reason },
        "Cancel request idempotent - already in terminal state",
      );
      return {
        success: true,
        message: `Request already ${request.status}`,
      };
    }

    // Atomically update status from "queued" to "cancelled"
    // This prevents race condition where matcher updates to "matched" between our check and update
    const updated = await redisOps.atomicUpdateRequestStatus(
      reqId,
      "queued",
      "cancelled",
    );

    if (!updated) {
      // Status was changed by another operation (likely matched or timeout)
      // Re-fetch to get current status and handle accordingly
      const currentRequest = await redisOps.getRequest(reqId);
      const currentStatus = currentRequest?.status || "unknown";

      logger.info(
        { reqId, reason, currentStatus },
        "CAS failed - request status changed during operation",
      );

      // If it was matched during our attempt, redirect to session
      if (currentStatus === "matched") {
        await redisOps.removeUserActiveRequest(request.userId);
        
        // Return 409 with session ID - collaboration service handles the rest
        return {
          success: false,
          error: "Request already matched",
          statusCode: 409,
          sessionId: currentRequest?.sessionId,
        };
      }

      // Already in terminal state - idempotent
      return {
        success: true,
        message: `Request already ${currentStatus}`,
      };
    }

    // Status successfully updated to "cancelled" - proceed with cleanup
    // Remove from queue
    await redisOps.dequeue(reqId, request.difficulty);

    // Remove from timeout tracking
    await redisOps.removeTimeout(reqId, request.difficulty);

    // Remove user's active request marker
    await redisOps.removeUserActiveRequest(request.userId);

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
    const auth = ensureAuthenticated(req, res);
    if (!auth) return;

    const { reqId } = req.params;

    try {
      await withSpan("cancel_match_request", { reqId }, async () => {
        const result = await cancelMatchRequest(reqId, auth.userId, "user requested");

        if (!result.success) {
          // Include sessionId in 409 response for already-matched case
          const responseBody: any = { error: result.error || "Failed to cancel" };
          if (result.sessionId) {
            responseBody.sessionId = result.sessionId;
          }
          res.status(result.statusCode || 500).json(responseBody);
          return;
        }

        // Successfully cancelled
        res.status(200).json(result);
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

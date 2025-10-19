/**
 * Collaboration Service client
 */

import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import type { CreateSessionRequest, CreateSessionResponse } from "../types.js";

const COLLABORATION_SERVICE_URL =
  process.env.COLLABORATION_SERVICE_URL || "http://localhost:4000";

/**
 * Create a session in the collaboration service
 */
export async function createSession(
  request: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const start = Date.now();

  try {
    logger.info({ request }, "Calling collaboration service to create session");

    const response = await fetch(`${COLLABORATION_SERVICE_URL}/api/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const duration = (Date.now() - start) / 1000;
    metrics.recordCollaborationServiceCall(duration);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Collaboration service returned ${response.status}: ${errorText}`,
      );
    }

    const data = (await response.json()) as CreateSessionResponse;

    logger.info(
      { sessionId: data.sessionId, duration },
      "Session created successfully",
    );

    return data;
  } catch (error) {
    const duration = (Date.now() - start) / 1000;
    metrics.recordCollaborationServiceCall(duration);
    metrics.recordError("collaboration_service_error", "create_session");

    logger.error(
      { error, request, duration },
      "Failed to create session in collaboration service",
    );

    throw error;
  }
}

/**
 * Health check for collaboration service
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${COLLABORATION_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return response.ok;
  } catch (error) {
    logger.warn({ error }, "Collaboration service health check failed");
    return false;
  }
}

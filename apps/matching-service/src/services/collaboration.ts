/**
 * Collaboration Service client
 */

import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import type { CreateSessionRequest, CreateSessionResponse } from "../types.js";

const COLLABORATION_SERVICE_URL =
  process.env.COLLABORATION_SERVICE_URL || "http://localhost:3003";

/**
 * Create a session in the collaboration service
 */
export async function createSession(
  request: CreateSessionRequest,
): Promise<CreateSessionResponse> {
  const start = Date.now();

  try {
    logger.info({ request }, "Calling collaboration service to create session");

    // Map matching-service request to collab-service expected schema
    // Collab expects { user1Id, user2Id, questionId, difficulty, topic?, language? }
    const [user1Id, user2Id] = request.userIds;
    const topic = request.topics?.[0];
    const language = request.languages?.[0];

    // TEMP: questionId not selected here; use topic as placeholder until question service integration
    const questionId = topic || "unknown";

    const collabPayload = {
      user1Id,
      user2Id,
      questionId,
      difficulty: request.difficulty,
      ...(topic ? { topic } : {}),
      ...(language ? { language } : {}),
    };

    const response = await fetch(`${COLLABORATION_SERVICE_URL}/v1/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // For collab mock auth: Authorization: Bearer <userId> (must be one of participants)
        Authorization: `Bearer ${user1Id}`,
      },
      body: JSON.stringify(collabPayload),
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

    const raw: any = await response.json();

    // Collab returns { message, data: { sessionId, ... } }
    const sessionId = raw?.data?.sessionId ?? raw?.sessionId;
    if (!sessionId) {
      throw new Error("Collaboration service response missing sessionId");
    }

    const data: CreateSessionResponse = { sessionId };

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

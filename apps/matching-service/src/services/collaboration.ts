/**
 * Collaboration Service client
 */

import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { getCollabAuthHeader } from "../utils/auth.js";
import { getMatchingQuestion } from "./question.js";
import type { CreateSessionRequest, CreateSessionResponse } from "../types.js";

const COLLABORATION_SERVICE_URL =
    process.env.COLLABORATION_SERVICE_URL || "http://localhost:3003";

/**
 * Create a session in the collaboration service
 * 
 * @param request - Session creation request
 * @param userToken - Optional JWT token from the user (for JWKS auth)
 */
export async function createSession(
    request: CreateSessionRequest,
    userToken?: string,
): Promise<CreateSessionResponse> {
    const start = Date.now();

    try {
        logger.info({ request }, "Calling collaboration service to create session");

        // Map matching-service request to collab-service expected schema
        // Collab expects { user1Id, user2Id, questionId, difficulty, topic?, language? }
        const [user1Id, user2Id] = request.userIds;
        const topic = request.topics?.[0];
        const language = request.languages?.[0];

        // Fetch an actual question from the question service
        const questionResult = await getMatchingQuestion(
            request.difficulty,
            request.topics,
            userToken, // Pass the user token for authentication
        );

        // Use fetched question ID, or fail if no question available
        if (!questionResult) {
            logger.error(
                { difficulty: request.difficulty, topics: request.topics },
                "❌ No questions available for matching criteria",
            );
            throw new Error(
                "No questions available. Please try different criteria or contact support."
            );
        }

        const { questionId: fetchedQuestionId, matchType } = questionResult;

        logger.info(
            {
                difficulty: request.difficulty,
                topics: request.topics,
                questionId: fetchedQuestionId,
                matchType,
            },
            "🎲 Selected question for session",
        );

        const collabPayload = {
            user1Id,
            user2Id,
            questionId: fetchedQuestionId,
            difficulty: request.difficulty,
            ...(topic ? { topic } : {}),
            ...(language ? { language } : {}),
        };

        logger.info(
            { collabPayload },
            "📤 Sending payload to collaboration service",
        );

        // Get appropriate authorization header
        // Requires a valid JWT token from user service
        let authHeader: string;
        try {
            authHeader = getCollabAuthHeader(user1Id, userToken);
        } catch (authError) {
            logger.error(
                {
                    error: authError,
                    user1Id,
                    hasUserToken: !!userToken,
                    tokenLength: userToken?.length
                },
                "Failed to get auth header for collab service - no valid JWT token"
            );
            throw new Error(
                "Cannot create collaboration session: Authentication token required. " +
                "Please ensure users are properly authenticated with the user service."
            );
        }

        const response = await fetch(`${COLLABORATION_SERVICE_URL}/api/v1/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: authHeader,
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

        // Log the full response to debug
        logger.info(
            {
                fullResponse: raw,
                hasData: !!raw?.data,
                dataKeys: raw?.data ? Object.keys(raw.data) : [],
            },
            "📦 Full collaboration service response received",
        );

        // Collab returns { message, data: { sessionId, questionId, ... } }
        const sessionId = raw?.data?.sessionId ?? raw?.sessionId;
        if (!sessionId) {
            logger.error(
                { raw, hasData: !!raw?.data },
                "❌ Collaboration service response missing sessionId",
            );
            throw new Error("Collaboration service response missing sessionId");
        }

        // Extract questionId and language if available
        const questionId = raw?.data?.questionId ?? raw?.questionId;
        const responseLanguage = raw?.data?.language ?? raw?.language;

        logger.info(
            {
                sessionId,
                questionId,
                language: responseLanguage,
                rawDataQuestionId: raw?.data?.questionId,
                rawQuestionId: raw?.questionId,
            },
            "🔍 Extracted session data from response",
        );

        const data: CreateSessionResponse = {
            sessionId,
            ...(questionId && { questionId }),
            ...(matchType && { questionMatchType: matchType }),
            ...(responseLanguage && { language: responseLanguage }),
        };

        logger.info(
            {
                sessionId: data.sessionId,
                questionId: data.questionId,
                questionMatchType: data.questionMatchType,
                language: data.language,
                hasQuestionId: !!data.questionId,
                duration,
            },
            "✅ Session created successfully",
        );

        return data;
    } catch (error) {
        const duration = (Date.now() - start) / 1000;
        metrics.recordCollaborationServiceCall(duration);
        metrics.recordError("collaboration_service_error", "create_session");

        logger.error(
            {
                error: error instanceof Error ? {
                    message: error.message,
                    name: error.name,
                    stack: error.stack,
                } : error,
                request,
                duration
            },
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

/**
 * Delete a session from the collaboration service
 * Used for cleanup when match rollback occurs
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
    const start = Date.now();

    try {
        logger.info({ sessionId }, "Deleting session from collaboration service");

        const response = await fetch(
            `${COLLABORATION_SERVICE_URL}/api/v1/sessions/${sessionId}`,
            {
                method: "DELETE",
                signal: AbortSignal.timeout(5000),
            },
        );

        const duration = (Date.now() - start) / 1000;
        metrics.recordCollaborationServiceCall(duration);

        if (!response.ok) {
            const errorText = await response.text();
            logger.warn(
                { sessionId, status: response.status, error: errorText },
                "Failed to delete session (may not exist or already deleted)",
            );
            return false;
        }

        logger.info({ sessionId, duration }, "Session deleted successfully");
        return true;
    } catch (error) {
        const duration = (Date.now() - start) / 1000;
        metrics.recordCollaborationServiceCall(duration);

        logger.error(
            { error, sessionId, duration },
            "Error deleting session from collaboration service",
        );
        return false;
    }
}

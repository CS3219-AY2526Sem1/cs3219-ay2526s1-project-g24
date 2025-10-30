/**
 * Matcher Worker - Processes matching using Redis Pub/Sub
 */

import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { withSpan } from "../observability/tracing.js";
import { redisOps, redis } from "../services/redis.js";
import { createSession } from "../services/collaboration.js";
import type { StoredMatchRequest, Difficulty } from "../types.js";

/**
 * Check if two requests are compatible
 */
export function isCompatible(
    req1: StoredMatchRequest,
    req2: StoredMatchRequest,
): boolean {
    const topics1 = req1.topics.split(",").map((t) => t.trim());
    const topics2 = req2.topics.split(",").map((t) => t.trim());
    const langs1 = req1.languages.split(",").map((l) => l.trim());
    const langs2 = req2.languages.split(",").map((l) => l.trim());

    const hasTopicOverlap = topics1.some((t) => topics2.includes(t));
    const hasLangOverlap = langs1.some((l) => langs2.includes(l));

    return hasTopicOverlap && hasLangOverlap;
}

/**
 * Attempt to match two requests from the queue
 */
async function attemptMatch(difficulty: Difficulty): Promise<void> {
    await withSpan("attempt_match", { difficulty }, async (span) => {
        // Atomically pop 2 requests from queue (FIFO order)
        const items = await redisOps.popFromQueue(difficulty, 2);

        if (items.length < 2) {
            // Not enough in queue, re-add the one we popped (if any)
            if (items.length === 1) {
                await redisOps.enqueue(items[0].reqId, difficulty, items[0].score);
            }
            logger.debug({ difficulty }, "Not enough requests in queue for matching");
            return;
        }

        const [item1, item2] = items;
        const req1 = await redisOps.getRequest(item1.reqId);
        const req2 = await redisOps.getRequest(item2.reqId);

        // Check if both requests still exist and are queued
        if (
            !req1 ||
            req1.status !== "queued" ||
            !req2 ||
            req2.status !== "queued"
        ) {
            logger.info(
                { req1Id: item1.reqId, req2Id: item2.reqId },
                "One or both requests no longer queued",
            );
            return;
        }

        // Check compatibility
        if (!isCompatible(req1, req2)) {
            // Incompatible - re-add to queue (back of line)
            await redisOps.enqueue(item1.reqId, difficulty, item1.score);
            await redisOps.enqueue(item2.reqId, difficulty, item2.score);
            logger.debug(
                { req1Id: item1.reqId, req2Id: item2.reqId },
                "Requests incompatible",
            );
            return;
        }

        // Compatible! Create session
        try {
            // Use auth token from first request if available (both users should be authenticated)
            // If no token available, fall back to mock auth (userId as token)
            const authToken = req1.authToken || req2.authToken;

            logger.info(
                {
                    req1Id: item1.reqId,
                    req2Id: item2.reqId,
                    user1: req1.userId,
                    user2: req2.userId,
                },
                "🎯 Creating collaboration session for matched users",
            );

            const mergedTopics = [
                ...new Set([...req1.topics.split(","), ...req2.topics.split(",")]),
            ];
            const mergedLanguages = [
                ...new Set([
                    ...req1.languages.split(","),
                    ...req2.languages.split(","),
                ]),
            ];

            logger.info(
                {
                    mergedTopics,
                    mergedTopicsType: Array.isArray(mergedTopics) ? 'array' : typeof mergedTopics,
                    mergedLanguages,
                    difficulty,
                },
                "📋 Merged topics and languages for session creation",
            );

            const session = await createSession(
                {
                    difficulty,
                    userIds: [req1.userId, req2.userId],
                    topics: mergedTopics,
                    languages: mergedLanguages,
                },
                authToken, // Pass token for JWKS auth, or undefined for mock auth
            );

            logger.info(
                {
                    sessionId: session.sessionId,
                    questionId: session.questionId,
                    user1: req1.userId,
                    user2: req2.userId,
                },
                "✅ Collaboration session created successfully",
            );

            // Update both requests as matched
            await redisOps.updateRequestStatus(
                item1.reqId,
                "matched",
                session.sessionId,
            );
            await redisOps.updateRequestStatus(
                item2.reqId,
                "matched",
                session.sessionId,
            );

            // Remove from timeout tracking (they've been matched)
            await redisOps.removeTimeout(item1.reqId, difficulty);
            await redisOps.removeTimeout(item2.reqId, difficulty);

            // Publish events
            logger.info(
                {
                    req1Id: item1.reqId,
                    req2Id: item2.reqId,
                    sessionId: session.sessionId,
                    questionId: session.questionId,
                },
                "📢 Publishing match events to both users",
            );

            const matchEvent = {
                status: "matched" as const,
                sessionId: session.sessionId,
                ...(session.questionId && { questionId: session.questionId }),
                timestamp: Date.now(),
            };

            await redisOps.publishEvent(item1.reqId, matchEvent);
            logger.info(
                {
                    reqId: item1.reqId,
                    sessionId: session.sessionId,
                    questionId: session.questionId,
                },
                "✉️ Event published for user 1",
            );

            await redisOps.publishEvent(item2.reqId, matchEvent);
            logger.info(
                {
                    reqId: item2.reqId,
                    sessionId: session.sessionId,
                    questionId: session.questionId,
                },
                "✉️ Event published for user 2",
            );

            // Record metrics
            const latency1 = (Date.now() - req1.createdAt) / 1000;
            const latency2 = (Date.now() - req2.createdAt) / 1000;
            metrics.recordMatch(difficulty, latency1);
            metrics.recordMatch(difficulty, latency2);

            logger.info(
                {
                    req1Id: item1.reqId,
                    req2Id: item2.reqId,
                    sessionId: session.sessionId,
                },
                "Successfully matched requests",
            );

            span.setAttribute("matched", true);
            span.setAttribute("sessionId", session.sessionId);
        } catch (error) {
            // Session creation failed - re-add to queue
            await redisOps.enqueue(item1.reqId, difficulty, item1.score);
            await redisOps.enqueue(item2.reqId, difficulty, item2.score);
            logger.error(
                { error, req1Id: item1.reqId, req2Id: item2.reqId },
                "Failed to create session",
            );
            throw error;
        }
    });
}

/**
 * Start the matcher worker
 */
export function startMatcher(): void {
    // Subscribe to match trigger channel
    const subscriber = redis.duplicate();

    subscriber.subscribe("match:trigger", (err?: Error | null) => {
        if (err) {
            logger.error({ error: err }, "Failed to subscribe to match trigger");
            return;
        }
        logger.info("Matcher worker subscribed to match:trigger");
    });

    subscriber.on("message", async (channel: string, message: string) => {
        if (channel !== "match:trigger") return;

        const { difficulty } = JSON.parse(message) as { difficulty: Difficulty };

        try {
            await attemptMatch(difficulty);
        } catch (error) {
            logger.error({ error, difficulty }, "Error in matcher worker");
        }
    });

    logger.info("Matcher worker started");
}

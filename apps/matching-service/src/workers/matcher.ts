/**
 * Matcher Worker - Processes matching using Redis Pub/Sub
 */

import { logger } from "../observability/logger.js";
import { metrics } from "../observability/metrics.js";
import { withSpan } from "../observability/tracing.js";
import { redisOps, redis } from "../services/redis.js";
import { createSession, deleteSession } from "../services/collaboration.js";
import type { StoredMatchRequest, Difficulty } from "../types.js";

/**
 * Check if two requests are compatible
 */
export function isCompatible(
    req1: StoredMatchRequest,
    req2: StoredMatchRequest,
): boolean {
    const topics1 = req1.topics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    const topics2 = req2.topics
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    const langs1 = req1.languages
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    const langs2 = req2.languages
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    // Ensure both have valid topics and languages
    if (
        topics1.length === 0 ||
        topics2.length === 0 ||
        langs1.length === 0 ||
        langs2.length === 0
    ) {
        return false;
    }

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
            // Requeue any request that is still pending to avoid dropping it
            const requeuePromises: Promise<void>[] = [];

            if (req1 && req1.status === "queued") {
                if (typeof item1.score === "undefined") {
                    logger.error(
                        { reqId: item1.reqId, difficulty, item: item1 },
                        "Cannot requeue request: score is undefined (data consistency issue)",
                    );
                } else {
                    requeuePromises.push(
                        redisOps.enqueue(item1.reqId, difficulty, item1.score),
                    );
                }
            }

            if (req2 && req2.status === "queued") {
                if (typeof item2.score === "undefined") {
                    logger.error(
                        { reqId: item2.reqId, difficulty, item: item2 },
                        "Cannot requeue request: score is undefined (data consistency issue)",
                    );
                } else {
                    requeuePromises.push(
                        redisOps.enqueue(item2.reqId, difficulty, item2.score),
                    );
                }
            }

            if (requeuePromises.length > 0) {
                await Promise.allSettled(requeuePromises);
            }

            logger.info(
                {
                    req1Id: item1.reqId,
                    req1Status: req1?.status ?? "missing",
                    req2Id: item2.reqId,
                    req2Status: req2?.status ?? "missing",
                },
                "One or both requests no longer queued",
            );
            return;
        }

        // Prevent matching same user with themselves
        if (req1.userId === req2.userId) {
            logger.warn(
                { userId: req1.userId, req1Id: item1.reqId, req2Id: item2.reqId },
                "Same user cannot match with themselves, re-queuing second request",
            );
            // Re-add the second request to back of queue
            await redisOps.enqueue(item2.reqId, difficulty, Date.now());
            // Re-add first request too to ensure fair ordering
            await redisOps.enqueue(item1.reqId, difficulty, Date.now() + 1);
            return;
        }

        // Check compatibility
        if (!isCompatible(req1, req2)) {
            // Incompatible - re-add to queue (back of line with current timestamp)
            // Use Date.now() instead of old score to prevent infinite matching loops
            const now = Date.now();
            await redisOps.enqueue(item1.reqId, difficulty, now);
            await redisOps.enqueue(item2.reqId, difficulty, now + 1); // +1 to maintain order
            logger.debug(
                { req1Id: item1.reqId, req2Id: item2.reqId },
                "Requests incompatible, re-queued with new timestamps",
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

            // Atomically update both requests as matched (prevents timeout/cancel from overwriting)
            const updated1 = await redisOps.atomicUpdateRequestStatus(
                item1.reqId,
                "queued",
                "matched",
                session.sessionId,
            );
            const updated2 = await redisOps.atomicUpdateRequestStatus(
                item2.reqId,
                "queued",
                "matched",
                session.sessionId,
            );

            // Check if either update failed (request was cancelled/timed out)
            if (!updated1 || !updated2) {
                logger.warn(
                    { req1Id: item1.reqId, updated1, req2Id: item2.reqId, updated2 },
                    "One or both requests couldn't be matched - status changed during operation",
                );

                // Get timeout configuration for re-adding
                const timeoutSeconds = parseInt(
                    process.env.MATCH_TIMEOUT_SECONDS || "30",
                    10,
                );

                // Rollback: If one succeeded but the other failed, revert the successful one
                // Use CAS to prevent race condition with timeout/cancel
                if (updated1 && !updated2) {
                    const rolledBack = await redisOps.atomicUpdateRequestStatus(
                        item1.reqId,
                        "matched",
                        "queued",
                    );
                    if (rolledBack) {
                        await redisOps.enqueue(item1.reqId, difficulty, Date.now());
                        await redisOps.addTimeout(item1.reqId, difficulty, timeoutSeconds);
                    } else {
                        logger.warn(
                            { reqId: item1.reqId },
                            "Rollback failed - request status changed (likely cancelled/timeout)",
                        );
                    }
                } else if (!updated1 && updated2) {
                    const rolledBack = await redisOps.atomicUpdateRequestStatus(
                        item2.reqId,
                        "matched",
                        "queued",
                    );
                    if (rolledBack) {
                        await redisOps.enqueue(item2.reqId, difficulty, Date.now());
                        await redisOps.addTimeout(item2.reqId, difficulty, timeoutSeconds);
                    } else {
                        logger.warn(
                            { reqId: item2.reqId },
                            "Rollback failed - request status changed (likely cancelled/timeout)",
                        );
                    }
                }

                // Cleanup the orphaned session
                await deleteSession(session.sessionId).catch((error) => {
                    logger.warn(
                        { sessionId: session.sessionId, error },
                        "Failed to cleanup orphaned session (best effort)",
                    );
                });

                return;
            }

            // Remove from timeout tracking (they've been matched)
            await redisOps.removeTimeout(item1.reqId, difficulty);
            await redisOps.removeTimeout(item2.reqId, difficulty);

            // Remove user active request markers
            await redisOps.removeUserActiveRequest(req1.userId);
            await redisOps.removeUserActiveRequest(req2.userId);

            // Publish events
            logger.info(
                {
                    req1Id: item1.reqId,
                    req2Id: item2.reqId,
                    sessionId: session.sessionId,
                    questionId: session.questionId,
                    questionMatchType: session.questionMatchType,
                    language: session.language,
                },
                "📢 Publishing match events to both users",
            );

            const matchEvent = {
                status: "matched" as const,
                sessionId: session.sessionId,
                ...(session.questionId && { questionId: session.questionId }),
                ...(session.questionMatchType && { questionMatchType: session.questionMatchType }),
                ...(session.language && { language: session.language }),
                timestamp: Date.now(),
            };

            await redisOps.publishEvent(item1.reqId, matchEvent);
            logger.info(
                {
                    reqId: item1.reqId,
                    sessionId: session.sessionId,
                    questionId: session.questionId,
                    language: session.language,
                },
                "✉️ Event published for user 1",
            );

            await redisOps.publishEvent(item2.reqId, matchEvent);
            logger.info(
                {
                    reqId: item2.reqId,
                    sessionId: session.sessionId,
                    questionId: session.questionId,
                    language: session.language,
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
            // Session creation failed - re-add to queue with proper timestamps and timeouts
            const timeoutSeconds = parseInt(
                process.env.MATCH_TIMEOUT_SECONDS || "30",
                10,
            );
            const now = Date.now();

            await redisOps.enqueue(item1.reqId, difficulty, now);
            await redisOps.enqueue(item2.reqId, difficulty, now + 1);
            await redisOps.addTimeout(item1.reqId, difficulty, timeoutSeconds);
            await redisOps.addTimeout(item2.reqId, difficulty, timeoutSeconds);

            logger.error(
                { error, req1Id: item1.reqId, req2Id: item2.reqId },
                "Failed to create session, re-queued both requests",
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

// Export internal helpers for targeted unit testing
export const __testExports = {
    attemptMatch,
};

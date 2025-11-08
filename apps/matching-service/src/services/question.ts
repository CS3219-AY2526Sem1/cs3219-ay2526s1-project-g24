/**
 * Question Service client
 * Fetches questions from the question service
 */

import { logger } from "../observability/logger.js";
import type { Difficulty } from "../types.js";

const QUESTION_SERVICE_URL =
    process.env.QUESTION_SERVICE_URL || "http://localhost:8000";

interface Question {
    id: number;
    title: string;
    difficulty: string;
    topics: Array<{ id: number; name: string }>;
}

interface TopicDto {
    id: number;
    name: string;
    description?: string;
}

async function resolveTopicIdsByNames(
    names: string[],
    authToken?: string,
): Promise<number[]> {
    try {
        // Fetch all topics once and map names (case-insensitive) to IDs
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

        const resp = await fetch(`${QUESTION_SERVICE_URL}/api/v1/topics`, {
            method: "GET",
            headers,
            signal: AbortSignal.timeout(3000),
        });
        if (!resp.ok) {
            logger.warn({ status: resp.status }, "⚠️ Failed to fetch topics for name->id mapping");
            return [];
        }
        const topics = (await resp.json()) as TopicDto[];
        const index = new Map<string, number>();
        topics.forEach((t) => index.set(t.name.toLowerCase(), t.id));
        const ids: number[] = [];
        names.forEach((n) => {
            const id = index.get(n.toLowerCase());
            if (typeof id === "number") ids.push(id);
        });
        return ids;
    } catch (error) {
        logger.warn({ error }, "⚠️ Error resolving topic IDs by names");
        return [];
    }
}

/**
 * Fetch a random question matching the given criteria with cascading fallback
 * @param difficulty - Question difficulty
 * @param topics - Array of topic names
 * @param authToken - Optional JWT token for authentication
 * @returns Object with question ID and match type, or null if no question found
 */
export async function getMatchingQuestion(
    difficulty: Difficulty,
    topics: string[],
    authToken?: string,
): Promise<{ questionId: string; matchType: 'exact' | 'partial' | 'difficulty' | 'random' } | null> {
    try {
        logger.info(
            { difficulty, topics },
            "🔍 Fetching random question from question service",
        );

        // Resolve topic names to IDs once
        let topicIds: number[] = [];
        if (topics && topics.length > 0) {
            topicIds = await resolveTopicIdsByNames(topics, authToken);
        }

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        // Strategy 1: Try exact match (difficulty + all topics)
        if (topicIds.length > 0) {
            const exactMatch = await tryFetchQuestion(difficulty, topicIds, headers);
            if (exactMatch) {
                // Verify that the question actually contains ALL requested topics
                const questionTopicIds = exactMatch.topics.map(t => t.id);
                const hasAllTopics = topicIds.every(id => questionTopicIds.includes(id));
                
                if (hasAllTopics) {
                    logger.info(
                        { questionId: exactMatch.id, title: exactMatch.title, strategy: 'exact', requestedTopics: topicIds.length, matchedTopics: questionTopicIds.length },
                        "✅ Found exact match (difficulty + all topics)",
                    );
                    return { questionId: String(exactMatch.id), matchType: 'exact' };
                } else {
                    logger.info(
                        { questionId: exactMatch.id, title: exactMatch.title, requestedTopics: topicIds, questionTopics: questionTopicIds },
                        "⚠️ Question doesn't have all requested topics, falling back to partial match",
                    );
                }
            }
        }

        // Strategy 2: Try with subsets of topics (remove one topic at a time)
        if (topicIds.length > 1) {
            for (let i = 0; i < topicIds.length; i++) {
                const subsetTopicIds = topicIds.filter((_, index) => index !== i);
                const partialMatch = await tryFetchQuestion(difficulty, subsetTopicIds, headers);
                if (partialMatch) {
                    logger.info(
                        { questionId: partialMatch.id, title: partialMatch.title, strategy: 'partial', usedTopics: subsetTopicIds.length },
                        "✅ Found partial match (difficulty + subset of topics)",
                    );
                    return { questionId: String(partialMatch.id), matchType: 'partial' };
                }
            }
        }

        // Strategy 3: Try difficulty only (ignore topics)
        const difficultyMatch = await tryFetchQuestion(difficulty, [], headers);
        if (difficultyMatch) {
            logger.info(
                { questionId: difficultyMatch.id, title: difficultyMatch.title, strategy: 'difficulty' },
                "✅ Found difficulty-only match (any topic)",
            );
            return { questionId: String(difficultyMatch.id), matchType: 'difficulty' };
        }

        // Strategy 4: Last resort - any random question
        const randomMatch = await tryFetchQuestion(null, [], headers);
        if (randomMatch) {
            logger.warn(
                { questionId: randomMatch.id, title: randomMatch.title, strategy: 'random', requestedDifficulty: difficulty, requestedTopics: topics },
                "⚠️ Using random fallback (no match for criteria)",
            );
            return { questionId: String(randomMatch.id), matchType: 'random' };
        }

        // No questions available at all
        logger.error(
            { difficulty, topics },
            "❌ No questions available in database",
        );
        return null;

    } catch (error) {
        logger.error(
            { error, difficulty, topics },
            "❌ Failed to fetch question from question service",
        );
        return null;
    }
}

/**
 * Helper function to try fetching a question with specific criteria
 */
async function tryFetchQuestion(
    difficulty: Difficulty | null,
    topicIds: number[],
    headers: Record<string, string>,
): Promise<Question | null> {
    try {
        const params = new URLSearchParams();
        
        if (difficulty) {
            params.append("difficulties", difficulty);
        }
        
        if (topicIds.length > 0) {
            params.append("topic_ids", topicIds.join(","));
        }

        const response = await fetch(
            `${QUESTION_SERVICE_URL}/api/v1/questions/random?${params.toString()}`,
            {
                method: "GET",
                headers,
                signal: AbortSignal.timeout(3000),
            },
        );

        if (!response.ok) {
            return null;
        }

        const question = (await response.json()) as Question;
        return question && question.id ? question : null;
    } catch (error) {
        return null;
    }
}

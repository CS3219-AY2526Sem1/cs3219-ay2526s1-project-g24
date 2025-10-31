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
 * Fetch a random question matching the given criteria
 * @param difficulty - Question difficulty
 * @param topics - Array of topic names
 * @param authToken - Optional JWT token for authentication
 * @returns Question ID as a string, or null if no question found
 */
export async function getMatchingQuestion(
    difficulty: Difficulty,
    topics: string[],
    authToken?: string,
): Promise<string | null> {
    try {
        logger.info(
            { difficulty, topics },
            "🔍 Fetching random question from question service",
        );

        // Build query parameters according to Question Service API
        // - difficulties: comma-separated string (e.g., "easy,medium")
        // - topic_ids: comma-separated numeric IDs
        const params = new URLSearchParams();
        params.append("difficulties", difficulty);

        // Resolve topic names to IDs (best effort). If none resolved, omit filter.
        let topicIdsCsv = "";
        if (topics && topics.length > 0) {
            const ids = await resolveTopicIdsByNames(topics, authToken);
            if (ids.length > 0) {
                topicIdsCsv = ids.join(",");
                params.append("topic_ids", topicIdsCsv);
            }
        }

        // Prepare headers
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };
        
        // Add authorization header if token is provided
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        // Use /random endpoint to get a single random question
        const response = await fetch(
            `${QUESTION_SERVICE_URL}/api/v1/questions/random?${params.toString()}`,
            {
                method: "GET",
                headers,
                signal: AbortSignal.timeout(3000), // 3 second timeout
            },
        );

        if (!response.ok) {
            logger.warn(
                { status: response.status, difficulty, topics },
                "⚠️ Question service returned error",
            );
            return null;
        }

        const question = (await response.json()) as Question;

        if (!question || !question.id) {
            logger.warn(
                { difficulty, topics, topicIdsCsv },
                "⚠️ No question found matching criteria",
            );
            return null;
        }

        logger.info(
            {
                questionId: question.id,
                title: question.title,
                difficulty: question.difficulty,
            },
            "✅ Selected random question for session",
        );

        return String(question.id);
    } catch (error) {
        logger.error(
            { error, difficulty, topics },
            "❌ Failed to fetch question from question service",
        );
        return null;
    }
}

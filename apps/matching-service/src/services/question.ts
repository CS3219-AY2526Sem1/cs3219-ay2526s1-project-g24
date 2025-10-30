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

/**
 * Fetch a random question matching the given criteria
 * @param difficulty - Question difficulty
 * @param topics - Array of topic names
 * @returns Question ID as a string, or null if no question found
 */
export async function getMatchingQuestion(
    difficulty: Difficulty,
    topics: string[],
): Promise<string | null> {
    try {
        logger.info(
            { difficulty, topics },
            "🔍 Fetching random question from question service",
        );

        // Build query parameters
        const params = new URLSearchParams();
        params.append("difficulty", difficulty);
        topics.forEach((topic) => params.append("topics", topic));

        // Use /random endpoint to get a single random question
        const response = await fetch(
            `${QUESTION_SERVICE_URL}/api/questions/random?${params.toString()}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
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
                { difficulty, topics },
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

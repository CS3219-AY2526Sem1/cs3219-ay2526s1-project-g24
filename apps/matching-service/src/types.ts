/**
 * Core type definitions for the matching service
 */

export type Difficulty = "easy" | "medium" | "hard";

export type RequestStatus = "queued" | "matched" | "cancelled" | "timeout";

/**
 * Match request submitted by a user
 */
export interface MatchRequest {
    userId: string;
    difficulty: Difficulty;
    topics: string[];
    languages: string[];
    authToken?: string; // Optional JWT token for authenticated requests
}

/**
 * Internal representation of a match request stored in Redis
 */
export interface StoredMatchRequest {
    userId: string;
    difficulty: Difficulty;
    topics: string; // CSV format: "graphs,bfs"
    languages: string; // CSV format: "python,java"
    status: RequestStatus;
    createdAt: number; // Unix timestamp (ms)
    sessionId?: string; // Set after successful match
    authToken?: string; // Optional JWT token (if provided)
}

/**
 * Response returned when creating a match request
 */
export interface MatchRequestResponse {
    reqId: string;
}

/**
 * Response returned when querying a match request
 */
export interface MatchRequestStatusResponse {
    reqId: string;
    userId: string;
    difficulty: Difficulty;
    topics: string[];
    languages: string[];
    status: RequestStatus;
    createdAt: number;
    sessionId?: string;
}

/**
 * Event sent via SSE to clients
 */
export interface MatchEvent {
    status: RequestStatus;
    timestamp: number;
    sessionId?: string;
    elapsed?: number; // Seconds since request creation
}

/**
 * Session creation request to Collaboration Service
 */
export interface CreateSessionRequest {
    difficulty: Difficulty;
    userIds: string[];
    topics: string[];
    languages: string[];
}

/**
 * Session creation response from Collaboration Service
 */
export interface CreateSessionResponse {
    sessionId: string;
    questionId?: string;
}

/**
 * Configuration for the service
 */
export interface ServiceConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
    };
    collaboration: {
        serviceUrl: string;
    };
    server: {
        port: number;
        env: "development" | "production" | "test";
    };
    observability: {
        otelEndpoint?: string;
        prometheusPort?: number;
    };
    matching: {
        timeoutSeconds: number; // Default: 30
        requestTTLSeconds: number; // Default: 60
    };
}

/**
 * Redis key patterns
 */
export const RedisKeys = {
    request: (reqId: string) => `match:req:${reqId}`,
    queue: (difficulty: Difficulty) => `queue:${difficulty}`,
    events: (reqId: string) => `events:${reqId}`,
} as const;

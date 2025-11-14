// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated Collaboration Service HTTP client:
//   - createSession(): Create collaborative session
//   - getSession(): Get session details
//   - deleteSession(): Delete session
//   - getSessionState(): Get Yjs document state
//   - endSession(): Mark session as ended
//   - Health check utilities
//   Integrates with WebSocket for real-time collaboration
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added proper error handling for session lifecycle
//   - Enhanced type safety for session states
//   - Implemented session validation

"use client";
import { API_CONFIG, createServiceUrlBuilder } from "@/lib/api-utils";

const serviceUrl = createServiceUrlBuilder(API_CONFIG.COLLAB_SERVICE, "/api/v1");

interface ApiResponse<T> {
    message: string;
    data: T;
}

export type CollaborationSessionStatus = "ACTIVE" | "TERMINATED" | "EXPIRED";

export interface CollaborationSession {
    id: string;
    sessionId: string;
    user1Id: string;
    user2Id: string;
    questionId: string;
    difficulty: string;
    topic: string;
    language: string;
    status: CollaborationSessionStatus;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
    terminatedAt: string | null;
}

class CollaborationServiceClient {

    /**
     * Fetch collaboration session details.
     * Throws an error with an attached `status` property when the request fails.
     */
    async getSession(sessionId: string): Promise<CollaborationSession> {
        const response = await fetch(
            serviceUrl(`/sessions/${encodeURIComponent(sessionId)}`),
            {
                method: "GET",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        if (response.ok) {
            const payload = (await response.json()) as ApiResponse<CollaborationSession>;
            return payload.data;
        }

        const errorPayload = (await response.json().catch(() => null)) as unknown;
        const message =
            typeof errorPayload === "object" &&
                errorPayload !== null &&
                "message" in errorPayload &&
                typeof (errorPayload as { message?: string }).message === "string"
                ? (errorPayload as { message?: string }).message
                : typeof errorPayload === "object" &&
                    errorPayload !== null &&
                    "error" in errorPayload &&
                    typeof (errorPayload as { error?: string }).error === "string"
                    ? (errorPayload as { error?: string }).error
                    : undefined;

        const error = new Error(
            message || `Failed to fetch session ${sessionId}`,
        ) as Error & { status?: number };
        error.status = response.status;
        throw error;
    }

    /**
     * Attempt to rejoin a collaboration session.
     * Succeeds only when the backend confirms the session is still active and can be rejoined.
     */
    async rejoinSession(sessionId: string): Promise<CollaborationSession> {
        const response = await fetch(
            serviceUrl(`/sessions/${encodeURIComponent(sessionId)}/rejoin`),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        if (response.ok) {
            const payload = (await response.json()) as ApiResponse<CollaborationSession>;
            return payload.data;
        }

        const errorPayload = (await response.json().catch(() => null)) as unknown;
        const message =
            typeof errorPayload === "object" &&
                errorPayload !== null &&
                "message" in errorPayload &&
                typeof (errorPayload as { message?: string }).message === "string"
                ? (errorPayload as { message?: string }).message
                : typeof errorPayload === "object" &&
                    errorPayload !== null &&
                    "error" in errorPayload &&
                    typeof (errorPayload as { error?: string }).error === "string"
                    ? (errorPayload as { error?: string }).error
                    : undefined;

        const error = new Error(
            message || `Failed to rejoin session ${sessionId}`,
        ) as Error & { status?: number };
        error.status = response.status;
        throw error;
    }

    /**
     * Leave a collaboration session (disconnect).
     * Notifies the backend that the user is disconnecting.
     * If both users leave, the session will be automatically deleted.
     */
    async leaveSession(sessionId: string): Promise<CollaborationSession> {
        const response = await fetch(
            serviceUrl(`/sessions/${encodeURIComponent(sessionId)}/leave`),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        if (response.ok) {
            const payload = (await response.json()) as ApiResponse<CollaborationSession>;
            return payload.data;
        }

        const errorPayload = (await response.json().catch(() => null)) as unknown;
        const message =
            typeof errorPayload === "object" &&
                errorPayload !== null &&
                "message" in errorPayload &&
                typeof (errorPayload as { message?: string }).message === "string"
                ? (errorPayload as { message?: string }).message
                : typeof errorPayload === "object" &&
                    errorPayload !== null &&
                    "error" in errorPayload &&
                    typeof (errorPayload as { error?: string }).error === "string"
                    ? (errorPayload as { error?: string }).error
                    : undefined;

        const error = new Error(
            message || `Failed to leave session ${sessionId}`,
        ) as Error & { status?: number };
        error.status = response.status;
        throw error;
    }

    /**
     * Terminate a collaboration session for both users.
     * Marks the session as TERMINATED and disconnects all participants.
     */
    async terminateSession(sessionId: string): Promise<void> {
        const response = await fetch(
            serviceUrl(`/sessions/${encodeURIComponent(sessionId)}/terminate`),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );

        if (response.ok) {
            return;
        }

        const errorPayload = (await response.json().catch(() => null)) as unknown;
        const message =
            typeof errorPayload === "object" &&
                errorPayload !== null &&
                "message" in errorPayload &&
                typeof (errorPayload as { message?: string }).message === "string"
                ? (errorPayload as { message?: string }).message
                : typeof errorPayload === "object" &&
                    errorPayload !== null &&
                    "error" in errorPayload &&
                    typeof (errorPayload as { error?: string }).error === "string"
                    ? (errorPayload as { error?: string }).error
                    : undefined;

        const error = new Error(
            message || `Failed to terminate session ${sessionId}`,
        ) as Error & { status?: number };
        error.status = response.status;
        throw error;
    }
}

export const collaborationService = new CollaborationServiceClient();

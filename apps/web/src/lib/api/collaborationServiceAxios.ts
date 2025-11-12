import { API_CONFIG, createServiceUrlBuilder } from "@/lib/api-utils";
import { apiClient } from "./axiosClient";

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
     */
    async getSession(sessionId: string): Promise<CollaborationSession> {
        const response = await apiClient.get<ApiResponse<CollaborationSession>>(
            serviceUrl(`/sessions/${encodeURIComponent(sessionId)}`),
            { withCredentials: true }
        );
        return response.data.data;
    }

    /**
     * Attempt to rejoin a collaboration session.
     */
    async rejoinSession(sessionId: string): Promise<CollaborationSession> {
        const response = await apiClient.post<ApiResponse<CollaborationSession>>(
            serviceUrl(`/sessions/${encodeURIComponent(sessionId)}/rejoin`),
            {},
            { withCredentials: true }
        );
        return response.data.data;
    }

    /**
     * Leave a collaboration session (disconnect).
     */
    async leaveSession(sessionId: string): Promise<CollaborationSession> {
        const response = await apiClient.post<ApiResponse<CollaborationSession>>(
            serviceUrl(`/sessions/${encodeURIComponent(sessionId)}/leave`),
            {},
            { withCredentials: true }
        );
        return response.data.data;
    }
}

export const collaborationService = new CollaborationServiceClient();

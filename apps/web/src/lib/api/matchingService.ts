/**
 * Matching Service API Client
 * Handles communication with the matching microservice
 */

import { API_CONFIG } from '../apiConfig';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type MatchStatus = 'queued' | 'matched' | 'cancelled' | 'timeout';

/**
 * Get JWT token from cookies
 * The user service stores the token in 'access_token' cookie
 */
function getAuthToken(): string | null {
    if (typeof document === 'undefined') return null;

    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'access_token') {
            return value;
        }
    }
    return null;
}

/**
 * Get headers with authentication
 */
function getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export interface MatchRequest {
    userId: string;
    difficulty: Difficulty;
    topics: string[];
    languages: string[];
}

export interface MatchRequestResponse {
    reqId: string;
    alreadyQueued?: boolean;
}

export interface MatchRequestStatus {
    reqId: string;
    userId: string;
    difficulty: Difficulty;
    topics: string[];
    languages: string[];
    status: MatchStatus;
    createdAt: number;
    sessionId?: string;
}

export interface MatchEvent {
    status: MatchStatus;
    sessionId?: string;
    timestamp: number;
    elapsed?: number;
}

class MatchingServiceClient {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_CONFIG.MATCHING_SERVICE;
    }

    /**
     * Create a new match request
     */
    async createMatchRequest(
        request: MatchRequest,
    ): Promise<MatchRequestResponse> {
        const response = await fetch(`${this.baseUrl}/v1/match/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(request),
        });

        if (response.ok) {
            return response.json() as Promise<MatchRequestResponse>;
        }

        let errorPayload: any = null;
        try {
            errorPayload = await response.json();
        } catch {
            // Ignore JSON parse failures for error payloads
        }

        if (response.status === 409 && errorPayload?.reqId) {
            return {
                reqId: errorPayload.reqId,
                alreadyQueued: true,
            };
        }

        throw new Error(
            errorPayload?.error || 'Failed to create match request',
        );
    }

    /**
     * Get the status of a match request
     */
    async getMatchRequestStatus(reqId: string): Promise<MatchRequestStatus> {
        const response = await fetch(`${this.baseUrl}/v1/match/requests/${reqId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get match request status');
        }

        return response.json();
    }

    /**
     * Cancel a match request
     * @throws Error if cancellation fails (except for 409 Conflict - already matched)
     * @returns Object indicating if request was cancelled or already matched
     */
    async cancelMatchRequest(
        reqId: string,
    ): Promise<{
        cancelled: boolean;
        alreadyMatched: boolean;
        sessionId?: string;
    }> {
        const response = await fetch(`${this.baseUrl}/v1/match/requests/${reqId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (response.ok) {
            // Successfully cancelled
            return { cancelled: true, alreadyMatched: false };
        }

        // Handle 409 Conflict - request was already matched
        if (response.status === 409) {
            // Extract session ID directly from 409 response body (optimization)
            try {
                const data = await response.json();
                if (data.sessionId) {
                    return {
                        cancelled: false,
                        alreadyMatched: true,
                        sessionId: data.sessionId,
                    };
                }
            } catch (err) {
                console.error('Failed to parse 409 response:', err);
            }

            // Fallback: Even if we can't parse the response, indicate it was matched
            return { cancelled: false, alreadyMatched: true };
        }

        // Other errors
        const error = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to cancel match request');
    }

    /**
     * Subscribe to real-time match updates via Server-Sent Events (SSE)
     * @param reqId The request ID to subscribe to
     * @param onEvent Callback for each event received
     * @param onError Callback for errors
     * @returns A function to close the connection
     */
    subscribeToMatchEvents(
        reqId: string,
        onEvent: (event: MatchEvent) => void,
        onError?: (error: Error) => void,
    ): () => void {
        const eventSource = new EventSource(
            `${this.baseUrl}/v1/match/requests/${reqId}/events`,
            { withCredentials: true },
        );

        // Listen for application-level SSE error events sent by the server.
        // The matching service emits a custom SSE event with name "error" and a JSON payload
        // when rejecting duplicate connections (HTTP 409). If we can parse that payload and
        // detect the duplicate message, surface a precise error instead of inferring.
        eventSource.addEventListener('error', (evt) => {
            try {
                // Some browsers dispatch built-in network errors here without data so we guard accordingly.
                const dataStr = (evt as MessageEvent).data as string | undefined;
                if (!dataStr) return;
                const payload = JSON.parse(dataStr);

                if (payload?.code === 'DUPLICATE_SSE') {
                    onError?.(new Error('Duplicate SSE connection'));
                    eventSource.close();
                }
            } catch {
                // Ignore malformed payloads
            }
        });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data) as MatchEvent;
                onEvent(data);
            } catch (error) {
                console.error('Error parsing SSE event:', error);
                onError?.(error as Error);
            }
        };

        eventSource.onerror = (_error) => {
            // On SSE errors (including normal server-initiated close after a terminal event),
            // fetch the latest status and treat terminal states as normal outcomes instead of errors.
            this.getMatchRequestStatus(reqId)
                .then((status) => {
                    if (status.status === 'matched' && status.sessionId) {
                        onEvent({
                            status: 'matched',
                            sessionId: status.sessionId,
                            timestamp: Date.now()
                        });
                    } else if (status.status === 'timeout' || status.status === 'cancelled') {
                        onEvent({
                            status: status.status,
                            timestamp: Date.now()
                        });
                    } else if (status.status === 'queued') {
                        // If still queued, this is likely a transient error or the server rejected us.
                        // We rely on the application-level SSE 'error' event (handled above) to flag true duplicates.
                        onError?.(new Error('SSE connection error'));
                    } else {
                        onError?.(new Error('SSE connection error'));
                    }
                })
                .catch((err) => {
                    console.error('Failed to get status after SSE error:', err);
                    onError?.(new Error('SSE connection error'));
                })
                .finally(() => {
                    eventSource.close();
                });
        };

        // Return cleanup function
        return () => {
            eventSource.close();
        };
    }
}

// Export singleton instance
export const matchingService = new MatchingServiceClient();

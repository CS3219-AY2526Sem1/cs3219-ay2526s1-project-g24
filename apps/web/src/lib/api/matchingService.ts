/**
 * Matching Service API Client
 * Handles communication with the matching microservice
 */

import { API_CONFIG } from '../apiConfig';
import { MatchEvent, MatchRequest, MatchRequestResponse, MatchRequestStatus } from '@/lib/types';

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
        const response = await fetch(`${this.baseUrl}/api/v1/match/requests`, {
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
        const response = await fetch(`${this.baseUrl}/api/v1/match/requests/${reqId}`, {
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
        const response = await fetch(`${this.baseUrl}/api/v1/match/requests/${reqId}`, {
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
            `${this.baseUrl}/api/v1/match/requests/${reqId}/events`,
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

import { API_CONFIG, createServiceUrlBuilder } from '@/lib/api-utils';
import { MatchEvent, MatchRequest, MatchRequestResponse, MatchRequestStatus } from '@/lib/types';
import { apiClient } from './axiosClient';

const serviceUrl = createServiceUrlBuilder(API_CONFIG.MATCHING_SERVICE);

class MatchingServiceClient {
    /**
     * Create a new match request
     */
    async createMatchRequest(request: MatchRequest): Promise<MatchRequestResponse> {
        try {
            const response = await apiClient.post<MatchRequestResponse>(
                serviceUrl('/api/v1/match/requests'),
                request,
                { withCredentials: true }
            );
            return response.data;
        } catch (error: any) {
            // Handle 409 Conflict - already queued
            if (error.response?.status === 409 && error.response?.data?.reqId) {
                return {
                    reqId: error.response.data.reqId,
                    alreadyQueued: true,
                };
            }
            throw error;
        }
    }

    /**
     * Get the status of a match request
     */
    async getMatchRequestStatus(reqId: string): Promise<MatchRequestStatus> {
        const response = await apiClient.get<MatchRequestStatus>(
            serviceUrl(`/api/v1/match/requests/${reqId}`),
            { withCredentials: true }
        );
        return response.data;
    }

    /**
     * Cancel a match request
     */
    async cancelMatchRequest(
        reqId: string,
    ): Promise<{
        cancelled: boolean;
        alreadyMatched: boolean;
        sessionId?: string;
    }> {
        try {
            await apiClient.delete(
                serviceUrl(`/api/v1/match/requests/${reqId}`),
                { withCredentials: true }
            );
            return { cancelled: true, alreadyMatched: false };
        } catch (error: any) {
            // Handle 409 Conflict - request was already matched
            if (error.response?.status === 409) {
                const sessionId = error.response?.data?.sessionId;
                return {
                    cancelled: false,
                    alreadyMatched: true,
                    sessionId,
                };
            }
            throw error;
        }
    }

    /**
     * Subscribe to real-time match updates via Server-Sent Events (SSE)
     * Note: SSE connections don't use axios, they use native EventSource
     */
    subscribeToMatchEvents(
        reqId: string,
        onEvent: (event: MatchEvent) => void,
        onError?: (error: Error) => void,
    ): () => void {
        const eventSource = new EventSource(
            serviceUrl(`/api/v1/match/requests/${reqId}/events`),
            { withCredentials: true },
        );

        eventSource.addEventListener('error', (evt) => {
            try {
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

        return () => {
            eventSource.close();
        };
    }
}

export const matchingService = new MatchingServiceClient();

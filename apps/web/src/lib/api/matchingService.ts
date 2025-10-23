/**
 * Matching Service API Client
 * Handles communication with the matching microservice
 */

import { API_CONFIG } from '../apiConfig';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type MatchStatus = 'queued' | 'matched' | 'cancelled' | 'timeout';

export interface MatchRequest {
  userId: string;
  difficulty: Difficulty;
  topics: string[];
  languages: string[];
}

export interface MatchRequestResponse {
  reqId: string;
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
}

class MatchingServiceClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.MATCHING_SERVICE;
  }

  /**
   * Create a new match request
   */
  async createMatchRequest(request: MatchRequest): Promise<MatchRequestResponse> {
    const response = await fetch(`${this.baseUrl}/v1/match/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create match request');
    }

    return response.json();
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
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get match request status');
    }

    return response.json();
  }

  /**
   * Cancel a match request
   */
  async cancelMatchRequest(reqId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/v1/match/requests/${reqId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel match request');
    }
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
    onError?: (error: Error) => void
  ): () => void {
    const eventSource = new EventSource(
      `${this.baseUrl}/v1/match/requests/${reqId}/events`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as MatchEvent;
        onEvent(data);
      } catch (error) {
        console.error('Error parsing SSE event:', error);
        onError?.(error as Error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      onError?.(new Error('SSE connection error'));
      eventSource.close();
    };

    // Return cleanup function
    return () => {
      eventSource.close();
    };
  }
}

// Export singleton instance
export const matchingService = new MatchingServiceClient();

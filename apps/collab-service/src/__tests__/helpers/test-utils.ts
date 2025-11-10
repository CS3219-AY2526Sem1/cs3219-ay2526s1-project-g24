/**
 * Test utilities and helpers
 */

import { Session } from '../../types/index.js';

/**
 * Create a mock session object
 */
export function createMockSession(overrides: Partial<Session> = {}): Session {
    const now = new Date();
    return {
        id: 'test-session-uuid',
        sessionId: 'session_123456',
        user1Id: 'user-1',
        user2Id: 'user-2',
        questionId: 'question-1',
        difficulty: 'MEDIUM',
        topic: 'Arrays',
        language: 'python',
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        lastActivityAt: now,
        terminatedAt: null,
        ...overrides,
    };
}

/**
 * Create a mock snapshot object
 */
export function createMockSnapshot(overrides: any = {}) {
    const now = new Date();
    return {
        id: 'snapshot-uuid',
        sessionId: 'test-session-uuid',
        yjsState: Buffer.from([1, 2, 3, 4]),
        version: 1,
        createdAt: now,
        ...overrides,
    };
}

/**
 * Create a mock JWT payload
 */
export function createMockJWTPayload(overrides: any = {}) {
    return {
        userId: 'user-1',
        email: 'user1@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
        ...overrides,
    };
}

/**
 * Create a mock Express request
 */
export function createMockRequest(overrides: any = {}) {
    return {
        params: {},
        query: {},
        body: {},
        headers: {},
        cookies: {},
        user: undefined,
        ...overrides,
    };
}

/**
 * Create a mock Express response
 */
export function createMockResponse() {
    const res: any = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        end: jest.fn().mockReturnThis(),
    };
    return res;
}

/**
 * Create a mock Express next function
 */
export function createMockNext() {
    return jest.fn();
}

/**
 * Wait for a specified duration
 */
export function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a Uint8Array from a number array
 */
export function createUint8Array(data: number[]): Uint8Array {
    return new Uint8Array(data);
}

/**
 * Convert Buffer to base64
 */
export function bufferToBase64(buffer: Buffer): string {
    return buffer.toString('base64');
}

/**
 * Convert base64 to Buffer
 */
export function base64ToBuffer(base64: string): Buffer {
    return Buffer.from(base64, 'base64');
}

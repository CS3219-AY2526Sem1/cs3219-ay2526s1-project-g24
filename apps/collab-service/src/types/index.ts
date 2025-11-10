import { Request } from 'express';
import * as Y from 'yjs';
import { Session as PrismaSession } from '@prisma/client';

// Session Types
export type SessionStatus = 'ACTIVE' | 'TERMINATED' | 'EXPIRED';

// Re-export Prisma Session type
export type Session = PrismaSession;

export interface CreateSessionRequest {
    sessionId: string;
    user1Id: string;
    user2Id: string;
    questionId: string;
    difficulty: string;
    topic: string;
    language?: string;
}

export interface TerminateSessionRequest {
    userId: string;
}

export interface RejoinSessionRequest {
    userId: string;
}

// WebSocket Types
export interface AuthenticatedWebSocket {
    userId?: string;
    sessionId?: string;
    isAlive?: boolean;
    readyState: number;
    send: (data: any) => void;
    close: (code?: number, reason?: string) => void;
    terminate?: () => void;
    ping: () => void;
    on: (event: string, listener: (...args: any[]) => void) => void;
    off?: (event: string, listener: (...args: any[]) => void) => void;
}

export interface WebSocketMessage {
    type: 'sync-step-1' | 'sync-step-2' | 'update' | 'awareness' | 'error';
    data?: Uint8Array;
    message?: string;
}

// Yjs Document Management
export interface YjsDocument {
    doc: Y.Doc;
    awareness: any; // y-protocols awareness
    lastActivity: number;
    connectedClients: Set<string>;
}

// JWT Payload
export interface JWTPayload {
    userId: string;
    email?: string;
    iat?: number;
    exp?: number;
}

// Express Request with Auth
export interface AuthRequest extends Request {
    user?: JWTPayload;
}

// Question Service Response
export interface Question {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    topics: string[];
    companies?: string[];
    examples?: Array<{
        input: string;
        output: string;
        explanation?: string;
    }>;
    constraints?: string[];
}

// Snapshot
export interface Snapshot {
    id: string;
    sessionId: string;
    yjsState: Buffer;
    version: number;
    createdAt: Date;
}

// Error Types
export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public isOperational: boolean = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

/**
 * Standard error codes for collaboration service
 */
export enum ErrorCode {
    // WebSocket errors
    WS_CONNECTION_FAILED = 'WS_CONNECTION_FAILED',
    WS_AUTHENTICATION_FAILED = 'WS_AUTHENTICATION_FAILED',
    WS_INVALID_MESSAGE = 'WS_INVALID_MESSAGE',
    WS_SESSION_NOT_FOUND = 'WS_SESSION_NOT_FOUND',

    // Redis errors
    REDIS_CONNECTION_FAILED = 'REDIS_CONNECTION_FAILED',
    REDIS_OPERATION_FAILED = 'REDIS_OPERATION_FAILED',
    REDIS_TIMEOUT = 'REDIS_TIMEOUT',

    // PostgreSQL errors
    POSTGRES_CONNECTION_FAILED = 'POSTGRES_CONNECTION_FAILED',
    POSTGRES_QUERY_FAILED = 'POSTGRES_QUERY_FAILED',
    POSTGRES_TIMEOUT = 'POSTGRES_TIMEOUT',

    // Yjs/Document errors
    DOCUMENT_TOO_LARGE = 'DOCUMENT_TOO_LARGE',
    DOCUMENT_CORRUPTED = 'DOCUMENT_CORRUPTED',
    DOCUMENT_SYNC_FAILED = 'DOCUMENT_SYNC_FAILED',

    // Snapshot errors
    SNAPSHOT_SAVE_FAILED = 'SNAPSHOT_SAVE_FAILED',
    SNAPSHOT_LOAD_FAILED = 'SNAPSHOT_LOAD_FAILED',
    SNAPSHOT_NOT_FOUND = 'SNAPSHOT_NOT_FOUND',

    // Validation errors
    INVALID_SESSION_ID = 'INVALID_SESSION_ID',
    INVALID_TOKEN = 'INVALID_TOKEN',
    INVALID_MESSAGE_FORMAT = 'INVALID_MESSAGE_FORMAT',

    // General errors
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<ErrorCode, string> = {
    // WebSocket
    [ErrorCode.WS_CONNECTION_FAILED]: 'Failed to connect to collaboration session. Please check your internet connection and try again.',
    [ErrorCode.WS_AUTHENTICATION_FAILED]: 'Authentication failed. Please sign in again.',
    [ErrorCode.WS_INVALID_MESSAGE]: 'Invalid message format. Please refresh the page.',
    [ErrorCode.WS_SESSION_NOT_FOUND]: 'Session not found. Please check your session ID.',

    // Redis
    [ErrorCode.REDIS_CONNECTION_FAILED]: 'Cache service unavailable. Collaboration may be slower than usual.',
    [ErrorCode.REDIS_OPERATION_FAILED]: 'Failed to sync changes. Your work is still saved locally.',
    [ErrorCode.REDIS_TIMEOUT]: 'Cache operation timed out. Please try again.',

    // PostgreSQL
    [ErrorCode.POSTGRES_CONNECTION_FAILED]: 'Database connection failed. Please try again later.',
    [ErrorCode.POSTGRES_QUERY_FAILED]: 'Failed to save your work. Please try again.',
    [ErrorCode.POSTGRES_TIMEOUT]: 'Database operation timed out. Please try again.',

    // Yjs/Document
    [ErrorCode.DOCUMENT_TOO_LARGE]: 'Document size limit exceeded. Please reduce content or split into multiple sessions.',
    [ErrorCode.DOCUMENT_CORRUPTED]: 'Document data is corrupted. Please contact support.',
    [ErrorCode.DOCUMENT_SYNC_FAILED]: 'Failed to sync document changes. Please refresh the page.',

    // Snapshot
    [ErrorCode.SNAPSHOT_SAVE_FAILED]: 'Failed to save snapshot. Your work is still synced in real-time.',
    [ErrorCode.SNAPSHOT_LOAD_FAILED]: 'Failed to load previous session. Starting with empty document.',
    [ErrorCode.SNAPSHOT_NOT_FOUND]: 'No previous snapshot found. Starting fresh.',

    // Validation
    [ErrorCode.INVALID_SESSION_ID]: 'Invalid session ID format. Please check and try again.',
    [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token. Please sign in again.',
    [ErrorCode.INVALID_MESSAGE_FORMAT]: 'Invalid message format. Please refresh the page.',

    // General
    [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred. Please try again.',
    [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable. Please try again in a few moments.',
    [ErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please wait a moment and try again.',
};

/**
 * Structured error for collaboration service
 */
export class CollaborationError extends Error {
    constructor(
        public code: ErrorCode,
        public message: string,
        public userMessage: string,
        public details?: any,
        public recoverable: boolean = true
    ) {
        super(message);
        this.name = 'CollaborationError';
    }

    /**
     * Create error from error code
     */
    static fromCode(code: ErrorCode, details?: any, technicalMessage?: string): CollaborationError {
        return new CollaborationError(
            code,
            technicalMessage || ERROR_MESSAGES[code],
            ERROR_MESSAGES[code],
            details,
            isRecoverable(code)
        );
    }

    /**
     * Create error from unknown error
     */
    static fromUnknown(error: unknown, context: string): CollaborationError {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Error] ${context}:`, error);

        return new CollaborationError(
            ErrorCode.INTERNAL_ERROR,
            `${context}: ${message}`,
            ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR],
            { originalError: error, context },
            true
        );
    }

    /**
     * Convert to JSON for API responses
     */
    toJSON() {
        return {
            error: {
                code: this.code,
                message: this.userMessage,
                recoverable: this.recoverable,
                ...(this.details && { details: this.details }),
            },
        };
    }

    /**
     * Convert to WebSocket message format
     */
    toWSMessage() {
        return {
            type: 'error',
            code: this.code,
            message: this.userMessage,
            recoverable: this.recoverable,
        };
    }
}

/**
 * Determine if error is recoverable
 */
function isRecoverable(code: ErrorCode): boolean {
    const unrecoverableErrors = [
        ErrorCode.WS_AUTHENTICATION_FAILED,
        ErrorCode.INVALID_TOKEN,
        ErrorCode.DOCUMENT_CORRUPTED,
        ErrorCode.INVALID_SESSION_ID,
    ];

    return !unrecoverableErrors.includes(code);
}

/**
 * Error handling utility functions
 */
export class ErrorHandler {
    /**
     * Handle Redis errors
     */
    static handleRedisError(error: unknown, operation: string): CollaborationError {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Redis Error] ${operation}:`, error);

        if (message.includes('timeout')) {
            return CollaborationError.fromCode(ErrorCode.REDIS_TIMEOUT, { operation });
        }

        if (message.includes('ECONNREFUSED') || message.includes('connect')) {
            return CollaborationError.fromCode(ErrorCode.REDIS_CONNECTION_FAILED, { operation });
        }

        return CollaborationError.fromCode(
            ErrorCode.REDIS_OPERATION_FAILED,
            { operation, error: message }
        );
    }

    /**
     * Handle PostgreSQL errors
     */
    static handlePostgresError(error: unknown, operation: string): CollaborationError {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Postgres Error] ${operation}:`, error);

        if (message.includes('timeout')) {
            return CollaborationError.fromCode(ErrorCode.POSTGRES_TIMEOUT, { operation });
        }

        if (message.includes('connect') || message.includes('ECONNREFUSED')) {
            return CollaborationError.fromCode(ErrorCode.POSTGRES_CONNECTION_FAILED, { operation });
        }

        return CollaborationError.fromCode(
            ErrorCode.POSTGRES_QUERY_FAILED,
            { operation, error: message }
        );
    }

    /**
     * Handle Yjs document errors
     */
    static handleDocumentError(error: unknown, sessionId: string): CollaborationError {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Document Error] Session ${sessionId}:`, error);

        if (message.includes('size') || message.includes('too large')) {
            return CollaborationError.fromCode(ErrorCode.DOCUMENT_TOO_LARGE, { sessionId });
        }

        if (message.includes('corrupt') || message.includes('invalid')) {
            return CollaborationError.fromCode(ErrorCode.DOCUMENT_CORRUPTED, { sessionId });
        }

        return CollaborationError.fromCode(
            ErrorCode.DOCUMENT_SYNC_FAILED,
            { sessionId, error: message }
        );
    }

    /**
     * Handle snapshot errors
     */
    static handleSnapshotError(error: unknown, operation: 'save' | 'load', sessionId: string): CollaborationError {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Snapshot Error] ${operation} for ${sessionId}:`, error);

        if (operation === 'save') {
            return CollaborationError.fromCode(
                ErrorCode.SNAPSHOT_SAVE_FAILED,
                { sessionId, error: message }
            );
        } else {
            return CollaborationError.fromCode(
                ErrorCode.SNAPSHOT_LOAD_FAILED,
                { sessionId, error: message }
            );
        }
    }

    /**
     * Log error with context
     */
    static logError(error: unknown, context: string, metadata?: Record<string, any>): void {
        const timestamp = new Date().toISOString();
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;

        console.error(`[${timestamp}] ${context}`, {
            error: errorMessage,
            stack: errorStack,
            ...metadata,
        });
    }

    /**
     * Check if error is retryable
     */
    static isRetryable(error: CollaborationError): boolean {
        const retryableErrors = [
            ErrorCode.REDIS_TIMEOUT,
            ErrorCode.REDIS_OPERATION_FAILED,
            ErrorCode.POSTGRES_TIMEOUT,
            ErrorCode.POSTGRES_QUERY_FAILED,
            ErrorCode.DOCUMENT_SYNC_FAILED,
        ];

        return retryableErrors.includes(error.code);
    }

    /**
     * Get retry delay based on attempt count
     */
    static getRetryDelay(attempt: number): number {
        // Exponential backoff: 1s, 2s, 4s, 8s, max 10s
        return Math.min(1000 * Math.pow(2, attempt), 10000);
    }
}

/**
 * Retry wrapper for async operations
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    context: string = 'Operation'
): Promise<T> {
    let lastError: CollaborationError | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error instanceof CollaborationError
                ? error
                : CollaborationError.fromUnknown(error, context);

            if (!ErrorHandler.isRetryable(lastError) || attempt === maxAttempts - 1) {
                throw lastError;
            }

            const delay = ErrorHandler.getRetryDelay(attempt);
            console.warn(`[Retry] ${context} failed (attempt ${attempt + 1}/${maxAttempts}), retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

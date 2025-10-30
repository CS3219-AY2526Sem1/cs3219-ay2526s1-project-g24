import {
    CollaborationError,
    ErrorCode,
    ErrorHandler,
    withRetry,
} from '../errors';

describe('CollaborationError', () => {
    describe('constructor', () => {
        it('should create error with all properties', () => {
            const error = new CollaborationError(
                ErrorCode.WS_CONNECTION_FAILED,
                'Technical message',
                'User message',
                { detail: 'test' },
                false
            );

            expect(error.code).toBe(ErrorCode.WS_CONNECTION_FAILED);
            expect(error.message).toBe('Technical message');
            expect(error.userMessage).toBe('User message');
            expect(error.details).toEqual({ detail: 'test' });
            expect(error.recoverable).toBe(false);
            expect(error.name).toBe('CollaborationError');
        });

        it('should default recoverable to true', () => {
            const error = new CollaborationError(
                ErrorCode.INTERNAL_ERROR,
                'message',
                'user message'
            );

            expect(error.recoverable).toBe(true);
        });
    });

    describe('fromCode', () => {
        it('should create error from error code with default message', () => {
            const error = CollaborationError.fromCode(
                ErrorCode.WS_SESSION_NOT_FOUND,
                { sessionId: '123' }
            );

            expect(error.code).toBe(ErrorCode.WS_SESSION_NOT_FOUND);
            expect(error.userMessage).toBe('Session not found. Please check your session ID.');
            expect(error.details).toEqual({ sessionId: '123' });
        });

        it('should use custom technical message if provided', () => {
            const error = CollaborationError.fromCode(
                ErrorCode.INTERNAL_ERROR,
                { test: true },
                'Custom technical message'
            );

            expect(error.message).toBe('Custom technical message');
            expect(error.userMessage).toBe('An unexpected error occurred. Please try again.');
        });

        it('should mark unrecoverable errors as not recoverable', () => {
            const error = CollaborationError.fromCode(ErrorCode.WS_AUTHENTICATION_FAILED);
            expect(error.recoverable).toBe(false);
        });

        it('should mark recoverable errors as recoverable', () => {
            const error = CollaborationError.fromCode(ErrorCode.REDIS_TIMEOUT);
            expect(error.recoverable).toBe(true);
        });
    });

    describe('fromUnknown', () => {
        it('should create error from Error object', () => {
            const originalError = new Error('Test error');
            const error = CollaborationError.fromUnknown(originalError, 'Test context');

            expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
            expect(error.message).toContain('Test context');
            expect(error.message).toContain('Test error');
            expect(error.details.originalError).toBe(originalError);
            expect(error.details.context).toBe('Test context');
        });

        it('should create error from string', () => {
            const error = CollaborationError.fromUnknown('String error', 'Test context');

            expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
            expect(error.message).toContain('String error');
        });
    });

    describe('toJSON', () => {
        it('should convert to JSON with details', () => {
            const error = new CollaborationError(
                ErrorCode.INVALID_SESSION_ID,
                'Technical',
                'User message',
                { sessionId: 'abc' },
                false
            );

            const json = error.toJSON();

            expect(json).toEqual({
                error: {
                    code: ErrorCode.INVALID_SESSION_ID,
                    message: 'User message',
                    recoverable: false,
                    details: { sessionId: 'abc' },
                },
            });
        });

        it('should convert to JSON without details if none provided', () => {
            const error = new CollaborationError(
                ErrorCode.INTERNAL_ERROR,
                'Technical',
                'User message'
            );

            const json = error.toJSON();

            expect(json).toEqual({
                error: {
                    code: ErrorCode.INTERNAL_ERROR,
                    message: 'User message',
                    recoverable: true,
                },
            });
        });
    });

    describe('toWSMessage', () => {
        it('should convert to WebSocket message format', () => {
            const error = new CollaborationError(
                ErrorCode.WS_INVALID_MESSAGE,
                'Technical',
                'User message',
                undefined,
                true
            );

            const wsMessage = error.toWSMessage();

            expect(wsMessage).toEqual({
                type: 'error',
                code: ErrorCode.WS_INVALID_MESSAGE,
                message: 'User message',
                recoverable: true,
            });
        });
    });
});

describe('ErrorHandler', () => {
    describe('handleRedisError', () => {
        it('should handle timeout errors', () => {
            const error = new Error('Operation timeout');
            const result = ErrorHandler.handleRedisError(error, 'get');

            expect(result.code).toBe(ErrorCode.REDIS_TIMEOUT);
            expect(result.details.operation).toBe('get');
        });

        it('should handle connection errors', () => {
            const error = new Error('ECONNREFUSED');
            const result = ErrorHandler.handleRedisError(error, 'connect');

            expect(result.code).toBe(ErrorCode.REDIS_CONNECTION_FAILED);
        });

        it('should handle generic Redis errors', () => {
            const error = new Error('Unknown Redis error');
            const result = ErrorHandler.handleRedisError(error, 'set');

            expect(result.code).toBe(ErrorCode.REDIS_OPERATION_FAILED);
            expect(result.details.error).toContain('Unknown Redis error');
        });
    });

    describe('handlePostgresError', () => {
        it('should handle timeout errors', () => {
            const error = new Error('Query timeout');
            const result = ErrorHandler.handlePostgresError(error, 'query');

            expect(result.code).toBe(ErrorCode.POSTGRES_TIMEOUT);
        });

        it('should handle connection errors', () => {
            const error = new Error('connect ECONNREFUSED');
            const result = ErrorHandler.handlePostgresError(error, 'connect');

            expect(result.code).toBe(ErrorCode.POSTGRES_CONNECTION_FAILED);
        });

        it('should handle generic Postgres errors', () => {
            const error = new Error('Query failed');
            const result = ErrorHandler.handlePostgresError(error, 'insert');

            expect(result.code).toBe(ErrorCode.POSTGRES_QUERY_FAILED);
        });
    });

    describe('handleDocumentError', () => {
        it('should handle document size errors', () => {
            const error = new Error('Document too large');
            const result = ErrorHandler.handleDocumentError(error, 'session-123');

            expect(result.code).toBe(ErrorCode.DOCUMENT_TOO_LARGE);
            expect(result.details.sessionId).toBe('session-123');
        });

        it('should handle document corruption errors', () => {
            const error = new Error('Document is corrupt');
            const result = ErrorHandler.handleDocumentError(error, 'session-456');

            expect(result.code).toBe(ErrorCode.DOCUMENT_CORRUPTED);
        });

        it('should handle generic document errors', () => {
            const error = new Error('Sync error');
            const result = ErrorHandler.handleDocumentError(error, 'session-789');

            expect(result.code).toBe(ErrorCode.DOCUMENT_SYNC_FAILED);
        });
    });

    describe('handleSnapshotError', () => {
        it('should handle save errors', () => {
            const error = new Error('Save failed');
            const result = ErrorHandler.handleSnapshotError(error, 'save', 'session-1');

            expect(result.code).toBe(ErrorCode.SNAPSHOT_SAVE_FAILED);
            expect(result.details.sessionId).toBe('session-1');
        });

        it('should handle load errors', () => {
            const error = new Error('Load failed');
            const result = ErrorHandler.handleSnapshotError(error, 'load', 'session-2');

            expect(result.code).toBe(ErrorCode.SNAPSHOT_LOAD_FAILED);
            expect(result.details.sessionId).toBe('session-2');
        });
    });

    describe('isRetryable', () => {
        it('should return true for retryable errors', () => {
            const retryableErrors = [
                ErrorCode.REDIS_TIMEOUT,
                ErrorCode.REDIS_OPERATION_FAILED,
                ErrorCode.POSTGRES_TIMEOUT,
                ErrorCode.POSTGRES_QUERY_FAILED,
                ErrorCode.DOCUMENT_SYNC_FAILED,
            ];

            retryableErrors.forEach((code) => {
                const error = CollaborationError.fromCode(code);
                expect(ErrorHandler.isRetryable(error)).toBe(true);
            });
        });

        it('should return false for non-retryable errors', () => {
            const error = CollaborationError.fromCode(ErrorCode.WS_AUTHENTICATION_FAILED);
            expect(ErrorHandler.isRetryable(error)).toBe(false);
        });
    });

    describe('getRetryDelay', () => {
        it('should calculate exponential backoff', () => {
            expect(ErrorHandler.getRetryDelay(0)).toBe(1000); // 2^0 * 1000
            expect(ErrorHandler.getRetryDelay(1)).toBe(2000); // 2^1 * 1000
            expect(ErrorHandler.getRetryDelay(2)).toBe(4000); // 2^2 * 1000
            expect(ErrorHandler.getRetryDelay(3)).toBe(8000); // 2^3 * 1000
        });

        it('should cap at 10 seconds', () => {
            expect(ErrorHandler.getRetryDelay(10)).toBe(10000);
            expect(ErrorHandler.getRetryDelay(20)).toBe(10000);
        });
    });
});

describe('withRetry', () => {
    it('should return result on first successful attempt', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        const result = await withRetry(operation, 3, 'Test operation');

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw on non-retryable errors immediately', async () => {
        const error = CollaborationError.fromCode(ErrorCode.WS_AUTHENTICATION_FAILED);
        const operation = jest.fn().mockRejectedValue(error);

        await expect(withRetry(operation, 3, 'Test operation')).rejects.toThrow(error);
        expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors and succeed', async () => {
        // Mock setTimeout to resolve immediately for faster tests
        jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
            fn();
            return 0 as any;
        });

        const operation = jest.fn()
            .mockRejectedValueOnce(CollaborationError.fromCode(ErrorCode.REDIS_TIMEOUT))
            .mockResolvedValueOnce('success');

        const result = await withRetry(operation, 3, 'Test operation');

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);

        jest.restoreAllMocks();
    });

    it('should throw after max attempts on retryable errors', async () => {
        // Mock setTimeout to resolve immediately for faster tests
        jest.spyOn(global, 'setTimeout').mockImplementation((fn: any) => {
            fn();
            return 0 as any;
        });

        const error = CollaborationError.fromCode(ErrorCode.REDIS_TIMEOUT);
        const operation = jest.fn().mockRejectedValue(error);

        await expect(withRetry(operation, 3, 'Test operation')).rejects.toMatchObject({
            code: ErrorCode.REDIS_TIMEOUT,
        });
        expect(operation).toHaveBeenCalledTimes(3);

        jest.restoreAllMocks();
    });

    it('should convert unknown errors to CollaborationError', async () => {
        const operation = jest.fn().mockRejectedValue(new Error('Unknown error'));

        await expect(withRetry(operation, 3, 'Test operation')).rejects.toMatchObject({
            code: ErrorCode.INTERNAL_ERROR,
            message: expect.stringContaining('Unknown error'),
        });
        // Unknown errors are converted to INTERNAL_ERROR which is not retryable
        expect(operation).toHaveBeenCalledTimes(1);
    });
});

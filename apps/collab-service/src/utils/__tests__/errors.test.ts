/**
 * Unit tests for error utility functions
 */

import {
  ErrorCode,
  CollaborationError,
  ErrorHandler,
  withRetry,
} from '../errors.js';

describe('CollaborationError', () => {
  it('should create error from error code', () => {
    const error = CollaborationError.fromCode(ErrorCode.WS_CONNECTION_FAILED);

    expect(error.code).toBe(ErrorCode.WS_CONNECTION_FAILED);
    expect(error.message).toBeDefined();
    expect(error.userMessage).toBeDefined();
    expect(error.recoverable).toBe(true);
  });

  it('should create error with custom details', () => {
    const error = CollaborationError.fromCode(
      ErrorCode.REDIS_TIMEOUT,
      { operation: 'get', key: 'test' }
    );

    expect(error.code).toBe(ErrorCode.REDIS_TIMEOUT);
    expect(error.details).toEqual({ operation: 'get', key: 'test' });
  });

  it('should create error from unknown error', () => {
    const unknownError = new Error('Unknown error');
    const error = CollaborationError.fromUnknown(unknownError, 'Test context');

    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.message).toContain('Test context');
    expect(error.details.originalError).toBe(unknownError);
  });

  it('should convert to JSON format', () => {
    const error = CollaborationError.fromCode(ErrorCode.DOCUMENT_TOO_LARGE);
    const json = error.toJSON();

    expect(json.error.code).toBe(ErrorCode.DOCUMENT_TOO_LARGE);
    expect(json.error.message).toBeDefined();
    expect(json.error.recoverable).toBeDefined();
  });

  it('should convert to WebSocket message format', () => {
    const error = CollaborationError.fromCode(ErrorCode.WS_SESSION_NOT_FOUND);
    const wsMessage = error.toWSMessage();

    expect(wsMessage.type).toBe('error');
    expect(wsMessage.code).toBe(ErrorCode.WS_SESSION_NOT_FOUND);
    expect(wsMessage.message).toBeDefined();
    expect(wsMessage.recoverable).toBeDefined();
  });

  it('should mark authentication errors as unrecoverable', () => {
    const error = CollaborationError.fromCode(ErrorCode.WS_AUTHENTICATION_FAILED);

    expect(error.recoverable).toBe(false);
  });

  it('should mark invalid token errors as unrecoverable', () => {
    const error = CollaborationError.fromCode(ErrorCode.INVALID_TOKEN);

    expect(error.recoverable).toBe(false);
  });
});

describe('ErrorHandler', () => {
  describe('handleRedisError', () => {
    it('should handle timeout errors', () => {
      const error = new Error('Connection timeout');
      const result = ErrorHandler.handleRedisError(error, 'test operation');

      expect(result.code).toBe(ErrorCode.REDIS_TIMEOUT);
      expect(result.details.operation).toBe('test operation');
    });

    it('should handle connection refused errors', () => {
      const error = new Error('ECONNREFUSED');
      const result = ErrorHandler.handleRedisError(error, 'connect');

      expect(result.code).toBe(ErrorCode.REDIS_CONNECTION_FAILED);
    });

    it('should handle generic Redis errors', () => {
      const error = new Error('Generic error');
      const result = ErrorHandler.handleRedisError(error, 'operation');

      expect(result.code).toBe(ErrorCode.REDIS_OPERATION_FAILED);
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

    it('should handle generic query errors', () => {
      const error = new Error('Query failed');
      const result = ErrorHandler.handlePostgresError(error, 'query');

      expect(result.code).toBe(ErrorCode.POSTGRES_QUERY_FAILED);
    });
  });

  describe('handleDocumentError', () => {
    it('should handle size errors', () => {
      const error = new Error('Document too large');
      const result = ErrorHandler.handleDocumentError(error, 'session_123');

      expect(result.code).toBe(ErrorCode.DOCUMENT_TOO_LARGE);
      expect(result.details.sessionId).toBe('session_123');
    });

    it('should handle corruption errors', () => {
      const error = new Error('Document corrupt');
      const result = ErrorHandler.handleDocumentError(error, 'session_123');

      expect(result.code).toBe(ErrorCode.DOCUMENT_CORRUPTED);
    });

    it('should handle generic document errors', () => {
      const error = new Error('Unknown error');
      const result = ErrorHandler.handleDocumentError(error, 'session_123');

      expect(result.code).toBe(ErrorCode.DOCUMENT_SYNC_FAILED);
    });
  });

  describe('handleSnapshotError', () => {
    it('should handle save errors', () => {
      const error = new Error('Save failed');
      const result = ErrorHandler.handleSnapshotError(error, 'save', 'session_123');

      expect(result.code).toBe(ErrorCode.SNAPSHOT_SAVE_FAILED);
      expect(result.details.sessionId).toBe('session_123');
    });

    it('should handle load errors', () => {
      const error = new Error('Load failed');
      const result = ErrorHandler.handleSnapshotError(error, 'load', 'session_123');

      expect(result.code).toBe(ErrorCode.SNAPSHOT_LOAD_FAILED);
    });
  });

  describe('isRetryable', () => {
    it('should identify retryable errors', () => {
      const error1 = CollaborationError.fromCode(ErrorCode.REDIS_TIMEOUT);
      const error2 = CollaborationError.fromCode(ErrorCode.POSTGRES_QUERY_FAILED);
      const error3 = CollaborationError.fromCode(ErrorCode.DOCUMENT_SYNC_FAILED);

      expect(ErrorHandler.isRetryable(error1)).toBe(true);
      expect(ErrorHandler.isRetryable(error2)).toBe(true);
      expect(ErrorHandler.isRetryable(error3)).toBe(true);
    });

    it('should identify non-retryable errors', () => {
      const error1 = CollaborationError.fromCode(ErrorCode.WS_AUTHENTICATION_FAILED);
      const error2 = CollaborationError.fromCode(ErrorCode.INVALID_TOKEN);

      expect(ErrorHandler.isRetryable(error1)).toBe(false);
      expect(ErrorHandler.isRetryable(error2)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should calculate exponential backoff', () => {
      expect(ErrorHandler.getRetryDelay(0)).toBe(1000);
      expect(ErrorHandler.getRetryDelay(1)).toBe(2000);
      expect(ErrorHandler.getRetryDelay(2)).toBe(4000);
      expect(ErrorHandler.getRetryDelay(3)).toBe(8000);
    });

    it('should cap delay at maximum', () => {
      expect(ErrorHandler.getRetryDelay(10)).toBe(10000);
      expect(ErrorHandler.getRetryDelay(20)).toBe(10000);
    });
  });
});

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should succeed on first attempt', async () => {
    const operation = jest.fn().mockResolvedValue('success');

    const result = await withRetry(operation, 3, 'Test operation');

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(CollaborationError.fromCode(ErrorCode.REDIS_TIMEOUT))
      .mockResolvedValue('success');

    const promise = withRetry(operation, 3, 'Test operation');
    
    // Advance timers to trigger the retry delay
    await jest.runAllTimersAsync();
    
    const result = await promise;

    expect(result).toBe('success');
    expect(operation).toHaveBeenCalledTimes(2);
  });

  it('should not retry on non-retryable error', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(CollaborationError.fromCode(ErrorCode.INVALID_TOKEN));

    await expect(withRetry(operation, 3, 'Test operation')).rejects.toThrow();
    expect(operation).toHaveBeenCalledTimes(1);
  });

  it('should fail after max attempts', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(CollaborationError.fromCode(ErrorCode.REDIS_TIMEOUT));

    const promise = withRetry(operation, 3, 'Test operation');
    
    // Run the promise and timers concurrently
    const resultPromise = promise.catch(e => e);
    await jest.runAllTimersAsync();
    const error = await resultPromise;

    expect(error).toBeInstanceOf(CollaborationError);
    expect(operation).toHaveBeenCalledTimes(3);
  });

  it('should handle non-CollaborationError', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(new Error('Generic error'));

    await expect(withRetry(operation, 2, 'Test operation')).rejects.toThrow();
  });
});


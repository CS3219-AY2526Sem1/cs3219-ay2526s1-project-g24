/**
 * Unit tests for error handling middleware
 */

import { errorHandler } from '../errorHandler.js';
import { AppError } from '../../types/index.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../__tests__/helpers/test-utils.js';

describe('Error Handler Middleware', () => {
    it('should handle AppError with correct status code', () => {
        const error = new AppError('Test error', 400);
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        errorHandler(error, req as any, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Test error',
            status: 400,
        });
    });

    it('should handle AppError with 403 status', () => {
        const error = new AppError('Forbidden', 403);
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        errorHandler(error, req as any, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Forbidden',
            status: 403,
        });
    });

    it('should handle AppError with 404 status', () => {
        const error = new AppError('Not found', 404);
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        errorHandler(error, req as any, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Not found',
            status: 404,
        });
    });

    it('should handle generic Error as 500', () => {
        const error = new Error('Unexpected error');
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        errorHandler(error, req as any, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal server error',
            status: 500,
        });
    });

    it('should handle non-Error objects as 500', () => {
        const error = 'String error';
        const req = createMockRequest();
        const res = createMockResponse();
        const next = createMockNext();

        errorHandler(error as any, req as any, res, next);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: 'Internal server error',
            status: 500,
        });
    });
});

// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated Express error handling middleware:
//   - AppError custom error handling with status codes
//   - Unexpected error fallback with 500 response
//   - Structured error response format
// Author review: Code reviewed, tested, and validated by team.

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../types/index.js';

export function errorHandler(
    err: Error | AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
            status: err.statusCode,
        });
        return;
    }

    // Unexpected errors
    console.error('Unexpected error:', err);
    res.status(500).json({
        error: 'Internal server error',
        status: 500,
    });
}

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthRequest, JWTPayload, AppError } from '../types';

/**
 * Middleware to verify JWT token from Authorization header
 * Supports mock authentication for local testing (set ENABLE_MOCK_AUTH=true in .env)
 */
export function authenticate(
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void {
    try {
        // Mock authentication for local testing
        if (config.enableMockAuth) {
            console.log('🔓 Mock authentication enabled - bypassing JWT verification');

            // Extract userId from Authorization: Bearer <userId> if provided; else default mock user
            const authHeader = req.headers.authorization;
            let userId = '123e4567-e89b-12d3-a456-426614174001'; // Default mock user

            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                userId = token && token.length > 0 ? token : userId;
            }

            req.user = {
                userId,
                email: `${userId}@mock.local`,
            };

            return next();
        }

        // Real JWT authentication
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError('No token provided', 401);
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
        req.user = decoded;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AppError('Invalid token', 401));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new AppError('Token expired', 401));
        } else {
            next(error);
        }
    }
}

/**
 * Extract JWT payload from token string (for WebSocket)
 * Supports mock authentication for local testing (set ENABLE_MOCK_AUTH=true in .env)
 */
export function verifyToken(token: string): JWTPayload {
    try {
        // Mock authentication for local testing
        if (config.enableMockAuth) {
            console.log('🔓 Mock authentication enabled for WebSocket - bypassing JWT verification');

            // Try to decode token without verification to extract userId
            let userId = '123e4567-e89b-12d3-a456-426614174001'; // Default mock user

            try {
                const decoded = jwt.decode(token) as any;
                if (decoded && decoded.userId) {
                    userId = decoded.userId;
                }
            } catch {
                // If decode fails, check if token is just a userId
                if (token && token.length > 0) {
                    userId = token;
                }
            }

            return {
                userId,
                email: `${userId}@mock.local`,
            };
        }

        // Real JWT authentication
        return jwt.verify(token, config.jwtSecret) as JWTPayload;
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AppError('Invalid token', 401);
        } else if (error instanceof jwt.TokenExpiredError) {
            throw new AppError('Token expired', 401);
        }
        throw error;
    }
}

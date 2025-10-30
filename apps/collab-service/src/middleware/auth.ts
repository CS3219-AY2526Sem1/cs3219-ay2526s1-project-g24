import { Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import { AuthRequest, JWTPayload, AppError } from '../types/index.js';
import { verifyTokenWithJWKS, extractToken } from '../utils/jwks-auth.js';

/**
 * Middleware to verify JWT token from Authorization header or cookie
 * Supports mock authentication for local testing (set ENABLE_MOCK_AUTH=true in .env)
 * Uses JWKS (JSON Web Key Set) for RS256 token verification from User Service
 */
export function authenticate(
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): void {
    // Async wrapper to handle promise
    (async () => {
        try {
            // Mock authentication for local testing
            if (config.enableMockAuth) {
                console.log('[Auth] 🔓 Mock authentication enabled - bypassing JWT verification');

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

                console.log('[Auth] ✓ Mock user authenticated:', userId);
                return next();
            }

            // Extract token from Authorization header or cookies
            console.log('[Auth] Extracting token from:', {
                hasAuthHeader: !!req.headers.authorization,
                hasCookies: !!req.cookies,
                authHeaderPrefix: req.headers.authorization?.substring(0, 20),
            });

            const token = extractToken(req.headers.authorization, req.cookies);

            if (!token) {
                console.warn('[Auth] ⚠️  No authentication token provided');
                throw new AppError('No authentication token provided', 401);
            }

            console.log('[Auth] Token extracted, verifying with JWKS...');

            // Verify token using JWKS
            const payload = await verifyTokenWithJWKS(token);
            req.user = payload;

            console.log('[Auth] ✓ Token verified successfully:', {
                userId: payload.userId,
                email: payload.email,
            });

            next();
        } catch (error) {
            console.error('[Auth] ❌ Authentication failed:', {
                error: error instanceof Error ? error.message : String(error),
                hasAuthHeader: !!req.headers.authorization,
                hasCookies: !!req.cookies,
            });
            next(error);
        }
    })();
}

/**
 * Extract JWT payload from token string (for WebSocket)
 * Supports mock authentication for local testing (set ENABLE_MOCK_AUTH=true in .env)
 * Uses JWKS (JSON Web Key Set) for RS256 token verification from User Service
 */
export function verifyToken(token: string): Promise<JWTPayload> {
    // Async function
    return (async () => {
        try {
            // Mock authentication for local testing
            if (config.enableMockAuth) {
                console.log('🔓 Mock authentication enabled for WebSocket - bypassing JWT verification');

                // For mock auth, token can be just a userId
                const userId = token && token.length > 0 ? token : '123e4567-e89b-12d3-a456-426614174001';

                return {
                    userId,
                    email: `${userId}@mock.local`,
                };
            }

            // Real JWT authentication using JWKS
            return await verifyTokenWithJWKS(token);
        } catch (error) {
            throw error;
        }
    })();
}

// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated JWKS authentication utilities:
//   - RS256 JWT verification using jose library
//   - JWKS fetching with 1-hour TTL caching
//   - Token extraction from Authorization header and cookies
//   - Token format validation (compact JWS)
//   - Comprehensive error handling for expired, invalid, and malformed tokens
//   - Cookie parsing with support for HttpOnly cookies
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced token validation with regex checks
//   - Added detailed logging for debugging
//   - Optimized JWKS caching strategy

/**
 * JWKS (JSON Web Key Set) Authentication utilities for Collab Service.
 *
 * This module handles JWT verification from the User Service using RS256 asymmetric encryption.
 * The User Service signs tokens with a private key, and this service verifies them using the public key
 * obtained from the JWKS endpoint.
 */

import * as jose from 'jose';
import { config } from '../config/index.js';
import { AppError, JWTPayload } from '../types/index.js';

/**
 * Cache for JWKS to avoid repeated network calls
 */
let jwksCache: jose.JWTVerifyGetKey | null = null;
let jwksCacheTime: number = 0;
const JWKS_CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Get JWKS verification function with caching
 */
function getJWKS(): jose.JWTVerifyGetKey {
    const now = Date.now();

    // Return cached JWKS if still valid
    if (jwksCache && (now - jwksCacheTime) < JWKS_CACHE_TTL) {
        return jwksCache;
    }

    // Create new JWKS instance
    const jwksUrl = `${config.userServiceUrl}/api/v1/.well-known/jwks.json`;
    console.log(`🔑 Fetching JWKS from: ${jwksUrl}`);

    jwksCache = jose.createRemoteJWKSet(new URL(jwksUrl));
    jwksCacheTime = now;

    return jwksCache;
}

/**
 * Verify JWT token using JWKS
 * 
 * @param token - The JWT token string
 * @returns Decoded and verified token payload
 * @throws AppError if token is invalid, expired, or verification fails
 */
export async function verifyTokenWithJWKS(token: string): Promise<JWTPayload> {
    try {
        console.log('[JWKS] Verifying token, length:', token?.length);

        // Get JWKS verification function
        const JWKS = getJWKS();

        // Basic sanity check: ensure token is a compact JWS (three base64url parts)
        const compactJwtRegex = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
        if (!token || typeof token !== 'string' || !compactJwtRegex.test(token)) {
            console.error('[JWKS] ❌ Invalid token format:', {
                hasToken: !!token,
                tokenType: typeof token,
                tokenLength: token?.length,
                tokenPrefix: token?.substring(0, 30),
            });
            throw new AppError('Invalid token format', 401);
        }

        console.log('[JWKS] Token format valid, calling jose.jwtVerify...');

        // Verify the token
        const { payload } = await jose.jwtVerify(token, JWKS, {
            algorithms: ['RS256'],
        });

        console.log('[JWKS] ✓ Token verified, payload:', {
            userId: payload.userId,
            email: payload.email,
            exp: payload.exp,
        });

        // Validate required fields
        if (!payload.userId || typeof payload.userId !== 'string') {
            console.error('[JWKS] ❌ Token missing userId claim');
            throw new AppError('Token missing userId claim', 401);
        }

        // Return normalized payload
        return {
            userId: payload.userId as string,
            email: payload.email as string | undefined,
            iat: payload.iat,
            exp: payload.exp,
        };
    } catch (error) {
        if (error instanceof jose.errors.JWTExpired) {
            console.error('[JWKS] ❌ Token expired');
            throw new AppError('Token has expired', 401);
        } else if (error instanceof jose.errors.JWTClaimValidationFailed) {
            console.error('[JWKS] ❌ Token claim validation failed:', error.message);
            throw new AppError('Token validation failed', 401);
        } else if (error instanceof jose.errors.JWSSignatureVerificationFailed) {
            console.error('[JWKS] ❌ Signature verification failed');
            throw new AppError('Token signature verification failed', 401);
        } else if (error instanceof AppError) {
            throw error;
        } else {
            console.error('[JWKS] ❌ JWT verification error:', {
                error: error instanceof Error ? error.message : String(error),
                type: error?.constructor?.name,
            });
            throw new AppError(`Invalid token: ${error instanceof Error ? error.message : 'Unknown error'}`, 401);
        }
    }
}

/**
 * Extract JWT token from Authorization header or cookie
 * 
 * @param authHeader - Authorization header value
 * @param cookies - Cookies object (if using cookie-based auth)
 * @returns Token string or null if not found
 */
export function extractToken(authHeader?: string, cookies?: Record<string, string>): string | null {
    console.log('[extractToken] Input:', {
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 30),
        hasCookies: !!cookies,
        cookieKeys: cookies ? Object.keys(cookies) : [],
    });

    let token: string | undefined | null = null;

    // If header provided, prefer it. Support both bare token and "Bearer <token>"
    if (authHeader) {
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('[extractToken] Extracted from Bearer header, length:', token?.length);
        } else {
            token = authHeader;
            console.log('[extractToken] Using header as-is (no Bearer prefix), length:', token?.length);
        }
    }

    // Fallback to cookie if no header token
    if ((!token || token.length === 0) && cookies?.access_token) {
        token = cookies.access_token as string;
        console.log('[extractToken] Extracted from cookie, length:', token?.length);
    }

    if (!token) {
        console.log('[extractToken] ❌ No token found');
        return null;
    }

    // Strip optional Bearer prefix if present in cookie or header value
    if (typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.substring(7);
        console.log('[extractToken] Stripped Bearer prefix from token');
    }

    token = token.trim();

    // Remove surrounding quotes if someone accidentally stored the token with quotes
    if ((token.startsWith('"') && token.endsWith('"')) || (token.startsWith("'") && token.endsWith("'"))) {
        token = token.slice(1, -1);
        console.log('[extractToken] Removed surrounding quotes from token');
    }

    const result = token.length > 0 ? token : null;
    console.log('[extractToken] Result:', {
        hasToken: !!result,
        tokenLength: result?.length,
        tokenPrefix: result?.substring(0, 30),
    });

    return result;
}

/**
 * Clear JWKS cache (useful for testing or when JWKS is rotated)
 */
export function clearJWKSCache(): void {
    jwksCache = null;
    jwksCacheTime = 0;
    console.log('🔑 JWKS cache cleared');
}

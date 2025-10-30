/**
 * Authentication utilities for service-to-service communication
 */

/**
 * Extract JWT token from request Authorization header or cookies
 * 
 * @param authHeader - Authorization header value (e.g., "Bearer token...")
 * @param cookieHeader - Cookie header value
 * @returns JWT token string or null if not found
 */
export function extractAuthToken(
    authHeader?: string,
    cookieHeader?: string
): string | null {
    console.log('[extractAuthToken] Input:', {
        hasAuthHeader: !!authHeader,
        authHeaderPrefix: authHeader?.substring(0, 30),
        hasCookieHeader: !!cookieHeader,
        cookieHeaderPrefix: cookieHeader?.substring(0, 100),
    });

    // Check Authorization header first (Bearer token)
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        console.log('[extractAuthToken] Extracted from Authorization header, length:', token.length);
        return token;
    }

    // Check cookies for access_token (matches User Service cookie name)
    if (cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        console.log('[extractAuthToken] Parsed cookies:', {
            cookieKeys: Object.keys(cookies),
            hasAccessToken: !!cookies.access_token,
            accessTokenLength: cookies.access_token?.length,
        });
        if (cookies.access_token) {
            console.log('[extractAuthToken] ✓ Extracted from cookie, length:', cookies.access_token.length);
            return cookies.access_token;
        }
    }

    console.log('[extractAuthToken] ❌ No token found');
    return null;
}

/**
 * Parse cookie header into key-value pairs
 * 
 * @param cookieHeader - Raw cookie header string
 * @returns Object with cookie name-value pairs
 */
function parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        if (name && rest.length > 0) {
            cookies[name.trim()] = rest.join('=').trim();
        }
    });

    return cookies;
}

/**
 * Get authorization header value for collab service requests
 * 
 * If a valid JWT token is available, use it.
 * If no token is available and collab service has ENABLE_MOCK_AUTH=true,
 * you could fall back to userId. However, for proper authentication,
 * we should only send valid JWT tokens.
 * 
 * @throws Error if no valid JWT token is available (caller should handle)
 */
export function getCollabAuthHeader(
    userId: string,
    userToken?: string | null,
): string {
    // If we have a real JWT token from the user, forward it
    if (userToken && userToken.length > 36) { // JWT tokens are much longer than UUIDs
        return `Bearer ${userToken}`;
    }

    // No valid JWT token available - throw error
    // The caller should handle this (e.g., return error to user to login)
    throw new Error(
        `Cannot create session: No valid authentication token available for user ${userId}. ` +
        `Client must provide a valid JWT token from the user service.`
    );
}

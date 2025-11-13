// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 15-20, 2025
// Scope: Generated JWT authentication middleware with functions:
//   - expressAuthentication(): Verify JWT from cookies/headers
//   - Token parsing and validation
//   - User context injection into request object
//   - Error responses for invalid/expired tokens
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Added comprehensive error handling with specific error types
//   - Integrated with Prisma for user lookup
//   - Added logging for authentication attempts and failures
//   - Modified to support both cookie and header-based auth
//   - Added role and permission checking capabilities

import { Request } from "express";
import * as jose from "jose";
import { getUserById } from "../services/user.service";
import { jwtConfig } from "../config";
import logger from "../logger";

export function expressAuthentication(
  req: Request,
  securityName: string,
  scopes?: string[]
) {
  return new Promise(async (resolve, reject) => {
    if (securityName !== "jwt") {
      return reject(new Error("Unsupported security scheme"));
    }

    // Debug: log cookies and headers
    logger.debug({ cookies: req.cookies, headers: req.headers }, "Incoming request cookies and headers");

    let token = "";
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.substring(7);
    } else if (req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    // Debug: log token value
    logger.debug({ token }, "Token extracted for authentication");

    if (!token) {
      logger.error("No token provided");
      return reject(new Error("No token provided"));
    }

    try {
      // Use the public key directly instead of remote JWKS to avoid network issues in K8s
      const publicKey = await jose.importSPKI(jwtConfig.publicKey, "RS256");
      let decoded;
      try {
        const result = await jose.jwtVerify(token, publicKey, {
          algorithms: ["RS256"],
        });
        decoded = result.payload;
        logger.debug({ decoded }, "JWT verified, payload");
      } catch (err) {
        logger.error({ err }, "JWT verification error");
        return reject(new Error("JWT verification failed: " + err));
      }

      if (!decoded || !decoded.userId) {
        logger.error({ decoded }, "Invalid token payload");
        return reject(new Error("Invalid token"));
      }

      // Scope-based authorization check
      if (scopes && scopes.length > 0) {
        const userScopes = (decoded.scopes as string[]) || [];
        logger.debug({ decoded, scopes, userScopes }, "[DEBUG] JWT payload, required route scopes, and JWT scopes");
        const hasAllScopes = scopes.every((scope) =>
          userScopes.includes(scope)
        );
        if (!hasAllScopes) {
          logger.error({ scopes, userScopes, decoded }, "Missing required scopes.");
          const error = new Error("Forbidden: Insufficient permissions");
          (error as any).status = 403;
          return reject(error);
        }
      }
      // If no scopes required, allow any valid JWT

      logger.debug({ userId: decoded.userId }, "Finding user by ID");
      const user = await getUserById(decoded.userId as string);
      logger.debug({ user }, "Resolved user object");
      if (!user) {
        return reject(new Error("User not found"));
      }

      resolve(user);
    } catch (err) {
      // This will catch errors from jwt.verify (e.g., expired token)
      return reject(err);
    }
  });
}

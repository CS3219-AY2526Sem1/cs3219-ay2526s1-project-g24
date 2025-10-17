import { Request } from "express";
import * as jose from "jose";
import { getUserById } from "../services/user.service";
import { config } from "../config";
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

    let token = "";
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.substring(7);
    } else if (req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return reject(new Error("No token provided"));
    }

    try {
      const JWKS = jose.createRemoteJWKSet(new URL(config.jwt.jwksUri));
      let decoded;
      try {
        const result = await jose.jwtVerify(token, JWKS, {
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
        logger.debug({ scopes }, "Required route scopes");
        logger.debug({ userScopes }, "JWT scopes");
        const hasAllScopes = scopes.every((scope) =>
          userScopes.includes(scope)
        );
        if (!hasAllScopes) {
          logger.error({ scopes, userScopes }, "Missing required scopes.");
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

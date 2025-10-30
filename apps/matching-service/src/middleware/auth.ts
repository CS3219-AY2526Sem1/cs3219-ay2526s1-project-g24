import type { NextFunction, Request, Response } from "express";
import { importSPKI, jwtVerify, type JWTPayload } from "jose";
import { AuthContext } from "../auth/types.js";
import { logger } from "../observability/logger.js";

// Use RSA public key directly instead of remote JWKS to avoid network issues in K8s
const RSA_PUBLIC_KEY = process.env.RSA_PUBLIC_KEY || "";

let publicKey: Awaited<ReturnType<typeof importSPKI>> | null = null;

async function getPublicKey() {
  if (!publicKey && RSA_PUBLIC_KEY) {
    publicKey = await importSPKI(RSA_PUBLIC_KEY, "RS256");
  }
  return publicKey;
}

type MutableRequest = Request & { auth?: AuthContext; cookies?: Record<string, string> };

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  const cookieToken = (req as MutableRequest).cookies?.access_token;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

function buildContext(userId: string, payload: JWTPayload, token: string): AuthContext {
  const scopes = Array.isArray(payload.scopes)
    ? (payload.scopes as string[])
    : typeof payload.scopes === "string"
      ? (payload.scopes as string).split(" ")
      : [];

  const roles = Array.isArray(payload.roles)
    ? (payload.roles as string[])
    : typeof payload.roles === "string"
      ? [payload.roles]
      : [];

  return {
    userId,
    scopes,
    roles,
    token,
    payload,
  };
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const mutableReq = req as MutableRequest;
  if (process.env.AUTH_DISABLED === "true") {
    const fallbackUserId =
      (req.headers["x-test-user-id"] as string | undefined) ||
      (typeof req.body === "object" && req.body?.userId) ||
      (typeof req.query.userId === "string" ? req.query.userId : undefined) ||
      process.env.AUTH_FAKE_USER_ID ||
      "test-user";

    mutableReq.auth = buildContext(fallbackUserId, {} as JWTPayload, "");
    return next();
  }

  try {
    const token = extractToken(req);

    if (!token) {
      logger.warn({ path: req.path }, "Missing authentication token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const key = await getPublicKey();
    if (!key) {
      logger.error("RSA_PUBLIC_KEY not configured");
      return res.status(500).json({ error: "Server misconfiguration" });
    }

    const { payload } = await jwtVerify(token, key, {
      algorithms: ["RS256"],
    });

    const userId = (payload.userId || payload.sub) as string | undefined;

    if (!userId) {
      logger.warn({ payload }, "Token missing user identifier");
      return res.status(401).json({ error: "Unauthorized" });
    }

    mutableReq.auth = buildContext(userId, payload, token);
    next();
  } catch (error) {
    logger.warn({ error }, "Authentication failed");
    return res.status(401).json({ error: "Unauthorized" });
  }
}

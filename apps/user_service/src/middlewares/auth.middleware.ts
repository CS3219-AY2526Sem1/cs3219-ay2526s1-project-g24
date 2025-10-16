import { Request } from 'express';
import * as jose from 'jose';
import { getUserById } from '../services/user.service';

const JWKS = jose.createRemoteJWKSet(
  new URL('http://localhost:8000/.well-known/jwks.json')
);

export function expressAuthentication(
  req: Request,
  securityName: string,
  scopes?: string[]
) {
  return new Promise(async (resolve, reject) => {
    if (securityName !== 'jwt') {
      return reject(new Error('Unsupported security scheme'));
    }

    const token = req.cookies.auth_token;
    if (!token) {
      return reject(new Error('No token provided'));
    }

    try {
      const { payload: decoded } = await jose.jwtVerify(token, JWKS, {
        algorithms: ['RS256'],
      });

      if (!decoded || !decoded.userId) {
        return reject(new Error('Invalid token'));
      }

      // Scope-based authorization check
      if (scopes && scopes.length > 0) {
        const userScopes = (decoded.scopes as string[]) || [];
        const hasAllScopes = scopes.every(scope => userScopes.includes(scope));
        if (!hasAllScopes) {
          const error = new Error('Forbidden: Insufficient permissions');
          (error as any).status = 403;
          return reject(error);
        }
      }

      const user = await getUserById(decoded.userId as string);
      if (!user) {
        return reject(new Error('User not found'));
      }

      resolve(user);
    } catch (err) {
      // This will catch errors from jwt.verify (e.g., expired token)
      return reject(err);
    }
  });
}

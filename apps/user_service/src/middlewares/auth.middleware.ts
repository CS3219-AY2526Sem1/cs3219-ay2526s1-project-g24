import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getUserById } from '../services/user.service';

export interface AuthenticatedRequest extends Request {
  user?: any; // tsoa will inject the user object here
}

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
      const decoded = jwt.verify(token, config.jwt.secret) as any;
      if (!decoded || !decoded.userId) {
        return reject(new Error('Invalid token'));
      }

      // Scope-based authorization check
      if (scopes && scopes.length > 0) {
        const userScopes = decoded.scopes || [];
        const hasAllScopes = scopes.every(scope => userScopes.includes(scope));
        if (!hasAllScopes) {
          const error = new Error('Forbidden: Insufficient permissions');
          (error as any).status = 403;
          return reject(error);
        }
      }

      const user = await getUserById(decoded.userId);
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

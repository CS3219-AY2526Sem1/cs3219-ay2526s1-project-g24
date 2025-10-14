import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getUserById } from '../services/user.service';

export interface AuthenticatedRequest extends Request {
  user?: any; // tsoa will inject the user object here
}

export function expressAuthentication(
  req: AuthenticatedRequest,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  if (securityName !== 'jwt') {
    return Promise.reject(new Error('Unsupported security scheme'));
  }

  const token = req.cookies.auth_token;

  return new Promise((resolve, reject) => {
    if (!token) {
      return reject(new Error('No token provided'));
    }

    jwt.verify(token, config.jwt.secret, async (err: any, decoded: any) => {
      if (err) {
        return reject(err);
      }

      try {
        const user = await getUserById(decoded.userId);
        if (!user) {
          return reject(new Error('User not found'));
        }
        // The resolved user object will be injected into the controller by tsoa
        resolve(user);
      } catch (error) {
        reject(error);
      }
    });
  });
}

import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function expressAuthentication(
  req: AuthenticatedRequest,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  const token = req.cookies.auth_token;

  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error('No token provided'));
    }
    jwt.verify(token, config.jwt.secret, (err: any, decoded: any) => {
      if (err) {
        reject(err);
      } else {
        // Attach user to the request
        req.userId = decoded.userId;
        resolve(decoded);
      }
    });
  });
}

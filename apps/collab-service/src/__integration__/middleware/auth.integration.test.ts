/**
 * Integration tests for Authentication middleware
 * Tests auth with real HTTP requests
 */

import express, { Express, Request, Response } from 'express';
import request from 'supertest';
import { authenticate } from '../../middleware/auth.js';
import jwt from 'jsonwebtoken';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        [key: string]: any;
      };
    }
  }
}

describe('Authentication Middleware Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Protected route
    app.get('/protected', authenticate, (req: Request, res: Response) => {
      res.json({
        message: 'Access granted',
        user: req.user,
      });
    });

    // Route that extracts user info
    app.get('/userinfo', authenticate, (req: Request, res: Response) => {
      res.json({
        userId: req.user?.userId,
        email: req.user?.email,
      });
    });
  });

  describe('Mock Auth Mode (ENABLE_MOCK_AUTH=true)', () => {
    beforeAll(() => {
      process.env.ENABLE_MOCK_AUTH = 'true';
    });

    it('should allow access with any Bearer token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer any-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Access granted');
      expect(response.body.user).toBeDefined();
    });

    it('should extract user info from mock token', async () => {
      const response = await request(app)
        .get('/userinfo')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.userId).toBeDefined();
      expect(response.body.email).toContain('@example.com');
    });

    it('should still reject missing Authorization header', async () => {
      const response = await request(app).get('/protected');

      expect(response.status).toBe(401);
    });

    it('should reject invalid Authorization format', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'InvalidFormat token');

      expect(response.status).toBe(401);
    });
  });

  describe('Real JWT Mode (ENABLE_MOCK_AUTH=false)', () => {
    beforeAll(() => {
      process.env.ENABLE_MOCK_AUTH = 'false';
      process.env.JWT_SECRET = 'test-integration-secret-key-12345';
    });

    it('should accept valid JWT token', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.userId).toBe('user-123');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject expired JWT token', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 7200,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!);

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
    });

    it('should reject token with invalid signature', async () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, 'wrong-secret');

      const response = await request(app)
        .get('/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
    });

    it('should reject malformed JWT token', async () => {
      const response = await request(app)
        .get('/protected')
        .set('Authorization', 'Bearer not.a.valid.jwt');

      expect(response.status).toBe(401);
    });
  });
});

/**
 * Unit tests for authentication middleware and utilities
 */

import { authenticate, verifyToken } from '../auth.js';
import { createMockRequest, createMockResponse, createMockNext } from '../../__tests__/helpers/test-utils.js';
import { AppError } from '../../types/index.js';

// Mock JWKS auth utilities
jest.mock('../../utils/jwks-auth.js', () => ({
  verifyTokenWithJWKS: jest.fn(),
  extractToken: jest.fn(),
}));

import { verifyTokenWithJWKS, extractToken } from '../../utils/jwks-auth.js';

// Mock config
jest.mock('../../config/index.js', () => ({
  config: {
    enableMockAuth: false,
    userServiceUrl: 'http://localhost:8000',
  },
}));

import { config } from '../../config/index.js';

describe('Authentication Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (config as any).enableMockAuth = false;
  });

  describe('authenticate middleware', () => {
    it('should authenticate valid token and set user', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      (extractToken as jest.Mock).mockReturnValue('valid-token');
      (verifyTokenWithJWKS as jest.Mock).mockResolvedValue(mockPayload);

      const req = createMockRequest({
        headers: { authorization: 'Bearer valid-token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req as any, res, next);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(extractToken).toHaveBeenCalledWith('Bearer valid-token', undefined);
      expect(verifyTokenWithJWKS).toHaveBeenCalledWith('valid-token');
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalledWith();
    });

    it('should fail if no token provided', async () => {
      (extractToken as jest.Mock).mockReturnValue(null);

      const req = createMockRequest({
        headers: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req as any, res, next);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('No authentication token');
    });

    it('should fail if token verification fails', async () => {
      (extractToken as jest.Mock).mockReturnValue('invalid-token');
      (verifyTokenWithJWKS as jest.Mock).mockRejectedValue(new AppError('Invalid token', 401));

      const req = createMockRequest({
        headers: { authorization: 'Bearer invalid-token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req as any, res, next);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should bypass JWT verification in mock auth mode', async () => {
      (config as any).enableMockAuth = true;

      const req = createMockRequest({
        headers: { authorization: 'Bearer user-123' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req as any, res, next);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('user-123');
      expect(verifyTokenWithJWKS).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith();
    });

    it('should use default mock user if no authorization header in mock mode', async () => {
      (config as any).enableMockAuth = true;

      const req = createMockRequest({
        headers: {},
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req as any, res, next);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe('123e4567-e89b-12d3-a456-426614174001');
      expect(next).toHaveBeenCalledWith();
    });

    it('should extract token from cookies if no header', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      (extractToken as jest.Mock).mockReturnValue('cookie-token');
      (verifyTokenWithJWKS as jest.Mock).mockResolvedValue(mockPayload);

      const req = createMockRequest({
        cookies: { access_token: 'cookie-token' },
      });
      const res = createMockResponse();
      const next = createMockNext();

      authenticate(req as any, res, next);

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(extractToken).toHaveBeenCalled();
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('verifyToken function', () => {
    it('should verify token and return payload', async () => {
      const mockPayload = {
        userId: 'user-123',
        email: 'test@example.com',
      };

      (verifyTokenWithJWKS as jest.Mock).mockResolvedValue(mockPayload);

      const result = await verifyToken('valid-token');

      expect(verifyTokenWithJWKS).toHaveBeenCalledWith('valid-token');
      expect(result).toEqual(mockPayload);
    });

    it('should throw error if token verification fails', async () => {
      (verifyTokenWithJWKS as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      await expect(verifyToken('invalid-token')).rejects.toThrow('Invalid token');
    });

    it('should bypass verification in mock auth mode', async () => {
      (config as any).enableMockAuth = true;

      const result = await verifyToken('user-456');

      expect(result.userId).toBe('user-456');
      expect(result.email).toBe('user-456@mock.local');
      expect(verifyTokenWithJWKS).not.toHaveBeenCalled();
    });

    it('should use default user if empty token in mock mode', async () => {
      (config as any).enableMockAuth = true;

      const result = await verifyToken('');

      expect(result.userId).toBe('123e4567-e89b-12d3-a456-426614174001');
    });
  });
});

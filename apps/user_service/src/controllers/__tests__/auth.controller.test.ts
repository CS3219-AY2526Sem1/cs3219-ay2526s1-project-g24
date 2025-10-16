import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthController } from '../auth.controller';
import * as authService from '../../services/auth.service';
import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';

vi.mock('../../services/auth.service');
vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});
vi.mock('jose');

describe('AuthController', () => {
  let authController: AuthController;
  let prisma: PrismaClient;

  beforeEach(() => {
    authController = new AuthController();
    prisma = new PrismaClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getGoogleAuthUrl', () => {
    it('should return a google auth url', async () => {
      vi.spyOn(authService, 'getGoogleAuthUrl').mockReturnValue('http://google.com');
      const result = await authController.getGoogleAuthUrl();
      expect(result).toEqual({ url: 'http://google.com' });
    });
  });

  describe('handleGoogleCallback', () => {
    it('should create a new user and generate a token', async () => {
      const code = 'test_code';
      const googleUser = {
        id: 'google_id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'test_picture',
      };
      const defaultRole = { id: 1, name: 'user', permissions: [] };
      const user = {
        id: 'user_id',
        email: 'test@example.com',
        roles: [{ role: defaultRole }],
      };

      vi.spyOn(authService, 'getGoogleUser').mockResolvedValue(googleUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(defaultRole as any);
      vi.mocked(prisma.user.create).mockResolvedValue(user as any);
      
      const signJwtMock = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('test_token'),
      };
      vi.mocked(jose.SignJWT).mockImplementation(() => signJwtMock as any);
      vi.mocked(jose.importPKCS8).mockResolvedValue('private_key' as any);

      const tsoaRes = vi.fn();

      await authController.handleGoogleCallback(code, tsoaRes);

      expect(authService.getGoogleUser).toHaveBeenCalledWith(code);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: googleUser.email },
        include: expect.any(Object),
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'user' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.any(Object),
        include: expect.any(Object),
      });
      expect(jose.SignJWT).toHaveBeenCalledWith(expect.any(Object));
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: 'test_token' },
        { 'Set-Cookie': 'auth_token=test_token; HttpOnly; Path=/; Max-Age=604800' }
      );
    });

    it('should not create a new user if user already exists', async () => {
      const code = 'test_code';
      const googleUser = {
        id: 'google_id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'test_picture',
      };
      const defaultRole = { id: 1, name: 'user', permissions: [] };
      const user = {
        id: 'user_id',
        email: 'test@example.com',
        roles: [{ role: defaultRole }],
      };

      vi.spyOn(authService, 'getGoogleUser').mockResolvedValue(googleUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
      
      const signJwtMock = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue('test_token'),
      };
      vi.mocked(jose.SignJWT).mockImplementation(() => signJwtMock as any);
      vi.mocked(jose.importPKCS8).mockResolvedValue('private_key' as any);

      const tsoaRes = vi.fn();

      await authController.handleGoogleCallback(code, tsoaRes);

      expect(authService.getGoogleUser).toHaveBeenCalledWith(code);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: googleUser.email },
        include: expect.any(Object),
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(jose.SignJWT).toHaveBeenCalledWith(expect.any(Object));
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: 'test_token' },
        { 'Set-Cookie': 'auth_token=test_token; HttpOnly; Path=/; Max-Age=604800' }
      );
    });
  });

  describe('logout', () => {
    it('should clear the auth token cookie', async () => {
      const tsoaRes = vi.fn();
      await authController.logout(tsoaRes);
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { message: 'Logged out successfully' },
        { 'Set-Cookie': 'auth_token=; HttpOnly; Path=/; Max-Age=0' }
      );
    });
  });

  describe('getSession', () => {
    it('should return the user from the request', async () => {
      const req = { user: { id: 'user_id', display_name: 'Test User' } };
      const result = await authController.getSession(req as any);
      expect(result).toEqual(req.user);
    });
  });
});

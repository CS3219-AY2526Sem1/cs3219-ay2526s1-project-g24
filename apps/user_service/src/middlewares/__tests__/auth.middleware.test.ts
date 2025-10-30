import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expressAuthentication } from '../auth.middleware';
import * as jose from 'jose';
import * as userService from '../../services/user.service';
import { Request } from 'express';

vi.mock('jose');
vi.mock('../../services/user.service');

describe('expressAuthentication Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject if securityName is not jwt', async () => {
    const req = {} as Request;
    await expect(expressAuthentication(req, 'apiKey')).rejects.toThrow(
      'Unsupported security scheme'
    );
  });

  it('should reject if no token is provided', async () => {
    const req = { headers: {}, cookies: {} } as Request;
    await expect(expressAuthentication(req, 'jwt')).rejects.toThrow(
      'No token provided'
    );
  });

  it('should reject if token is invalid', async () => {
    const req = {
      headers: { authorization: 'Bearer invalidtoken' },
      cookies: {},
    } as Request;
    vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
    vi.mocked(jose.jwtVerify).mockRejectedValue(new Error('Invalid token'));

    await expect(expressAuthentication(req, 'jwt')).rejects.toThrow(
      'Invalid token'
    );
  });

  it('should reject if token payload is invalid', async () => {
    const req = {
      headers: { authorization: 'Bearer validtoken' },
      cookies: {},
    } as Request;
    vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload: {} } as any);

    await expect(expressAuthentication(req, 'jwt')).rejects.toThrow(
      'Invalid token'
    );
  });

  it('should reject if user is not found', async () => {
    const req = {
      headers: { authorization: 'Bearer validtoken' },
      cookies: {},
    } as Request;
    const payload = { userId: 'unknown-user' };
    vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload } as any);
    vi.mocked(userService.getUserById).mockResolvedValue(null);

    await expect(expressAuthentication(req, 'jwt')).rejects.toThrow(
      'User not found'
    );
  });

  it('should resolve with user on successful authentication via header', async () => {
    const req = {
      headers: { authorization: 'Bearer validtoken' },
      cookies: {},
    } as Request;
    const user = { id: 'user-123', name: 'Test User' };
    const payload = { userId: 'user-123' };
    vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload } as any);
    vi.mocked(userService.getUserById).mockResolvedValue(user as any);

    const result = await expressAuthentication(req, 'jwt');
    expect(result).toEqual(user);
    expect(userService.getUserById).toHaveBeenCalledWith('user-123');
  });

  it('should resolve with user on successful authentication via cookie', async () => {
    const req = {
      headers: {},
      cookies: { access_token: 'validtoken' },
    } as unknown as Request;
    const user = { id: 'user-123', name: 'Test User' };
    const payload = { userId: 'user-123' };
    vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
    vi.mocked(jose.jwtVerify).mockResolvedValue({ payload } as any);
    vi.mocked(userService.getUserById).mockResolvedValue(user as any);

    const result = await expressAuthentication(req, 'jwt');
    expect(result).toEqual(user);
  });

  describe('Scope-based authorization', () => {
    it('should reject if user does not have required scopes', async () => {
      const req = {
        headers: { authorization: 'Bearer validtoken' },
        cookies: {},
      } as Request;
      const payload = { userId: 'user-123', scopes: ['read'] };
      vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
      vi.mocked(jose.jwtVerify).mockResolvedValue({ payload } as any);

      await expect(
        expressAuthentication(req, 'jwt', ['write'])
      ).rejects.toThrow('Forbidden: Insufficient permissions');
    });

    it('should resolve if user has all required scopes', async () => {
      const req = {
        headers: { authorization: 'Bearer validtoken' },
        cookies: {},
      } as Request;
      const user = { id: 'user-123', name: 'Test User' };
      const payload = { userId: 'user-123', scopes: ['read', 'write'] };
      vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
      vi.mocked(jose.jwtVerify).mockResolvedValue({ payload } as any);
      vi.mocked(userService.getUserById).mockResolvedValue(user as any);

      const result = await expressAuthentication(req, 'jwt', ['read', 'write']);
      expect(result).toEqual(user);
    });

    it('should resolve if user has more scopes than required', async () => {
        const req = {
          headers: { authorization: 'Bearer validtoken' },
          cookies: {},
        } as Request;
        const user = { id: 'user-123', name: 'Test User' };
        const payload = { userId: 'user-123', scopes: ['read', 'write', 'delete'] };
        vi.mocked(jose.importSPKI).mockResolvedValue({} as any);
        vi.mocked(jose.jwtVerify).mockResolvedValue({ payload } as any);
        vi.mocked(userService.getUserById).mockResolvedValue(user as any);
  
        const result = await expressAuthentication(req, 'jwt', ['read', 'write']);
        expect(result).toEqual(user);
      });
  });
});

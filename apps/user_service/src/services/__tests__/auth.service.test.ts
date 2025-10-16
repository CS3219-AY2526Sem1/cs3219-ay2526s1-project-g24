import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';

vi.mock('axios');

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

const mockGenerateAuthUrl = vi.fn();
const mockGetToken = vi.fn();

vi.doMock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: vi.fn(() => ({
        generateAuthUrl: mockGenerateAuthUrl,
        getToken: mockGetToken,
        setCredentials: vi.fn(),
      })),
    },
  },
}));

describe('Auth Service', () => {
  let prisma: PrismaClient;
  let authService: any;

  beforeEach(async () => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
    authService = await import('../auth.service.js');
  });

  it('should get google auth url', () => {
    mockGenerateAuthUrl.mockReturnValue('http://google.com');
    const result = authService.getGoogleAuthUrl();
    expect(result).toEqual('http://google.com');
  });

  it('should get google user', async () => {
    mockGetToken.mockResolvedValue({ tokens: { access_token: 'token' } });
    vi.mocked(axios.get).mockResolvedValue({ data: { id: '1', name: 'Test' } });
    const result = await authService.getGoogleUser('code');
    expect(result).toEqual({ id: '1', name: 'Test' });
  });

  it('should return true if user has role', async () => {
    const user = { id: '1', roles: [{ role: { name: 'admin' } }] };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    const result = await authService.hasRole('1', ['admin']);
    expect(result).toBe(true);
  });

  it('should return false if user does not have role', async () => {
    const user = { id: '1', roles: [{ role: { name: 'user' } }] };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    const result = await authService.hasRole('1', ['admin']);
    expect(result).toBe(false);
  });

  it('should return false if user does not exist', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await authService.hasRole('1', ['admin']);
    expect(result).toBe(false);
  });
});

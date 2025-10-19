
import { AuthController } from '../auth.controller';
import { getGoogleUser } from '../../services/auth.service';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

jest.mock('../../services/auth.service');
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});
jest.mock('jsonwebtoken');

describe('AuthController', () => {
  let authController: AuthController;
  let prisma: PrismaClient;

  beforeEach(() => {
    authController = new AuthController();
    prisma = new PrismaClient();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      const res = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
      } as any;

      (getGoogleUser as jest.Mock).mockResolvedValue(googleUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.role.findUnique as jest.Mock).mockResolvedValue(defaultRole);
      (prisma.user.create as jest.Mock).mockResolvedValue(user);
      (jwt.sign as jest.Mock).mockReturnValue('test_token');

      const tsoaRes = jest.fn();

      await authController.handleGoogleCallback(code, tsoaRes);

      expect(getGoogleUser).toHaveBeenCalledWith(code);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: googleUser.email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'user' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: googleUser.email,
          display_name: googleUser.name,
          avatar_url: googleUser.picture,
          google_id: googleUser.id,
          roles: {
            create: {
              role_id: defaultRole.id,
            },
          },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: user.id,
          email: user.email,
          roles: ['user'],
          scopes: [],
        },
        config.jwt.secret,
        { expiresIn: '7d' }
      );
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: 'test_token' },
        { 'Set-Cookie': 'auth_token=test_token; HttpOnly; Path=/; Max-Age=604800' }
      );
    });

    it('should return a token for an existing user', async () => {
      const code = 'test_code';
      const googleUser = {
        id: 'google_id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'test_picture',
      };
      const user = {
        id: 'user_id',
        email: 'test@example.com',
        roles: [
          {
            role: {
              name: 'user',
              permissions: [{ permission: { name: 'read:own_user' } }],
            },
          },
        ],
      };
      const res = {
        status: jest.fn(),
        json: jest.fn(),
        cookie: jest.fn(),
      } as any;

      (getGoogleUser as jest.Mock).mockResolvedValue(googleUser);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(user);
      (jwt.sign as jest.Mock).mockReturnValue('test_token');

      const tsoaRes = jest.fn();

      await authController.handleGoogleCallback(code, tsoaRes);

      expect(getGoogleUser).toHaveBeenCalledWith(code);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: googleUser.email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: user.id,
          email: user.email,
          roles: ['user'],
          scopes: ['read:own_user'],
        },
        config.jwt.secret,
        { expiresIn: '7d' }
      );
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: 'test_token' },
        { 'Set-Cookie': 'auth_token=test_token; HttpOnly; Path=/; Max-Age=604800' }
      );
    });
  });

  describe('logout', () => {
    it('should clear the auth_token cookie', async () => {
      const tsoaRes = jest.fn();

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
      const req = { user: { id: 'user_id', email: 'test@example.com' } } as any;

      const result = await authController.getSession(req);

      expect(result).toEqual(req.user);
    });
  });
});

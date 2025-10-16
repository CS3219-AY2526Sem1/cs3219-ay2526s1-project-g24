import {
  Controller,
  Get,
  Post,
  Route,
  Tags,
  Query,
  Res,
  Request,
  Security,
} from 'tsoa';
import type { TsoaResponse } from 'tsoa';
import { getGoogleAuthUrl, getGoogleUser } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { getUserById } from '../services/user.service';

const prisma = new PrismaClient();

@Route('v1/auth')
@Tags('Authentication')
export class AuthController extends Controller {
  @Get('google/url')
  public async getGoogleAuthUrl() {
    return { url: getGoogleAuthUrl() };
  }

  @Get('google/callback')
  public async handleGoogleCallback(
    @Query() code: string,
    @Res()
    res: TsoaResponse<
      200,
      { accessToken: string },
      { 'Set-Cookie'?: string }
    >
  ) {
    try {
      const googleUser = await getGoogleUser(code);

      let user = await prisma.user.findUnique({
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

      if (!user) {
        const defaultRole = await prisma.role.findUnique({
          where: { name: 'user' },
        });
        if (!defaultRole) {
          throw new Error('Default user role not found.');
        }

        user = await prisma.user.create({
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
      }

      const roles = user.roles.map((userRole) => userRole.role.name);
      const permissions = user.roles.flatMap((userRole) =>
        userRole.role.permissions.map(
          (rolePermission) => rolePermission.permission.name
        )
      );
      const scopes = [...new Set(permissions)]; // Remove duplicates

      const accessToken = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          roles,
          scopes,
        },
        config.jwt.secret,
        {
          expiresIn: '7d', // Set a longer expiration
        }
      );

      res(
        200,
        { accessToken },
        { 'Set-Cookie': `auth_token=${accessToken}; HttpOnly; Path=/; Max-Age=604800` } // 7 days
      );
    } catch (error: any) {
      console.error('Error during Google callback:', error.response?.data || error.message);
      this.setStatus(500);
      return { accessToken: '' };
    }
  }

  @Post('logout')
  public async logout(
    @Res() res: TsoaResponse<200, { message: string }, { 'Set-Cookie'?: string }>
  ) {
    res(200, { message: 'Logged out successfully' }, { 'Set-Cookie': `auth_token=; HttpOnly; Path=/; Max-Age=0` });
  }

  @Security('jwt')
  @Get('session')
  public async getSession(@Request() req: { user: any }) {
    return req.user;
  }
}

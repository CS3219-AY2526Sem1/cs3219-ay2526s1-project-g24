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
import { getGoogleAuthUrl, getGoogleUser, generateJwtToken } from '../services/auth.service';
import prisma from '../prisma';

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
    @Res() res: TsoaResponse<200, { accessToken: string }, { 'Set-Cookie'?: string }>
  ): Promise<{ accessToken: string }> {
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

      const accessToken = await generateJwtToken(user);

      res(200, { accessToken }, { 'Set-Cookie': `auth_token=${accessToken}; HttpOnly; Path=/; Max-Age=604800` });
      return { accessToken };
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
    res(200, { message: 'Logged out successfully' }, { 'Set-Cookie': 'auth_token=; HttpOnly; Path=/; Max-Age=0' });
  }

  @Security('jwt')
  @Post('refresh')
  public async refresh(
    @Request() req: { user: any },
    @Res() res: TsoaResponse<200, { accessToken: string }, { 'Set-Cookie'?: string }>
  ): Promise<{ accessToken: string }> {
    const user = req.user;

    const accessToken = await generateJwtToken(user);

    res(200, { accessToken }, { 'Set-Cookie': `auth_token=${accessToken}; HttpOnly; Path=/; Max-Age=604800` });
    return { accessToken };
  }

  @Security('jwt')
  @Get('session')
  public async getSession(@Request() req: { user: any }) {
    return req.user;
  }
}

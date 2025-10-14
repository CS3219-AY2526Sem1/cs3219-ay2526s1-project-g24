import { Controller, Get, Route, Tags, Query, Res } from 'tsoa';
import type { TsoaResponse } from 'tsoa';
import { getGoogleAuthUrl, getGoogleUser } from '../services/auth.service';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { config } from '../config';

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
    @Res() res: TsoaResponse<200, { token: string }>
  ) {
    try {
      const googleUser = await getGoogleUser(code);

      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            display_name: googleUser.name,
            avatar_url: googleUser.picture,
            google_id: googleUser.id,
          },
        });
      }

      const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
        expiresIn: '1h',
      });

      res(200, { token }, { 'Set-Cookie': `auth_token=${token}; HttpOnly; Path=/; Max-Age=3600` });
    } catch (error) {
      console.error(error);
      // Consider a more specific error response
      this.setStatus(500);
      return { token: '' };
    }
  }

  @Get('refresh')
  public async refreshToken() {
    // Placeholder
    return { token: 'your-new-jwt-token' };
  }

  @Get('logout')
  public async logout() {
    // Placeholder
    return { message: 'Logged out' };
  }

  @Get('session')
  public async getSession() {
    // Placeholder
    return { session: 'your-session-data' };
  }
}

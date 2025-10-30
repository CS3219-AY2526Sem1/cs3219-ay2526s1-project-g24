import * as jose from "jose";
import { jwtConfig, oauthConfig, webConfig } from "../config";
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
} from "tsoa";
import type { TsoaResponse } from "tsoa";
import { AuthResponse } from "../models/auth-response.model";
import {
  getGoogleAuthUrl,
  getGoogleUser,
  generateAccessToken,
  generateRefreshToken,
} from "../services/auth.service";
import prisma from "../prisma";
import { isProduction } from "../utils/flags";
import logger from "../logger";

@Route("auth")
@Tags("Authentication")
export class AuthController extends Controller {
  @Get("google/url")
  public async getGoogleAuthUrl() {
    return { url: getGoogleAuthUrl() };
  }

  @Get("google/callback")
  public async handleGoogleCallback(
    @Query() code: string,
    @Res() res: TsoaResponse<302, void, { "Set-Cookie"?: string[]; Location: string }>,
  ): Promise<void> {
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
          where: { name: "user" },
        });
        if (!defaultRole) {
          throw new Error("Default user role not found.");
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

      const accessToken = await generateAccessToken(user);
      const refreshTokenFamily = await prisma.refreshTokenFamily.create({
        data: {
          user_id: user.id,
        },
      });
      const { refreshToken, jti } = await generateRefreshToken(
        user,
        refreshTokenFamily.id,
      );

      await prisma.refreshToken.create({
        data: {
          id: jti,
          family_id: refreshTokenFamily.id,
        },
      });

      // Determine the redirect URL based on environment
      const redirectUrl = isProduction()
        ? webConfig.callbackUrl
        : webConfig.callbackUrl;

      // Set cookies and include Location header for client-side redirect
      res(
        302,
        undefined,
        {
          "Set-Cookie": [
            `access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${jwtConfig.accessTokenExpiry}${isProduction() ? "; Secure" : ""}`,
            `refresh_token=${refreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${jwtConfig.refreshTokenExpiry}${isProduction() ? "; Secure" : ""}`,
          ],
          "Location": redirectUrl
        },
      );
      return;
    } catch (error: any) {
      logger.error(
        "Error during Google callback:",
        error.response?.data || error.message,
      );
      this.setStatus(500);
      res(302, undefined, { "Location": webConfig.errorUrl });
      return;
    }
  }

  @Post("logout")
  public async logout(
    @Request() req: any,
    @Res()
    res: TsoaResponse<200, { message: string }, { "Set-Cookie"?: string[] }>,
  ) {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
      try {
        const JWKS = jose.createRemoteJWKSet(new URL(jwtConfig.jwksUri));
        const { payload } = await jose.jwtVerify(refreshToken, JWKS, {
          algorithms: ["RS256"],
        });
        const { familyId } = payload;
        if (familyId) {
          await prisma.refreshTokenFamily.update({
            where: { id: familyId as string },
            data: { is_revoked: true },
          });
        }
      } catch (error) {
        // Ignore errors, just clear cookies
      }
    }
    res(
      200,
      { message: "Logged out successfully" },
      {
        "Set-Cookie": [
          `access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isProduction() ? "; Secure" : ""}`,
          `refresh_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${isProduction() ? "; Secure" : ""}`,
        ],
      },
    );
  }

  @Post("refresh")
  public async refresh(
    @Request() req: any,
    @Res() res: TsoaResponse<200, AuthResponse, { "Set-Cookie"?: string[] }>,
  ): Promise<AuthResponse> {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      this.setStatus(401);
      return { accessToken: "" };
    }

    try {
      const JWKS = jose.createRemoteJWKSet(new URL(jwtConfig.jwksUri));
      const { payload } = await jose.jwtVerify(refreshToken, JWKS, {
        algorithms: ["RS256"],
      });

      const { jti, familyId, userId } = payload;

      if (!jti || !familyId || !userId) {
        this.setStatus(401);
        return { accessToken: "" };
      }

      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { id: jti },
        include: { family: true },
      });

      if (!tokenRecord || tokenRecord.family.user_id !== userId) {
        this.setStatus(401);
        return { accessToken: "" };
      }

      if (tokenRecord.family.is_revoked) {
        this.setStatus(401);
        return { accessToken: "" };
      }

      if (tokenRecord.is_used) {
        await prisma.refreshTokenFamily.update({
          where: { id: tokenRecord.family_id },
          data: { is_revoked: true },
        });
        this.setStatus(401);
        return { accessToken: "" };
      }

      await prisma.refreshToken.update({
        where: { id: jti },
        data: { is_used: true },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId as string },
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
        this.setStatus(401);
        return { accessToken: "" };
      }

      const accessToken = await generateAccessToken(user);
      const { refreshToken: newRefreshToken, jti: newJti } =
        await generateRefreshToken(user, tokenRecord.family_id);

      // Store the new refresh token in the database
      // jti is the unique identifier for the new refresh token
      await prisma.refreshToken.create({
        data: {
          id: newJti,
          family_id: tokenRecord.family_id,
        },
      });

      res(
        200,
        { accessToken },
        {
          "Set-Cookie": [
            `access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${jwtConfig.accessTokenExpiry}${isProduction() ? "; Secure" : ""}`,
            `refresh_token=${newRefreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${jwtConfig.refreshTokenExpiry}${isProduction() ? "; Secure" : ""}`,
          ],
        },
      );
      return { accessToken };
    } catch (error) {
      this.setStatus(401);
      return { accessToken: "" };
    }
  }

  @Security("jwt")
  @Get("session")
  public async getSession(@Request() req: { user: any }) {
    const user = req.user;
    return { user };
  }
}

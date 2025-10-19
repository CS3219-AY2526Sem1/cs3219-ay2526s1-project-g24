import * as jose from "jose";
import { config } from "../config";
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
  generateTokens,
} from "../services/auth.service";
import prisma from "../prisma";

@Route("v1/auth")
@Tags("Authentication")
export class AuthController extends Controller {
  @Get("google/url")
  public async getGoogleAuthUrl() {
    return { url: getGoogleAuthUrl() };
  }

  @Get("google/callback")
  public async handleGoogleCallback(
    @Query() code: string,
    @Res() res: TsoaResponse<200, AuthResponse, { "Set-Cookie"?: string[] }>
  ): Promise<AuthResponse> {
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

      const { accessToken, refreshToken } = await generateTokens(user);

      res(
        200,
        { accessToken },
        {
          "Set-Cookie": [
            `access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=900`,
            `refresh_token=${refreshToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1209600`,
          ],
        }
      );
      return { accessToken };
    } catch (error: any) {
      console.error(
        "Error during Google callback:",
        error.response?.data || error.message
      );
      this.setStatus(500);
      return { accessToken: "" };
    }
  }

  @Post("logout")
  public async logout(
    @Res()
    res: TsoaResponse<200, { message: string }, { "Set-Cookie"?: string[] }>
  ) {
    res(
      200,
      { message: "Logged out successfully" },
      {
        "Set-Cookie": [
          `access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
          `refresh_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`,
        ],
      }
    );
  }

  @Post("refresh")
  public async refresh(
    @Request() req: any,
    @Res() res: TsoaResponse<200, AuthResponse, { "Set-Cookie"?: string }>
  ): Promise<AuthResponse> {
    const refreshToken = req.cookies.refresh_token;

    if (!refreshToken) {
      this.setStatus(401);
      return { accessToken: "" };
    }

    try {
      const JWKS = jose.createRemoteJWKSet(new URL(config.jwt.jwksUri));
      const { payload } = await jose.jwtVerify(refreshToken, JWKS, {
        algorithms: ["RS256"],
      });

      const user = await prisma.user.findUnique({
        where: { id: payload.userId as string },
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

      const { accessToken } = await generateTokens(user);

      res(
        200,
        { accessToken },
        {
          "Set-Cookie": `access_token=${accessToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=900`,
        }
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
    return req.user;
  }
}

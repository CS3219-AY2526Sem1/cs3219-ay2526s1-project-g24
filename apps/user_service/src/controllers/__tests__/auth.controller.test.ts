import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthController } from "../auth.controller";
import * as authService from "../../services/auth.service";
import { PrismaClient } from "@prisma/client";

const fakeUuid = "123e4567-e89b-12d3-a456-426614174000";

vi.mock("jose", () => ({
  createRemoteJWKSet: () => (() => Promise.resolve({})) as any,
  importSPKI: async () => ({}) as any, // Mock importSPKI to return a dummy key
  jwtVerify: async () => ({
    payload: {
      userId: "user_id",
      jti: fakeUuid,
      familyId: "family_id",
    },
  }),
}));

const {
  getGoogleAuthUrlSpy,
  getGoogleUserSpy,
  generateAccessTokenSpy,
  generateRefreshTokenSpy,
} = vi.hoisted(() => {
  return {
    getGoogleAuthUrlSpy: vi.fn(),
    getGoogleUserSpy: vi.fn(),
    generateAccessTokenSpy: vi.fn(),
    generateRefreshTokenSpy: vi.fn(),
  };
});
vi.mock("../../services/auth.service", () => ({
  getGoogleAuthUrl: getGoogleAuthUrlSpy,
  getGoogleUser: getGoogleUserSpy,
  generateAccessToken: generateAccessTokenSpy,
  generateRefreshToken: generateRefreshTokenSpy,
}));

vi.mock("@prisma/client", () => {
  const mPrismaClient = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    refreshTokenFamily: {
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe("AuthController", () => {
  let authController: AuthController;
  let prisma: any;

  beforeEach(() => {
    authController = new AuthController();
    prisma = new PrismaClient();
    getGoogleAuthUrlSpy.mockReset();
    getGoogleUserSpy.mockReset();
    generateAccessTokenSpy.mockReset();
    generateRefreshTokenSpy.mockReset();
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
    prisma.role.findUnique.mockReset();
    prisma.refreshTokenFamily.create.mockReset();
    prisma.refreshTokenFamily.update.mockReset();
    prisma.refreshToken.create.mockReset();
    prisma.refreshToken.findUnique.mockReset();
    prisma.refreshToken.update.mockReset();
  });

  describe("getGoogleAuthUrl", () => {
    it("should return a google auth url", async () => {
      getGoogleAuthUrlSpy.mockReturnValue("http://google.com");
      const result = await authController.getGoogleAuthUrl();
      expect(result).toEqual({ url: "http://google.com" });
    });
  });

  describe("handleGoogleCallback", () => {
    it("should create a new user and generate a token", async () => {
      const code = "test_code";
      const googleUser = {
        id: "google_id",
        email: "test@example.com",
        name: "Test User",
        picture: "test_picture",
      };
      const defaultRole = { id: 1, name: "user", permissions: [] };
      const user = {
        id: "user_id",
        email: "test@example.com",
        roles: [{ role: defaultRole }],
      };

      getGoogleUserSpy.mockResolvedValue(googleUser);
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(defaultRole as any);
      prisma.user.create.mockResolvedValue(user as any);
      generateAccessTokenSpy.mockResolvedValue("test_token");
      prisma.refreshTokenFamily.create.mockResolvedValue({ id: "family_id" });
      generateRefreshTokenSpy.mockResolvedValue({
        refreshToken: "refresh_token",
        jti: fakeUuid,
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const tsoaRes = vi.fn();
      const result = await authController.handleGoogleCallback(code, tsoaRes);

      expect(getGoogleUserSpy).toHaveBeenCalledWith(code);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: googleUser.email },
        include: expect.any(Object),
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: "user" },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.any(Object),
        include: expect.any(Object),
      });
      expect(generateAccessTokenSpy).toHaveBeenCalledWith(user);
      expect(prisma.refreshTokenFamily.create).toHaveBeenCalledWith({
        data: { user_id: user.id },
      });
      expect(generateRefreshTokenSpy).toHaveBeenCalledWith(user, "family_id");
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: { id: fakeUuid, family_id: "family_id" },
      });
      expect(tsoaRes).toHaveBeenCalledWith(302, undefined, {
        Location: "http://localhost:3000/auth/callback",
        "Set-Cookie": [
          "access_token=test_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=900",
          "refresh_token=refresh_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800",
        ],
      });
      expect(result).toEqual(undefined);
    });

    it("should not create a new user if user already exists", async () => {
      const code = "test_code";
      const googleUser = {
        id: "google_id",
        email: "test@example.com",
        name: "Test User",
        picture: "test_picture",
      };
      const defaultRole = { id: 1, name: "user", permissions: [] };
      const user = {
        id: "user_id",
        email: "test@example.com",
        roles: [{ role: defaultRole }],
      };

      getGoogleUserSpy.mockResolvedValue(googleUser);
      prisma.user.findUnique.mockResolvedValue(user as any);
      generateAccessTokenSpy.mockResolvedValue("test_token");
      prisma.refreshTokenFamily.create.mockResolvedValue({
        id: "family_id",
      });
      generateRefreshTokenSpy.mockResolvedValue({
        refreshToken: "refresh_token",
        jti: fakeUuid,
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const tsoaRes = vi.fn();
      const result = await authController.handleGoogleCallback(code, tsoaRes);

      expect(getGoogleUserSpy).toHaveBeenCalledWith(code);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: googleUser.email },
        include: expect.any(Object),
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(generateAccessTokenSpy).toHaveBeenCalledWith(user);
      expect(prisma.refreshTokenFamily.create).toHaveBeenCalledWith({
        data: { user_id: user.id },
      });
      expect(generateRefreshTokenSpy).toHaveBeenCalledWith(user, "family_id");
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: { id: fakeUuid, family_id: "family_id" },
      });
      expect(tsoaRes).toHaveBeenCalledWith(302, undefined, {
        Location: "http://localhost:3000/auth/callback",
        "Set-Cookie": [
          "access_token=test_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=900",
          "refresh_token=refresh_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800",
        ],
      });
      expect(result).toEqual(undefined);
    });
  });

  describe("logout", () => {
    it("should clear the auth token cookie", async () => {
      const tsoaRes = vi.fn();
      const req = { cookies: {} };
      await authController.logout(req as any, tsoaRes);
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { message: "Logged out successfully" },
        {
          "Set-Cookie": [
            "access_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
            "refresh_token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0",
          ],
        }
      );
    });
  });

  describe("refresh", () => {
    it("should refresh the token", async () => {
      const userId = "user_id";
      const user = {
        id: userId,
        email: "test@example.com",
        roles: [{ role: { name: "user", permissions: [] } }],
      };
      const req = { cookies: { refresh_token: "dummy_refresh_token" }, user };

      generateAccessTokenSpy.mockResolvedValue("new_test_token");
      generateRefreshTokenSpy.mockResolvedValue({
        refreshToken: "refresh_token",
        jti: fakeUuid,
      });
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: fakeUuid,
        family_id: "family_id",
        is_used: false,
        family: { user_id: userId, is_revoked: false },
      });
      prisma.refreshToken.update.mockResolvedValue({});
      prisma.user.findUnique.mockImplementation((args: any) => {
        if (args?.where?.id === userId) {
          return Promise.resolve(user);
        }
        return Promise.resolve(null);
      });
      prisma.refreshToken.create.mockResolvedValue({});

      const tsoaRes = vi.fn();
      const result = await authController.refresh(req as any, tsoaRes);

      expect(generateAccessTokenSpy).toHaveBeenCalledWith(user);
      expect(generateRefreshTokenSpy).toHaveBeenCalledWith(user, "family_id");
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: { id: fakeUuid, family_id: "family_id" },
      });
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: "new_test_token" },
        {
          "Set-Cookie": [
            "access_token=new_test_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=900",
            "refresh_token=refresh_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800",
          ],
        }
      );
      expect(result).toEqual({ accessToken: "new_test_token" });
    });
  });

  describe("getSession", () => {
    it("should return the user from the request", async () => {
      const req = { user: { id: "user_id", display_name: "Test User" } };
      const result = await authController.getSession(req as any);
      expect(result).toEqual({
        user: {
          display_name: "Test User",
          id: "user_id",
        },
      });
    });
  });
});

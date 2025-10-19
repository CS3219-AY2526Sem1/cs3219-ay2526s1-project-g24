import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthController } from "../auth.controller";
import * as authService from "../../services/auth.service";
import { PrismaClient } from "@prisma/client";

vi.mock("jose", () => ({
  createRemoteJWKSet: () => (() => Promise.resolve({})) as any,
  jwtVerify: async () => ({ payload: { userId: "user_id" } }),
}));
vi.mock("../../services/auth.service");
vi.mock("@prisma/client", () => {
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

describe("AuthController", () => {
  let authController: AuthController;
  let prisma: PrismaClient;

  beforeEach(() => {
    authController = new AuthController();
    prisma = new PrismaClient();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("getGoogleAuthUrl", () => {
    it("should return a google auth url", async () => {
      vi.spyOn(authService, "getGoogleAuthUrl").mockReturnValue(
        "http://google.com"
      );
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

      vi.spyOn(authService, "getGoogleUser").mockResolvedValue(googleUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.role.findUnique).mockResolvedValue(defaultRole as any);
      vi.mocked(prisma.user.create).mockResolvedValue(user as any);
      vi.spyOn(authService, "generateTokens").mockResolvedValue({
        accessToken: "test_token",
        refreshToken: "refresh_token",
      });

      const tsoaRes = vi.fn();
      const result = await authController.handleGoogleCallback(code, tsoaRes);

      expect(authService.getGoogleUser).toHaveBeenCalledWith(code);
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
      expect(authService.generateTokens).toHaveBeenCalledWith(user);
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: "test_token" },
        {
          "Set-Cookie": [
            "access_token=test_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=900",
            "refresh_token=refresh_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=1209600",
          ],
        }
      );
      expect(result).toEqual({ accessToken: "test_token" });
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

      vi.spyOn(authService, "getGoogleUser").mockResolvedValue(googleUser);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
      vi.spyOn(authService, "generateTokens").mockResolvedValue({
        accessToken: "test_token",
        refreshToken: "refresh_token",
      });

      const tsoaRes = vi.fn();
      const result = await authController.handleGoogleCallback(code, tsoaRes);

      expect(authService.getGoogleUser).toHaveBeenCalledWith(code);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: googleUser.email },
        include: expect.any(Object),
      });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(authService.generateTokens).toHaveBeenCalledWith(user);
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: "test_token" },
        {
          "Set-Cookie": [
            "access_token=test_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=900",
            "refresh_token=refresh_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=1209600",
          ],
        }
      );
      expect(result).toEqual({ accessToken: "test_token" });
    });
  });

  describe("logout", () => {
    it("should clear the auth token cookie", async () => {
      const tsoaRes = vi.fn();
      await authController.logout(tsoaRes);
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
      const user = {
        id: "user_id",
        email: "test@example.com",
        roles: [{ role: { name: "user", permissions: [] } }],
      };
      // Provide req.cookies.refresh_token as expected by the controller
      const req = { cookies: { refresh_token: "dummy_refresh_token" }, user };

      vi.spyOn(authService, "generateTokens").mockResolvedValue({
        accessToken: "new_test_token",
        refreshToken: "refresh_token",
      });

      // Mock jose.createRemoteJWKSet and jose.jwtVerify to simulate valid JWT verification
      const jose = await import("jose");
      vi.spyOn(jose, "createRemoteJWKSet").mockReturnValue((() =>
        Promise.resolve({})) as any);
      vi.spyOn(jose, "jwtVerify").mockResolvedValue({
        payload: { userId: user.id },
      } as any);

      // Mock prisma.user.findUnique to return the user
      vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

      const tsoaRes = vi.fn();
      const result = await authController.refresh(req as any, tsoaRes);

      expect(authService.generateTokens).toHaveBeenCalledWith(user);
      expect(tsoaRes).toHaveBeenCalledWith(
        200,
        { accessToken: "new_test_token" },
        {
          "Set-Cookie":
            "access_token=new_test_token; HttpOnly; SameSite=Strict; Path=/; Max-Age=900",
        }
      );
      expect(result).toEqual({ accessToken: "new_test_token" });
    });
  });

  describe("getSession", () => {
    it("should return the user from the request", async () => {
      const req = { user: { id: "user_id", display_name: "Test User" } };
      const result = await authController.getSession(req as any);
      expect(result).toEqual(req.user);
    });
  });
});

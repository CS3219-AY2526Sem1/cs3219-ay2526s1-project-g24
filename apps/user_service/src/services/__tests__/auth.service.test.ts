import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as jose from "jose";

vi.mock("axios");
vi.mock("jose");

vi.mock("@prisma/client", () => {
  const mPrismaClient = {
    user: {
      findUnique: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

const mockGenerateAuthUrl = vi.fn();
const mockGetToken = vi.fn();

vi.doMock("googleapis", () => ({
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

describe("Auth Service", () => {
  let prisma: PrismaClient;
  let authService: any;

  beforeEach(async () => {
    prisma = new PrismaClient();
    vi.clearAllMocks();
    authService = await import("../auth.service.js");
  });

  it("should get google auth url", () => {
    mockGenerateAuthUrl.mockReturnValue("http://google.com");
    const result = authService.getGoogleAuthUrl();
    expect(result).toEqual("http://google.com");
  });

  it("should get google user", async () => {
    mockGetToken.mockResolvedValue({ tokens: { access_token: "token" } });
    vi.mocked(axios.get).mockResolvedValue({ data: { id: "1", name: "Test" } });
    const result = await authService.getGoogleUser("code");
    expect(result).toEqual({ id: "1", name: "Test" });
  });

  it("should return true if user has role", async () => {
    const user = { id: "1", roles: [{ role: { name: "admin" } }] };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    const result = await authService.hasRole("1", ["admin"]);
    expect(result).toBe(true);
  });

  it("should return false if user does not have role", async () => {
    const user = { id: "1", roles: [{ role: { name: "user" } }] };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    const result = await authService.hasRole("1", ["admin"]);
    expect(result).toBe(false);
  });

  it("should return false if user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const result = await authService.hasRole("1", ["admin"]);
    expect(result).toBe(false);
  });

  describe("generateTokens", () => {
    it("should generate access and refresh tokens with correct user details", async () => {
      const user = {
        id: "user-123",
        email: "test@example.com",
        roles: [
          {
            role: {
              name: "admin",
              permissions: [
                { permission: { name: "users:read" } },
                { permission: { name: "users:write" } },
              ],
            },
          },
          {
            role: {
              name: "user",
              permissions: [
                { permission: { name: "profile:read" } },
                { permission: { name: "profile:write" } },
              ],
            },
          },
        ],
      };

      const signJwtMock = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        sign: vi
          .fn()
          .mockResolvedValueOnce("signed-access-token")
          .mockResolvedValueOnce("signed-refresh-token"),
      };
      vi.mocked(jose.SignJWT).mockImplementation(() => signJwtMock as any);
      vi.mocked(jose.importPKCS8).mockResolvedValue("private_key" as any);

      const { generateTokens } = await import("../auth.service.js");
      const tokens = await generateTokens(user as any);

      expect(jose.importPKCS8).toHaveBeenCalled();
      expect(jose.SignJWT).toHaveBeenCalledWith({
        userId: "user-123",
        email: "test@example.com",
        roles: ["admin", "user"],
        scopes: ["users:read", "users:write", "profile:read", "profile:write"],
      });
      expect(signJwtMock.setProtectedHeader).toHaveBeenCalledWith({
        alg: "RS256",
        kid: "1",
      });
      expect(signJwtMock.setIssuedAt).toHaveBeenCalled();
      expect(signJwtMock.setExpirationTime).toHaveBeenCalledWith("15m");
      expect(signJwtMock.sign).toHaveBeenCalledWith("private_key");

      // For refresh token
      expect(jose.SignJWT).toHaveBeenCalledWith({
        userId: "user-123",
      });
      expect(signJwtMock.setExpirationTime).toHaveBeenCalledWith("14d");
      expect(tokens).toEqual({
        accessToken: "signed-access-token",
        refreshToken: "signed-refresh-token",
      });
    });
  });
});

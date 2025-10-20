import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as jose from "jose";
import * as crypto from "crypto";

vi.mock("axios");
vi.mock("jose");
vi.mock("crypto");

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

  describe("generateAccessToken", () => {
    it("should generate an access token with correct user details", async () => {
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
        sign: vi.fn().mockResolvedValue("signed-access-token"),
      };
      vi.mocked(jose.SignJWT).mockImplementation(() => signJwtMock as any);
      vi.mocked(jose.importPKCS8).mockResolvedValue("private_key" as any);

      const { generateAccessToken } = await import("../auth.service.js");
      const token = await generateAccessToken(user as any);

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
      expect(token).toBe("signed-access-token");
    });
  });

  describe("generateRefreshToken", () => {
    it("should generate a refresh token with correct user id and familyId", async () => {
      const user = { id: "user-123" };
      const familyId = "family-456";

      const fakeUuid = "123e4567-e89b-12d3-a456-426614174000";

      const signJwtMock = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setJti: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue("signed-refresh-token"),
      };
      vi.mocked(jose.SignJWT).mockImplementation(() => signJwtMock as any);
      vi.mocked(jose.importPKCS8).mockResolvedValue("private_key" as any);
      vi.mocked(crypto.randomUUID).mockReturnValue(fakeUuid);

      const { generateRefreshToken } = await import("../auth.service.js");
      const result = await generateRefreshToken(user as any, familyId);

      expect(jose.importPKCS8).toHaveBeenCalled();
      expect(jose.SignJWT).toHaveBeenCalledWith({
        userId: "user-123",
        familyId,
      });
      expect(signJwtMock.setProtectedHeader).toHaveBeenCalledWith({
        alg: "RS256",
        kid: "1",
      });
      expect(signJwtMock.setIssuedAt).toHaveBeenCalled();
      expect(signJwtMock.setExpirationTime).toHaveBeenCalledWith("14d");
      expect(signJwtMock.setJti).toHaveBeenCalledWith(fakeUuid);
      expect(signJwtMock.sign).toHaveBeenCalledWith("private_key");
      expect(result).toEqual({
        refreshToken: "signed-refresh-token",
        jti: fakeUuid,
      });
    });
  });
});

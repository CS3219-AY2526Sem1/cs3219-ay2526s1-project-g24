import { google } from "googleapis";
import { config } from "../config";
import axios from "axios";
import prisma from "../prisma";
import type { User } from "@prisma/client";
import * as jose from "jose";
import { randomUUID } from "crypto";

const oauth2Client = new google.auth.OAuth2(
  config.google.clientId,
  config.google.clientSecret,
  config.google.redirectUri,
);

export const getGoogleAuthUrl = () => {
  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
  ];

  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
};

export const getGoogleUser = async (code: string) => {
  const { tokens } = await oauth2Client.getToken({
    code,
    redirect_uri: config.google.redirectUri,
  });
  oauth2Client.setCredentials(tokens);

  const { data } = await axios.get(
    "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
    {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    },
  );

  return data;
};

export const hasRole = async (
  userId: string,
  roles: string[],
): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: true,
        },
      },
    },
  });

  if (!user) {
    return false;
  }

  const userRoles = user.roles.map((userRole) => userRole.role.name);
  return roles.some((role) => userRoles.includes(role));
};

export const generateAccessToken = async (user: User & { roles: any[] }) => {
  const roles = user.roles.map((userRole: any) => userRole.role.name);
  const permissions = user.roles.flatMap((userRole: any) =>
    userRole.role.permissions.map(
      (rolePermission: any) => rolePermission.permission.name,
    ),
  );
  const scopes = [...new Set(permissions)]; // Remove duplicates

  // We sign the JWT with the private key (This should be the most recently rotated key)
  const privateKey = await jose.importPKCS8(config.jwt.privateKey, "RS256");

  const accessToken = await new jose.SignJWT({
    userId: user.id,
    email: user.email,
    roles,
    scopes,
  })
    .setProtectedHeader({ alg: "RS256", kid: "1" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(privateKey);

  return accessToken;
};

export const generateRefreshToken = async (
  user: Pick<User, "id">,
  familyId: string,
) => {
  const privateKey = await jose.importPKCS8(config.jwt.privateKey, "RS256");
  const jti = randomUUID();

  const refreshToken = await new jose.SignJWT({
    userId: user.id,
    familyId,
  })
    .setProtectedHeader({ alg: "RS256", kid: "1" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .setJti(jti)
    .sign(privateKey);

  return { refreshToken, jti };
};

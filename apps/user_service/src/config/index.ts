import { ADMIN, ADMIN_PERMISSIONS, USER, USER_PERMISSIONS } from "../utils/constants";

export const jwtConfig = {
  privateKey: process.env.RSA_PRIVATE_KEY || "",
  publicKey: process.env.RSA_PUBLIC_KEY || "",
  jwksUri:
    process.env.JWKS_URI || "http://localhost:8001/.well-known/jwks.json",
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || "900", // 15 minutes
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || "604800", // 7 days
};

export const oauthConfig = {
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
};

export const userRbacConfig = {
  defaultRole: USER,
  roles: [USER, ADMIN],
  permissions: [
    ...Object.values(USER_PERMISSIONS),
    ...Object.values(ADMIN_PERMISSIONS),
  ],
  rolesWithPermissions: {
    "user": [
      // User-level permissions
      USER_PERMISSIONS.USER_READ,
      USER_PERMISSIONS.USER_READ_SELF,
    ],
    "admin": [
      // User-level permissions
      USER_PERMISSIONS.USER_READ,
      USER_PERMISSIONS.USER_READ_SELF,

      // Admin-level permissions for user management
      ADMIN_PERMISSIONS.ADMIN_USERS_READ,
      ADMIN_PERMISSIONS.ADMIN_USERS_EDIT,
      ADMIN_PERMISSIONS.ADMIN_USERS_DELETE,

      // Admin-level permissions for role management
      ADMIN_PERMISSIONS.ADMIN_ROLES_CREATE,
      ADMIN_PERMISSIONS.ADMIN_ROLES_READ,
      ADMIN_PERMISSIONS.ADMIN_ROLES_EDIT,
      ADMIN_PERMISSIONS.ADMIN_ROLES_DELETE,

      // Admin-level permissions for permission management
      ADMIN_PERMISSIONS.ADMIN_PERMISSIONS_CREATE,
      ADMIN_PERMISSIONS.ADMIN_PERMISSIONS_READ,
      ADMIN_PERMISSIONS.ADMIN_PERMISSIONS_EDIT,
      ADMIN_PERMISSIONS.ADMIN_PERMISSIONS_DELETE,
    ],
  },
};

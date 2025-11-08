import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import {
  ADMIN,
  ADMIN_PERMISSIONS,
  USER,
  USER_PERMISSIONS,
} from "../../utils/constants.js";

let publicKey: any;
let user1Token: string;
let admin1Token: string;
let prisma: any;
let dbContainer: any;
let server: any;

vi.doMock("jose", async (importOriginal) => {
  const actual = await importOriginal();
  return Object.assign({}, actual, {
    createRemoteJWKSet: vi.fn(() => async () => publicKey),
  });
});

describe("User Controller Integration (Testcontainers)", () => {
  beforeAll(async () => {
    dbContainer = await new PostgreSqlContainer("postgres:15-alpine").start();
    const databaseUrl = dbContainer.getConnectionUri();
    process.env.USERDB_DATABASE_URL = databaseUrl;

    // Dynamically import PrismaClient and jose after mocking
    prisma = new PrismaClient();
    const jose = await import("jose");

    // Generate keypair and set publicKey BEFORE creating the server
    // Set extractable: true so we can export the keys
    const { publicKey: pubKey, privateKey: privKey } =
      await jose.generateKeyPair("RS256", { extractable: true });
    publicKey = pubKey;
    
    // Export the public key in SPKI format for the server to use
    const publicKeySpki = await jose.exportSPKI(pubKey);
    process.env.RSA_PUBLIC_KEY = publicKeySpki;
    process.env.RSA_PRIVATE_KEY = await jose.exportPKCS8(privKey);

    // Dynamically import server after mocking
    const { createServer } = await import("../../server.js");
    server = createServer().listen(9010);

    execSync("pnpm --filter user_service exec prisma migrate deploy");

    // Run migrations
    await prisma.user.deleteMany();

    // Seed a public user
    const user1 = await prisma.user.create({
      data: {
        id: "public-user-id",
        email: "public@example.com",
        display_name: "Public User",
      },
    });

    // Seed an admin user
    await prisma.user.create({
      data: {
        id: "admin-user-id",
        email: "admin@example.com",
        display_name: "Admin User",
      },
    });

    // Create a JWT for the public user
    user1Token = await new jose.SignJWT({
      userId: user1.id,
      email: user1.email,
      scopes: [USER_PERMISSIONS.USER_READ_SELF, USER_PERMISSIONS.USER_READ],
      roles: [USER],
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(privKey);

    // Create a JWT for an admin user
    admin1Token = await new jose.SignJWT({
      userId: "admin-user-id",
      email: "admin@example.com",
      roles: [ADMIN],
      scopes: [
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
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(privKey);
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
    if (dbContainer) {
      await dbContainer.stop();
    }
    if (server && typeof server.close === "function") {
      server.close();
    }
  });

  it("should have public user in the prisma db", async () => {
    const user = await prisma.user.findUnique({
      where: { id: "public-user-id" },
    });
    expect(user).not.toBeNull();
    expect(user?.email).toBe("public@example.com");
  });

  it("should have admin user in the prisma db", async () => {
    const user = await prisma.user.findUnique({
      where: { id: "admin-user-id" },
    });
    expect(user).not.toBeNull();
    expect(user?.email).toBe("admin@example.com");
  });

  it("should get user1 /me (self-service endpoint)", async () => {
    const res = await request(server)
      .get(`/api/v1/users/me`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("public-user-id");
  });

  it("should get user1 (public endpoint)", async () => {
    const res = await request(server)
  .get(`/api/v1/users/public-user-id`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("public-user-id");
  });

  it("should allow admin1 to get user1 details", async () => {
    const res = await request(server)
  .get(`/api/v1/users/public-user-id`)
      .set("Authorization", `Bearer ${admin1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("public-user-id");
  });

  it("should allow admin1 to edit user1 details", async () => {
    const res = await request(server)
  .patch(`/api/v1/users/public-user-id`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        email: "try to edit email",
        display_name: "Updated Public User",
      });
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("public-user-id");
  });

  it("should see that user1 details were updated", async () => {
    const user = await prisma.user.findUnique({
      where: { id: "public-user-id" },
    });
    expect(user).not.toBeNull();
    expect(user?.display_name).toBe("Updated Public User");
    expect(user?.email).toBe("public@example.com"); // email should not be changed
  });

  it("should allow admin to see that there are 2 users in total", async () => {
    const res = await request(server)
  .get(`/api/v1/admin/users`)
      .set("Authorization", `Bearer ${admin1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("should allow admin to delete user1", async () => {
    const res = await request(server)
  .delete(`/api/v1/users/public-user-id`)
      .set("Authorization", `Bearer ${admin1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted successfully");
  });

  it("should see that user1 is deleted", async () => {
    const user = await prisma.user.findUnique({
      where: { id: "public-user-id" },
    });
    expect(user).toBeNull();
  });

  it("should allow admin to edit himself via /me endpoint", async () => {
    const res = await request(server)
  .patch(`/api/v1/users/me`)
      .set("Authorization", `Bearer ${admin1Token}`)
      .send({
        display_name: "Updated Admin User",
      });
    expect(res.status).toBe(200);
    expect(res.body.display_name).toBe("Updated Admin User");
  });

  it("should show that admin user is updated", async () => {
    const user = await prisma.user.findUnique({
      where: { id: "admin-user-id" },
    });
    expect(user).not.toBeNull();
    expect(user?.display_name).toBe("Updated Admin User");
  });

  it("should allow admin to delete himself via /me endpoint", async () => {
    const res = await request(server)
  .delete(`/api/v1/users/me`)
      .set("Authorization", `Bearer ${admin1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("User deleted");
  });

  it("should see that admin user is deleted", async () => {
    const user = await prisma.user.findUnique({
      where: { id: "admin-user-id" },
    });
    expect(user).toBeNull();
  });
});

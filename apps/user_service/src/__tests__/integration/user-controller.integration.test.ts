import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import prisma from "../../prisma";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { execSync } from "child_process";
import { createServer } from "../../server";
import * as jose from "jose";
import { vi } from "vitest";

let dbContainer: StartedPostgreSqlContainer;
let server: any;

let user1Token: string;
let admin1Token: string;

let publicKey: jose.CryptoKey | undefined;

vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jose")>();
  return {
    ...actual,
    createRemoteJWKSet: vi.fn(() => async () => publicKey),
  };
});

describe("User Controller Integration (Testcontainers)", () => {
  beforeAll(async () => {
    dbContainer = await new PostgreSqlContainer("postgres:15-alpine").start();
    const databaseUrl = dbContainer.getConnectionUri();
    process.env.DATABASE_URL = databaseUrl;
    const { publicKey: pubKey, privateKey: privKey } =
      await jose.generateKeyPair("RS256");
    publicKey = pubKey;

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
      scopes: ["users:read:self", "users:read"],
      roles: ["user"],
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(privKey);

    // Create a JWT for an admin user
    admin1Token = await new jose.SignJWT({
      userId: "admin-user-id",
      email: "admin@example.com",
      roles: ["admin"],
      scopes: [
        // User-level permissions
        "users:read:self", // A user's own permissions, often implied
        "users:read", // Permission to read any user's data

        // Admin-level permissions for user management
        "admin:users:read",
        "admin:users:edit",
        "admin:users:delete",
        "admin:users:edit-roles",

        // Admin-level permissions for role management
        "admin:roles:create",
        "admin:roles:read",
        "admin:roles:edit-permissions",

        // Admin-level permissions for permission management
        "admin:permissions:create",
        "admin:permissions:read",
      ],
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-kid" })
      .setIssuedAt()
      .setExpirationTime("2h")
      .sign(privKey);

    server = createServer().listen(9010);
  }, 60000);

  afterAll(async () => {
    await prisma.$disconnect();
    await dbContainer.stop();
    server.close();
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
      .get(`/v1/users/me`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("public-user-id");
  });

  it("should get user1 (public endpoint)", async () => {
    const res = await request(server)
      .get(`/v1/users/public-user-id`)
      .set("Authorization", `Bearer ${user1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("public-user-id");
  });

  it("should allow admin1 to get user1 details", async () => {
    const res = await request(server)
      .get(`/v1/users/public-user-id`)
      .set("Authorization", `Bearer ${admin1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("public-user-id");
  });

  it("should allow admin1 to edit user1 details", async () => {
    const res = await request(server)
      .patch(`/v1/users/public-user-id`)
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
      .get(`/v1/admin/users`)
      .set("Authorization", `Bearer ${admin1Token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it("should allow admin to delete user1", async () => {
    const res = await request(server)
      .delete(`/v1/users/public-user-id`)
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
      .patch(`/v1/users/me`)
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
      .delete(`/v1/users/me`)
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

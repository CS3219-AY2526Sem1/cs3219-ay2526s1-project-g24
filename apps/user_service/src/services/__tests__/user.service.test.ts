import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  getUserById,
  updateUser,
  deleteUser,
  getAllUsers,
} from "../user.service";

vi.mock("@prisma/client", () => {
  const mPrismaClient = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe("User Service", () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
  });

  it("should get user by id", async () => {
    const user = { id: "1", username: "Test" };
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    const result = await getUserById("1");
    expect(result).toEqual(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: "1" },
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
  });

  it("should update user", async () => {
    const user = { id: "1", username: "Test" };
    vi.mocked(prisma.user.update).mockResolvedValue(user as any);
    const result = await updateUser("1", { username: "Test" });
    expect(result).toEqual(user);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: { username: "Test" },
    });
  });

  it("should delete user", async () => {
    const user = { id: "1", username: "Test" };
    vi.mocked(prisma.user.delete).mockResolvedValue(user as any);
    const result = await deleteUser("1");
    expect(result).toEqual(user);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "1" } });
  });

  it("should get all users", async () => {
    const users = [{ id: "1", username: "Test" }];
    vi.mocked(prisma.user.findMany).mockResolvedValue(users as any);
    const result = await getAllUsers();
    expect(result).toEqual(users);
    expect(prisma.user.findMany).toHaveBeenCalledWith({
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
  });
});

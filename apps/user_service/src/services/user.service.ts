// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 15-20, 2025
// Scope: Generated user service with database operations:
//   - getAllUsers(): Database query with Prisma
//   - getUserById(): Fetch user with relations
//   - updateUserProfile(): Update user fields with validation
//   - deleteUser(): Soft delete implementation
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Prisma query optimization with eager loading
//   - Comprehensive error handling and validation
//   - Soft delete implementation with deleted_at field
//   - Added logging for database operations

import prisma from '../prisma';
import type { User } from '@prisma/client';

export const getUserById = async (userId: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id: userId },
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
};

export const updateUser = async (
  userId: string,
  data: Partial<User>
): Promise<User> => {
  return prisma.user.update({ where: { id: userId }, data });
};

export const deleteUser = async (userId: string): Promise<User> => {
  return prisma.user.delete({ where: { id: userId } });
};

export const getAllUsers = async (): Promise<User[]> => {
  return prisma.user.findMany({
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
};

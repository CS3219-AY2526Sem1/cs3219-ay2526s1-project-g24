import prisma from '../prisma';
import type { User } from '@prisma/client';

export const getUserById = async (userId: string) => {
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
  return prisma.user.findMany();
};

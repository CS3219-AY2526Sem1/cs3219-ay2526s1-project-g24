import { PrismaClient } from '@prisma/client';
import type { User } from '@prisma/client';

const prisma = new PrismaClient();

export const getUserById = async (userId: string): Promise<User | null> => {
  return prisma.user.findUnique({ where: { id: userId } });
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

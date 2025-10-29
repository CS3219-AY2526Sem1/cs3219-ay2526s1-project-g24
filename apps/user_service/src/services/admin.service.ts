import prisma from '../prisma';

// Role Management
export const createRole = (name: string) => {
  return prisma.role.create({ data: { name } });
};

export const getAllRoles = () => {
  return prisma.role.findMany({ include: { permissions: { include: { permission: true } } } });
};

// Permission Management
export const createPermission = (name: string) => {
  return prisma.permission.create({ data: { name } });
};

export const getAllPermissions = () => {
  return prisma.permission.findMany();
};

// User-Role Management
export const assignRoleToUser = (userId: string, roleId: number) => {
  return prisma.userRole.create({
    data: {
      user_id: userId,
      role_id: roleId,
    },
  });
};

export const removeRoleFromUser = (userId: string, roleId: number) => {
  return prisma.userRole.delete({
    where: {
      user_id_role_id: {
        user_id: userId,
        role_id: roleId,
      },
    },
  });
};

// Role-Permission Management
export const grantPermissionToRole = (roleId: number, permissionId: number) => {
  return prisma.rolePermission.create({
    data: {
      role_id: roleId,
      permission_id: permissionId,
    },
  });
};

export const revokePermissionFromRole = (roleId: number, permissionId: number) => {
  return prisma.rolePermission.delete({
    where: {
      role_id_permission_id: {
        role_id: roleId,
        permission_id: permissionId,
      },
    },
  });
};

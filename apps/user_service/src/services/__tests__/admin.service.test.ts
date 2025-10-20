import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import {
  createRole,
  getAllRoles,
  createPermission,
  getAllPermissions,
  assignRoleToUser,
  removeRoleFromUser,
  grantPermissionToRole,
  revokePermissionFromRole,
} from '../admin.service';

vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    role: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    permission: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
      delete: vi.fn(),
    },
    rolePermission: {
      create: vi.fn(),
      delete: vi.fn(),
    },
  };
  return { PrismaClient: vi.fn(() => mPrismaClient) };
});

describe('Admin Service', () => {
  let prisma: PrismaClient;

  beforeEach(() => {
    prisma = new PrismaClient();
  });

  it('should create a role', async () => {
    const role = { id: 1, name: 'admin' };
    vi.mocked(prisma.role.create).mockResolvedValue(role as any);
    const result = await createRole('admin');
    expect(result).toEqual(role);
    expect(prisma.role.create).toHaveBeenCalledWith({ data: { name: 'admin' } });
  });

  it('should get all roles', async () => {
    const roles = [{ id: 1, name: 'admin' }];
    vi.mocked(prisma.role.findMany).mockResolvedValue(roles as any);
    const result = await getAllRoles();
    expect(result).toEqual(roles);
    expect(prisma.role.findMany).toHaveBeenCalledWith({ include: { permissions: { include: { permission: true } } } });
  });

  it('should create a permission', async () => {
    const permission = { id: 1, name: 'read' };
    vi.mocked(prisma.permission.create).mockResolvedValue(permission as any);
    const result = await createPermission('read');
    expect(result).toEqual(permission);
    expect(prisma.permission.create).toHaveBeenCalledWith({ data: { name: 'read' } });
  });

  it('should get all permissions', async () => {
    const permissions = [{ id: 1, name: 'read' }];
    vi.mocked(prisma.permission.findMany).mockResolvedValue(permissions as any);
    const result = await getAllPermissions();
    expect(result).toEqual(permissions);
    expect(prisma.permission.findMany).toHaveBeenCalledWith();
  });

  it('should assign a role to a user', async () => {
    const userRole = { id: 1, userId: '1', roleId: 1 };
    vi.mocked(prisma.userRole.create).mockResolvedValue(userRole as any);
    const result = await assignRoleToUser('1', 1);
    expect(result).toEqual(userRole);
    expect(prisma.userRole.create).toHaveBeenCalledWith({ data: { user_id: '1', role_id: 1 } });
  });

  it('should remove a role from a user', async () => {
    const userRole = { id: 1, userId: '1', roleId: 1 };
    vi.mocked(prisma.userRole.delete).mockResolvedValue(userRole as any);
    const result = await removeRoleFromUser('1', 1);
    expect(result).toEqual(userRole);
    expect(prisma.userRole.delete).toHaveBeenCalledWith({ where: { user_id_role_id: { user_id: '1', role_id: 1 } } });
  });

  it('should grant a permission to a role', async () => {
    const rolePermission = { id: 1, roleId: 1, permissionId: 1 };
    vi.mocked(prisma.rolePermission.create).mockResolvedValue(rolePermission as any);
    const result = await grantPermissionToRole(1, 1);
    expect(result).toEqual(rolePermission);
    expect(prisma.rolePermission.create).toHaveBeenCalledWith({ data: { role_id: 1, permission_id: 1 } });
  });

  it('should revoke a permission from a role', async () => {
    const rolePermission = { id: 1, roleId: 1, permissionId: 1 };
    vi.mocked(prisma.rolePermission.delete).mockResolvedValue(rolePermission as any);
    const result = await revokePermissionFromRole(1, 1);
    expect(result).toEqual(rolePermission);
    expect(prisma.rolePermission.delete).toHaveBeenCalledWith({ where: { role_id_permission_id: { role_id: 1, permission_id: 1 } } });
  });
});

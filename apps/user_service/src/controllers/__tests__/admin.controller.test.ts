import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdminController } from '../admin.controller';
import * as adminService from '../../services/admin.service';
import * as userService from '../../services/user.service';

vi.mock('../../services/admin.service');
vi.mock('../../services/user.service');

describe('AdminController', () => {
  let adminController: AdminController;

  beforeEach(() => {
    adminController = new AdminController();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

    describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = [{ id: '1', name: 'Test User' }];
      vi.spyOn(userService, 'getAllUsers').mockResolvedValue(users as any);
      const result = await adminController.getAllUsers();
      expect(result).toEqual(users);
    });
  });

  describe('createRole', () => {
    it('should create a new role', async () => {
      const role = { id: 1, name: 'new-role' };
      vi.spyOn(adminService, 'createRole').mockResolvedValue(role as any);
      const result = await adminController.createRole({ name: 'new-role' });
      expect(result).toEqual(role);
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', async () => {
      const roles = [{ id: 1, name: 'admin' }, { id: 2, name: 'user' }];
      vi.spyOn(adminService, 'getAllRoles').mockResolvedValue(roles as any);
      const result = await adminController.getAllRoles();
      expect(result).toEqual(roles);
    });
  });

  describe('createPermission', () => {
    it('should create a new permission', async () => {
      const permission = { id: 1, name: 'new-permission' };
      vi.spyOn(adminService, 'createPermission').mockResolvedValue(permission as any);
      const result = await adminController.createPermission({ name: 'new-permission' });
      expect(result).toEqual(permission);
    });
  });

  describe('getAllPermissions', () => {
    it('should return all permissions', async () => {
      const permissions = [{ id: 1, name: 'read' }, { id: 2, name: 'write' }];
      vi.spyOn(adminService, 'getAllPermissions').mockResolvedValue(permissions as any);
      const result = await adminController.getAllPermissions();
      expect(result).toEqual(permissions);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      const userRole = { userId: '1', roleId: 1 };
      vi.spyOn(adminService, 'assignRoleToUser').mockResolvedValue(userRole as any);
      const result = await adminController.assignRoleToUser('1', { roleId: 1 });
      expect(result).toEqual(userRole);
    });
  });

  describe('removeRoleFromUser', () => {
    it('should remove a role from a user', async () => {
      const userRole = { userId: '1', roleId: 1 };
      vi.spyOn(adminService, 'removeRoleFromUser').mockResolvedValue(userRole as any);
      const result = await adminController.removeRoleFromUser('1', 1);
      expect(result).toEqual(userRole);
    });
  });

  describe('grantPermissionToRole', () => {
    it('should grant a permission to a role', async () => {
      const rolePermission = { roleId: 1, permissionId: 1 };
      vi.spyOn(adminService, 'grantPermissionToRole').mockResolvedValue(rolePermission as any);
      const result = await adminController.grantPermissionToRole(1, { permissionId: 1 });
      expect(result).toEqual(rolePermission);
    });
  });

  describe('revokePermissionFromRole', () => {
    it('should revoke a permission from a role', async () => {
      const rolePermission = { roleId: 1, permissionId: 1 };
      vi.spyOn(adminService, 'revokePermissionFromRole').mockResolvedValue(rolePermission as any);
      const result = await adminController.revokePermissionFromRole(1, 1);
      expect(result).toEqual(rolePermission);
    });
  });
});
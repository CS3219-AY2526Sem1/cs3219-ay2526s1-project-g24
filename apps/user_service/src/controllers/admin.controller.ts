// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: September 20-25, 2025
// Scope: Generated admin controller for Role-Based Access Control (RBAC):
//   - createRole(): Create new user roles
//   - getAllRoles(): List all available roles
//   - createPermission(): Define new permissions
//   - getAllPermissions(): List all permissions
//   - assignRoleToUser(): Grant roles to users
//   - revokeRoleFromUser(): Remove user roles
//   - assignPermissionToRole(): Add permissions to roles
//   - revokePermissionFromRole(): Remove permissions from roles
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced authorization checks
//   - Comprehensive error handling for RBAC operations
//   - Integrated with admin service layer

import {
  Controller,
  Get,
  Post,
  Delete,
  Route,
  Tags,
  Security,
  Body,
  Path,
} from "tsoa";
import {
  createRole,
  getAllRoles,
  createPermission,
  getAllPermissions,
  assignRoleToUser,
  removeRoleFromUser,
  grantPermissionToRole,
  revokePermissionFromRole,
} from "../services/admin.service";
import { getAllUsers } from "../services/user.service";
import { ADMIN_PERMISSIONS } from "../utils/constants";

/**
 * @author Ryam - Added Security Decorators to AdminController methods.
 * We can only use String literals in the Security decorator due to tsoa limitations. Means we cannot use ADMIN_PERMISSIONS.ADMIN_USERS_READ directly, but have to use the string "admin:users:read" instead.
 */
@Route("admin")
@Tags("Admin")
@Security("jwt")
export class AdminController extends Controller {
  // User Management
  @Get("users")
  // ADMIN_PERMISSIONS.ADMIN_USERS_READ
  @Security("jwt", ["admin:users:read"])
  public async getAllUsers() {
    return getAllUsers();
  }

  // Role Management
  @Post("roles")
  // ADMIN_PERMISSIONS.ADMIN_ROLES_CREATE
  @Security("jwt", ["admin:roles:create"])
  public async createRole(@Body() body: { name: string }) {
    return createRole(body.name);
  }

  @Get("roles")
  // ADMIN_PERMISSIONS.ADMIN_ROLES_READ
  @Security("jwt", ["admin:roles:read"])
  public async getAllRoles() {
    return getAllRoles();
  }

  // Permission Management
  @Post("permissions")
  // ADMIN_PERMISSIONS.ADMIN_PERMISSIONS_CREATE
  @Security("jwt", ["admin:permissions:create"])
  public async createPermission(@Body() body: { name: string }) {
    return createPermission(body.name);
  }

  @Get("permissions")
  // ADMIN_PERMISSIONS.ADMIN_PERMISSIONS_READ
  @Security("jwt", ["admin:permissions:read"])
  public async getAllPermissions() {
    return getAllPermissions();
  }

  // User-Role Management
  @Post("users/{userId}/roles")
  // ADMIN_PERMISSIONS.ADMIN_USERS_EDIT
  @Security("jwt", ["admin:users:edit"])
  public async assignRoleToUser(
    @Path() userId: string,
    @Body() body: { roleId: number }
  ) {
    return assignRoleToUser(userId, body.roleId);
  }

  @Delete("users/{userId}/roles/{roleId}")
  // ADMIN_PERMISSIONS.ADMIN_USERS_EDIT
  @Security("jwt", ["admin:users:edit"])
  public async removeRoleFromUser(
    @Path() userId: string,
    @Path() roleId: number
  ) {
    return removeRoleFromUser(userId, roleId);
  }

  // Role-Permission Management
  @Post("roles/{roleId}/permissions")
  // ADMIN_PERMISSIONS.ADMIN_ROLES_EDIT
  @Security("jwt", ["admin:roles:edit"])
  public async grantPermissionToRole(
    @Path() roleId: number,
    @Body() body: { permissionId: number }
  ) {
    return grantPermissionToRole(roleId, body.permissionId);
  }

  @Delete("roles/{roleId}/permissions/{permissionId}")
  // ADMIN_PERMISSIONS.ADMIN_ROLES_EDIT
  @Security("jwt", ["admin:roles:edit"])
  public async revokePermissionFromRole(
    @Path() roleId: number,
    @Path() permissionId: number
  ) {
    return revokePermissionFromRole(roleId, permissionId);
  }
}

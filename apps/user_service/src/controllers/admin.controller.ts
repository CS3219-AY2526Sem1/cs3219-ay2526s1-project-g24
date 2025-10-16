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

@Route("v1/admin")
@Tags("Admin")
@Security("jwt")
export class AdminController extends Controller {
  // User Management
  @Get("users")
  @Security("jwt", ["admin:users:read"])
  public async getAllUsers() {
    return getAllUsers();
  }

  // Role Management
  @Post("roles")
  @Security("jwt", ["admin:roles:create"])
  public async createRole(@Body() body: { name: string }) {
    return createRole(body.name);
  }

  @Get("roles")
  @Security("jwt", ["admin:roles:read"])
  public async getAllRoles() {
    return getAllRoles();
  }

  // Permission Management
  @Post("permissions")
  @Security("jwt", ["admin:permissions:create"])
  public async createPermission(@Body() body: { name: string }) {
    return createPermission(body.name);
  }

  @Get("permissions")
  @Security("jwt", ["admin:permissions:read"])
  public async getAllPermissions() {
    return getAllPermissions();
  }

  // User-Role Management
  @Post("users/{userId}/roles")
  @Security("jwt", ["admin:users:edit-roles"])
  public async assignRoleToUser(
    @Path() userId: string,
    @Body() body: { roleId: number }
  ) {
    return assignRoleToUser(userId, body.roleId);
  }

  @Delete("users/{userId}/roles/{roleId}")
  @Security("jwt", ["admin:users:edit-roles"])
  public async removeRoleFromUser(
    @Path() userId: string,
    @Path() roleId: number
  ) {
    return removeRoleFromUser(userId, roleId);
  }

  // Role-Permission Management
  @Post("roles/{roleId}/permissions")
  @Security("jwt", ["admin:roles:edit-permissions"])
  public async grantPermissionToRole(
    @Path() roleId: number,
    @Body() body: { permissionId: number }
  ) {
    return grantPermissionToRole(roleId, body.permissionId);
  }

  @Delete("roles/{roleId}/permissions/{permissionId}")
  @Security("jwt", ["admin:roles:edit-permissions"])
  public async revokePermissionFromRole(
    @Path() roleId: number,
    @Path() permissionId: number
  ) {
    return revokePermissionFromRole(roleId, permissionId);
  }
}

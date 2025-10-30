export const ADMIN = "admin";
export const USER = "user";

// All Permissions

// User-level permissions
const USER_READ_SELF = "users:read:self";
const USER_READ = "users:read";
export const USER_PERMISSIONS = {
  USER_READ_SELF,
  USER_READ,
};

// Admin-level permissions for user/role/permissions management
const ADMIN_USERS_READ = "admin:users:read";
const ADMIN_USERS_EDIT = "admin:users:edit";
const ADMIN_USERS_DELETE = "admin:users:delete";
const ADMIN_ROLES_READ = "admin:roles:read";
const ADMIN_ROLES_CREATE = "admin:roles:create";
const ADMIN_ROLES_EDIT = "admin:roles:edit";
const ADMIN_ROLES_DELETE = "admin:roles:delete";
const ADMIN_PERMISSIONS_READ = "admin:permissions:read";
const ADMIN_PERMISSIONS_CREATE = "admin:permissions:create";
const ADMIN_PERMISSIONS_EDIT = "admin:permissions:edit";
const ADMIN_PERMISSIONS_DELETE = "admin:permissions:delete";
export const ADMIN_PERMISSIONS = {
  ADMIN_USERS_READ,
  ADMIN_USERS_EDIT,
  ADMIN_USERS_DELETE,
  ADMIN_ROLES_READ,
  ADMIN_ROLES_CREATE,
  ADMIN_ROLES_EDIT,
  ADMIN_ROLES_DELETE,
  ADMIN_PERMISSIONS_READ,
  ADMIN_PERMISSIONS_CREATE,
  ADMIN_PERMISSIONS_EDIT,
  ADMIN_PERMISSIONS_DELETE,
};
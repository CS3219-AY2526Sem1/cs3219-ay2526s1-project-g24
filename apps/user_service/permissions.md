# Role-Based Access Control (RBAC) Permissions

This document outlines the roles and permissions used within the User Service. The system is designed to be flexible, allowing for fine-grained control over user access.

---

## Roles

There are two primary roles configured by default:

- **`admin`**: This role is intended for system administrators and developers. It grants full access to all administrative functions, including user management, role and permission configuration, and system-wide settings.
- **`user`**: This is the default role assigned to all new users upon sign-up. It grants basic permissions necessary for a standard user to interact with the application, such as managing their own profile.

---

## Permissions Table

The following table details the permissions assigned to each default role.

| Permission Scope | Description | `user` Role | `admin` Role |
| :--- | :--- | :---: | :---: |
| **User Self-Service** | | | |
| `users:read:self` | Allows a user to read their own profile data. | ✅ | ✅ |
| **User Administration** | | | |
| `users:read` | Allows reading the profile data of **any** user. | ✅ | ✅ |
| `admin:users:read` | Allows listing all users in the system. | ❌ | ✅ |
| `admin:users:edit` | Allows updating the profile data of **any** user. | ❌ | ✅ |
| `admin:users:delete` | Allows deleting **any** user from the system. | ❌ | ✅ |
| `admin:users:edit-roles` | Allows assigning or revoking roles for **any** user. | ❌ | ✅ |
| **Role Administration** | | | |
| `admin:roles:read` | Allows listing all available roles and their permissions. | ❌ | ✅ |
| `admin:roles:create` | Allows creating a new role. | ❌ | ✅ |
| `admin:roles:edit-permissions` | Allows granting or revoking permissions for a role. | ❌ | ✅ |
| **Permission Administration** | | | |
| `admin:permissions:read` | Allows listing all available permissions in the system. | ❌ | ✅ |
| `admin:permissions:create` | Allows creating a new permission. | ❌ | ✅ |

---

This structure ensures that standard users have the necessary access to use the application without being exposed to sensitive administrative capabilities, while administrators have the comprehensive control needed to manage the system.

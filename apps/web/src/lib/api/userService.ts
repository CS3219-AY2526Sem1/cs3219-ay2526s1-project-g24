import { API_CONFIG } from "../apiConfig";
import { Session, User, Role, Permission } from "@/lib/types";

const API_URL = `${API_CONFIG.USER_SERVICE}/api/v1`;
const AUTH_API_BASE = "/api/auth";

const normalizePermission = (permission: any): Permission => ({
    id: Number(permission.id),
    name: permission.name,
    description: permission.description,
    created_at: permission.created_at,
    updated_at: permission.updated_at,
});

const normalizeRole = (role: any): Role => ({
    id: Number(role.id),
    name: role.name,
    permissions: Array.isArray(role.permissions)
        ? role.permissions
            .map((entry: any) => {
                const rawPermission = entry?.permission ?? entry;
                if (!rawPermission) {
                    return null;
                }
                return normalizePermission(rawPermission);
            })
            .filter((permission: any): permission is Permission => Boolean(permission))
        : [],
    created_at: role.created_at,
    updated_at: role.updated_at,
});

const normalizeUser = (user: any): User => {
    const roles = Array.isArray(user.roles)
        ? user.roles
            .map((assignment: any) => {
                const rawRole = assignment?.role ?? assignment;
                if (!rawRole) {
                    return null;
                }
                return normalizeRole(rawRole);
            })
            .filter((role: any): role is Role => Boolean(role))
        : [];

    return {
        ...user,
        roles,
    } as User;
};

// Auth Service

export const getGoogleSignInUrl = async (): Promise<string> => {
    const response = await fetch(`${AUTH_API_BASE}/google/url`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to get Google Sign-In URL");
    }
    const { url } = await response.json();
    return url;
};

export const logoutUser = async (): Promise<void> => {
    await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
};

export const getSession = async (): Promise<Session | null> => {
    const response = await fetch(`${API_URL}/auth/session`, {
        // Include credentials to send cookies
        credentials: "include",
    });
    if (!response.ok) {
        return null;
    }
    const res = await response.json();
    return { user: normalizeUser(res.user) };
};

// User Service

export const getUser = async (): Promise<User> => {
    const response = await fetch(`${API_URL}/users/me`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }
    const user = await response.json();
    return normalizeUser(user);
};

export const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_URL}/admin/users`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch users");
    }
    const users = await response.json();
    return users.map((user: any) => normalizeUser(user));
};

export const getRoles = async (): Promise<Role[]> => {
    const response = await fetch(`${API_URL}/admin/roles`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch roles");
    }
    const roles = await response.json();
    return roles.map((role: any) => normalizeRole(role));
};

export const createRole = async (name: string): Promise<Role> => {
    const response = await fetch(`${API_URL}/admin/roles`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        throw new Error("Failed to create role");
    }
    const role = await response.json();
    return normalizeRole(role);
};

export const getPermissions = async (): Promise<Permission[]> => {
    const response = await fetch(`${API_URL}/admin/permissions`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch permissions");
    }
    const permissions = await response.json();
    return permissions.map((permission: any) => normalizePermission(permission));
};

export const createPermission = async (name: string): Promise<Permission> => {
    const response = await fetch(`${API_URL}/admin/permissions`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
    });
    if (!response.ok) {
        throw new Error("Failed to create permission");
    }
    const permission = await response.json();
    return normalizePermission(permission);
};

export const grantPermissionToRole = async (
    roleId: number,
    permissionId: number
): Promise<void> => {
    const response = await fetch(
        `${API_URL}/admin/roles/${roleId}/permissions`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ permissionId }),
        }
    );
    if (!response.ok) {
        throw new Error("Failed to grant permission to role");
    }
};

export const revokePermissionFromRole = async (
    roleId: number,
    permissionId: number
): Promise<void> => {
    const response = await fetch(
        `${API_URL}/admin/roles/${roleId}/permissions/${permissionId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );
    if (!response.ok) {
        throw new Error("Failed to revoke permission from role");
    }
};

export const updateUser = async (user: Partial<User>): Promise<User> => {

    const cleanedData: Record<string, any> = {};
    if (user.username !== undefined) cleanedData.username = user.username;
    if (user.display_name !== undefined) cleanedData.display_name = user.display_name;
    if (user.description !== undefined) cleanedData.description = user.description;
    if (user.programming_proficiency !== undefined) cleanedData.programming_proficiency = user.programming_proficiency;
    if (user.preferred_language !== undefined) cleanedData.preferred_language = user.preferred_language;

    const response = await fetch(`${API_URL}/users/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
    });
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error("Failed to update user: " + errorText);
    }
    return response.json();
};

export const assignRoleToUser = async (
    userId: string,
    roleId: number
): Promise<void> => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/roles`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ roleId }),
    });
    if (!response.ok) {
        throw new Error("Failed to assign role to user");
    }
};

export const removeRoleFromUser = async (
    userId: string,
    roleId: number
): Promise<void> => {
    const response = await fetch(
        `${API_URL}/admin/users/${userId}/roles/${roleId}`,
        {
            method: "DELETE",
            credentials: "include",
        }
    );
    if (!response.ok) {
        throw new Error("Failed to remove role from user");
    }
};

export const deleteUser = async (userId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to delete user");
    }
};

export const getUserById = async (userId: string): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        credentials: "include",
    });
    if (!response.ok) {
        throw new Error("Failed to fetch user");
    }
    const user = await response.json();
    return normalizeUser(user);
};

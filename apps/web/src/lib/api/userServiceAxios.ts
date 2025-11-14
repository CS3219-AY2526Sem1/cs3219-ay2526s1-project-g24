// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated User Service Axios API client:
//   - User authentication functions (Google OAuth, logout, session)
//   - User CRUD operations (get, update, delete)
//   - Admin user management (list, update, delete)
//   - Role and permission normalization
//   - Integration with Axios client with auth interceptors
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced data normalization for roles and permissions
//   - Added comprehensive error handling
//   - Optimized API response parsing

import { API_CONFIG, createServiceUrlBuilder } from "@/lib/api-utils";
import { Session, User, Role, Permission } from "@/lib/types";
import { apiClient } from "./axiosClient";

const serviceUrl = createServiceUrlBuilder(API_CONFIG.USER_SERVICE, "/api/v1");

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
    const response = await apiClient.get(serviceUrl(`/auth/google/url`), {
        withCredentials: true,
    });
    return response.data.url;
};

export const logoutUser = async (): Promise<void> => {
    await apiClient.post(serviceUrl(`/auth/logout`), {}, {
        withCredentials: true,
    });
};

export const getSession = async (): Promise<Session | null> => {
    try {
        const response = await apiClient.get(serviceUrl(`/auth/session`), {
            withCredentials: true,
        });
        return { user: normalizeUser(response.data.user) };
    } catch (error) {
        return null;
    }
};

// User Service

export const getUser = async (): Promise<User> => {
    const response = await apiClient.get(serviceUrl(`/users/me`), {
        withCredentials: true,
    });
    return normalizeUser(response.data);
};

export const getUsers = async (): Promise<User[]> => {
    const response = await apiClient.get(serviceUrl(`/admin/users`), {
        withCredentials: true,
    });
    return response.data.map((user: any) => normalizeUser(user));
};

export const getRoles = async (): Promise<Role[]> => {
    const response = await apiClient.get(serviceUrl(`/admin/roles`), {
        withCredentials: true,
    });
    return response.data.map((role: any) => normalizeRole(role));
};

export const createRole = async (name: string): Promise<Role> => {
    const response = await apiClient.post(
        serviceUrl(`/admin/roles`),
        { name },
        { withCredentials: true }
    );
    return normalizeRole(response.data);
};

export const getPermissions = async (): Promise<Permission[]> => {
    const response = await apiClient.get(serviceUrl(`/admin/permissions`), {
        withCredentials: true,
    });
    return response.data.map((permission: any) => normalizePermission(permission));
};

export const createPermission = async (name: string): Promise<Permission> => {
    const response = await apiClient.post(
        serviceUrl(`/admin/permissions`),
        { name },
        { withCredentials: true }
    );
    return normalizePermission(response.data);
};

export const grantPermissionToRole = async (
    roleId: number,
    permissionId: number
): Promise<void> => {
    await apiClient.post(
        serviceUrl(`/admin/roles/${roleId}/permissions`),
        { permissionId },
        { withCredentials: true }
    );
};

export const revokePermissionFromRole = async (
    roleId: number,
    permissionId: number
): Promise<void> => {
    await apiClient.delete(
        serviceUrl(`/admin/roles/${roleId}/permissions/${permissionId}`),
        { withCredentials: true }
    );
};

export const updateUser = async (user: Partial<User>): Promise<User> => {
    const cleanedData: Record<string, any> = {};
    if (user.username !== undefined) cleanedData.username = user.username;
    if (user.display_name !== undefined) cleanedData.display_name = user.display_name;
    if (user.description !== undefined) cleanedData.description = user.description;
    if (user.programming_proficiency !== undefined) cleanedData.programming_proficiency = user.programming_proficiency;
    if (user.preferred_language !== undefined) cleanedData.preferred_language = user.preferred_language;

    const response = await apiClient.patch(
        serviceUrl(`/users/me`),
        cleanedData,
        { withCredentials: true }
    );
    return response.data;
};

export const assignRoleToUser = async (
    userId: string,
    roleId: number
): Promise<void> => {
    await apiClient.post(
        serviceUrl(`/admin/users/${userId}/roles`),
        { roleId },
        { withCredentials: true }
    );
};

export const removeRoleFromUser = async (
    userId: string,
    roleId: number
): Promise<void> => {
    await apiClient.delete(
        serviceUrl(`/admin/users/${userId}/roles/${roleId}`),
        { withCredentials: true }
    );
};

export const deleteUser = async (userId: string): Promise<void> => {
    await apiClient.delete(
        serviceUrl(`/users/${userId}`),
        { withCredentials: true }
    );
};

export const getUserById = async (userId: string): Promise<User> => {
    const response = await apiClient.get(
        serviceUrl(`/users/${userId}`),
        { withCredentials: true }
    );
    return normalizeUser(response.data);
};

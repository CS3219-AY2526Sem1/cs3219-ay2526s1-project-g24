// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated admin user management page:
//   - User listing with search and filtering
//   - User deletion with confirmation modal
//   - Role assignment/removal for users
//   - Role creation and management
//   - Permission creation and management
//   - Permission grant/revoke for roles
//   - Responsive table layout with loading states
//   - Real-time updates after mutations
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced RBAC UI with better visual feedback
//   - Added comprehensive error handling

"use client";

import Link from "next/link";
import {
    useState,
    useEffect,
    useCallback,
    useMemo,
    FormEvent,
} from "react";
import {
    getUsers,
    deleteUser,
    assignRoleToUser,
    removeRoleFromUser,
    getRoles,
    createRole,
    getPermissions,
    createPermission,
    grantPermissionToRole,
    revokePermissionFromRole,
} from "@/lib/api/userService";

import { withAdminAuth } from "@/components/withAuth";
import { User, Role, Permission } from "@/lib/types";

function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [newRoleName, setNewRoleName] = useState("");
    const [newPermissionName, setNewPermissionName] = useState("");
    const [userRoleSelections, setUserRoleSelections] = useState<Record<string, number | "">>({});
    const [rolePermissionSelections, setRolePermissionSelections] = useState<Record<number, number | "">>({});
    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [isRolesLoading, setIsRolesLoading] = useState(false);
    const [isPermissionsLoading, setIsPermissionsLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        setIsUsersLoading(true);
        try {
            const usersData = await getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsUsersLoading(false);
        }
    }, []);

    const fetchRoles = useCallback(async () => {
        setIsRolesLoading(true);
        try {
            const rolesData = await getRoles();
            setRoles(rolesData);
        } catch (error) {
            console.error("Failed to fetch roles", error);
        } finally {
            setIsRolesLoading(false);
        }
    }, []);

    const fetchPermissions = useCallback(async () => {
        setIsPermissionsLoading(true);
        try {
            const permissionsData = await getPermissions();
            setPermissions(permissionsData);
        } catch (error) {
            console.error("Failed to fetch permissions", error);
        } finally {
            setIsPermissionsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        fetchPermissions();
    }, [fetchUsers, fetchRoles, fetchPermissions]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return users;
        }
        return users.filter((user) => {
            const displayName = user.display_name?.toLowerCase() ?? "";
            const email = user.email?.toLowerCase() ?? "";
            return displayName.includes(query) || email.includes(query);
        });
    }, [users, search]);

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUser(userId);
            setUsers((prev) => prev.filter((user) => user.id !== userId));
        } catch (error) {
            console.error("Failed to delete user", error);
        }
    };

    const handleAssignRoleToUser = async (userId: string) => {
        const selectedRoleId = userRoleSelections[userId];
        if (!selectedRoleId) {
            return;
        }
        try {
            await assignRoleToUser(userId, Number(selectedRoleId));
            setUserRoleSelections((prev) => ({ ...prev, [userId]: "" }));
            await fetchUsers();
        } catch (error) {
            console.error("Failed to assign role to user", error);
        }
    };

    const handleRemoveRoleFromUser = async (userId: string, roleId: number) => {
        try {
            await removeRoleFromUser(userId, roleId);
            await fetchUsers();
        } catch (error) {
            console.error("Failed to remove role from user", error);
        }
    };

    const handleCreateRole = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = newRoleName.trim();
        if (!trimmedName) {
            return;
        }
        try {
            await createRole(trimmedName);
            setNewRoleName("");
            await fetchRoles();
        } catch (error) {
            console.error("Failed to create role", error);
        }
    };

    const handleCreatePermission = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedName = newPermissionName.trim();
        if (!trimmedName) {
            return;
        }
        try {
            await createPermission(trimmedName);
            setNewPermissionName("");
            await fetchPermissions();
        } catch (error) {
            console.error("Failed to create permission", error);
        }
    };

    const handleGrantPermissionToRole = async (roleId: number) => {
        const selectedPermissionId = rolePermissionSelections[roleId];
        if (!selectedPermissionId) {
            return;
        }
        try {
            await grantPermissionToRole(roleId, Number(selectedPermissionId));
            setRolePermissionSelections((prev) => ({ ...prev, [roleId]: "" }));
            await fetchRoles();
        } catch (error) {
            console.error("Failed to grant permission to role", error);
        }
    };

    const handleRevokePermissionFromRole = async (roleId: number, permissionId: number) => {
        try {
            await revokePermissionFromRole(roleId, permissionId);
            await fetchRoles();
        } catch (error) {
            console.error("Failed to revoke permission from role", error);
        }
    };

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-dashed border-gray-300">
                <div className="flex justify-between items-center px-6 md:px-12 py-9 max-w-[68rem] mx-auto">
                    <div>
                        <Link href="/admin">
                            <h1 className="font-mclaren text-black text-2xl md:text-3xl cursor-pointer hover:opacity-70 transition-opacity">
                                PeerPrep Admin
                            </h1>
                        </Link>
                    </div>
                    <nav className="flex gap-8">
                        <Link
                            href="/admin"
                            className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/questions"
                            className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors"
                        >
                            Questions
                        </Link>
                        <Link
                            href="/admin/users"
                            className="font-montserrat font-medium text-sm text-black"
                        >
                            Users
                        </Link>
                        <Link
                            href="/home"
                            className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors"
                        >
                            Exit Admin
                        </Link>
                    </nav>
                </div>
            </header>

            <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h1 className="font-montserrat text-5xl font-semibold text-black mb-4">
                            Manage Users
                        </h1>
                        <p className="font-montserrat text-xl text-gray-500">
                            View and manage user accounts
                        </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors"
                        />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                        {isUsersLoading ? (
                            <div className="p-12 text-center">
                                <p className="font-montserrat text-gray-500 text-lg">Loading users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="font-montserrat text-gray-500 text-lg">No users found</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            User
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            Roles
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            Created At
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredUsers.map((user) => {
                                        const assignedRoles = user.roles ?? [];
                                        const availableRoles = roles.filter(
                                            (role) => !assignedRoles.some((assigned) => assigned.id === role.id)
                                        );

                                        return (
                                            <tr key={user.id} className="hover:bg-gray-200/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-montserrat text-black text-sm font-medium">
                                                            {user.display_name}
                                                        </p>
                                                        <p className="font-montserrat text-gray-500 text-xs">
                                                            {user.email}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-2">
                                                        {assignedRoles.length === 0 ? (
                                                            <span className="font-montserrat text-gray-500 text-xs">
                                                                No roles assigned
                                                            </span>
                                                        ) : (
                                                            assignedRoles.map((role) => (
                                                                <span
                                                                    key={role.id}
                                                                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-black font-montserrat text-xs"
                                                                >
                                                                    {role.name}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveRoleFromUser(user.id, role.id)}
                                                                        className="text-gray-500 hover:text-black transition-colors"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </span>
                                                            ))
                                                        )}
                                                    </div>
                                                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
                                                        <select
                                                            value={userRoleSelections[user.id] ?? ""}
                                                            onChange={(e) =>
                                                                setUserRoleSelections((prev) => ({
                                                                    ...prev,
                                                                    [user.id]: e.target.value === "" ? "" : Number(e.target.value),
                                                                }))
                                                            }
                                                            className="bg-white border border-gray-300 rounded-full px-4 py-2 font-montserrat text-xs text-black focus:outline-none focus:border-[#DCC8FE] transition-colors"
                                                        >
                                                            <option value="">Select role</option>
                                                            {availableRoles.map((role) => (
                                                                <option key={role.id} value={role.id}>
                                                                    {role.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAssignRoleToUser(user.id)}
                                                            disabled={
                                                                !userRoleSelections[user.id] || availableRoles.length === 0
                                                            }
                                                            className={`px-4 py-2 rounded-full font-montserrat text-xs font-medium transition-colors ${
                                                                !userRoleSelections[user.id] || availableRoles.length === 0
                                                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                                    : "bg-black text-white hover:bg-gray-800"
                                                            }`}
                                                        >
                                                            Assign Role
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-montserrat text-gray-500 text-xs">
                                                        {user.created_at
                                                            ? new Date(user.created_at).toLocaleDateString()
                                                            : "N/A"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setSelectedUser(user)}
                                                            className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-montserrat text-xs rounded-full transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="mt-16">
                        <div className="mb-8">
                            <h2 className="font-montserrat text-4xl font-semibold text-black mb-4">
                                Manage Roles
                            </h2>
                            <p className="font-montserrat text-lg text-gray-500">
                                Create roles and map permissions to control access.
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="font-montserrat text-black text-lg font-semibold">Roles</h3>
                                    <p className="font-montserrat text-sm text-gray-500">
                                        Assign permissions to each role to define capabilities.
                                    </p>
                                </div>
                                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleCreateRole}>
                                    <input
                                        type="text"
                                        value={newRoleName}
                                        onChange={(e) => setNewRoleName(e.target.value)}
                                        placeholder="New role name"
                                        className="bg-white border border-gray-300 rounded-full px-4 py-2 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-full font-montserrat text-sm font-medium transition-colors"
                                    >
                                        Create Role
                                    </button>
                                </form>
                            </div>

                            <div className="mt-6">
                                {isRolesLoading ? (
                                    <div className="p-8 text-center rounded-2xl bg-white/50 border border-dashed border-gray-200">
                                        <p className="font-montserrat text-gray-500 text-sm">Loading roles...</p>
                                    </div>
                                ) : roles.length === 0 ? (
                                    <div className="p-8 text-center rounded-2xl bg-white/50 border border-dashed border-gray-200">
                                        <p className="font-montserrat text-gray-500 text-sm">
                                            No roles have been created yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                                        Role
                                                    </th>
                                                    <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                                        Permissions
                                                    </th>
                                                    <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                                        Add Permission
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {roles.map((role) => {
                                                    const assignedPermissions = role.permissions ?? [];
                                                    const availablePermissions = permissions.filter(
                                                        (permission) =>
                                                            !assignedPermissions.some(
                                                                (assigned) => assigned.id === permission.id
                                                            )
                                                    );

                                                    return (
                                                        <tr key={role.id} className="bg-white">
                                                            <td className="px-6 py-4 align-top">
                                                                <p className="font-montserrat text-black text-sm font-medium">
                                                                    {role.name}
                                                                </p>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-wrap gap-2">
                                                                    {assignedPermissions.length === 0 ? (
                                                                        <span className="font-montserrat text-gray-500 text-xs">
                                                                            No permissions assigned
                                                                        </span>
                                                                    ) : (
                                                                        assignedPermissions.map((permission) => (
                                                                            <span
                                                                                key={permission.id}
                                                                                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200 text-black font-montserrat text-xs"
                                                                            >
                                                                                {permission.name}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        handleRevokePermissionFromRole(
                                                                                            role.id,
                                                                                            permission.id
                                                                                        )
                                                                                    }
                                                                                    className="text-gray-500 hover:text-black transition-colors"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            </span>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                                    <select
                                                                        value={rolePermissionSelections[role.id] ?? ""}
                                                                        onChange={(e) =>
                                                                            setRolePermissionSelections((prev) => ({
                                                                                ...prev,
                                                                                [role.id]:
                                                                                    e.target.value === ""
                                                                                        ? ""
                                                                                        : Number(e.target.value),
                                                                            }))
                                                                        }
                                                                        className="bg-white border border-gray-300 rounded-full px-4 py-2 font-montserrat text-xs text-black focus:outline-none focus:border-[#DCC8FE] transition-colors"
                                                                    >
                                                                        <option value="">Select permission</option>
                                                                        {availablePermissions.map((permission) => (
                                                                            <option key={permission.id} value={permission.id}>
                                                                                {permission.name}
                                                                            </option>
                                                                        ))}
                                                                    </select>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleGrantPermissionToRole(role.id)}
                                                                        disabled={
                                                                            !rolePermissionSelections[role.id] ||
                                                                            availablePermissions.length === 0
                                                                        }
                                                                        className={`px-4 py-2 rounded-full font-montserrat text-xs font-medium transition-colors ${
                                                                            !rolePermissionSelections[role.id] ||
                                                                            availablePermissions.length === 0
                                                                                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                                                                : "bg-black text-white hover:bg-gray-800"
                                                                        }`}
                                                                    >
                                                                        Grant
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-16">
                        <div className="mb-8">
                            <h2 className="font-montserrat text-4xl font-semibold text-black mb-4">
                                Manage Permissions
                            </h2>
                            <p className="font-montserrat text-lg text-gray-500">
                                Track the permissions available to assign to roles.
                            </p>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h3 className="font-montserrat text-black text-lg font-semibold">Permissions</h3>
                                    <p className="font-montserrat text-sm text-gray-500">
                                        Create permissions to represent discrete capabilities.
                                    </p>
                                </div>
                                <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleCreatePermission}>
                                    <input
                                        type="text"
                                        value={newPermissionName}
                                        onChange={(e) => setNewPermissionName(e.target.value)}
                                        placeholder="New permission name"
                                        className="bg-white border border-gray-300 rounded-full px-4 py-2 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors"
                                    />
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-black text-white hover:bg-gray-800 rounded-full font-montserrat text-sm font-medium transition-colors"
                                    >
                                        Create Permission
                                    </button>
                                </form>
                            </div>

                            <div className="mt-6">
                                {isPermissionsLoading ? (
                                    <div className="p-8 text-center rounded-2xl bg-white/50 border border-dashed border-gray-200">
                                        <p className="font-montserrat text-gray-500 text-sm">Loading permissions...</p>
                                    </div>
                                ) : permissions.length === 0 ? (
                                    <div className="p-8 text-center rounded-2xl bg-white/50 border border-dashed border-gray-200">
                                        <p className="font-montserrat text-gray-500 text-sm">
                                            No permissions have been created yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                                        Permission
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {permissions.map((permission) => (
                                                    <tr key={permission.id} className="bg-white">
                                                        <td className="px-6 py-4">
                                                            <p className="font-montserrat text-black text-sm font-medium">
                                                                {permission.name}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-md w-full mx-4">
                        <h3 className="font-montserrat text-black text-xl font-semibold mb-4">
                            Confirm Delete
                        </h3>
                        <p className="font-montserrat text-gray-500 mb-6">
                            Are you sure you want to delete user{" "}
                            <span className="text-black font-medium">{selectedUser.display_name}</span>? This action
                            cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-sm rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleDeleteUser(selectedUser.id);
                                    setSelectedUser(null);
                                }}
                                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-black font-montserrat font-medium text-sm rounded-full transition-colors"
                            >
                                Delete User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAdminAuth(AdminUsers);

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getUsers, deleteUser } from "@/lib/api/userService";

import { withAdminAuth } from "@/components/withAuth";
import { User } from "@/lib/types";

function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const usersData = await getUsers();
                setUsers(usersData);
            } catch (error) {
                console.error("Failed to fetch users", error);
                // Handle error
            }
        };

        fetchUsers();
    }, []);

    // TODO: Role management needs to be updated to use the new RBAC system
    // with assignRoleToUser/removeRoleFromUser instead of simple role field
    const handleUpdateRole = async (userId: string, newRole: "user" | "admin") => {
        console.warn("Role management not yet implemented with new RBAC system");
        // try {
        //     const updatedUser = await updateUserRole(userId, newRole);
        //     setUsers(users.map(user => user.id === userId ? updatedUser : user));
        // } catch (error) {
        //     console.error("Failed to update user role", error);
        // }
    };

    const handleDeleteUser = async (userId: string) => {
        try {
            await deleteUser(userId);
            setUsers(users.filter(user => user.id !== userId));
        } catch (error) {
            console.error("Failed to delete user", error);
            // Handle error
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

                    {/* Search */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors"
                        />
                    </div>

                    {/* Users List */}
                    {users.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                            <p className="font-montserrat text-gray-500 text-lg">No users found</p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            User
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
                                    {users.map((user) => (
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
                                                <span className="font-montserrat text-gray-500 text-xs">
                                                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {/* TODO: Re-implement role management with RBAC system */}
                                                    <button
                                                        onClick={() => setSelectedUser(user)}
                                                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-montserrat text-xs rounded-full transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
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

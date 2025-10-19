"use client";

import Link from "next/link";
import { useState } from "react";

type User = {
    id: string;
    fullName: string;
    email: string;
    role: "USER" | "ADMIN";
    createdAt: string;
    lastLogin: string;
    totalSessions: number;
    totalSubmissions: number;
};

// Mock data
const MOCK_USERS: User[] = [
    {
        id: "1",
        fullName: "Alice Johnson",
        email: "alice@example.com",
        role: "ADMIN",
        createdAt: "2024-01-10",
        lastLogin: "2024-10-15",
        totalSessions: 45,
        totalSubmissions: 120
    },
    {
        id: "2",
        fullName: "Bob Smith",
        email: "bob.smith@example.com",
        role: "USER",
        createdAt: "2024-01-12",
        lastLogin: "2024-10-16",
        totalSessions: 32,
        totalSubmissions: 89
    },
    {
        id: "3",
        fullName: "Carol Williams",
        email: "carol.w@example.com",
        role: "USER",
        createdAt: "2024-01-15",
        lastLogin: "2024-10-14",
        totalSessions: 28,
        totalSubmissions: 67
    },
    {
        id: "4",
        fullName: "David Brown",
        email: "david.brown@example.com",
        role: "USER",
        createdAt: "2024-01-18",
        lastLogin: "2024-10-16",
        totalSessions: 41,
        totalSubmissions: 103
    },
    {
        id: "5",
        fullName: "Emma Davis",
        email: "emma.davis@example.com",
        role: "USER",
        createdAt: "2024-01-20",
        lastLogin: "2024-10-15",
        totalSessions: 19,
        totalSubmissions: 42
    },
    {
        id: "6",
        fullName: "Frank Miller",
        email: "frank.m@example.com",
        role: "USER",
        createdAt: "2024-01-22",
        lastLogin: "2024-10-13",
        totalSessions: 35,
        totalSubmissions: 78
    },
    {
        id: "7",
        fullName: "Grace Lee",
        email: "grace.lee@example.com",
        role: "USER",
        createdAt: "2024-01-25",
        lastLogin: "2024-10-16",
        totalSessions: 52,
        totalSubmissions: 145
    },
    {
        id: "8",
        fullName: "Henry Wilson",
        email: "henry.w@example.com",
        role: "ADMIN",
        createdAt: "2024-01-11",
        lastLogin: "2024-10-16",
        totalSessions: 61,
        totalSubmissions: 178
    }
];

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [search, setSearch] = useState("");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleUpdateRole = async (userId: string, newRole: "USER" | "ADMIN") => {
        // TODO: API call to update user role
        console.log(`Updating user ${userId} role to ${newRole}`);
    };

    const handleDeleteUser = async (userId: string) => {
        // TODO: API call to delete user
        console.log(`Deleting user ${userId}`);
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
                                            Role
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            Sessions
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            Submissions
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-500 text-sm font-medium">
                                            Last Login
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
                                                        {user.fullName}
                                                    </p>
                                                    <p className="font-montserrat text-gray-500 text-xs">
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-montserrat ${user.role === "ADMIN"
                                                        ? "bg-[#DCC8FE] text-black"
                                                        : "bg-gray-200 text-black"
                                                        }`}
                                                >
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-montserrat text-black text-sm">
                                                    {user.totalSessions}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-montserrat text-black text-sm">
                                                    {user.totalSubmissions}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-montserrat text-gray-500 text-xs">
                                                    {new Date(user.lastLogin).toLocaleDateString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() =>
                                                            handleUpdateRole(
                                                                user.id,
                                                                user.role === "ADMIN" ? "USER" : "ADMIN"
                                                            )
                                                        }
                                                        className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-xs rounded-full transition-colors"
                                                    >
                                                        {user.role === "ADMIN" ? "Demote" : "Promote"}
                                                    </button>
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
                            <span className="text-black font-medium">{selectedUser.fullName}</span>? This action
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

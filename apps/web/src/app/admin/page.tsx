"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 847,
        totalQuestions: 127,
        easyQuestions: 43,
        mediumQuestions: 56,
        hardQuestions: 28,
        activeSessions: 23,
    });

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-dashed border-gray-200">
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
                            className="font-montserrat font-medium text-sm text-black"
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
                            className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors"
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
                    <h1 className="font-montserrat text-5xl font-semibold text-black mb-4">
                        Admin Dashboard
                    </h1>
                    <p className="font-montserrat text-xl text-gray-500 mb-12">
                        Manage questions, test cases, and users
                    </p>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h3 className="font-montserrat text-gray-500 text-sm mb-2">Total Users</h3>
                            <p className="font-montserrat text-black text-4xl font-semibold">{stats.totalUsers}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h3 className="font-montserrat text-gray-500 text-sm mb-2">Total Questions</h3>
                            <p className="font-montserrat text-black text-4xl font-semibold">{stats.totalQuestions}</p>
                        </div>
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h3 className="font-montserrat text-gray-500 text-sm mb-2">Active Sessions</h3>
                            <p className="font-montserrat text-black text-4xl font-semibold">{stats.activeSessions}</p>
                        </div>
                    </div>

                    {/* Question Distribution */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-12">
                        <h2 className="font-montserrat text-black text-2xl font-semibold mb-6">Question Distribution</h2>
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                    <span className="font-montserrat text-black text-sm">Easy</span>
                                </div>
                                <p className="font-montserrat text-black text-3xl font-semibold ml-7">{stats.easyQuestions}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                                    <span className="font-montserrat text-black text-sm">Medium</span>
                                </div>
                                <p className="font-montserrat text-black text-3xl font-semibold ml-7">{stats.mediumQuestions}</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                                    <span className="font-montserrat text-black text-sm">Hard</span>
                                </div>
                                <p className="font-montserrat text-black text-3xl font-semibold ml-7">{stats.hardQuestions}</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Link href="/admin/questions/new" className="block">
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#DCC8FE] transition-all cursor-pointer">
                                <h3 className="font-montserrat text-black text-xl font-semibold mb-2">Create Question</h3>
                                <p className="font-montserrat text-gray-500 text-sm">Add a new coding question to the platform</p>
                            </div>
                        </Link>
                        <Link href="/admin/questions" className="block">
                            <div className="bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#DCC8FE] transition-all cursor-pointer">
                                <h3 className="font-montserrat text-black text-xl font-semibold mb-2">Manage Questions</h3>
                                <p className="font-montserrat text-gray-500 text-sm">View, edit, and delete existing questions</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}

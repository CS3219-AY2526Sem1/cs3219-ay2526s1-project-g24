"use client";

import React from "react";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300" />
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300" />
            </div>

            <AdminHeader />

            <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
                {children}
            </main>
        </div>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminHeader() {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === "/admin") {
            return pathname === path;
        }
        return pathname.startsWith(path);
    };

    const navItems = [
        { label: "Dashboard", href: "/admin" },
        { label: "Questions", href: "/admin/questions" },
        { label: "Users", href: "/admin/users" },
    ];

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-dashed border-gray-200">
            <div className="flex justify-between items-center px-6 md:px-12 py-9 max-w-[68rem] mx-auto">
                <div>
                    <Link href="/admin">
                        <h1 className="font-mclaren text-black text-2xl md:text-3xl cursor-pointer hover:opacity-70 transition-opacity">
                            PeerPrep Admin
                        </h1>
                    </Link>
                </div>
                <nav className="flex gap-8 items-center">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`font-montserrat font-medium text-sm transition-colors ${isActive(item.href)
                                ? "text-black"
                                : "text-gray-500 hover:text-black"
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link
                        href="/admin/login"
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-montserrat font-medium text-sm rounded-full transition-colors"
                    >
                        Exit Admin
                    </Link>
                </nav>
            </div>
        </header>
    );
}

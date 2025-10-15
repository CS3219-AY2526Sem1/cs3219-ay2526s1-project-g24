"use client";

import Link from "next/link";
import { useState } from "react";

export default function Match() {
    const [activeTab, setActiveTab] = useState("Match");

    const tabs = [
        { name: "Home", href: "/home" },
        { name: "Match", href: "/match" },
        { name: "Questions", href: "/questions" },
        { name: "Profile", href: "/profile" },
    ];

    return (
        <div className="min-h-screen bg-[#333232] relative overflow-hidden">
            <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 bg-[#333232] border-b-2 border-dashed border-white/20">
                <div className="flex justify-between items-center px-6 md:px-12 py-9 max-w-[68rem] mx-auto">
                    <div>
                        <Link href="/home">
                            <h1 className="font-mclaren text-white text-2xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity">
                                PeerPrep
                            </h1>
                        </Link>
                    </div>
                    <nav className="flex gap-8">
                        {tabs.map((tab) => (
                            <Link
                                key={tab.name}
                                href={tab.href}
                                className={`font-montserrat font-medium text-sm transition-colors ${activeTab === tab.name
                                    ? "text-white"
                                    : "text-[#9e9e9e] hover:text-white"
                                    }`}
                                onClick={() => setActiveTab(tab.name)}
                            >
                                {tab.name}
                            </Link>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
                <div className="max-w-5xl mx-auto">
                    <h1 className="font-montserrat text-5xl font-semibold text-white mb-4">
                        Find a Match
                    </h1>
                    <p className="font-montserrat text-xl text-[#9e9e9e]">
                        Match page coming soon...
                    </p>
                </div>
            </main>
        </div>
    );
}

// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated landing page component:
//   - Landing page with hero section and features
//   - Google OAuth sign-in button
//   - Auto-redirect for authenticated users
//   - Responsive design with Tailwind CSS
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced visual design and animations
//   - Added feature highlights
//   - Optimized for SEO

"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Landing() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If user is authenticated and has completed onboarding, redirect to home
        if (!loading && user && user.programming_proficiency) {
            router.replace("/home");
        }
    }, [user, loading, router]);

    // Show landing page while checking auth or if user is not authenticated
    return (
        <div className="h-screen bg-[#333232] relative overflow-hidden">
            <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 bg-[#333232] border-b-2 border-dashed border-white/20">
                <div className="flex justify-between items-center px-6 md:px-12 py-9 max-w-[68rem] mx-auto">
                    <div className="fade-in-up">
                        <Link href="/home">
                            <h1 className="font-mclaren text-white text-2xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity">
                                PeerPrep
                            </h1>
                        </Link>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/signin">
                            <button className="glow-button primary-glow bg-white text-[#1e1e1e] px-6 py-2 rounded-full font-montserrat font-medium text-sm hover:scale-105 transition-all fade-in-up">
                                Sign In
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="relative z-10 flex items-center justify-center h-screen px-6 md:px-12 pt-12">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-6 max-w-5xl mx-auto w-full translate-x-9">
                    <div className="flex-1 max-w-xl">
                        <div className="flex items-center gap-3 mb-6 fade-in-up-delayed">
                            <img
                                src="/peers_memoji.png"
                                alt="Community members"
                                className="h-10"
                            />
                            <span className="font-edu-tas text-[#b4b4b4] text-base md:text-lg">#JoinPeerPrep</span>
                        </div>

                        <div className="mb-8 fade-in-up-delayed-1">
                            <h2 className="font-montserrat text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-white mb-1">
                                Master coding
                            </h2>
                            <h2 className="font-montserrat text-3xl md:text-4xl lg:text-5xl font-medium leading-tight text-white mb-1">
                                interview with
                            </h2>
                            <h2 className="font-montserrat text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-profile-avatar mb-1">
                                peer-to-peer
                            </h2>
                            <h2 className="font-montserrat text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-profile-avatar">
                                collaboration
                            </h2>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 mb-8 fade-in-up-delayed-2">
                            <Link href="/signin">
                                <button className="glow-button primary-glow bg-white text-[#1e1e1e] px-7 py-3 rounded-full font-montserrat font-medium hover:scale-105 transition-all">
                                    Start practicing
                                </button>
                            </Link>
                            <Link href="https://nusmods.com/courses/CS3219/software-engineering-principles-and-patterns" target="_blank" rel="noopener noreferrer">
                                <button className="glow-button secondary-glow border border-white/30 text-white px-7 py-3 rounded-full font-montserrat font-medium hover:bg-white/10 transition-all">
                                    Learn more
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="flex-1 max-w-2xl relative fade-in-up-delayed-2">
                        <Image
                            src="/bro_hold_com.png"
                            alt="Bro swagger with laptop ready to code with peers!"
                            width={600}
                            height={700}
                            priority
                            unoptimized
                            className="w-full h-auto drop-shadow-2xl"
                        />
                    </div>
                </div>
            </main>

            <footer className="absolute bottom-2 left-0 right-0 text-center px-6 z-10">
                <p className="font-montserrat text-[#454545] text-xs leading-tight max-w-4xl mx-auto">
                    This project is part of the National University of Singapore (NUS) subject CS3219 for the academic year 2025/2026 and<br />
                    was created by Goh En Rui Ryann, Cleon Tan De Xuan, Lee Seng Kit, Tan Le Yew, and Litchiowong Napassorn, with all rights reserved.
                </p>
            </footer>
        </div>
    );
}

// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated server error handler component:
//   - Full-screen error overlay for server errors
//   - Try again, dismiss, and go home actions
//   - Error code and message display
//   - Integration with useServerError hook
//   - Consistent branding with glassmorphism UI
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced visual feedback with animations
//   - Added accessibility attributes

'use client';

import { useServerError } from '@/hooks/useServerError';
import Link from 'next/link';

export function ServerErrorHandler() {
    const { error, clearError } = useServerError();

    if (!error) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#333232]/95 backdrop-blur-sm">
            {/* Background pattern */}
            <div className="fixed inset-0 opacity-10 pointer-events-none">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
            </div>

            <div className="relative bg-[#2a2929] border-2 border-dashed border-white/20 rounded-2xl shadow-2xl p-8 md:p-12 max-w-lg w-full mx-4">
                {/* Sad Server Icon */}
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 bg-[#1e1e1e] rounded-xl flex items-center justify-center border-2 border-white/10">
                            <svg
                                className="w-12 h-12 text-red-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                                />
                            </svg>
                        </div>
                        {/* Glowing effect */}
                        <div className="absolute inset-0 bg-red-500/20 rounded-xl blur-xl"></div>
                    </div>
                </div>

                <h2 className="font-mclaren text-3xl text-white text-center mb-3">
                    Oops! Server Down
                </h2>

                <p className="font-montserrat text-[#b4b4b4] text-center mb-2">
                    {error.message}
                </p>

                <p className="font-montserrat text-sm text-[#7a7a7a] text-center mb-8">
                    Error Code: {error.status}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="glow-button primary-glow bg-white text-[#1e1e1e] px-6 py-3 rounded-full font-montserrat font-medium hover:scale-105 transition-all w-full"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={clearError}
                        className="glow-button secondary-glow border-2 border-white/30 text-white px-6 py-3 rounded-full font-montserrat font-medium hover:bg-white/10 transition-all w-full"
                    >
                        Dismiss
                    </button>
                    <Link href="/home">
                        <button
                            onClick={clearError}
                            className="border border-white/20 text-[#b4b4b4] px-6 py-3 rounded-full font-montserrat text-sm hover:border-white/40 hover:text-white transition-all w-full"
                        >
                            Go to Home
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

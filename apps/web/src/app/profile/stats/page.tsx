"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import withAuth from "@/components/withAuth";
import { getUserStats, getUserSolvedQuestions, UserStats, UserSolvedQuestion } from "@/lib/api/questionService";
import { getDifficultyStyles } from "@/lib/difficulty";

function ProfileStats() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Profile");
    const [stats, setStats] = useState<UserStats | null>(null);
    const [solvedQuestions, setSolvedQuestions] = useState<UserSolvedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const tabs = [
        { name: "Home", href: "/home" },
        { name: "Match", href: "/match" },
        { name: "Questions", href: "/questions" },
        { name: "Profile", href: "/profile" },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [statsData, solvedData] = await Promise.all([
                    getUserStats(),
                    getUserSolvedQuestions(),
                ]);
                setStats(statsData);
                setSolvedQuestions(solvedData);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load statistics');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getProgressPercentage = (solved: number, total: number = 200) => {
        return Math.min((solved / total) * 100, 100);
    };

    return (
        <div className="min-h-screen bg-[#333232] relative overflow-hidden font-montserrat">
            {/* Background decoration */}
            <div className="fixed inset-0 opacity-20 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-white/30"></div>
            </div>

            {/* Header */}
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
                                className={`font-montserrat font-medium text-sm transition-colors ${
                                    activeTab === tab.name
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

            {/* Main Content */}
            <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
                <div className="max-w-6xl mx-auto">
                    <h1 className="font-montserrat text-5xl font-semibold text-white mb-12">
                        Your Statistics
                    </h1>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-white text-lg">Loading your stats...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-400 text-lg">{error}</p>
                        </div>
                    ) : stats ? (
                        <div className="space-y-8">
                            {/* Overall Progress Card */}
                            <div className="bg-[#3a3a3a] border-2 border-white/20 rounded-2xl p-8">
                                <h2 className="text-2xl font-semibold text-white mb-6">Overall Progress</h2>
                                
                                {/* Total Solved */}
                                <div className="mb-8">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-white text-lg font-medium">Total Solved</span>
                                        <span className="text-white text-lg font-bold">{stats.total_solved}/200</span>
                                    </div>
                                    <div className="w-full bg-[#2d2d2d] rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] h-full rounded-full transition-all duration-500"
                                            style={{ width: `${getProgressPercentage(stats.total_solved)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Difficulty Breakdown */}
                                <div className="grid grid-cols-3 gap-6">
                                    {/* Easy */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[#4ade80] text-sm font-medium">Easy</span>
                                            <span className="text-white text-sm font-semibold">{stats.easy_solved}/75</span>
                                        </div>
                                        <div className="w-full bg-[#2d2d2d] rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="bg-[#4ade80] h-full rounded-full transition-all duration-500"
                                                style={{ width: `${getProgressPercentage(stats.easy_solved, 75)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Medium */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[#fb923c] text-sm font-medium">Medium</span>
                                            <span className="text-white text-sm font-semibold">{stats.medium_solved}/100</span>
                                        </div>
                                        <div className="w-full bg-[#2d2d2d] rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="bg-[#fb923c] h-full rounded-full transition-all duration-500"
                                                style={{ width: `${getProgressPercentage(stats.medium_solved, 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Hard */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[#f87171] text-sm font-medium">Hard</span>
                                            <span className="text-white text-sm font-semibold">{stats.hard_solved}/25</span>
                                        </div>
                                        <div className="w-full bg-[#2d2d2d] rounded-full h-2 overflow-hidden">
                                            <div 
                                                className="bg-[#f87171] h-full rounded-full transition-all duration-500"
                                                style={{ width: `${getProgressPercentage(stats.hard_solved, 25)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Total Attempted */}
                                <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-white mb-2">{stats.total_attempted}</div>
                                    <div className="text-[#9e9e9e] text-sm">Attempted</div>
                                </div>

                                {/* Acceptance Rate */}
                                <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-white mb-2">{stats.acceptance_rate.toFixed(1)}%</div>
                                    <div className="text-[#9e9e9e] text-sm">Acceptance</div>
                                </div>

                                {/* Total Submissions */}
                                <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-white mb-2">{stats.total_submissions}</div>
                                    <div className="text-[#9e9e9e] text-sm">Submissions</div>
                                </div>

                                {/* Streak */}
                                <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-xl p-6 text-center">
                                    <div className="text-4xl font-bold text-white mb-2">
                                        {stats.streak_days}
                                        <span className="text-2xl ml-1">🔥</span>
                                    </div>
                                    <div className="text-[#9e9e9e] text-sm">Day Streak</div>
                                </div>
                            </div>

                            {/* Recently Solved Questions */}
                            <div className="bg-[#3a3a3a] border-2 border-white/20 rounded-2xl p-8">
                                <h2 className="text-2xl font-semibold text-white mb-6">Recently Solved</h2>
                                
                                {solvedQuestions.length > 0 ? (
                                    <div className="space-y-3">
                                        {solvedQuestions.slice(0, 10).map((question) => (
                                            <div
                                                key={question.question_id}
                                                onClick={() => router.push(`/practice/${question.question_id}`)}
                                                className="bg-[#2d2d2d] border border-[#4a4a4a] rounded-lg px-6 py-4 flex items-center justify-between hover:bg-[#353535] transition-colors cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <svg className="w-5 h-5 text-[#4ade80] flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-white font-medium truncate">{question.title}</h3>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    {question.best_runtime_ms && (
                                                        <span className="text-[#9e9e9e] text-sm">
                                                            {question.best_runtime_ms}ms
                                                        </span>
                                                    )}
                                                    <span className={`text-xs px-3 py-1 rounded-full font-semibold uppercase ${getDifficultyStyles(question.difficulty)}`}>
                                                        {question.difficulty}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-[#9e9e9e]">No solved questions yet. Start solving!</p>
                                        <button
                                            onClick={() => router.push('/questions')}
                                            className="mt-4 px-6 py-2 bg-white/10 border-2 border-white/20 rounded-full text-white hover:bg-white/20 transition-colors"
                                        >
                                            Browse Questions
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </main>
        </div>
    );
}

export default withAuth(ProfileStats);

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getDifficultyStyles } from "@/lib/difficulty";
import withAuth from "@/components/withAuth";
import { getQuestions, getTopics, QuestionListItem, TopicResponse } from "@/lib/api/questionService";

function Questions() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Questions");
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [topicFilter, setTopicFilter] = useState<number | null>(null); // Store topic ID instead of name
    const [difficultyFilter, setDifficultyFilter] = useState('All difficulty');
    
    // API state
    const [questions, setQuestions] = useState<QuestionListItem[]>([]);
    const [topics, setTopics] = useState<TopicResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch topics on mount
    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const topicsData = await getTopics();
                setTopics(topicsData);
            } catch (err) {
                console.error('Failed to load topics:', err);
            }
        };

        fetchTopics();
    }, []);

    // Fetch questions from API
    useEffect(() => {
        const fetchQuestions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getQuestions({
                    page,
                    page_size: 100,
                    difficulties: difficultyFilter !== 'All difficulty' ? difficultyFilter.toLowerCase() : undefined,
                    topic_ids: topicFilter !== null ? topicFilter.toString() : undefined,
                    search: debouncedSearchQuery || undefined,
                });
                setQuestions(data.questions);
                setTotalQuestions(data.total);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load questions');
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuestions();
    }, [page, difficultyFilter, topicFilter, debouncedSearchQuery]);

    const tabs = [
        { name: "Home", href: "/home" },
        { name: "Match", href: "/match" },
        { name: "Questions", href: "/questions" },
        { name: "Profile", href: "/profile" },
    ];

    const handleQuestionClick = (questionId: number) => {
        router.push(`/practice/${questionId}`);
    };

    return (
        <div className="min-h-screen bg-[#333232] relative overflow-hidden font-montserrat">
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
                <div className="max-w-6xl mx-auto">
                    <h1 className="font-montserrat text-5xl font-semibold text-white text-center mb-12">
                        Questions Library
                    </h1>

                    {/* Filters */}
                    <div className="flex gap-4 mb-8">
                        {/* Search Bar */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-2 border-white/20 rounded-full px-6 py-3 font-montserrat text-sm text-white placeholder:text-[#585858] focus:outline-none focus:border-white/40 transition-colors"
                            />
                            <svg
                                className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#585858]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Topic Filter */}
                        <div className="relative">
                            <select
                                value={topicFilter !== null ? topicFilter : ''}
                                onChange={(e) => setTopicFilter(e.target.value ? parseInt(e.target.value) : null)}
                                className="bg-transparent border-2 border-white/20 rounded-full pl-6 pr-12 py-3 font-montserrat text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors min-w-[180px]"
                            >
                                <option value="" className="bg-[#333232] text-white">All topics</option>
                                {topics.map((topic) => (
                                    <option key={topic.id} value={topic.id} className="bg-[#333232] text-white">
                                        {topic.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                    <path d="M1 1L6 6L11 1" stroke="#585858" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>

                        {/* Difficulty Filter */}
                        <div className="relative">
                            <select
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                className="bg-transparent border-2 border-white/20 rounded-full pl-6 pr-12 py-3 font-montserrat text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors min-w-[180px]"
                            >
                                <option value="All difficulty" className="bg-[#333232] text-white">All difficulty</option>
                                <option value="EASY" className="bg-[#333232] text-white">Easy</option>
                                <option value="MEDIUM" className="bg-[#333232] text-white">Medium</option>
                                <option value="HARD" className="bg-[#333232] text-white">Hard</option>
                            </select>
                            <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                    <path d="M1 1L6 6L11 1" stroke="#585858" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Questions List */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <p className="text-white text-lg">Loading questions...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-400 text-lg">{error}</p>
                        </div>
                    ) : questions.length > 0 ? (
                        <div className="space-y-3">
                            {questions.map((question) => (
                                <div
                                    key={question.id}
                                    onClick={() => handleQuestionClick(question.id)}
                                    className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg px-6 py-5 flex items-center justify-between hover:bg-[#404040] transition-colors cursor-pointer"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-white text-lg font-medium">{question.title}</h3>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <p className="text-[#9e9e9e] text-sm">{question.topics.map(t => t.name).join(', ')}</p>
                                    </div>
                                    <div className="flex-1 flex justify-end">
                                        <span className={`text-xs px-4 py-1.5 rounded-full font-semibold uppercase ${getDifficultyStyles(question.difficulty)}`}>
                                            {question.difficulty}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-[#9e9e9e] text-lg">No questions found</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default withAuth(Questions);

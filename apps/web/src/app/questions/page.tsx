"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDifficultyStyles } from "@/lib/difficulty";

const mockQuestions = [
    { id: 1, title: 'Two Sum', topics: ['Arrays', 'Hash Table'], difficulty: 'EASY' },
    { id: 2, title: 'Add Two Numbers', topics: ['Linked List'], difficulty: 'MEDIUM' },
    { id: 3, title: 'Longest Palindromic Substring', topics: ['Strings', 'DP'], difficulty: 'MEDIUM' },
    { id: 4, title: 'Median of Two Sorted Array', topics: ['Arrays', 'Binary Search'], difficulty: 'HARD' },
    { id: 5, title: 'Container With Most Water', topics: ['Arrays'], difficulty: 'MEDIUM' },
    { id: 6, title: 'Roman to Integer', topics: ['Hash Table'], difficulty: 'EASY' },
    { id: 7, title: 'Longest Common Prefix', topics: ['Strings'], difficulty: 'EASY' },
    { id: 8, title: 'Valid Parentheses', topics: ['Strings'], difficulty: 'EASY' },
    { id: 9, title: 'Word Search', topics: ['DFS'], difficulty: 'MEDIUM' },
    { id: 10, title: '3Sum', topics: ['Arrays', 'Sorting'], difficulty: 'MEDIUM' },
    { id: 11, title: 'Binary Tree Inorder Traversal', topics: ['Tree'], difficulty: 'MEDIUM' },
];

export default function Questions() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Questions");
    const [searchQuery, setSearchQuery] = useState('');
    const [topicFilter, setTopicFilter] = useState('All topics');
    const [difficultyFilter, setDifficultyFilter] = useState('All difficulty');

    const tabs = [
        { name: "Home", href: "/home" },
        { name: "Match", href: "/match" },
        { name: "Questions", href: "/questions" },
        { name: "Profile", href: "/profile" },
    ];

    const filteredQuestions = mockQuestions.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesTopic = topicFilter === 'All topics' || q.topics.includes(topicFilter);
        const matchesDifficulty = difficultyFilter === 'All difficulty' || q.difficulty === difficultyFilter;
        return matchesSearch && matchesTopic && matchesDifficulty;
    });

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
                                value={topicFilter}
                                onChange={(e) => setTopicFilter(e.target.value)}
                                className="bg-transparent border-2 border-white/20 rounded-full pl-6 pr-12 py-3 font-montserrat text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors min-w-[180px]"
                            >
                                <option value="All topics" className="bg-[#333232] text-white">All topics</option>
                                <option value="Arrays" className="bg-[#333232] text-white">Arrays</option>
                                <option value="Strings" className="bg-[#333232] text-white">Strings</option>
                                <option value="Hash Table" className="bg-[#333232] text-white">Hash Table</option>
                                <option value="Linked List" className="bg-[#333232] text-white">Linked List</option>
                                <option value="Tree" className="bg-[#333232] text-white">Tree</option>
                                <option value="Binary Search" className="bg-[#333232] text-white">Binary Search</option>
                                <option value="DP" className="bg-[#333232] text-white">Dynamic Programming</option>
                                <option value="DFS" className="bg-[#333232] text-white">DFS</option>
                                <option value="Sorting" className="bg-[#333232] text-white">Sorting</option>
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
                    {filteredQuestions.length > 0 ? (
                        <div className="space-y-3">
                            {filteredQuestions.map((question) => (
                                <div
                                    key={question.id}
                                    onClick={() => handleQuestionClick(question.id)}
                                    className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg px-6 py-5 flex items-center justify-between hover:bg-[#404040] transition-colors cursor-pointer"
                                >
                                    <div className="flex-1">
                                        <h3 className="text-white text-lg font-medium">{question.title}</h3>
                                    </div>
                                    <div className="flex-1 text-center">
                                        <p className="text-[#9e9e9e] text-sm">{question.topics.join(', ')}</p>
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


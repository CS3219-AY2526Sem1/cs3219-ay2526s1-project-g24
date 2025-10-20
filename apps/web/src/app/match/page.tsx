"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getDifficultyStyles } from "@/lib/difficulty";
import withAuth from "@/components/withAuth";

const topics = [
    { name: "Arrays &\nHashing", subtitle: "Two pointers, Sliding window" },
    { name: "String\nManipulation", subtitle: "Pattern matching, KMP" },
    { name: "Binary\nTrees", subtitle: "Tree traversal, Binary Search Tree" },
    { name: "Graph\nAlgorithms", subtitle: "DFS, BFS, Shortest paths" },
    { name: "Dynamic\nProgramming", subtitle: "Memoization, Tabulation" },
    { name: "Recursion\n& Search", subtitle: "Permutations, N-Queens" },
    { name: "List\nOperations", subtitle: "Pointers, Manipulation" },
    { name: "LIFO\nFIFO", subtitle: "Applications, Monotonic" },
    { name: "Priority\nQueue", subtitle: "Min/max heap operations" },
    { name: "Prefix\nTrees", subtitle: "String search, Autocomplete" },
    { name: "Sort\nAlgorithms", subtitle: "Quick, Merge, Radix" },
    { name: "Search &\nBounds", subtitle: "Search Algorithms" },
];

const difficulties = [
    {
        level: "Beginner\nLevel",
        tag: "EASY",
        description: "Perfect for getting started with fundamentals",
    },
    {
        level: "Intermediate\nLevel",
        tag: "MEDIUM",
        description: "Build deeper understanding and skills",
    },
    {
        level: "Expert\nLevel",
        tag: "HARD",
        description: "Master the most challenging problems",
    },
];

const languages = [
    { name: "C++", icon: "/c-.png" },
    { name: "Java", icon: "/java.png" },
    { name: "Python", icon: "/python.png" },
    { name: "JavaScript", icon: "/js.png" },
];

function Match() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("Match");
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("Intermediate Level");
    const [selectedLanguage, setSelectedLanguage] = useState<string>("Python");

    const tabs = [
        { name: "Home", href: "/home" },
        { name: "Match", href: "/match" },
        { name: "Questions", href: "/questions" },
        { name: "Profile", href: "/profile" },
    ];

    const toggleTopic = (topic: string) => {
        setSelectedTopics((prev) =>
            prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
        );
    };

    const handleMatch = () => {
        router.push("/wait");
    };

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
                    <div className="text-center mb-16">
                        <h2 className="font-montserrat text-5xl font-semibold text-white mb-4">
                            Start Your Practice Session
                        </h2>
                        <p className="font-montserrat text-lg text-white flex items-center justify-center gap-2">
                            <img src="/peers_memoji.png" alt="Peers" className="h-6" />
                            Ready to code with a peer?
                        </p>
                    </div>

                    <section className="mb-16">
                        <h3 className="font-montserrat text-3xl font-semibold text-white mb-8">
                            Choose Topic
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {topics.map((topic) => (
                                <button
                                    key={topic.name}
                                    onClick={() => toggleTopic(topic.name)}
                                    className={`p-6 rounded-2xl border-2 transition-all text-center ${selectedTopics.includes(topic.name)
                                        ? "bg-[#2d2d2d] border-white/20 opacity-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        : "bg-[#2d2d2d] border-white/10 opacity-40 hover:opacity-60"
                                        }`}
                                >
                                    <h4
                                        className={`font-montserrat text-lg font-semibold mb-2 leading-tight whitespace-pre-line ${selectedTopics.includes(topic.name)
                                            ? "text-white"
                                            : "text-gray-400"
                                            }`}
                                    >
                                        {topic.name}
                                    </h4>
                                    <p className="font-montserrat text-xs text-gray-500">
                                        {topic.subtitle}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="mb-16">
                        <h3 className="font-montserrat text-3xl font-semibold text-white mb-8">
                            Choose Difficulty
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {difficulties.map((diff) => (
                                <button
                                    key={diff.level}
                                    onClick={() => setSelectedDifficulty(diff.level)}
                                    className={`p-8 rounded-2xl border-2 transition-all text-center flex flex-col items-center ${selectedDifficulty === diff.level
                                        ? "bg-[#2d2d2d] border-white/20 opacity-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        : "bg-[#2d2d2d] border-white/10 opacity-40 hover:opacity-60"
                                        }`}
                                >
                                    <div className="mb-3">
                                        <span
                                            className={`font-montserrat text-xs px-3 py-1 rounded-full ${getDifficultyStyles(diff.tag)}`}
                                        >
                                            {diff.tag}
                                        </span>
                                    </div>
                                    <h4
                                        className={`font-montserrat text-2xl font-semibold mb-3 leading-tight whitespace-pre-line ${selectedDifficulty === diff.level
                                            ? "text-white"
                                            : "text-gray-400"
                                            }`}
                                    >
                                        {diff.level}
                                    </h4>
                                    <p className="font-montserrat text-sm text-gray-500">
                                        {diff.description}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="mb-12">
                        <h3 className="font-montserrat text-3xl font-semibold text-white mb-8">
                            Choose Coding Language
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {languages.map((lang) => (
                                <button
                                    key={lang.name}
                                    onClick={() => setSelectedLanguage(lang.name)}
                                    className={`p-8 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-4 ${selectedLanguage === lang.name
                                        ? "bg-[#2d2d2d] border-white/20 opacity-100 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                                        : "bg-[#2d2d2d] border-white/10 opacity-40 hover:opacity-60"
                                        }`}
                                >
                                    <Image
                                        src={lang.icon}
                                        alt={lang.name}
                                        width={64}
                                        height={64}
                                        className={`w-16 h-16 ${selectedLanguage === lang.name
                                            ? ""
                                            : "grayscale"
                                            }`}
                                        unoptimized
                                    />
                                    <h4
                                        className={`font-montserrat text-xl font-medium ${selectedLanguage === lang.name
                                            ? "text-white"
                                            : "text-gray-400"
                                            }`}
                                    >
                                        {lang.name}
                                    </h4>
                                </button>
                            ))}
                        </div>
                    </section>

                    <div className="flex justify-center">
                        <button
                            onClick={handleMatch}
                            className="glow-button primary-glow bg-white text-[#1e1e1e] px-12 py-3 rounded-full font-montserrat font-medium text-lg hover:scale-105 transition-all"
                        >
                            Match
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default withAuth(Match);
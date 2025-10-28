"use client";

import Link from "next/link";
import { useState } from "react";
import { withAdminAuth } from "@/components/withAuth";

type Question = {
    id: string;
    title: string;
    difficulty: "EASY" | "MEDIUM" | "HARD";
    topics: string[];
    createdAt: string;
    isDeleted: boolean;
    totalTestCases: number;
};

// Mock data
const MOCK_QUESTIONS: Question[] = [
    {
        id: "1",
        title: "Two Sum",
        difficulty: "EASY",
        topics: ["Arrays", "Hash Table"],
        createdAt: "2024-01-15",
        isDeleted: false,
        totalTestCases: 8
    },
    {
        id: "2",
        title: "Add Two Numbers",
        difficulty: "MEDIUM",
        topics: ["Linked List", "Math", "Recursion"],
        createdAt: "2024-01-16",
        isDeleted: false,
        totalTestCases: 12
    },
    {
        id: "3",
        title: "Median of Two Sorted Arrays",
        difficulty: "HARD",
        topics: ["Arrays", "Binary Search", "Divide and Conquer"],
        createdAt: "2024-01-17",
        isDeleted: false,
        totalTestCases: 15
    },
    {
        id: "4",
        title: "Longest Palindromic Substring",
        difficulty: "MEDIUM",
        topics: ["String", "Dynamic Programming"],
        createdAt: "2024-01-18",
        isDeleted: false,
        totalTestCases: 10
    },
    {
        id: "5",
        title: "Reverse Integer",
        difficulty: "EASY",
        topics: ["Math"],
        createdAt: "2024-01-19",
        isDeleted: false,
        totalTestCases: 6
    },
    {
        id: "6",
        title: "Regular Expression Matching",
        difficulty: "HARD",
        topics: ["String", "Dynamic Programming", "Recursion"],
        createdAt: "2024-01-20",
        isDeleted: false,
        totalTestCases: 20
    },
    {
        id: "7",
        title: "Container With Most Water",
        difficulty: "MEDIUM",
        topics: ["Array", "Two Pointers", "Greedy"],
        createdAt: "2024-01-21",
        isDeleted: false,
        totalTestCases: 9
    },
    {
        id: "8",
        title: "3Sum (Deleted)",
        difficulty: "MEDIUM",
        topics: ["Array", "Two Pointers"],
        createdAt: "2024-01-14",
        isDeleted: true,
        totalTestCases: 11
    }
];

function AdminQuestions() {
    const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS);
    const [search, setSearch] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");
    const [showDeleted, setShowDeleted] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; questionId: string; questionTitle: string }>({
        show: false,
        questionId: "",
        questionTitle: ""
    });

    const difficultyColors = {
        EASY: "text-green-400",
        MEDIUM: "text-yellow-400",
        HARD: "text-red-400",
    };

    const handleDeleteQuestion = async (id: string, title: string) => {
        setDeleteConfirm({ show: true, questionId: id, questionTitle: title });
    };

    const confirmDelete = async () => {
        setDeleteConfirm({ show: false, questionId: "", questionTitle: "" });
    };

    const handleRestoreQuestion = async (id: string) => {
    };

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
                            className="font-montserrat font-medium text-sm text-gray-500 hover:text-black transition-colors"
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/admin/questions"
                            className="font-montserrat font-medium text-sm text-black"
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
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="font-montserrat text-5xl font-semibold text-black mb-4">
                                Manage Questions
                            </h1>
                            <p className="font-montserrat text-xl text-gray-500">
                                Create, edit, and manage coding questions
                            </p>
                        </div>
                        <Link href="/admin/questions/new">
                            <button className="px-6 py-3 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat font-medium text-sm rounded-full transition-all">
                                + New Question
                            </button>
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Search questions..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-full px-4 py-2.5 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors"
                            />
                            <select
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-full px-4 py-2.5 font-montserrat text-sm text-black focus:outline-none focus:border-[#DCC8FE] transition-colors appearance-none cursor-pointer"
                            >
                                <option value="ALL">All Difficulties</option>
                                <option value="EASY">Easy</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HARD">Hard</option>
                            </select>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={showDeleted}
                                        onChange={(e) => setShowDeleted(e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white peer-checked:bg-[#DCC8FE] peer-checked:border-[#DCC8FE] transition-all flex items-center justify-center">
                                        {showDeleted && (
                                            <svg className="w-3 h-3 text-black" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                <path d="M5 13l4 4L19 7"></path>
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="font-montserrat text-sm text-black">Show Deleted</span>
                            </label>
                        </div>
                    </div>

                    {/* Questions List */}
                    {questions.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                            <p className="font-montserrat text-gray-500 text-lg mb-4">No questions yet</p>
                            <Link href="/admin/questions/new">
                                <button className="px-6 py-3 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat font-medium text-sm rounded-full transition-all">
                                    Create First Question
                                </button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {questions.map((question) => (
                                <div
                                    key={question.id}
                                    className={`bg-white border rounded-2xl p-6 transition-all ${question.isDeleted
                                        ? "border-red-300 opacity-60"
                                        : "border-gray-200 hover:border-[#DCC8FE]"
                                        }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-montserrat text-black text-lg font-semibold">
                                                    {question.title}
                                                </h3>
                                                {question.isDeleted && (
                                                    <span className="px-3 py-1 bg-red-100 text-red-600 text-xs font-montserrat rounded-full">
                                                        DELETED
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mb-3">
                                                <span
                                                    className={`font-montserrat text-sm font-medium ${difficultyColors[question.difficulty]
                                                        }`}
                                                >
                                                    {question.difficulty}
                                                </span>
                                                <span className="font-montserrat text-gray-500 text-sm">
                                                    {question.totalTestCases} test cases
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {question.topics.map((topic) => (
                                                    <span
                                                        key={topic}
                                                        className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-montserrat rounded-full"
                                                    >
                                                        {topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {question.isDeleted ? (
                                                <button
                                                    onClick={() => handleRestoreQuestion(question.id)}
                                                    className="px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 font-montserrat text-sm rounded-full transition-colors"
                                                >
                                                    Restore
                                                </button>
                                            ) : (
                                                <>
                                                    <Link href={`/admin/questions/${question.id}/edit`}>
                                                        <button className="px-4 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-sm rounded-full transition-colors">
                                                            Edit
                                                        </button>
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDeleteQuestion(question.id, question.title)}
                                                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-montserrat text-sm rounded-full transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={() => setDeleteConfirm({ show: false, questionId: "", questionTitle: "" })}
                    ></div>
                    <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                        <h3 className="font-montserrat text-2xl font-semibold text-black mb-3">
                            Delete Question?
                        </h3>
                        <p className="font-montserrat text-gray-500 mb-6">
                            Are you sure you want to delete "{deleteConfirm.questionTitle}"? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={() => setDeleteConfirm({ show: false, questionId: "", questionTitle: "" })}
                                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-sm rounded-full transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-montserrat text-sm rounded-full transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withAdminAuth(AdminQuestions);

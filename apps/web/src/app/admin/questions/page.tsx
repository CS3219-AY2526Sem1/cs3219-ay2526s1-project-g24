// AI Assistance Disclosure:
// Tool: GitHub Copilot (model: Claude Sonnet 4.5)
// Date Range: November 1-10, 2025
// Scope: Generated admin questions management page:
//   - Question listing with pagination (20 per page)
//   - Search with debouncing (500ms delay)
//   - Multi-filter support (difficulty, topic, company, deleted status)
//   - Question deletion with confirmation modal
//   - Question restoration for soft-deleted questions
//   - Real-time filter updates with API integration
//   - Responsive table layout with loading spinner
//   - Navigation to question details and edit pages
// Author review: Code reviewed, tested, and validated by team. Modified for:
//   - Enhanced filter UX with better visual feedback
//   - Added comprehensive pagination controls

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { withAdminAuth } from "@/components/withAuth";
import {
    getQuestions,
    deleteQuestion,
    restoreQuestion,
    QuestionListItem,
    getTopics,
    getCompanies,
    TopicResponse,
    CompanyResponse
} from "@/lib/api/questionService";
import LoadingSpinner from "@/components/LoadingSpinner";

function AdminQuestions() {
    // API Data
    const [questions, setQuestions] = useState<QuestionListItem[]>([]);
    const [topics, setTopics] = useState<TopicResponse[]>([]);
    const [companies, setCompanies] = useState<CompanyResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
    const [topicFilter, setTopicFilter] = useState<number | null>(null);
    const [companyFilter, setCompanyFilter] = useState<number | null>(null);
    const [showDeleted, setShowDeleted] = useState(false);  // Toggle for deleted questions

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Delete modal
    const [deleteConfirm, setDeleteConfirm] = useState<{
        show: boolean;
        questionId: number | null;
        questionTitle: string
    }>({
        show: false,
        questionId: null,
        questionTitle: ""
    });

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

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

    // Fetch companies on mount
    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const companiesData = await getCompanies();
                setCompanies(companiesData);
            } catch (err) {
                console.error('Failed to load companies:', err);
            }
        };
        fetchCompanies();
    }, []);

    // Fetch questions
    useEffect(() => {
        const fetchQuestions = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await getQuestions({
                    page,
                    page_size: 50,
                    difficulties: difficultyFilter !== 'all' ? difficultyFilter : undefined,
                    topic_ids: topicFilter !== null ? topicFilter.toString() : undefined,
                    company_ids: companyFilter !== null ? companyFilter.toString() : undefined,
                    search: debouncedSearch || undefined,
                    include_deleted: showDeleted,  // Include deleted questions if toggle is on
                });

                setQuestions(data.questions);
                setTotalPages(data.total_pages);
                setTotalQuestions(data.total);
            } catch (err) {
                console.error("Failed to fetch questions:", err);
                setError(err instanceof Error ? err.message : "Failed to load questions");
            } finally {
                setLoading(false);
            }
        };

        fetchQuestions();
    }, [page, difficultyFilter, topicFilter, companyFilter, debouncedSearch, showDeleted]);

    const difficultyColors = {
        easy: "bg-green-100 text-green-700 border-green-300",
        medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
        hard: "bg-red-100 text-red-700 border-red-300",
    };

    const handleDeleteQuestion = async (id: number, title: string) => {
        setDeleteConfirm({ show: true, questionId: id, questionTitle: title });
    };

    const handleRestoreQuestion = async (id: number) => {
        try {
            await restoreQuestion(id);
            // Refetch questions to update the list
            const data = await getQuestions({
                page,
                page_size: 50,
                difficulties: difficultyFilter !== 'all' ? difficultyFilter : undefined,
                topic_ids: topicFilter !== null ? topicFilter.toString() : undefined,
                company_ids: companyFilter !== null ? companyFilter.toString() : undefined,
                search: debouncedSearch || undefined,
                include_deleted: showDeleted,
            });
            setQuestions(data.questions);
            setTotalQuestions(data.total);
        } catch (err) {
            console.error("Failed to restore question:", err);
            alert("Failed to restore question");
        }
    };

    const confirmDelete = async () => {
        if (deleteConfirm.questionId === null) return;

        try {
            await deleteQuestion(deleteConfirm.questionId);
            // Refresh the questions list
            setQuestions(questions.filter(q => q.id !== deleteConfirm.questionId));
            setTotalQuestions(prev => prev - 1);
            setDeleteConfirm({ show: false, questionId: null, questionTitle: "" });
        } catch (err) {
            console.error("Failed to delete question:", err);
            alert("Failed to delete question. Please try again.");
        }
    };

    const cancelDelete = () => {
        setDeleteConfirm({ show: false, questionId: null, questionTitle: "" });
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
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                <option value="all">All Difficulties</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                            <select
                                value={topicFilter !== null ? topicFilter : ''}
                                onChange={(e) => setTopicFilter(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full bg-white border border-gray-300 rounded-full px-4 py-2.5 font-montserrat text-sm text-black focus:outline-none focus:border-[#DCC8FE] transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">All Topics</option>
                                {topics.map((topic) => (
                                    <option key={topic.id} value={topic.id}>
                                        {topic.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={companyFilter !== null ? companyFilter : ''}
                                onChange={(e) => setCompanyFilter(e.target.value ? parseInt(e.target.value) : null)}
                                className="w-full bg-white border border-gray-300 rounded-full px-4 py-2.5 font-montserrat text-sm text-black focus:outline-none focus:border-[#DCC8FE] transition-colors appearance-none cursor-pointer"
                            >
                                <option value="">All Companies</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="mt-4 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <p className="text-gray-500 text-sm font-montserrat">
                                    Showing {questions.length} of {totalQuestions} questions
                                </p>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={showDeleted}
                                        onChange={(e) => {
                                            setShowDeleted(e.target.checked);
                                            setPage(1);  // Reset to first page
                                        }}
                                        className="w-4 h-4 rounded border-gray-300 text-[#DCC8FE] focus:ring-[#DCC8FE] cursor-pointer"
                                    />
                                    <span className="text-gray-600 text-sm font-montserrat">
                                        Show deleted questions
                                    </span>
                                </label>
                            </div>
                            {totalPages > 1 && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-montserrat text-sm text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 font-montserrat text-sm text-gray-600">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg font-montserrat text-sm text-black disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <LoadingSpinner message="Loading questions..." fullScreen={false} />
                    )}

                    {/* Error State */}
                    {error && !loading && (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                            <p className="font-montserrat text-red-600 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Questions List */}
                    {!loading && !error && questions.length === 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                            <p className="font-montserrat text-gray-500 text-lg mb-4">No questions found</p>
                            <Link href="/admin/questions/new">
                                <button className="px-6 py-3 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat font-medium text-sm rounded-full transition-all">
                                    Create First Question
                                </button>
                            </Link>
                        </div>
                    )}

                    {/* Questions Table */}
                    {!loading && !error && questions.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-600 text-sm font-medium">
                                            Title
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-600 text-sm font-medium">
                                            Difficulty
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-600 text-sm font-medium">
                                            Topics
                                        </th>
                                        <th className="px-6 py-4 text-left font-montserrat text-gray-600 text-sm font-medium">
                                            Companies
                                        </th>
                                        <th className="px-6 py-4 text-right font-montserrat text-gray-600 text-sm font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {questions.map((question) => {
                                        const isDeleted = question.deleted_at != null;
                                        return (
                                            <tr key={question.id} className={`hover:bg-gray-50 transition-colors ${isDeleted ? 'opacity-60 bg-red-50' : ''}`}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Link
                                                            href={`/admin/questions/${question.id}`}
                                                            className={`font-montserrat text-sm font-medium hover:text-[#DCC8FE] transition-colors ${isDeleted ? 'text-gray-500 line-through' : 'text-black'}`}
                                                        >
                                                            {question.title}
                                                        </Link>
                                                        {isDeleted && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-montserrat rounded-full border border-red-300">
                                                                Deleted
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-montserrat font-semibold border ${difficultyColors[question.difficulty]}`}>
                                                        {question.difficulty.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 relative group">
                                                        {question.topics.slice(0, 2).map((topic) => (
                                                            <span
                                                                key={topic.id}
                                                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-montserrat rounded"
                                                            >
                                                                {topic.name}
                                                            </span>
                                                        ))}
                                                        {question.topics.length > 2 && (
                                                            <span className="px-2 py-1 text-gray-500 text-xs font-montserrat">
                                                                +{question.topics.length - 2}
                                                            </span>
                                                        )}
                                                        {/* Tooltip for all topics */}
                                                        {question.topics.length > 2 && (
                                                            <div className="absolute left-0 top-full mt-2 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 whitespace-nowrap">
                                                                <div className="flex flex-col gap-1">
                                                                    {question.topics.map((topic) => (
                                                                        <span key={topic.id} className="font-montserrat">
                                                                            • {topic.name}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 relative group">
                                                        {question.companies.length > 0 ? (
                                                            <>
                                                                {question.companies.slice(0, 2).map((company) => (
                                                                    <span
                                                                        key={company.id}
                                                                        className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-montserrat rounded"
                                                                    >
                                                                        {company.name}
                                                                    </span>
                                                                ))}
                                                                {question.companies.length > 2 && (
                                                                    <span className="px-2 py-1 text-gray-500 text-xs font-montserrat">
                                                                        +{question.companies.length - 2}
                                                                    </span>
                                                                )}
                                                                {/* Tooltip for all companies */}
                                                                {question.companies.length > 2 && (
                                                                    <div className="absolute left-0 top-full mt-2 bg-gray-800 text-white text-xs rounded-lg py-2 px-3 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 whitespace-nowrap">
                                                                        <div className="flex flex-col gap-1">
                                                                            {question.companies.map((company) => (
                                                                                <span key={company.id} className="font-montserrat">
                                                                                    • {company.name}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400 text-xs font-montserrat">—</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex gap-2 justify-end">
                                                        <Link href={`/admin/questions/${question.id}`}>
                                                            <button className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-montserrat text-xs rounded transition-colors">
                                                                View
                                                            </button>
                                                        </Link>
                                                        {isDeleted ? (
                                                            <button
                                                                onClick={() => handleRestoreQuestion(question.id)}
                                                                className="px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 font-montserrat text-xs rounded transition-colors"
                                                            >
                                                                Restore
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleDeleteQuestion(question.id, question.title)}
                                                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-montserrat text-xs rounded transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Delete Confirmation Modal */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={cancelDelete}
                    ></div>
                    <div className="relative bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
                        <h3 className="font-montserrat text-2xl font-semibold text-black mb-3">
                            Delete Question?
                        </h3>
                        <p className="font-montserrat text-gray-500 mb-6">
                            Are you sure you want to delete &ldquo;{deleteConfirm.questionTitle}&rdquo;? The question will be hidden but can be restored later.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={cancelDelete}
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

"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";

type TestCase = {
    id: string;
    input: string;
    expectedOutput: string;
    isPublic: boolean;
};

export default function ManageTestCases() {
    const params = useParams();
    const questionId = params.qid as string;

    const [testCases, setTestCases] = useState<TestCase[]>([]);
    const [newTestCase, setNewTestCase] = useState({
        input: "",
        expectedOutput: "",
        isPublic: false,
    });
    const [isAdding, setIsAdding] = useState(false);

    const handleAddTestCase = async () => {
        setNewTestCase({ input: "", expectedOutput: "", isPublic: false });
        setIsAdding(false);
    };

    const handleUpdateTestCase = async (id: string, updates: Partial<TestCase>) => {
    };

    const handleDeleteTestCase = async (id: string) => {
    };

    const handleValidateTestCase = async (id: string) => {
    };

    const handleValidateAll = async () => {
    };

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            <div className="fixed inset-0 opacity-10 pointer-events-none z-0">
                <div className="absolute left-[20%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
                <div className="absolute left-[80%] top-0 bottom-0 w-px border-l-2 border-dashed border-gray-300"></div>
            </div>

            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-2 border-dashed border-gray-300">
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
                <div className="max-w-5xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <Link
                                href="/admin/questions"
                                className="font-montserrat text-gray-500 text-sm hover:text-black transition-colors mb-2 inline-block"
                            >
                                ← Back to Questions
                            </Link>
                            <h1 className="font-montserrat text-4xl font-semibold text-black">
                                Manage Test Cases
                            </h1>
                            <p className="font-montserrat text-gray-500 mt-2">Question ID: {questionId}</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleValidateAll}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-sm rounded-full transition-colors"
                            >
                                Validate All
                            </button>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="px-4 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-sm rounded-full transition-colors"
                            >
                                + Add Test Case
                            </button>
                        </div>
                    </div>

                    {/* Add New Test Case Form */}
                    {isAdding && (
                        <div className="bg-gray-50 border border-[#DCC8FE] rounded-2xl p-6 mb-6">
                            <h3 className="font-montserrat text-black text-lg font-semibold mb-4">
                                New Test Case
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block font-montserrat text-gray-500 text-sm mb-2">
                                        Input
                                    </label>
                                    <textarea
                                        value={newTestCase.input}
                                        onChange={(e) =>
                                            setNewTestCase({ ...newTestCase, input: e.target.value })
                                        }
                                        placeholder="Test case input"
                                        rows={4}
                                        className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none"
                                    />
                                </div>
                                <div>
                                    <label className="block font-montserrat text-gray-500 text-sm mb-2">
                                        Expected Output
                                    </label>
                                    <textarea
                                        value={newTestCase.expectedOutput}
                                        onChange={(e) =>
                                            setNewTestCase({ ...newTestCase, expectedOutput: e.target.value })
                                        }
                                        placeholder="Expected output"
                                        rows={4}
                                        className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none"
                                    />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            checked={newTestCase.isPublic}
                                            onChange={(e) =>
                                                setNewTestCase({ ...newTestCase, isPublic: e.target.checked })
                                            }
                                            className="sr-only peer"
                                        />
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded bg-white peer-checked:bg-[#DCC8FE] peer-checked:border-[#DCC8FE] transition-all flex items-center justify-center">
                                            {newTestCase.isPublic && (
                                                <svg className="w-3 h-3 text-black" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                    <span className="font-montserrat text-black text-sm">
                                        Public (visible to users)
                                    </span>
                                </label>
                                <div className="flex gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setIsAdding(false);
                                            setNewTestCase({ input: "", expectedOutput: "", isPublic: false });
                                        }}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-sm rounded-full transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAddTestCase}
                                        className="px-6 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat font-medium text-sm rounded-full transition-colors"
                                    >
                                        Add Test Case
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Test Cases List */}
                    {testCases.length === 0 ? (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-12 text-center">
                            <p className="font-montserrat text-gray-500 text-lg mb-4">
                                No test cases yet
                            </p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="px-6 py-3 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat font-medium text-sm rounded-full transition-all"
                            >
                                Add First Test Case
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {testCases.map((testCase, index) => (
                                <div
                                    key={testCase.id}
                                    className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-[#DCC8FE]/50 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="font-montserrat text-black text-lg font-semibold">
                                                Test Case #{index + 1}
                                            </span>
                                            {testCase.isPublic ? (
                                                <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-montserrat rounded-full">
                                                    PUBLIC
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-montserrat rounded-full">
                                                    HIDDEN
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleValidateTestCase(testCase.id)}
                                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-xs rounded-full transition-colors"
                                            >
                                                Validate
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleUpdateTestCase(testCase.id, {
                                                        isPublic: !testCase.isPublic,
                                                    })
                                                }
                                                className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-xs rounded-full transition-colors"
                                            >
                                                Toggle Visibility
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTestCase(testCase.id)}
                                                className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-montserrat text-xs rounded-full transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-montserrat text-gray-500 text-xs mb-2">
                                                Input
                                            </label>
                                            <pre className="bg-white border border-gray-300 rounded-full p-3 font-mono text-sm text-black overflow-x-auto">
                                                {testCase.input}
                                            </pre>
                                        </div>
                                        <div>
                                            <label className="block font-montserrat text-gray-500 text-xs mb-2">
                                                Expected Output
                                            </label>
                                            <pre className="bg-white border border-gray-300 rounded-full p-3 font-mono text-sm text-black overflow-x-auto">
                                                {testCase.expectedOutput}
                                            </pre>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

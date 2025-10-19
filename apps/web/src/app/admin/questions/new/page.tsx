"use client";

import Link from "next/link";
import { useState } from "react";

type Example = {
    input: string;
    output: string;
    explanation?: string;
};

type TestCase = {
    input: string;
    expectedOutput: string;
};

export default function CreateQuestion() {
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [description, setDescription] = useState("");
    const [examples, setExamples] = useState<Example[]>([{ input: "", output: "", explanation: "" }]);
    const [constraints, setConstraints] = useState<string[]>([""]);
    const [testCases, setTestCases] = useState<TestCase[]>([{ input: "", expectedOutput: "" }]);

    const availableTopics = [
        "Arrays",
        "Strings",
        "Hash Table",
        "Dynamic Programming",
        "Binary Search",
        "DFS",
        "BFS",
        "Tree",
        "Graph",
        "Sorting",
        "Greedy",
        "Recursion",
        "Backtracking",
        "Linked List",
        "Stack",
        "Queue",
    ];

    const toggleTopic = (topic: string) => {
        if (selectedTopics.includes(topic)) {
            setSelectedTopics(selectedTopics.filter((t) => t !== topic));
        } else {
            setSelectedTopics([...selectedTopics, topic]);
        }
    };

    const addExample = () => {
        setExamples([...examples, { input: "", output: "", explanation: "" }]);
    };

    const removeExample = (index: number) => {
        setExamples(examples.filter((_, i) => i !== index));
    };

    const updateExample = (index: number, field: keyof Example, value: string) => {
        const updated = [...examples];
        updated[index] = { ...updated[index], [field]: value };
        setExamples(updated);
    };

    const addConstraint = () => {
        setConstraints([...constraints, ""]);
    };

    const removeConstraint = (index: number) => {
        setConstraints(constraints.filter((_, i) => i !== index));
    };

    const updateConstraint = (index: number, value: string) => {
        const updated = [...constraints];
        updated[index] = value;
        setConstraints(updated);
    };

    const addTestCase = () => {
        setTestCases([...testCases, { input: "", expectedOutput: "" }]);
    };

    const removeTestCase = (index: number) => {
        setTestCases(testCases.filter((_, i) => i !== index));
    };

    const updateTestCase = (index: number, field: keyof TestCase, value: string) => {
        const updated = [...testCases];
        updated[index] = { ...updated[index], [field]: value };
        setTestCases(updated);
    };

    const handleSubmit = async () => {
        // TODO: API call to create question
        const questionData = {
            title,
            difficulty,
            topics: selectedTopics,
            description,
            examples: examples.filter((ex) => ex.input || ex.output),
            constraints: constraints.filter((c) => c.trim()),
            testCases: testCases.filter((tc) => tc.input || tc.expectedOutput),
        };
    };

    const handleValidateTestCases = async () => {
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
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="font-montserrat text-4xl font-semibold text-black">
                            Create New Question
                        </h1>
                        <Link href="/admin/questions">
                            <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-sm rounded-full transition-colors">
                                Cancel
                            </button>
                        </Link>
                    </div>

                    <div className="space-y-6">
                        {/* Title */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">
                                Question Title
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Two Sum"
                                className="w-full bg-white border border-gray-300 rounded-full px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors"
                            />
                        </div>

                        {/* Difficulty & Topics */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">
                                Difficulty
                            </label>
                            <div className="flex gap-3 mb-6">
                                {["EASY", "MEDIUM", "HARD"].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level as "EASY" | "MEDIUM" | "HARD")}
                                        className={`px-6 py-2 font-montserrat text-sm rounded-full transition-colors ${difficulty === level
                                            ? "bg-[#DCC8FE] text-black"
                                            : "bg-white text-black hover:bg-gray-200"
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>

                            <label className="block font-montserrat text-black text-sm font-medium mb-3">
                                Topics
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {availableTopics.map((topic) => (
                                    <button
                                        key={topic}
                                        onClick={() => toggleTopic(topic)}
                                        className={`px-4 py-2 font-montserrat text-xs rounded-full transition-colors ${selectedTopics.includes(topic)
                                            ? "bg-[#DCC8FE] text-black"
                                            : "bg-white text-gray-500 hover:bg-gray-200"
                                            }`}
                                    >
                                        {topic}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <label className="block font-montserrat text-black text-sm font-medium mb-3">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the problem..."
                                rows={8}
                                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 font-montserrat text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] transition-colors resize-none"
                            />
                        </div>

                        {/* Examples */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="font-montserrat text-black text-sm font-medium">Examples</label>
                                <button
                                    onClick={addExample}
                                    className="px-4 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-xs rounded-full transition-colors"
                                >
                                    + Add Example
                                </button>
                            </div>
                            <div className="space-y-4">
                                {examples.map((example, index) => (
                                    <div key={index} className="bg-white rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-montserrat text-gray-500 text-xs">
                                                Example {index + 1}
                                            </span>
                                            {examples.length > 1 && (
                                                <button
                                                    onClick={() => removeExample(index)}
                                                    className="text-red-400 hover:text-red-300 text-xs font-montserrat"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={example.input}
                                            onChange={(e) => updateExample(index, "input", e.target.value)}
                                            placeholder="Input"
                                            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-montserrat text-sm text-black placeholder:text-gray-400 mb-2 focus:outline-none focus:border-[#DCC8FE]"
                                        />
                                        <input
                                            type="text"
                                            value={example.output}
                                            onChange={(e) => updateExample(index, "output", e.target.value)}
                                            placeholder="Output"
                                            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-montserrat text-sm text-black placeholder:text-gray-400 mb-2 focus:outline-none focus:border-[#DCC8FE]"
                                        />
                                        <input
                                            type="text"
                                            value={example.explanation || ""}
                                            onChange={(e) => updateExample(index, "explanation", e.target.value)}
                                            placeholder="Explanation (optional)"
                                            className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Constraints */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="font-montserrat text-black text-sm font-medium">Constraints</label>
                                <button
                                    onClick={addConstraint}
                                    className="px-4 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-xs rounded-full transition-colors"
                                >
                                    + Add Constraint
                                </button>
                            </div>
                            <div className="space-y-2">
                                {constraints.map((constraint, index) => (
                                    <div key={index} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={constraint}
                                            onChange={(e) => updateConstraint(index, e.target.value)}
                                            placeholder="e.g., 1 <= nums.length <= 10^4"
                                            className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 font-montserrat text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE]"
                                        />
                                        {constraints.length > 1 && (
                                            <button
                                                onClick={() => removeConstraint(index)}
                                                className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-montserrat text-xs rounded-full transition-colors"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Test Cases */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <label className="font-montserrat text-black text-sm font-medium">Test Cases</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleValidateTestCases}
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-xs rounded-full transition-colors"
                                    >
                                        Validate
                                    </button>
                                    <button
                                        onClick={addTestCase}
                                        className="px-4 py-2 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat text-xs rounded-full transition-colors"
                                    >
                                        + Add Test Case
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {testCases.map((testCase, index) => (
                                    <div key={index} className="bg-white rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="font-montserrat text-gray-500 text-xs">
                                                Test Case {index + 1}
                                            </span>
                                            {testCases.length > 1 && (
                                                <button
                                                    onClick={() => removeTestCase(index)}
                                                    className="text-red-400 hover:text-red-300 text-xs font-montserrat"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-montserrat text-gray-500 text-xs mb-1">
                                                    Input
                                                </label>
                                                <textarea
                                                    value={testCase.input}
                                                    onChange={(e) => updateTestCase(index, "input", e.target.value)}
                                                    placeholder="Input data"
                                                    rows={3}
                                                    className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-montserrat text-gray-500 text-xs mb-1">
                                                    Expected Output
                                                </label>
                                                <textarea
                                                    value={testCase.expectedOutput}
                                                    onChange={(e) =>
                                                        updateTestCase(index, "expectedOutput", e.target.value)
                                                    }
                                                    placeholder="Expected output"
                                                    rows={3}
                                                    className="w-full bg-gray-50 border border-gray-300 rounded px-3 py-2 font-mono text-sm text-black placeholder:text-gray-400 focus:outline-none focus:border-[#DCC8FE] resize-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="flex gap-4 justify-end">
                            <Link href="/admin/questions">
                                <button className="px-8 py-3 bg-gray-200 hover:bg-gray-300 text-black font-montserrat text-sm rounded-full transition-colors">
                                    Cancel
                                </button>
                            </Link>
                            <button
                                onClick={handleSubmit}
                                className="px-8 py-3 bg-[#DCC8FE] hover:bg-[#d4b8f7] text-black font-montserrat font-medium text-sm rounded-full transition-colors"
                            >
                                Create Question
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

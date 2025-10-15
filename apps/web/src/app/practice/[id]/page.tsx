'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';

const mockQuestionData: { [key: number]: any } = {
    1: {
        title: 'Two Sum',
        difficulty: 'EASY',
        topics: ['Arrays', 'Hash Table'],
        description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
        examples: [
            {
                input: 'nums = [2,7,11,15], target = 9',
                output: '[0,1]',
                explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
            },
            {
                input: 'nums = [3,2,4], target = 6',
                output: '[1,2]',
                explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
            }
        ],
        constraints: [
            '2 <= nums.length <= 10⁴',
            '-10⁹ <= nums[i] <= 10⁹',
            '-10⁹ <= target <= 10⁹',
            'Only one valid answer exists.'
        ]
    },
};

export default function PracticePage() {
    const router = useRouter();
    const params = useParams();
    const questionId = Number(params.id);

    const [leftWidth, setLeftWidth] = useState(40);
    const [codeHeight, setCodeHeight] = useState(60);
    const [isDraggingVertical, setIsDraggingVertical] = useState(false);
    const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
    const [activeTab, setActiveTab] = useState<'testResults' | 'customInput'>('testResults');
    const [selectedTestCase, setSelectedTestCase] = useState(1);
    const [selectedLanguage, setSelectedLanguage] = useState<'python' | 'javascript' | 'java' | 'cpp'>('python');
    const [code, setCode] = useState('# Write your solution here\n\nclass Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass');

    const containerRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);

    const question = mockQuestionData[questionId] || mockQuestionData[1];

    const languageConfig = {
        python: {
            language: 'python',
            defaultCode: '# Write your solution here\n\nclass Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        pass'
        },
        javascript: {
            language: 'javascript',
            defaultCode: '// Write your solution here\n\n/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};'
        },
        java: {
            language: 'java',
            defaultCode: '// Write your solution here\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}'
        },
        cpp: {
            language: 'cpp',
            defaultCode: '// Write your solution here\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};'
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingVertical && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const offsetX = e.clientX - containerRect.left;
                const newWidthPercent = (offsetX / containerRect.width) * 100;
                setLeftWidth(Math.min(Math.max(newWidthPercent, 20), 80));
            }

            if (isDraggingHorizontal && rightPanelRef.current) {
                const panelRect = rightPanelRef.current.getBoundingClientRect();
                const offsetY = e.clientY - panelRect.top;
                const newHeightPercent = (offsetY / panelRect.height) * 100;
                setCodeHeight(Math.min(Math.max(newHeightPercent, 30), 80));
            }
        };

        const handleMouseUp = () => {
            setIsDraggingVertical(false);
            setIsDraggingHorizontal(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isDraggingVertical || isDraggingHorizontal) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);

            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDraggingVertical, isDraggingHorizontal]);

    const handleExit = () => {
        router.push('/questions');
    };

    return (
        <div className="h-screen bg-[#1e1e1e] flex flex-col font-montserrat">
            {/* Header */}
            <header className="bg-[#2e2e2e] px-6 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]">
                <div className="flex items-center gap-6">
                    <h1 className="font-mclaren text-xl text-white">PeerPrep</h1>
                    <span className="text-gray-400 text-sm">Solo Practice</span>
                </div>
                <span className="text-white text-sm">Cliff Hänger</span>
                <button
                    onClick={handleExit}
                    className="px-4 py-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-medium transition-colors"
                >
                    Exit
                </button>
            </header>

            {/* Main Content */}
            <div ref={containerRef} className="flex-1 flex overflow-hidden">
                {/* Left Panel - Question */}
                <div
                    className="bg-[#252525] overflow-y-auto"
                    style={{
                        width: `${leftWidth}%`,
                        pointerEvents: isDraggingVertical || isDraggingHorizontal ? 'none' : 'auto'
                    }}
                >
                    <div className="p-6">
                        {/* Question Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-3">
                                <h2 className="text-2xl font-semibold text-white">{question.title}</h2>
                                <span className={`text-xs px-3 py-1 rounded font-medium uppercase ${question.difficulty === 'EASY' ? 'bg-[#4a5a3a] text-[#a8d08d]' :
                                    question.difficulty === 'MEDIUM' ? 'bg-[#5a4a3a] text-[#f4b942]' :
                                        'bg-[#5a3a3a] text-[#f4a2a2]'
                                    }`}>
                                    {question.difficulty}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {question.topics.map((topic: string) => (
                                    <span key={topic} className="text-sm text-gray-400">{topic}</span>
                                ))}
                            </div>
                        </div>

                        {/* Question Description */}
                        <div className="space-y-4 text-gray-300 text-sm leading-relaxed">
                            <p className="whitespace-pre-line">{question.description}</p>

                            {/* Examples */}
                            {question.examples.map((example: any, idx: number) => (
                                <div key={idx} className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e3e]">
                                    <p className="font-semibold text-white mb-2">Example {idx + 1}:</p>
                                    <div className="font-mono text-xs space-y-1">
                                        <p><span className="text-gray-500">Input:</span> <span className="text-gray-300">{example.input}</span></p>
                                        <p><span className="text-gray-500">Output:</span> <span className="text-gray-300">{example.output}</span></p>
                                        <p><span className="text-gray-500">Explanation:</span> <span className="text-gray-400">{example.explanation}</span></p>
                                    </div>
                                </div>
                            ))}

                            {/* Constraints */}
                            <div>
                                <p className="font-semibold text-white mb-2">Constraints:</p>
                                <ul className="list-disc list-inside text-gray-400 space-y-1 text-xs">
                                    {question.constraints.map((constraint: string, idx: number) => (
                                        <li key={idx}>{constraint}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vertical Resizer */}
                <div
                    className="w-1 bg-[#3e3e3e] hover:bg-[#5e5e5e] cursor-col-resize transition-colors relative z-50"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsDraggingVertical(true);
                        document.body.style.cursor = 'col-resize';
                        document.body.style.userSelect = 'none';
                    }}
                />

                {/* Right Panel - Code Editor & Test Cases */}
                <div
                    ref={rightPanelRef}
                    className="flex-1 flex flex-col bg-[#1e1e1e]"
                    style={{
                        pointerEvents: isDraggingVertical || isDraggingHorizontal ? 'none' : 'auto'
                    }}
                >
                    {/* Code Editor Section */}
                    <div
                        className="bg-[#1e1e1e] overflow-hidden"
                        style={{ height: `${codeHeight}%` }}
                    >
                        <div className="h-full flex flex-col">
                            {/* Code Editor Header */}
                            <div className="bg-[#2e2e2e] px-4 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <select
                                            value={selectedLanguage}
                                            onChange={(e) => {
                                                const newLang = e.target.value as 'python' | 'javascript' | 'java' | 'cpp';
                                                setSelectedLanguage(newLang);
                                                setCode(languageConfig[newLang].defaultCode);
                                            }}
                                            className="bg-transparent border-2 border-white/20 rounded-full pl-4 pr-10 py-1.5 font-montserrat font-medium text-sm text-white appearance-none cursor-pointer focus:outline-none focus:border-white/40 transition-colors"
                                        >
                                            <option value="python" className="bg-[#2e2e2e] text-white">Python 3.8</option>
                                            <option value="javascript" className="bg-[#2e2e2e] text-white">JavaScript</option>
                                            <option value="java" className="bg-[#2e2e2e] text-white">Java</option>
                                            <option value="cpp" className="bg-[#2e2e2e] text-white">C++</option>
                                        </select>
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                            <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                                                <path d="M1 1L6 6L11 1" stroke="#9e9e9e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-1.5 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-sm font-medium transition-colors">
                                        Run Code
                                    </button>
                                    <button className="px-4 py-1.5 bg-[#F1FCAC] hover:bg-[#e5f099] text-black text-sm font-medium transition-colors">
                                        Submit
                                    </button>
                                </div>
                            </div>

                            {/* Code Editor Area with Monaco Editor */}
                            <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
                                <Editor
                                    height="100%"
                                    language={languageConfig[selectedLanguage].language}
                                    value={code}
                                    onChange={(value) => setCode(value || '')}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: 14,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: 4,
                                        wordWrap: 'on',
                                        lineNumbers: 'on',
                                        glyphMargin: false,
                                        folding: true,
                                        lineDecorationsWidth: 10,
                                        lineNumbersMinChars: 3,
                                        renderLineHighlight: 'line',
                                        bracketPairColorization: {
                                            enabled: true
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Horizontal Resizer */}
                    <div
                        className="h-1 bg-[#3e3e3e] hover:bg-[#5e5e5e] cursor-row-resize transition-colors relative z-50"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsDraggingHorizontal(true);
                            document.body.style.cursor = 'row-resize';
                            document.body.style.userSelect = 'none';
                        }}
                    />

                    {/* Test Cases Section */}
                    <div className="flex-1 bg-[#252525] overflow-hidden flex flex-col">
                        {/* Tab Navigation */}
                        <div className="bg-[#2e2e2e] px-4 flex items-center gap-1 border-b border-[#3e3e3e]">
                            <button
                                onClick={() => setActiveTab('testResults')}
                                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'testResults'
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                Test Results
                                {activeTab === 'testResults' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('customInput')}
                                className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${activeTab === 'customInput'
                                    ? 'text-white'
                                    : 'text-gray-400 hover:text-gray-300'
                                    }`}
                            >
                                Custom Input
                                {activeTab === 'customInput' && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>
                                )}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {activeTab === 'testResults' ? (
                                <div>
                                    {/* Test Case Selector */}
                                    <div className="flex items-center gap-2 mb-4">
                                        <button
                                            onClick={() => setSelectedTestCase(1)}
                                            className={`flex items-center gap-1 ${selectedTestCase === 1 ? '' : 'opacity-50'}`}
                                        >
                                            <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#F1FCAC] text-black text-xs font-bold">
                                                ✓
                                            </span>
                                            <span className="text-white text-sm font-medium ml-1">Test 1</span>
                                        </button>
                                        <button
                                            onClick={() => setSelectedTestCase(2)}
                                            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-medium transition-colors ${selectedTestCase === 2
                                                ? 'bg-[#3e3e3e] text-white'
                                                : 'text-gray-400 hover:text-white hover:bg-[#2e2e2e]'
                                                }`}
                                        >
                                            2
                                        </button>
                                    </div>

                                    {/* Test Results Display */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-white block mb-2 text-sm font-medium">Input</label>
                                            <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                {selectedTestCase === 1 ? 'nums = [2,7,11,15], target = 9' : 'nums = [3,2,4], target = 6'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-white block mb-2 text-sm font-medium">Your Output</label>
                                            <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                {selectedTestCase === 1 ? '[0,1]' : '[1,2]'}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-white block mb-2 text-sm font-medium">Expected Output</label>
                                            <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                {selectedTestCase === 1 ? '[0,1]' : '[1,2]'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-white block mb-2 text-sm font-medium">Custom Input</label>
                                        <textarea
                                            className="w-full bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300 resize-none focus:outline-none focus:border-[#5e5e5e] transition-colors"
                                            rows={6}
                                            placeholder="Enter your custom test input here..."
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-4 py-2 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-sm font-medium transition-colors">
                                            Run with Custom Input
                                        </button>
                                    </div>
                                    <div>
                                        <label className="text-white block mb-2 text-sm font-medium">Output</label>
                                        <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-500 min-h-[100px]">
                                            Output will appear here after running...
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Editor from '@monaco-editor/react';
import DifficultyTag from '@/components/DifficultyTag';
import MarkdownContent from '@/components/MarkdownContent';
import LoadingSpinner from '@/components/LoadingSpinner';
import { EDITOR_CONFIG, LAYOUT_DEFAULTS } from '@/lib/constants';
import { getQuestionById, QuestionDetail, runCode, submitSolution, TestCaseResult, getSimilarQuestions, QuestionListItem } from '@/lib/api/questionService';
import { ProgrammingLanguage } from '@/lib/types';
import { useAuth } from '@/hooks/useAuth';
import { removeExamplesFromDescription } from '@/lib/utils';


export default function PracticePage() {
    const router = useRouter();
    const params = useParams();
    const questionId = Number(params.id);
    const { user } = useAuth();

    const [leftWidth, setLeftWidth] = useState<number>(LAYOUT_DEFAULTS.LEFT_PANEL_WIDTH_PERCENT);
    const [codeHeight, setCodeHeight] = useState<number>(LAYOUT_DEFAULTS.CODE_HEIGHT_PERCENT);
    const [isDraggingVertical, setIsDraggingVertical] = useState(false);
    const [isDraggingHorizontal, setIsDraggingHorizontal] = useState(false);
    const [activeTab, setActiveTab] = useState<'testResults' | 'customInput'>('testResults');
    const [selectedTestCase, setSelectedTestCase] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState<ProgrammingLanguage>(ProgrammingLanguage.PYTHON);
    const [code, setCode] = useState('');

    // Question data state
    const [question, setQuestion] = useState<QuestionDetail | null>(null);
    const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
    const [questionError, setQuestionError] = useState<string | null>(null);

    // Similar questions state
    const [similarQuestions, setSimilarQuestions] = useState<QuestionListItem[]>([]);
    const [isLoadingSimilar, setIsLoadingSimilar] = useState(true);

    // Test execution state
    const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [executionError, setExecutionError] = useState<string | null>(null);

    // Custom input state
    const [customInput, setCustomInput] = useState('');
    const [customOutput, setCustomOutput] = useState<string | null>(null);
    const [customError, setCustomError] = useState<string | null>(null);
    const [isRunningCustom, setIsRunningCustom] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const rightPanelRef = useRef<HTMLDivElement>(null);

    // Helper function to get localStorage key for code
    const getCodeStorageKey = (qId: number, lang: ProgrammingLanguage) => {
        return `peerprep_code_q${qId}_${lang}`;
    };

    // Fetch question data on mount
    useEffect(() => {
        const fetchQuestion = async () => {
            setIsLoadingQuestion(true);
            setQuestionError(null);
            try {
                const data = await getQuestionById(questionId);
                setQuestion(data);

                // Try to load saved code from localStorage first
                const savedCode = localStorage.getItem(getCodeStorageKey(questionId, selectedLanguage));

                if (savedCode) {
                    setCode(savedCode);
                } else {
                    // Fall back to template if no saved code
                    const template = data.code_templates[selectedLanguage];
                    if (template) {
                        setCode(template);
                    }
                }
            } catch (err) {
                setQuestionError(err instanceof Error ? err.message : 'Failed to load question');
            } finally {
                setIsLoadingQuestion(false);
            }
        };

        fetchQuestion();
    }, [questionId]);

    // Fetch similar questions on mount
    useEffect(() => {
        const fetchSimilar = async () => {
            setIsLoadingSimilar(true);
            try {
                const similar = await getSimilarQuestions(questionId, 5);
                setSimilarQuestions(similar);
            } catch (err) {
                console.error('Failed to load similar questions:', err);
            } finally {
                setIsLoadingSimilar(false);
            }
        };

        fetchSimilar();
    }, [questionId]);

    // Update code when language changes
    useEffect(() => {
        if (question) {
            // Try to load saved code from localStorage first
            const savedCode = localStorage.getItem(getCodeStorageKey(questionId, selectedLanguage));

            if (savedCode) {
                setCode(savedCode);
            } else {
                // Fall back to template if no saved code
                const template = question.code_templates[selectedLanguage];
                if (template) {
                    setCode(template);
                }
            }
        }
    }, [selectedLanguage, question]);

    // Save code to localStorage whenever it changes
    useEffect(() => {
        if (code && question) {
            localStorage.setItem(getCodeStorageKey(questionId, selectedLanguage), code);
        }
    }, [code, questionId, selectedLanguage, question]);

    // Initialize custom input with example when switching to that tab
    useEffect(() => {
        if (activeTab === 'customInput' && !customInput && question && question.sample_test_cases.length > 0) {
            setCustomInput(getExampleInput());
        }
    }, [activeTab, question]);

    // Handle Run Code button
    const handleRunCode = async () => {
        if (!question || !code) return;

        setIsRunning(true);
        setExecutionError(null);
        setActiveTab('testResults');

        try {
            // Run code - will use sample test cases by default
            const response = await runCode(questionId, {
                language: selectedLanguage,
                code: code,
                // Don't specify test_case_ids to run against sample cases
            });

            setTestResults(response.results);
        } catch (err) {
            setExecutionError(err instanceof Error ? err.message : 'Failed to run code');
            setTestResults([]);
        } finally {
            setIsRunning(false);
        }
    };

    // Handle Submit Code button
    const handleSubmitCode = async () => {
        if (!question || !code) return;

        setIsRunning(true);
        setExecutionError(null);
        setActiveTab('testResults');

        try {
            // Submit solution - runs ALL test cases
            const response = await submitSolution(questionId, {
                language: selectedLanguage,
                code: code,
            });

            // Prepare submission result data to pass to results page
            const submissionData = {
                submission_id: response.submission_id,
                question_id: questionId,
                question_title: question.title,
                difficulty: question.difficulty,
                status: response.status,
                passed_test_cases: response.passed_test_cases,
                total_test_cases: response.total_test_cases,
                runtime_ms: response.runtime_ms,
                memory_mb: response.memory_mb,
                runtime_percentile: response.runtime_percentile,
                memory_percentile: response.memory_percentile,
                timestamp: new Date().toISOString(),
                language: selectedLanguage,
            };

            // Redirect to submission results page with data
            const dataParam = encodeURIComponent(JSON.stringify(submissionData));
            router.push(`/practice/${questionId}/submission?data=${dataParam}`);
        } catch (err) {
            setExecutionError(err instanceof Error ? err.message : 'Failed to submit code');
            setTestResults([]);
            setIsRunning(false);
        }
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDraggingVertical && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const offsetX = e.clientX - containerRect.left;
                const newWidthPercent = (offsetX / containerRect.width) * 100;
                setLeftWidth(Math.min(Math.max(newWidthPercent, LAYOUT_DEFAULTS.MIN_PANEL_WIDTH_PERCENT), LAYOUT_DEFAULTS.MAX_PANEL_WIDTH_PERCENT));
            }

            if (isDraggingHorizontal && rightPanelRef.current) {
                const panelRect = rightPanelRef.current.getBoundingClientRect();
                const offsetY = e.clientY - panelRect.top;
                const newHeightPercent = (offsetY / panelRect.height) * 100;
                setCodeHeight(Math.min(Math.max(newHeightPercent, LAYOUT_DEFAULTS.MIN_PANEL_HEIGHT_PERCENT), LAYOUT_DEFAULTS.MAX_PANEL_HEIGHT_PERCENT));
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

    // Handle Run Custom Input
    const handleRunCustomInput = async () => {
        if (!question || !code || !customInput.trim()) {
            setCustomError('Please enter custom input');
            return;
        }

        setIsRunningCustom(true);
        setCustomError(null);
        setCustomOutput(null);

        try {
            // Parse the custom input JSON
            let inputData: Record<string, any>;
            try {
                inputData = JSON.parse(customInput);
            } catch (parseError) {
                throw new Error('Invalid JSON format. Please check your input.');
            }

            // Call the question service's run endpoint with custom_input
            const response = await runCode(questionId, {
                language: selectedLanguage,
                code: code,
                custom_input: inputData,
            });

            // Format the output from the first (and only) result
            if (response.results.length > 0) {
                const result = response.results[0];
                let outputText = '';

                if (result.error) {
                    outputText = `❌ Error:\n${result.error}`;
                    setCustomError(result.error);
                } else {
                    outputText = `✅ Execution successful!\n\n`;
                    outputText += `Output: ${JSON.stringify(result.actual_output, null, 2)}\n\n`;

                    if (result.runtime_ms !== null && result.runtime_ms !== undefined) {
                        outputText += `Runtime: ${result.runtime_ms.toFixed(2)} ms\n`;
                    }
                    if (result.memory_mb !== null && result.memory_mb !== undefined) {
                        outputText += `Memory: ${result.memory_mb.toFixed(2)} MB\n`;
                    }
                }

                setCustomOutput(outputText);
            } else {
                throw new Error('No results returned from execution');
            }

        } catch (err) {
            setCustomError(err instanceof Error ? err.message : 'Failed to run custom input');
            setCustomOutput(null);
        } finally {
            setIsRunningCustom(false);
        }
    };

    // Generate example input based on first sample test case
    const getExampleInput = () => {
        if (!question || !question.sample_test_cases || question.sample_test_cases.length === 0) {
            return '{}';
        }
        return JSON.stringify(question.sample_test_cases[0].input_data, null, 2);
    };

    // Get parameter names from function signature
    const getParameterNames = () => {
        if (!question || !question.function_signature) {
            return [];
        }
        return question.function_signature.arguments.map((arg: any) => arg.name);
    };

    if (isLoadingQuestion) {
        return <LoadingSpinner message="Loading practice question..." />;
    }

    if (questionError) {
        return (
            <div className="h-screen bg-[#1e1e1e] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 text-lg mb-4">{questionError}</p>
                    <button
                        onClick={() => router.push('/questions')}
                        className="px-6 py-2 bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
                    >
                        Back to Questions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen bg-[#1e1e1e] flex flex-col font-montserrat">
            {/* Header */}
            <header className="bg-[#2e2e2e] px-6 py-2.5 flex items-center justify-between border-b border-[#3e3e3e]">
                <div className="flex items-center gap-6">
                    <h1
                        className="font-mclaren text-xl text-white cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => router.push('/home')}
                    >
                        PeerPrep
                    </h1>
                    <span className="text-gray-400 text-sm">Solo Practice</span>
                </div>
                <span className="text-white text-sm">{user?.display_name || 'User'}</span>
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
                        {isLoadingQuestion ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-white">Loading question...</div>
                            </div>
                        ) : questionError ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-red-500">{questionError}</div>
                            </div>
                        ) : question ? (
                            <>
                                {/* Back Button */}
                                <button
                                    onClick={() => router.push('/questions')}
                                    className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 group"
                                >
                                    <svg
                                        className="w-4 h-4 transition-transform group-hover:-translate-x-1"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    <span className="text-sm font-medium">Back to Questions</span>
                                </button>

                                <div className="mb-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-2xl font-semibold text-white">{question.title}</h2>
                                        <DifficultyTag difficulty={question.difficulty} />
                                        {question.deleted_at && (
                                            <span className="px-3 py-1 bg-red-900/30 text-red-400 text-xs rounded-md font-medium border border-red-700/30">
                                                Question Removed
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        {question.topics.map((topic) => (
                                            <span key={topic.id} className="text-sm text-gray-400">{topic.name}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <MarkdownContent content={removeExamplesFromDescription(question.description)} />

                                    {question.sample_test_cases.map((testCase: any, idx: number) => (
                                        <div key={idx} className="bg-[#1e1e1e] p-4 rounded-lg border border-[#3e3e3e]">
                                            <p className="font-semibold text-white mb-2">Example {idx + 1}:</p>
                                            <div className="font-mono text-xs space-y-1">
                                                <p><span className="text-gray-500">Input:</span> <span className="text-gray-300">{JSON.stringify(testCase.input_data)}</span></p>
                                                <p><span className="text-gray-500">Output:</span> <span className="text-gray-300">{JSON.stringify(testCase.expected_output)}</span></p>
                                                {testCase.explanation && (
                                                    <p><span className="text-gray-500">Explanation:</span> <span className="text-gray-400">{testCase.explanation}</span></p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Similar Questions Section */}
                                {!isLoadingSimilar && similarQuestions.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-[#3e3e3e]">
                                        <h3 className="text-white font-semibold mb-4 text-sm">Similar Questions</h3>
                                        <div className="space-y-2">
                                            {similarQuestions.map((similar) => (
                                                <div
                                                    key={similar.id}
                                                    onClick={() => router.push(`/practice/${similar.id}`)}
                                                    className="bg-[#1e1e1e] border border-[#3e3e3e] hover:border-[#5e5e5e] rounded-lg p-3 cursor-pointer transition-all hover:bg-[#252525] group"
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-white text-sm transition-colors">{similar.title}</span>
                                                        <DifficultyTag difficulty={similar.difficulty} />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {similar.topics.slice(0, 3).map((topic) => (
                                                            <span key={topic.id} className="text-xs text-gray-500">{topic.name}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}
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
                                                setSelectedLanguage(e.target.value as ProgrammingLanguage);
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
                                    <button
                                        onClick={handleRunCode}
                                        disabled={isRunning || !question}
                                        className="px-4 py-1.5 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRunning ? 'Running...' : 'Run Code'}
                                    </button>
                                    <button
                                        onClick={handleSubmitCode}
                                        disabled={isRunning || !question}
                                        className="px-4 py-1.5 bg-profile-avatar hover:bg-profile-avatar-hover text-black text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isRunning ? 'Submitting...' : 'Submit'}
                                    </button>
                                </div>
                            </div>

                            {/* Code Editor Area with Monaco Editor */}
                            <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
                                <Editor
                                    height="100%"
                                    language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
                                    value={code}
                                    onChange={(value) => setCode(value || '')}
                                    theme="vs-dark"
                                    options={{
                                        fontSize: EDITOR_CONFIG.FONT_SIZE,
                                        minimap: { enabled: false },
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        tabSize: EDITOR_CONFIG.TAB_SIZE,
                                        wordWrap: 'on',
                                        lineNumbers: 'on',
                                        glyphMargin: false,
                                        folding: true,
                                        lineDecorationsWidth: EDITOR_CONFIG.LINE_DECORATIONS_WIDTH,
                                        lineNumbersMinChars: EDITOR_CONFIG.LINE_NUMBERS_MIN_CHARS,
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
                        <div className="flex-1 overflow-y-auto p-4 relative">
                            {activeTab === 'testResults' ? (
                                <div>
                                    {/* Loading Overlay */}
                                    {isRunning && (
                                        <div className="absolute inset-0 bg-[#252525]/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                                            <div className="flex flex-col items-center gap-4">
                                                {/* Animated spinner */}
                                                <div className="relative">
                                                    <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
                                                    <div className="w-16 h-16 border-4 border-profile-avatar rounded-full border-t-transparent animate-spin absolute top-0"></div>
                                                </div>

                                                {/* Status message */}
                                                <div className="text-center">
                                                    <p className="text-white font-semibold text-lg mb-1">Running Code...</p>
                                                    <p className="text-gray-400 text-sm">Executing test cases</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {executionError && (
                                        <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">
                                            {executionError}
                                        </div>
                                    )}

                                    {testResults.length === 0 ? (
                                        <div className="text-gray-400 text-center py-8">
                                            Run your code to see test results
                                        </div>
                                    ) : (
                                        <>
                                            {/* Test Case Selector */}
                                            <div className="flex items-center gap-2 mb-4 flex-wrap">
                                                {testResults.map((result, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedTestCase(idx)}
                                                        className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${selectedTestCase === idx
                                                            ? 'bg-[#3e3e3e]'
                                                            : 'bg-[#2e2e2e] hover:bg-[#3a3a3a]'
                                                            }`}
                                                    >
                                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${result.passed
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-red-500 text-white'
                                                            }`}>
                                                            {result.passed ? '✓' : '✗'}
                                                        </span>
                                                        <span className="text-white text-sm font-medium ml-1">
                                                            Test {idx + 1}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Selected Test Result Display */}
                                            {testResults[selectedTestCase] && (
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-white block mb-2 text-sm font-medium">Result</label>
                                                        <div className={`p-3 rounded font-medium text-sm ${testResults[selectedTestCase].passed
                                                            ? 'bg-green-900/20 border border-green-500 text-green-300'
                                                            : 'bg-red-900/20 border border-red-500 text-red-300'
                                                            }`}>
                                                            {testResults[selectedTestCase].passed ? '✓ Passed' : '✗ Failed'}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-white block mb-2 text-sm font-medium">Input</label>
                                                        <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                            {JSON.stringify(testResults[selectedTestCase].input_data, null, 2)}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-white block mb-2 text-sm font-medium">Your Output</label>
                                                        <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                            {testResults[selectedTestCase].actual_output !== null
                                                                ? JSON.stringify(testResults[selectedTestCase].actual_output, null, 2)
                                                                : 'No output'}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <label className="text-white block mb-2 text-sm font-medium">Expected Output</label>
                                                        <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                            {JSON.stringify(testResults[selectedTestCase].expected_output, null, 2)}
                                                        </div>
                                                    </div>

                                                    {testResults[selectedTestCase].error && (
                                                        <div>
                                                            <label className="text-white block mb-2 text-sm font-medium">Error</label>
                                                            <div className="bg-[#1e1e1e] border border-red-500 p-3 rounded font-mono text-sm text-red-300">
                                                                {testResults[selectedTestCase].error}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {(testResults[selectedTestCase].runtime_ms !== null || testResults[selectedTestCase].memory_mb !== null) && (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            {testResults[selectedTestCase].runtime_ms !== null && (
                                                                <div>
                                                                    <label className="text-white block mb-2 text-sm font-medium">Runtime</label>
                                                                    <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                                        {testResults[selectedTestCase].runtime_ms?.toFixed(2)} ms
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {testResults[selectedTestCase].memory_mb !== null && (
                                                                <div>
                                                                    <label className="text-white block mb-2 text-sm font-medium">Memory</label>
                                                                    <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300">
                                                                        {testResults[selectedTestCase].memory_mb?.toFixed(2)} MB
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 relative">
                                    {/* Loading Overlay for Custom Input */}
                                    {isRunningCustom && (
                                        <div className="absolute inset-0 bg-[#252525]/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-16 h-16 border-4 border-gray-700 rounded-full"></div>
                                                    <div className="w-16 h-16 border-4 border-profile-avatar rounded-full border-t-transparent animate-spin absolute top-0"></div>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-white font-semibold text-lg mb-1">Running Code...</p>
                                                    <p className="text-gray-400 text-sm">Executing with custom input</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Help text */}
                                    <div className="bg-[#2e2e2e] border border-[#3e3e3e] p-3 rounded">
                                        <p className="text-gray-400 text-xs mb-2">
                                            💡 <span className="font-semibold">How to use:</span> Enter input as JSON with parameter names as keys
                                        </p>
                                        {question && question.function_signature && (
                                            <div className="text-xs text-gray-500 font-mono">
                                                Parameters: {question.function_signature.arguments.map((arg: any) => arg.name).join(', ')}
                                            </div>
                                        )}
                                    </div>

                                    {/* Custom Input */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-white text-sm font-medium">Custom Input</label>
                                            {question && question.sample_test_cases && question.sample_test_cases.length > 0 && (
                                                <button
                                                    onClick={() => setCustomInput(getExampleInput())}
                                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                                >
                                                    Load Example
                                                </button>
                                            )}
                                        </div>
                                        <textarea
                                            value={customInput}
                                            onChange={(e) => setCustomInput(e.target.value)}
                                            className="w-full bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm text-gray-300 resize-none focus:outline-none focus:border-[#5e5e5e] transition-colors"
                                            rows={8}
                                            placeholder={`Example format:\n${getExampleInput()}`}
                                        />
                                    </div>

                                    {/* Run Button */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleRunCustomInput}
                                            disabled={isRunningCustom || !question || !customInput.trim()}
                                            className="px-4 py-2 bg-[#3e3e3e] hover:bg-[#4e4e4e] text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isRunningCustom ? 'Running...' : 'Run with Custom Input'}
                                        </button>
                                        {customInput && (
                                            <button
                                                onClick={() => {
                                                    setCustomInput('');
                                                    setCustomOutput(null);
                                                    setCustomError(null);
                                                }}
                                                className="px-4 py-2 bg-transparent border border-[#3e3e3e] hover:border-[#5e5e5e] text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>

                                    {/* Error Display */}
                                    {customError && (
                                        <div className="p-3 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">
                                            {customError}
                                        </div>
                                    )}

                                    {/* Output */}
                                    <div>
                                        <label className="text-white block mb-2 text-sm font-medium">Output</label>
                                        <div className="bg-[#1e1e1e] border border-[#3e3e3e] p-3 rounded font-mono text-sm min-h-[150px]">
                                            {customOutput ? (
                                                <pre className="text-gray-300 whitespace-pre-wrap">{customOutput}</pre>
                                            ) : (
                                                <span className="text-gray-500">Output will appear here after running...</span>
                                            )}
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
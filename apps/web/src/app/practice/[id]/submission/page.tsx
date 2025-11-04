'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getDifficultyStyles } from '@/lib/difficulty';

// Simple SVG Icon Components
const CheckCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircle = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Clock = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Cpu = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const ArrowLeft = ({ className }: { className?: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

interface SubmissionResult {
    submission_id: string;
    question_id: number;
    question_title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    status: string;
    passed_test_cases: number;
    total_test_cases: number;
    runtime_ms?: number;
    memory_mb?: number;
    runtime_percentile?: number;
    memory_percentile?: number;
    timestamp: string;
    language: string;
}

const getStatusConfig = (status: string, passed: number, total: number) => {
    if (status === 'accepted') {
        return {
            icon: CheckCircle,
            color: 'text-green-300',
            bgColor: 'bg-green-900/20',
            borderColor: 'border-green-500',
            title: 'Accepted',
            message: 'Congratulations! Your solution passed all test cases.',
        };
    }

    const statusMap: Record<string, any> = {
        'wrong_answer': {
            icon: XCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-900/20',
            borderColor: 'border-red-500',
            title: 'Wrong Answer',
            message: `Your solution failed some test cases. ${passed} out of ${total} passed.`,
        },
        'time_limit_exceeded': {
            icon: Clock,
            color: 'text-yellow-400',
            bgColor: 'bg-yellow-900/20',
            borderColor: 'border-yellow-500',
            title: 'Time Limit Exceeded',
            message: 'Your solution took too long to execute.',
        },
        'runtime_error': {
            icon: XCircle,
            color: 'text-red-400',
            bgColor: 'bg-red-900/20',
            borderColor: 'border-red-500',
            title: 'Runtime Error',
            message: 'Your solution encountered an error during execution.',
        },
        'compilation_error': {
            icon: XCircle,
            color: 'text-orange-400',
            bgColor: 'bg-orange-900/20',
            borderColor: 'border-orange-500',
            title: 'Compilation Error',
            message: 'Your code could not be compiled.',
        },
    };

    return statusMap[status] || statusMap['wrong_answer'];
};

export default function SubmissionResultPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [submission, setSubmission] = useState<SubmissionResult | null>(null);

    useEffect(() => {
        // Get submission data from URL params
        const submissionData = searchParams.get('data');
        if (submissionData) {
            try {
                const parsed = JSON.parse(decodeURIComponent(submissionData));
                setSubmission(parsed);
            } catch (error) {
                console.error('Failed to parse submission data:', error);
                router.push('/questions');
            }
        } else {
            router.push('/questions');
        }
    }, [searchParams, router]);

    if (!submission) {
        return (
            <div className="min-h-screen bg-[#333232] flex items-center justify-center">
                <div className="text-white text-lg">Loading...</div>
            </div>
        );
    }

    const statusConfig = getStatusConfig(
        submission.status,
        submission.passed_test_cases,
        submission.total_test_cases
    );
    const StatusIcon = statusConfig.icon;
    const isPassed = submission.status === 'accepted';

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
                    <div className="flex items-center gap-6">
                        <h1
                            onClick={() => router.push('/home')}
                            className="font-mclaren text-white text-2xl md:text-3xl cursor-pointer hover:opacity-80 transition-opacity"
                        >
                            PeerPrep
                        </h1>
                        <span className="text-[#9e9e9e] text-sm font-medium">Submission Result</span>
                    </div>
                    <button
                        onClick={() => router.push(`/practice/${submission.question_id}`)}
                        className="flex items-center gap-2 px-4 py-2 bg-transparent border-2 border-white/20 hover:border-white/40 text-white text-sm font-medium transition-colors rounded-full"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Problem
                    </button>
                </div>
            </header>

            <main className="relative z-10 pt-44 pb-20 px-6 md:px-12">
                <div className="max-w-4xl mx-auto">
                    {/* Status Card */}
                    <div className={`${statusConfig.bgColor} border-2 ${statusConfig.borderColor} rounded-lg p-8 mb-8`}>
                        <div className="flex items-start gap-6">
                            <StatusIcon className={`w-16 h-16 ${statusConfig.color} flex-shrink-0`} />
                            <div className="flex-1">
                                <h2 className={`text-3xl font-bold ${statusConfig.color} mb-2`}>
                                    {statusConfig.title}
                                </h2>
                                <p className="text-white text-lg mb-4">{statusConfig.message}</p>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className="text-white font-medium">{submission.question_title}</span>
                                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold uppercase ${getDifficultyStyles(submission.difficulty)}`}>
                                        {submission.difficulty}
                                    </span>
                                    <span className="text-[#9e9e9e] text-sm">
                                        {submission.language.charAt(0).toUpperCase() + submission.language.slice(1)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Test Cases Result */}
                    <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg p-6 mb-8">
                        <h3 className="text-white text-xl font-semibold mb-4">Test Cases</h3>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-center">
                                    <div className={`text-5xl font-bold ${isPassed ? 'text-green-300' : 'text-red-400'}`}>
                                        {submission.passed_test_cases}
                                    </div>
                                    <div className="text-[#9e9e9e] text-sm mt-1">Passed</div>
                                </div>
                                <div className="text-white text-2xl">/</div>
                                <div className="text-center">
                                    <div className="text-5xl font-bold text-white">
                                        {submission.total_test_cases}
                                    </div>
                                    <div className="text-[#9e9e9e] text-sm mt-1">Total</div>
                                </div>
                            </div>

                            {/* Visual progress bar */}
                            <div className="flex-1 max-w-md ml-8">
                                <div className="bg-[#2a2a2a] rounded-full h-6 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${isPassed ? 'bg-green-400' : 'bg-red-500'}`}
                                        style={{
                                            width: `${(submission.passed_test_cases / submission.total_test_cases) * 100}%`
                                        }}
                                    />
                                </div>
                                <div className="text-center text-white text-sm mt-2 font-medium">
                                    {Math.round((submission.passed_test_cases / submission.total_test_cases) * 100)}% Success Rate
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance Metrics - Only show if accepted */}
                    {isPassed && (submission.runtime_ms !== undefined || submission.memory_mb !== undefined) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            {/* Runtime */}
                            {submission.runtime_ms !== undefined && (
                                <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Clock className="w-6 h-6 text-blue-400" />
                                        <h3 className="text-white text-lg font-semibold">Runtime</h3>
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-2">
                                        {submission.runtime_ms} ms
                                    </div>
                                    {submission.runtime_percentile != null && (
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-300" />
                                            <span className="text-green-300 text-sm font-medium">
                                                Beats {submission.runtime_percentile.toFixed(1)}% of submissions
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Memory */}
                            {submission.memory_mb !== undefined && (
                                <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <Cpu className="w-6 h-6 text-purple-400" />
                                        <h3 className="text-white text-lg font-semibold">Memory</h3>
                                    </div>
                                    <div className="text-4xl font-bold text-white mb-2">
                                        {submission.memory_mb.toFixed(2)} MB
                                    </div>
                                    {submission.memory_percentile != null && (
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-green-300" />
                                            <span className="text-green-300 text-sm font-medium">
                                                Beats {submission.memory_percentile.toFixed(1)}% of submissions
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Submission Details */}
                    <div className="bg-[#3a3a3a] border border-[#4a4a4a] rounded-lg p-6">
                        <h3 className="text-white text-xl font-semibold mb-4">Submission Details</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <div className="text-[#9e9e9e] mb-1">Submission ID</div>
                                <div className="text-white font-mono">{submission.submission_id}</div>
                            </div>
                            <div>
                                <div className="text-[#9e9e9e] mb-1">Submitted At</div>
                                <div className="text-white">
                                    {new Date(submission.timestamp).toLocaleString()}
                                </div>
                            </div>
                            <div>
                                <div className="text-[#9e9e9e] mb-1">Language</div>
                                <div className="text-white capitalize">{submission.language}</div>
                            </div>
                            <div>
                                <div className="text-[#9e9e9e] mb-1">Status</div>
                                <div className={`${statusConfig.color} font-medium capitalize`}>
                                    {submission.status.replace(/_/g, ' ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 mt-8 justify-center">
                        <button
                            onClick={() => router.push(`/practice/${submission.question_id}`)}
                            className="px-6 py-3 bg-transparent border-2 border-white/20 hover:border-white/40 text-white font-medium transition-colors rounded-full"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => router.push('/questions')}
                            className="px-6 py-3 bg-profile-avatar hover:bg-profile-avatar-hover text-black font-medium transition-colors rounded-full"
                        >
                            Browse Questions
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

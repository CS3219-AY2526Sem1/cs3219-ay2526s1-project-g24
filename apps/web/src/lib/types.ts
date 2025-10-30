// Type definitions for the web application

// ========== USER TYPES ==========

export enum ProficiencyLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
}

export enum ProgrammingLanguage {
    CPP = "cpp",
    JAVA = "java",
    PYTHON = "python",
    JAVASCRIPT = "javascript",
}

export interface Permission {
    id: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Role {
    id: number;
    name: string;
    permissions: Permission[];
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: string;
    username?: string;
    display_name?: string;
    email: string;
    avatar_url?: string;
    google_id?: string;
    description?: string;
    programming_proficiency?: ProficiencyLevel;
    preferred_language?: ProgrammingLanguage;
    roles?: Role[];
    created_at: string;
    updated_at: string;
}

// ========== AUTH ==========

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
}


export interface Session {
    user: User;
}

// ========== MATCHING TYPES ==========

export type MatchingDifficulty = "easy" | "medium" | "hard";

export type MatchStatus = 'queued' | 'matched' | 'cancelled' | 'timeout';

export interface MatchRequest {
    userId: string;
    difficulty: MatchingDifficulty;
    topics: string[];
    languages: string[];
}

export interface MatchRequestResponse {
    reqId: string;
    alreadyQueued?: boolean;
}

export interface MatchRequestStatus {
    reqId: string;
    userId: string;
    difficulty: MatchingDifficulty;
    topics: string[];
    languages: string[];
    status: MatchStatus;
    createdAt: number;
    sessionId?: string;
}

export interface MatchEvent {
    status: MatchStatus;
    sessionId?: string;
    questionId?: string;
    timestamp: number;
    elapsed?: number;
}

// ========== QUESTION TYPES ==========

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuestionSummary {
    id: string;
    title: string;
    topics: string[];
    difficulty: Difficulty;
}

export interface Question extends QuestionSummary {
    description: string;
    examples: Example[];
    constraints: string[];
    testCases?: TestCase[];
}

export interface AdminQuestionSummary extends QuestionSummary {
    createdAt: string;
    updatedAt: string;
    isDeleted: boolean;
    totalTestCases: number;
}

export interface AdminQuestion extends Question {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    isDeleted: boolean;
}

export interface QuestionInput {
    title: string;
    difficulty: Difficulty;
    topics: string[];
    description: string;
    examples?: Example[];
    constraints?: string[];
    testCases?: TestCaseInput[];
}

export interface Example {
    input: string;
    output: string;
    explanation?: string;
}

// ========== TEST CASE TYPES ==========

export interface TestCase {
    id: string;
    questionId: string;
    input: string;
    expectedOutput: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TestCaseInput {
    input: string;
    expectedOutput: string;
    isPublic?: boolean;
}

export interface TestCaseValidationResult {
    valid: boolean;
    results: {
        testCaseIndex: number;
        passed: boolean;
        error?: string;
    }[];
}

// ========== user TYPES ==========

export interface UserProfile {
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url?: string;
    google_id: string;
    description?: string;
    programming_proficiency?: "beginner" | "intermediate" | "advanced";
    created_at: string;
    updated_at: string;
}

export interface AdminUserProfile {
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url?: string;
    google_id: string;
    description?: string;
    programming_proficiency?: "beginner" | "intermediate" | "advanced";
    roles: Role[];
    created_at: string;
    updated_at: string;
    last_login?: string;
    total_sessions?: number;
    total_submissions?: number;
}

// ========== PAGINATION ==========

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export interface QueryParams {
    search?: string;
    page?: number;
    limit?: number;
}

export interface QuestionQueryParams extends QueryParams {
    difficulty?: Difficulty | "ALL";
    topics?: string[];
    includeDeleted?: boolean;
}

// ========== STATS ==========

export interface SystemStats {
    totalUsers: number;
    totalQuestions: number;
    questionsByDifficulty: {
        EASY: number;
        MEDIUM: number;
        HARD: number;
    };
    totalSessions: number;
    activeSessions: number;
}

// ========== TOPIC TYPES ==========

export interface Topic {
    name: string;
    questionCount?: number;
}

// ========== EXECUTION TYPES ==========

export interface ExecutionResult {
    results: {
        testCase: number;
        passed: boolean;
        output: string;
        expected: string;
    }[];
    passed: number;
    failed: number;
    executionTime: number;
}

// ========== IMAGE UPLOAD ==========

export interface PresignedUrlResponse {
    uploadUrl: string;
    imageUrl: string;
}

// ========== ERROR TYPES ==========

export interface ApiError {
    error: string;
    message: string;
    statusCode: number;
}

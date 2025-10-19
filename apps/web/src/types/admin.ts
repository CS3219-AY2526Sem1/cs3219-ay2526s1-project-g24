// Type definitions for Admin API responses

export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type UserRole = "USER" | "ADMIN";
export type ProgrammingLanguage = "python" | "javascript" | "java" | "cpp";

// ========== QUESTION TYPES ==========

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

// ========== USER TYPES ==========

export interface UserProfile {
    id: string;
    fullName: string;
    email: string;
    language?: string;
    proficiency?: string;
    avatarUrl?: string;
}

export interface AdminUserProfile extends UserProfile {
    role: UserRole;
    createdAt: string;
    lastLogin: string;
    totalSessions: number;
    totalSubmissions: number;
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

// ========== AUTH ==========

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: UserProfile;
}

export interface Session {
    userId: string;
    email: string;
    isAuthenticated: boolean;
}

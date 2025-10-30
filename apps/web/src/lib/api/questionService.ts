/**
 * Question Service API Client
 * Handles all interactions with the Question Service backend
 */

import { API_CONFIG } from '../apiConfig';

const QUESTION_SERVICE_URL = API_CONFIG.QUESTION_SERVICE;

// Topic and Company interfaces
export interface TopicResponse {
    id: number;
    name: string;
    description?: string;
}

export interface CompanyResponse {
    id: number;
    name: string;
    description?: string;
    question_count?: number;
}

// Test Case interfaces
export interface TestCasePublic {
    input_data: Record<string, any>;
    expected_output: any;
    explanation?: string;
    order_index: number;
}

// Question list item (lightweight for list view)
export interface QuestionListItem {
    id: number;
    title: string;
    difficulty: 'easy' | 'medium' | 'hard';
    acceptance_rate: number;
    topics: TopicResponse[];
    companies: CompanyResponse[];
    is_attempted: boolean;
    is_solved: boolean;
    deleted_at?: string | null;  // ISO timestamp or null
}

// Full question detail
export interface QuestionDetail {
    id: number;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    code_templates: Record<string, string>; // {"python": "...", "javascript": "...", etc}
    function_signature: {
        function_name: string;
        arguments: Array<{
            name: string;
            type: string;
        }>;
        return_type: string;
    };
    constraints?: string;
    hints?: string[];
    time_limit: Record<string, number>; // seconds per language
    memory_limit: Record<string, number>; // KB per language
    acceptance_rate: number;
    total_submissions: number;
    total_accepted: number;
    likes: number;
    dislikes: number;
    topics: TopicResponse[];
    companies: CompanyResponse[];
    sample_test_cases: TestCasePublic[];
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;  // ISO timestamp or null
    is_attempted: boolean;
    is_solved: boolean;
    user_attempts_count: number;
}

// Paginated response
export interface QuestionListResponse {
    questions: QuestionListItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

/**
 * Fetch all questions with pagination and filters
 * Endpoint: GET /api/v1/questions/
 */
export async function getQuestions(params?: {
    difficulties?: string; // Comma-separated: "easy,medium,hard"
    topic_ids?: string; // Comma-separated topic IDs
    company_ids?: string; // Comma-separated company IDs
    attempted_only?: boolean;
    solved_only?: boolean;
    unsolved_only?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
    sort_by?: string; // id, difficulty, acceptance_rate, title
    sort_order?: 'asc' | 'desc';
    user_id?: string;
    include_deleted?: boolean;  // Admin-only: include soft-deleted questions
}): Promise<QuestionListResponse> {
    const queryParams = new URLSearchParams();

    // Add all parameters
    if (params?.difficulties) queryParams.append('difficulties', params.difficulties);
    if (params?.topic_ids) queryParams.append('topic_ids', params.topic_ids);
    if (params?.company_ids) queryParams.append('company_ids', params.company_ids);
    if (params?.attempted_only !== undefined) queryParams.append('attempted_only', params.attempted_only.toString());
    if (params?.solved_only !== undefined) queryParams.append('solved_only', params.solved_only.toString());
    if (params?.unsolved_only !== undefined) queryParams.append('unsolved_only', params.unsolved_only.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
    if (params?.user_id) queryParams.append('user_id', params.user_id);
    if (params?.include_deleted !== undefined) queryParams.append('include_deleted', params.include_deleted.toString());

    const url = `${QUESTION_SERVICE_URL}/api/v1/questions/?${queryParams.toString()}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch a single question by ID with full details
 * Endpoint: GET /api/v1/questions/{question_id}
 */
export async function getQuestionById(id: number, userId?: string, includeDeleted?: boolean): Promise<QuestionDetail> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);
    if (includeDeleted !== undefined) queryParams.append('include_deleted', includeDeleted.toString());

    const url = `${QUESTION_SERVICE_URL}/api/v1/questions/${id}${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('Question not found');
        }
        throw new Error(`Failed to fetch question: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get a random question with optional filters
 * Endpoint: GET /api/v1/questions/random
 */
export async function getRandomQuestion(params?: {
    difficulties?: string;
    topic_ids?: string;
    company_ids?: string;
    user_id?: string;
}): Promise<QuestionDetail> {
    const queryParams = new URLSearchParams();

    if (params?.difficulties) queryParams.append('difficulties', params.difficulties);
    if (params?.topic_ids) queryParams.append('topic_ids', params.topic_ids);
    if (params?.company_ids) queryParams.append('company_ids', params.company_ids);
    if (params?.user_id) queryParams.append('user_id', params.user_id);

    const url = `${QUESTION_SERVICE_URL}/api/v1/questions/random${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('No questions found matching criteria');
        }
        throw new Error(`Failed to fetch random question: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get the daily challenge question
 * Endpoint: GET /api/v1/questions/daily
 */
export async function getDailyQuestion(userId?: string): Promise<QuestionDetail> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);

    const url = `${QUESTION_SERVICE_URL}/api/v1/questions/daily${queryParams.toString() ? `?${queryParams}` : ''}`;

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with request
    });

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('No daily question available');
        }
        throw new Error(`Failed to fetch daily question: ${response.statusText}`);
    }

    return response.json();
}

// Code Execution Interfaces
export interface TestCaseResult {
    test_case_id?: number;
    input_data: Record<string, any>;
    expected_output: any;
    actual_output: any;
    passed: boolean;
    runtime_ms?: number;
    memory_mb?: number;
    error?: string;
}

export interface CodeExecutionResponse {
    question_id: number;
    language: string;
    total_test_cases: number;
    passed_test_cases: number;
    results: TestCaseResult[];
    overall_passed: boolean;
    avg_runtime_ms?: number;
    avg_memory_mb?: number;
}

export interface CodeExecutionRequest {
    language: string;
    code: string;
    test_case_ids?: number[];
    custom_input?: Record<string, any>;
}

/**
 * Run code against sample/selected test cases
 * Endpoint: POST /api/v1/questions/{question_id}/run
 */
export async function runCode(questionId: number, request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}/run`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with request
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to run code: ${response.statusText}`);
    }

    return response.json();
}

export interface SubmissionResponse {
    submission_id: string;
    question_id: number;
    status: string; // "accepted", "wrong_answer", "time_limit_exceeded", "runtime_error", "compilation_error"
    passed_test_cases: number;
    total_test_cases: number;
    runtime_ms?: number;
    memory_mb?: number;
    runtime_percentile?: number;
    memory_percentile?: number;
    timestamp?: string;
}

export interface SubmissionRequest {
    language: string;
    code: string;
}

/**
 * Submit solution (runs all test cases)
 * Endpoint: POST /api/v1/questions/{question_id}/submit
 */
export async function submitSolution(questionId: number, request: SubmissionRequest): Promise<SubmissionResponse> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Send cookies with request
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to submit solution: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch all topics from the question service
 * Endpoint: GET /api/v1/topics
 */
export async function getTopics(): Promise<TopicResponse[]> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/topics`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Fetch all companies from the question service
 * Endpoint: GET /api/v1/companies
 */
export async function getCompanies(): Promise<CompanyResponse[]> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/companies`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`);
    }

    return response.json();
}

export interface QuestionUpdateRequest {
    title?: string;
    description?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    topic_ids?: number[];
    company_ids?: number[];
    code_templates?: Record<string, string>;
    function_signature?: {
        function_name: string;
        arguments: Array<{ name: string; type: string }>;
        return_type: string;
    };
    constraints?: string;
    hints?: string[];
    time_limit?: Record<string, number>;
    memory_limit?: Record<string, number>;
}

export interface TestCaseCreate {
    input_data: Record<string, any>;
    expected_output: any;
    visibility: 'public' | 'private' | 'sample';
    order_index: number;
    explanation?: string;
}

export interface QuestionCreateRequest {
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    topic_ids: number[];
    company_ids: number[];
    code_templates: Record<string, string>;
    function_signature: {
        function_name: string;
        arguments: Array<{ name: string; type: string }>;
        return_type: string;
    };
    constraints?: string;
    hints?: string[];
    time_limit?: Record<string, number>;
    memory_limit?: Record<string, number>;
    test_cases: TestCaseCreate[];
}

export async function updateQuestion(
    questionId: number,
    updates: QuestionUpdateRequest
): Promise<QuestionDetail> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to update question: ${response.statusText}`);
    }

    return response.json();
}

export async function createQuestion(question: QuestionCreateRequest): Promise<QuestionDetail> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(question),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to create question: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get similar questions based on topics and difficulty
 * Endpoint: GET /api/v1/questions/{question_id}/similar
 */
export async function getSimilarQuestions(questionId: number, limit: number = 5): Promise<QuestionListItem[]> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}/similar?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch similar questions: ${response.statusText}`);
    }

    return response.json();
}

// ============================================================================
// STATISTICS & ANALYTICS
// ============================================================================

export interface QuestionStats {
    question_id: number;
    total_submissions: number;
    total_accepted: number;
    acceptance_rate: number;
    likes: number;
    dislikes: number;
    average_runtime_ms?: number;
    average_memory_mb?: number;
    difficulty_distribution?: Record<string, number>;
}

export interface SubmissionSummary {
    timestamp: string;
    language: string;
    status: string;
    runtime_ms?: number;
    memory_mb?: number;
}

/**
 * Get question statistics
 * Endpoint: GET /api/v1/questions/{question_id}/stats
 */
export async function getQuestionStats(questionId: number): Promise<QuestionStats> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}/stats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch question stats: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get recent submissions for a question
 * Endpoint: GET /api/v1/questions/{question_id}/submissions
 */
export async function getQuestionSubmissions(questionId: number, limit: number = 20): Promise<SubmissionSummary[]> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}/submissions?limit=${limit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch question submissions: ${response.statusText}`);
    }

    return response.json();
}

// ============================================================================
// USER STATISTICS & PROGRESS
// ============================================================================

export interface UserStats {
    user_id: string;
    total_solved: number;
    easy_solved: number;
    medium_solved: number;
    hard_solved: number;
    total_attempted: number;
    acceptance_rate: number;
    total_submissions: number;
    streak_days: number;
}

export interface UserSolvedQuestion {
    question_id: number;
    title: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    first_solved_at?: string;
    attempts_count: number;
    best_runtime_ms?: number;
}

export interface UserAttemptResponse {
    id: number;
    user_id: string;
    question_id: number;
    is_solved: boolean;
    attempts_count: number;
    last_attempted_at: string;
    first_solved_at?: string;
    best_runtime_ms?: number;
    best_memory_mb?: number;
}

/**
 * Get current user's statistics
 * Endpoint: GET /api/v1/users/me/stats
 */
export async function getUserStats(): Promise<UserStats> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/users/me/stats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user stats: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get total question counts by difficulty
 * Makes three API calls to count questions for each difficulty
 */
export async function getQuestionCounts(): Promise<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
}> {
    try {
        // Fetch counts for each difficulty in parallel
        const [easyRes, mediumRes, hardRes] = await Promise.all([
            fetch(`${QUESTION_SERVICE_URL}/api/v1/questions?difficulties=easy&page_size=1`, {
                credentials: 'include',
            }),
            fetch(`${QUESTION_SERVICE_URL}/api/v1/questions?difficulties=medium&page_size=1`, {
                credentials: 'include',
            }),
            fetch(`${QUESTION_SERVICE_URL}/api/v1/questions?difficulties=hard&page_size=1`, {
                credentials: 'include',
            })
        ]);

        const [easyData, mediumData, hardData] = await Promise.all([
            easyRes.json(),
            mediumRes.json(),
            hardRes.json()
        ]);

        const easy = easyData.total || 0;
        const medium = mediumData.total || 0;
        const hard = hardData.total || 0;

        return {
            total: easy + medium + hard,
            easy,
            medium,
            hard
        };
    } catch (error) {
        console.error('Failed to fetch question counts:', error);
        // Return defaults if fetch fails
        return { total: 55, easy: 20, medium: 25, hard: 10 };
    }
}

/**
 * Get current user's solved questions
 * Endpoint: GET /api/v1/users/me/solved
 */
export async function getUserSolvedQuestions(): Promise<UserSolvedQuestion[]> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/users/me/solved`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch solved questions: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get current user's attempt history
 * Endpoint: GET /api/v1/users/me/attempts
 */
export async function getUserAttempts(skip: number = 0, limit: number = 50): Promise<UserAttemptResponse[]> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/users/me/attempts?skip=${skip}&limit=${limit}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch user attempts: ${response.statusText}`);
    }

    return response.json();
}

export async function deleteQuestion(questionId: number, permanent: boolean = false): Promise<void> {
    const queryParams = new URLSearchParams();
    if (permanent) queryParams.append('permanent', 'true');
    
    const url = `${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}${queryParams.toString() ? `?${queryParams}` : ''}`;
    
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to delete question: ${response.statusText}`);
    }
}

export async function restoreQuestion(questionId: number): Promise<QuestionDetail> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/v1/questions/${questionId}/restore`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to restore question: ${response.statusText}`);
    }

    return response.json();
}


// ============================================================================
// ADMIN DASHBOARD STATISTICS
// ============================================================================

export interface DashboardStats {
    totalQuestions: number;
    easyQuestions: number;
    mediumQuestions: number;
    hardQuestions: number;
}

/**
 * Get dashboard statistics for admin panel
 * Fetches all questions and calculates difficulty distribution
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        // The API limits page_size to 100, so we need to fetch multiple pages
        let allQuestions: QuestionListItem[] = [];
        let currentPage = 1;
        let totalPages = 1;
        const pageSize = 100; // Max allowed by the API

        // Fetch all pages
        while (currentPage <= totalPages) {
            const response = await getQuestions({
                page: currentPage,
                page_size: pageSize,
            });

            allQuestions = allQuestions.concat(response.questions);
            totalPages = response.total_pages;
            currentPage++;
            
            // Safety check to prevent infinite loops
            if (currentPage > 100) {
                console.warn('Reached maximum page limit (100)');
                break;
            }
        }

        console.log(`[getDashboardStats] Fetched ${allQuestions.length} total questions`);

        const stats: DashboardStats = {
            totalQuestions: allQuestions.length,
            easyQuestions: 0,
            mediumQuestions: 0,
            hardQuestions: 0,
        };

        // Count questions by difficulty
        allQuestions.forEach((question) => {
            switch (question.difficulty) {
                case 'easy':
                    stats.easyQuestions++;
                    break;
                case 'medium':
                    stats.mediumQuestions++;
                    break;
                case 'hard':
                    stats.hardQuestions++;
                    break;
                default:
                    console.warn(`Unknown difficulty: ${question.difficulty}`, question);
            }
        });

        console.log('[getDashboardStats] Stats:', stats);
        return stats;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
}

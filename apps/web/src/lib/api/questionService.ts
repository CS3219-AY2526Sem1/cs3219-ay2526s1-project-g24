/**
 * Question Service API Client
 * Handles all interactions with the Question Service backend
 */

// In Next.js, environment variables starting with NEXT_PUBLIC_ are available to the browser
const QUESTION_SERVICE_URL = typeof window !== 'undefined'
    ? (window as any).ENV?.NEXT_PUBLIC_QUESTION_SERVICE_URL || 'http://localhost:8000'
    : 'http://localhost:8000';

// Topic and Company interfaces
export interface TopicResponse {
    id: number;
    name: string;
    description?: string;
}

export interface CompanyResponse {
    id: number;
    name: string;
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
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    acceptance_rate: number;
    topics: TopicResponse[];
    companies: CompanyResponse[];
    is_attempted: boolean;
    is_solved: boolean;
}

// Full question detail
export interface QuestionDetail {
    id: number;
    title: string;
    description: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
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
 * Endpoint: GET /api/questions/
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

    const url = `${QUESTION_SERVICE_URL}/api/questions/?${queryParams.toString()}`;

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
 * Endpoint: GET /api/questions/{question_id}
 */
export async function getQuestionById(id: number, userId?: string): Promise<QuestionDetail> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);

    const url = `${QUESTION_SERVICE_URL}/api/questions/${id}${queryParams.toString() ? `?${queryParams}` : ''}`;

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
 * Endpoint: GET /api/questions/random
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

    const url = `${QUESTION_SERVICE_URL}/api/questions/random${queryParams.toString() ? `?${queryParams}` : ''}`;

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
 * Endpoint: GET /api/questions/daily
 */
export async function getDailyQuestion(userId?: string): Promise<QuestionDetail> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);

    const url = `${QUESTION_SERVICE_URL}/api/questions/daily${queryParams.toString() ? `?${queryParams}` : ''}`;

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
}

/**
 * Run code against sample/selected test cases
 * Endpoint: POST /api/questions/{question_id}/run
 */
export async function runCode(questionId: number, request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/questions/${questionId}/run`, {
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
    status: string; // "accepted", "wrong_answer", "time_limit_exceeded", "runtime_error"
    passed_test_cases: number;
    total_test_cases: number;
    runtime_ms?: number;
    memory_mb?: number;
}

export interface SubmissionRequest {
    language: string;
    code: string;
}

/**
 * Submit solution (runs all test cases)
 * Endpoint: POST /api/questions/{question_id}/submit
 */
export async function submitSolution(questionId: number, request: SubmissionRequest): Promise<SubmissionResponse> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/questions/${questionId}/submit`, {
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
 * Endpoint: GET /api/topics
 */
export async function getTopics(): Promise<TopicResponse[]> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/topics`, {
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

export async function updateQuestion(
    questionId: number,
    updates: QuestionUpdateRequest
): Promise<QuestionDetail> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/questions/${questionId}`, {
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

export async function createQuestion(question: QuestionUpdateRequest): Promise<QuestionDetail> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/questions/`, {
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

export async function deleteQuestion(questionId: number): Promise<void> {
    const response = await fetch(`${QUESTION_SERVICE_URL}/api/questions/${questionId}`, {
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

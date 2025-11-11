/**
 * Question Service API Client with Axios
 * All interactions with the Question Service backend
 */

import { API_CONFIG, createServiceUrlBuilder } from '@/lib/api-utils';
import { apiClient } from './axiosClient';
import {
    TopicResponse,
    CompanyResponse,
    TestCasePublic,
    QuestionListItem,
    QuestionDetail,
    QuestionListResponse,
    CodeExecutionResponse,
    CodeExecutionRequest,
    SubmissionResponse,
    SubmissionRequest,
    QuestionUpdateRequest,
    TestCaseCreate,
    QuestionCreateRequest,
    QuestionStats,
    SubmissionSummary,
    UserStats,
    UserSolvedQuestion,
    UserAttemptResponse,
    DashboardStats,
} from './questionService'; // Import types from original file

const serviceUrl = createServiceUrlBuilder(API_CONFIG.QUESTION_SERVICE);

/**
 * Fetch all questions with pagination and filters
 */
export async function getQuestions(params?: {
    difficulties?: string;
    topic_ids?: string;
    company_ids?: string;
    attempted_only?: boolean;
    solved_only?: boolean;
    unsolved_only?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
    user_id?: string;
    include_deleted?: boolean;
}): Promise<QuestionListResponse> {
    const queryParams = new URLSearchParams();

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

    const response = await apiClient.get<QuestionListResponse>(
        serviceUrl(`/api/v1/questions/?${queryParams.toString()}`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Fetch a single question by ID with full details
 */
export async function getQuestionById(id: number, userId?: string, includeDeleted?: boolean): Promise<QuestionDetail> {
    if (isNaN(id) || id <= 0 || !Number.isFinite(id)) {
        throw new Error(`Invalid question ID: ${id}. Question ID must be a positive integer.`);
    }

    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);
    if (includeDeleted !== undefined) queryParams.append('include_deleted', includeDeleted.toString());

    const response = await apiClient.get<QuestionDetail>(
        serviceUrl(`/api/v1/questions/${id}${queryParams.toString() ? `?${queryParams}` : ''}`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get a random question with optional filters
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

    const response = await apiClient.get<QuestionDetail>(
        serviceUrl(`/api/v1/questions/random${queryParams.toString() ? `?${queryParams}` : ''}`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get the daily challenge question
 */
export async function getDailyQuestion(userId?: string): Promise<QuestionDetail> {
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append('user_id', userId);

    const response = await apiClient.get<QuestionDetail>(
        serviceUrl(`/api/v1/questions/daily${queryParams.toString() ? `?${queryParams}` : ''}`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Run code against sample/selected test cases
 */
export async function runCode(questionId: number, request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    if (isNaN(questionId) || questionId <= 0 || !Number.isFinite(questionId)) {
        throw new Error(`Invalid question ID: ${questionId}. Question ID must be a positive integer.`);
    }

    const response = await apiClient.post<CodeExecutionResponse>(
        serviceUrl(`/api/v1/questions/${questionId}/run`),
        request,
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Submit solution (runs all test cases)
 */
export async function submitSolution(questionId: number, request: SubmissionRequest): Promise<SubmissionResponse> {
    if (isNaN(questionId) || questionId <= 0 || !Number.isFinite(questionId)) {
        throw new Error(`Invalid question ID: ${questionId}. Question ID must be a positive integer.`);
    }

    const response = await apiClient.post<SubmissionResponse>(
        serviceUrl(`/api/v1/questions/${questionId}/submit`),
        request,
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Fetch all topics
 */
export async function getTopics(): Promise<TopicResponse[]> {
    const response = await apiClient.get<TopicResponse[]>(
        serviceUrl(`/api/v1/topics/`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Fetch all companies
 */
export async function getCompanies(): Promise<CompanyResponse[]> {
    const response = await apiClient.get<CompanyResponse[]>(
        serviceUrl(`/api/v1/companies/`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Update a question
 */
export async function updateQuestion(
    questionId: number,
    updates: QuestionUpdateRequest
): Promise<QuestionDetail> {
    const response = await apiClient.put<QuestionDetail>(
        serviceUrl(`/api/v1/questions/${questionId}`),
        updates,
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Create a new question
 */
export async function createQuestion(question: QuestionCreateRequest): Promise<QuestionDetail> {
    const response = await apiClient.post<QuestionDetail>(
        serviceUrl(`/api/v1/questions/`),
        question,
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get similar questions
 */
export async function getSimilarQuestions(questionId: number, limit: number = 5): Promise<QuestionListItem[]> {
    const response = await apiClient.get<QuestionListItem[]>(
        serviceUrl(`/api/v1/questions/${questionId}/similar?limit=${limit}`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get question statistics
 */
export async function getQuestionStats(questionId: number): Promise<QuestionStats> {
    const response = await apiClient.get<QuestionStats>(
        serviceUrl(`/api/v1/questions/${questionId}/stats`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get recent submissions for a question
 */
export async function getQuestionSubmissions(questionId: number, limit: number = 20): Promise<SubmissionSummary[]> {
    const response = await apiClient.get<SubmissionSummary[]>(
        serviceUrl(`/api/v1/questions/${questionId}/submissions?limit=${limit}`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get current user's statistics
 */
export async function getUserStats(): Promise<UserStats> {
    const response = await apiClient.get<UserStats>(
        serviceUrl(`/api/v1/users/me/stats`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get total question counts by difficulty
 */
export async function getQuestionCounts(): Promise<{
    total: number;
    easy: number;
    medium: number;
    hard: number;
}> {
    try {
        const [easyRes, mediumRes, hardRes] = await Promise.all([
            apiClient.get<QuestionListResponse>(
                serviceUrl(`/api/v1/questions?difficulties=easy&page_size=1`),
                { withCredentials: true }
            ),
            apiClient.get<QuestionListResponse>(
                serviceUrl(`/api/v1/questions?difficulties=medium&page_size=1`),
                { withCredentials: true }
            ),
            apiClient.get<QuestionListResponse>(
                serviceUrl(`/api/v1/questions?difficulties=hard&page_size=1`),
                { withCredentials: true }
            )
        ]);

        const easy = easyRes.data.total || 0;
        const medium = mediumRes.data.total || 0;
        const hard = hardRes.data.total || 0;

        return {
            total: easy + medium + hard,
            easy,
            medium,
            hard
        };
    } catch (error) {
        console.error('Failed to fetch question counts:', error);
        return { total: 55, easy: 20, medium: 25, hard: 10 };
    }
}

/**
 * Get current user's solved questions
 */
export async function getUserSolvedQuestions(): Promise<UserSolvedQuestion[]> {
    const response = await apiClient.get<UserSolvedQuestion[]>(
        serviceUrl(`/api/v1/users/me/solved`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get current user's attempt history
 */
export async function getUserAttempts(skip: number = 0, limit: number = 50): Promise<UserAttemptResponse[]> {
    const response = await apiClient.get<UserAttemptResponse[]>(
        serviceUrl(`/api/v1/users/me/attempts?skip=${skip}&limit=${limit}`),
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Delete a question
 */
export async function deleteQuestion(questionId: number, permanent: boolean = false): Promise<void> {
    const queryParams = new URLSearchParams();
    if (permanent) queryParams.append('permanent', 'true');

    await apiClient.delete(
        serviceUrl(`/api/v1/questions/${questionId}${queryParams.toString() ? `?${queryParams}` : ''}`),
        { withCredentials: true }
    );
}

/**
 * Restore a deleted question
 */
export async function restoreQuestion(questionId: number): Promise<QuestionDetail> {
    const response = await apiClient.post<QuestionDetail>(
        serviceUrl(`/api/v1/questions/${questionId}/restore`),
        {},
        { withCredentials: true }
    );

    return response.data;
}

/**
 * Get dashboard statistics for admin panel
 */
export async function getDashboardStats(): Promise<DashboardStats> {
    try {
        let allQuestions: QuestionListItem[] = [];
        let currentPage = 1;
        let totalPages = 1;
        const pageSize = 100;

        while (currentPage <= totalPages) {
            const response = await getQuestions({
                page: currentPage,
                page_size: pageSize,
            });

            allQuestions = allQuestions.concat(response.questions);
            totalPages = response.total_pages;
            currentPage++;

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

// Export all types
export type {
    TopicResponse,
    CompanyResponse,
    TestCasePublic,
    QuestionListItem,
    QuestionDetail,
    QuestionListResponse,
    CodeExecutionResponse,
    CodeExecutionRequest,
    SubmissionResponse,
    SubmissionRequest,
    QuestionUpdateRequest,
    TestCaseCreate,
    QuestionCreateRequest,
    QuestionStats,
    SubmissionSummary,
    UserStats,
    UserSolvedQuestion,
    UserAttemptResponse,
    DashboardStats,
};

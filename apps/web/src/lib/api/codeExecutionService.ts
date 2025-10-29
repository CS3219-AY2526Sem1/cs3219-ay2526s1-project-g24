/**
 * Code Execution Service API Client
 * Handles all interactions with the Code Execution Service backend
 */

const CODE_EXECUTION_SERVICE_URL = typeof window !== 'undefined'
    ? (window as any).ENV?.NEXT_PUBLIC_CODE_EXECUTION_SERVICE_URL || 'http://localhost:3010'
    : 'http://localhost:3010';

export type Language = 'python' | 'javascript' | 'java' | 'cpp';

export interface TestCaseInput {
    input_data: Record<string, any>;
    expected_output: any;
    order_index: number;
}

export interface CodeExecutionRequest {
    language: Language;
    source_code: string;
    test_cases: TestCaseInput[];
    function_signature?: {
        function_name: string;
        arguments: Array<{
            name: string;
            type: string;
        }>;
        return_type: string;
    };
    time_limit?: number;
    memory_limit?: number;
}

export interface TestCaseResult {
    order_index: number;
    input_data: Record<string, any>;
    expected_output: any;
    actual_output: any | null;
    passed: boolean;
    runtime_ms: number | null;
    memory_kb: number | null;
    status: string;
    error_message: string | null;
    stdout: string | null;
    stderr: string | null;
}

export interface CodeExecutionResponse {
    language: string;
    total_test_cases: number;
    passed_test_cases: number;
    results: TestCaseResult[];
    overall_passed: boolean;
    avg_runtime_ms: number | null;
    avg_memory_kb: number | null;
    compilation_error: string | null;
}

/**
 * Execute code against test cases
 */
export async function executeCode(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    const response = await fetch(`${CODE_EXECUTION_SERVICE_URL}/api/execution/execute`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || `Failed to execute code: ${response.statusText}`);
    }

    return response.json();
}

/**
 * Run code with custom input (for testing/debugging)
 */
export async function runCodeWithCustomInput(
    language: Language,
    sourceCode: string,
    customInput: Record<string, any>,
    functionSignature?: CodeExecutionRequest['function_signature']
): Promise<TestCaseResult> {
    const request: CodeExecutionRequest = {
        language,
        source_code: sourceCode,
        test_cases: [{
            input_data: customInput,
            expected_output: null, // No expected output for custom runs
            order_index: 0,
        }],
        function_signature: functionSignature,
    };

    const response = await executeCode(request);
    
    if (response.results.length === 0) {
        throw new Error('No execution results returned');
    }

    return response.results[0];
}

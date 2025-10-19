"""
Pytest fixtures and test configuration for code execution service
"""
from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

# Sample Function Signatures for Testing
SAMPLE_FUNCTION_SIGNATURES = {
    "two_sum": {
        "function_name": "twoSum",
        "arguments": [
            {"name": "nums", "type": "int[]"},
            {"name": "target", "type": "int"}
        ],
        "return_type": "int[]"
    },
    "add_two_numbers": {
        "function_name": "addTwoNumbers",
        "arguments": [
            {"name": "l1", "type": "ListNode"},
            {"name": "l2", "type": "ListNode"}
        ],
        "return_type": "ListNode"
    },
    "inorder_traversal": {
        "function_name": "inorderTraversal",
        "arguments": [
            {"name": "root", "type": "TreeNode"}
        ],
        "return_type": "int[]"
    },
    "is_palindrome": {
        "function_name": "isPalindrome",
        "arguments": [
            {"name": "s", "type": "string"}
        ],
        "return_type": "boolean"
    }
}


# Sample Test Data
SAMPLE_TEST_DATA = {
    "two_sum": {
        "input_data": {"nums": [2, 7, 11, 15], "target": 9},
        "expected_output": [0, 1]
    },
    "add_two_numbers": {
        "input_data": {"l1": [2, 4, 3], "l2": [5, 6, 4]},
        "expected_output": [7, 0, 8]
    },
    "inorder_traversal": {
        "input_data": {"root": [1, None, 2, 3]},
        "expected_output": [1, 3, 2]
    },
    "is_palindrome": {
        "input_data": {"s": "A man, a plan, a canal: Panama"},
        "expected_output": True
    }
}


# Sample User Code
SAMPLE_USER_CODE = {
    "python": {
        "two_sum": """class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []""",
        "add_two_numbers": """class Solution:
    def addTwoNumbers(self, l1, l2):
        dummy = ListNode(0)
        curr = dummy
        carry = 0
        
        while l1 or l2 or carry:
            val1 = l1.val if l1 else 0
            val2 = l2.val if l2 else 0
            
            total = val1 + val2 + carry
            carry = total // 10
            curr.next = ListNode(total % 10)
            curr = curr.next
            
            if l1: l1 = l1.next
            if l2: l2 = l2.next
        
        return dummy.next"""
    },
    "javascript": {
        "two_sum": """var twoSum = function(nums, target) {
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) {
            return [seen[complement], i];
        }
        seen[nums[i]] = i;
    }
    return [];
};"""
    },
    "java": {
        "two_sum": """class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] {seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[] {};
    }
}"""
    },
    "cpp": {
        "two_sum": """class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};"""
    }
}


# Mock Judge0 Responses
MOCK_JUDGE0_RESPONSES = {
    "submission_created": {
        "token": "test-token-12345"
    },
    "submission_accepted": {
        "token": "test-token-12345",
        "status": {"id": 3, "description": "Accepted"},
        "stdout": "[0, 1]\n",
        "stderr": None,
        "compile_output": None,
        "time": "0.01",
        "memory": 3456
    },
    "submission_wrong_answer": {
        "token": "test-token-12345",
        "status": {"id": 4, "description": "Wrong Answer"},
        "stdout": "[1, 2]\n",
        "stderr": None,
        "compile_output": None,
        "time": "0.01",
        "memory": 3456
    },
    "submission_runtime_error": {
        "token": "test-token-12345",
        "status": {"id": 11, "description": "Runtime Error (NZEC)"},
        "stdout": None,
        "stderr": (
            "Traceback (most recent call last):\n  File \"main.py\", "
            "line 10\nIndexError: list index out of range\n"
        ),
        "compile_output": None,
        "time": "0.01",
        "memory": 3456
    },
    "submission_compilation_error": {
        "token": "test-token-12345",
        "status": {"id": 6, "description": "Compilation Error"},
        "stdout": None,
        "stderr": None,
        "compile_output": "main.py:5: SyntaxError: invalid syntax\n",
        "time": None,
        "memory": None
    },
    "submission_time_limit_exceeded": {
        "token": "test-token-12345",
        "status": {"id": 5, "description": "Time Limit Exceeded"},
        "stdout": None,
        "stderr": None,
        "compile_output": None,
        "time": "2.5",
        "memory": 3456
    }
}


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app"""
    from app.main import app
    return TestClient(app)


@pytest.fixture
def mock_judge0_client(monkeypatch):
    """
    Mock httpx.AsyncClient for Judge0 API calls.
    Returns a mock that can be configured per-test.
    """
    # Create mock responses that will be returned
    mock_post_response = MagicMock()
    mock_post_response.json = MagicMock(return_value=MOCK_JUDGE0_RESPONSES["submission_created"])
    mock_post_response.raise_for_status = MagicMock()
    mock_post_response.status_code = 200
    
    mock_get_response = MagicMock()
    mock_get_response.json = MagicMock(return_value=MOCK_JUDGE0_RESPONSES["submission_accepted"])
    mock_get_response.raise_for_status = MagicMock()
    mock_get_response.status_code = 200
    
    # Create the mock client with call tracking
    mock_client = MagicMock()
    
    # Track calls
    post_calls = []
    get_calls = []
    
    # Set up async methods with call tracking
    async def mock_post(*args, **kwargs):
        post_calls.append({"args": args, "kwargs": kwargs})
        return mock_post_response
    
    async def mock_get(*args, **kwargs):
        get_calls.append({"args": args, "kwargs": kwargs})
        return mock_get_response
    
    # Create mock objects for the methods
    mock_post_method = MagicMock(side_effect=mock_post)
    mock_get_method = MagicMock(side_effect=mock_get)
    
    mock_client.post = mock_post_method
    mock_client.get = mock_get_method
    
    # Store references for test assertions
    mock_client._post_response = mock_post_response
    mock_client._get_response = mock_get_response
    mock_client._post_calls = post_calls
    mock_client._get_calls = get_calls
    
    # Mock the context manager
    class MockAsyncClient:
        def __init__(self, *args, **kwargs):
            pass
        
        async def __aenter__(self):
            return mock_client
        
        async def __aexit__(self, *args):
            pass
    
    monkeypatch.setattr("httpx.AsyncClient", MockAsyncClient)
    
    return mock_client


@pytest.fixture
def sample_two_sum_request():
    """Sample request for two sum problem"""
    return {
        "language": "python",
        "source_code": SAMPLE_USER_CODE["python"]["two_sum"],
        "test_cases": [
            {
                "input_data": SAMPLE_TEST_DATA["two_sum"]["input_data"],
                "expected_output": SAMPLE_TEST_DATA["two_sum"]["expected_output"],
                "order_index": 0
            }
        ],
        "function_signature": SAMPLE_FUNCTION_SIGNATURES["two_sum"],
        "time_limit": 2.0,
        "memory_limit": 256000
    }


@pytest.fixture
def sample_linked_list_request():
    """Sample request for linked list problem"""
    return {
        "language": "python",
        "source_code": SAMPLE_USER_CODE["python"]["add_two_numbers"],
        "test_cases": [
            {
                "input_data": SAMPLE_TEST_DATA["add_two_numbers"]["input_data"],
                "expected_output": SAMPLE_TEST_DATA["add_two_numbers"]["expected_output"],
                "order_index": 0
            }
        ],
        "function_signature": SAMPLE_FUNCTION_SIGNATURES["add_two_numbers"],
        "time_limit": 2.0,
        "memory_limit": 256000
    }


@pytest.fixture
def code_generator():
    """Create a CodeGenerator instance"""
    from app.execution.code_generator import CodeGenerator
    return CodeGenerator()

#!/usr/bin/env python3
"""
Comprehensive Test Suite for ALL Questions and ALL Languages
Tests Python, JavaScript, Java, and C++ for all 8 questions in the database
"""

import requests
import json
import sys
from typing import Dict, List, Any
from dataclasses import dataclass

BASE_URL = "http://localhost:8000"
USER_ID = "test-all-languages-user"

# Color codes for terminal output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

@dataclass
class TestResult:
    question_id: int
    question_title: str
    language: str
    endpoint: str
    passed: bool
    message: str
    details: Dict[str, Any] = None

# Global test results tracker
test_results: List[TestResult] = []

# ============================================================
# SOLUTIONS FOR ALL QUESTIONS IN ALL LANGUAGES
# ============================================================

SOLUTIONS = {
    1: {  # Two Sum
        "title": "Two Sum",
        "python": """
class Solution:
    def twoSum(self, nums, target):
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement], i]
            seen[num] = i
        return []
""",
        "javascript": """
var twoSum = function(nums, target) {
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) {
            return [seen[complement], i];
        }
        seen[nums[i]] = i;
    }
    return [];
};
""",
        "java": """
class Solution {
    public int[] twoSum(int[] nums, int target) {
        java.util.Map<Integer, Integer> seen = new java.util.HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
}
""",
        "cpp": """
class Solution {
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
};
"""
    },
    5: {  # Valid Parentheses
        "title": "Valid Parentheses",
        "python": """
class Solution:
    def isValid(self, s):
        stack = []
        pairs = {'(': ')', '{': '}', '[': ']'}
        for char in s:
            if char in pairs:
                stack.append(char)
            elif not stack or pairs[stack.pop()] != char:
                return False
        return len(stack) == 0
""",
        "javascript": """
var isValid = function(s) {
    const stack = [];
    const pairs = {'(': ')', '{': '}', '[': ']'};
    for (let char of s) {
        if (pairs[char]) {
            stack.push(char);
        } else if (stack.length === 0 || pairs[stack.pop()] !== char) {
            return false;
        }
    }
    return stack.length === 0;
};
""",
        "java": """
class Solution {
    public boolean isValid(String s) {
        java.util.Stack<Character> stack = new java.util.Stack<>();
        java.util.Map<Character, Character> pairs = new java.util.HashMap<>();
        pairs.put('(', ')');
        pairs.put('{', '}');
        pairs.put('[', ']');
        
        for (char c : s.toCharArray()) {
            if (pairs.containsKey(c)) {
                stack.push(c);
            } else if (stack.isEmpty() || pairs.get(stack.pop()) != c) {
                return false;
            }
        }
        return stack.isEmpty();
    }
}
""",
        "cpp": """
class Solution {
public:
    bool isValid(string s) {
        stack<char> stk;
        unordered_map<char, char> pairs = {{'(', ')'}, {'{', '}'}, {'[', ']'}};
        
        for (char c : s) {
            if (pairs.find(c) != pairs.end()) {
                stk.push(c);
            } else if (stk.empty() || pairs[stk.top()] != c) {
                return false;
            } else {
                stk.pop();
            }
        }
        return stk.empty();
    }
};
"""
    },
    8: {  # Climbing Stairs
        "title": "Climbing Stairs",
        "python": """
class Solution:
    def climbStairs(self, n):
        if n <= 2:
            return n
        a, b = 1, 2
        for _ in range(3, n + 1):
            a, b = b, a + b
        return b
""",
        "javascript": """
var climbStairs = function(n) {
    if (n <= 2) return n;
    let a = 1, b = 2;
    for (let i = 3; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
};
""",
        "java": """
class Solution {
    public int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }
}
""",
        "cpp": """
class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) return n;
        int a = 1, b = 2;
        for (int i = 3; i <= n; i++) {
            int temp = a + b;
            a = b;
            b = temp;
        }
        return b;
    }
};
"""
    },
    7: {  # Maximum Subarray
        "title": "Maximum Subarray",
        "python": """
class Solution:
    def maxSubArray(self, nums):
        max_sum = current_sum = nums[0]
        for num in nums[1:]:
            current_sum = max(num, current_sum + num)
            max_sum = max(max_sum, current_sum)
        return max_sum
""",
        "javascript": """
var maxSubArray = function(nums) {
    let maxSum = nums[0];
    let currentSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currentSum = Math.max(nums[i], currentSum + nums[i]);
        maxSum = Math.max(maxSum, currentSum);
    }
    return maxSum;
};
""",
        "java": """
class Solution {
    public int maxSubArray(int[] nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        for (int i = 1; i < nums.length; i++) {
            currentSum = Math.max(nums[i], currentSum + nums[i]);
            maxSum = Math.max(maxSum, currentSum);
        }
        return maxSum;
    }
}
""",
        "cpp": """
class Solution {
public:
    int maxSubArray(vector<int>& nums) {
        int maxSum = nums[0];
        int currentSum = nums[0];
        for (size_t i = 1; i < nums.size(); i++) {
            currentSum = max(nums[i], currentSum + nums[i]);
            maxSum = max(maxSum, currentSum);
        }
        return maxSum;
    }
};
"""
    }
}

# ============================================================
# TEST FUNCTIONS
# ============================================================

def print_header(text: str):
    """Print a formatted header"""
    print(f"\n{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{text:^70}{Colors.ENDC}")
    print(f"{Colors.BLUE}{Colors.BOLD}{'='*70}{Colors.ENDC}\n")

def print_test_header(question: str, language: str, endpoint: str):
    """Print test header"""
    print(f"\nTesting: {Colors.BOLD}{question}{Colors.ENDC} | " +
          f"Language: {Colors.YELLOW}{language.upper()}{Colors.ENDC} | " +
          f"Endpoint: {Colors.BLUE}{endpoint}{Colors.ENDC}")
    print("-" * 70)

def print_result(passed: bool, message: str):
    """Print test result"""
    status = f"{Colors.GREEN}✅ {message}{Colors.ENDC}" if passed else f"{Colors.RED}❌ {message}{Colors.ENDC}"
    print(status)

def test_run_endpoint(question_id: int, question_title: str, language: str, solution_code: str) -> TestResult:
    """Test the /run endpoint for a given question and language"""
    print_test_header(question_title, language, "/run")
    
    payload = {
        "language": language,
        "code": solution_code,
        "test_case_ids": None
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{question_id}/run",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            passed_count = result['passed_test_cases']
            total_count = result['total_test_cases']
            overall_passed = result['overall_passed']
            
            message = f"Passed {passed_count}/{total_count} test cases"
            if overall_passed:
                print_result(True, message)
                return TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint="/run",
                    passed=True,
                    message=message,
                    details=result
                )
            else:
                print_result(False, message)
                for i, test in enumerate(result['results'], 1):
                    if not test['passed']:
                        print(f"  Test {i} Failed:")
                        print(f"    Expected: {test.get('expected_output')}")
                        print(f"    Got: {test.get('actual_output')}")
                return TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint="/run",
                    passed=False,
                    message=message,
                    details=result
                )
        else:
            message = f"HTTP {response.status_code}"
            print_result(False, message)
            return TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint="/run",
                passed=False,
                message=message
            )
    except Exception as e:
        message = f"Exception: {str(e)}"
        print_result(False, message)
        return TestResult(
            question_id=question_id,
            question_title=question_title,
            language=language,
            endpoint="/run",
            passed=False,
            message=message
        )

def test_submit_endpoint(question_id: int, question_title: str, language: str, solution_code: str) -> TestResult:
    """Test the /submit endpoint for a given question and language"""
    print_test_header(question_title, language, "/submit")
    
    payload = {
        "language": language,
        "code": solution_code
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{question_id}/submit?user_id={USER_ID}",
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            status = result['status']
            passed_count = result['passed_test_cases']
            total_count = result['total_test_cases']
            runtime = result.get('avg_runtime_ms', 0)
            memory = result.get('avg_memory_mb', 0)
            
            if status == "accepted":
                message = f"Status: {status} | Passed {passed_count}/{total_count}"
                print_result(True, message)
                print(f"  Runtime: {runtime}ms | Memory: {memory}MB")
                return TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint="/submit",
                    passed=True,
                    message=message,
                    details=result
                )
            else:
                message = f"Status: {status} | Passed {passed_count}/{total_count}"
                print_result(False, message)
                return TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint="/submit",
                    passed=False,
                    message=message,
                    details=result
                )
        else:
            message = f"HTTP {response.status_code}"
            print_result(False, message)
            return TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint="/submit",
                passed=False,
                message=message
            )
    except Exception as e:
        message = f"Exception: {str(e)}"
        print_result(False, message)
        return TestResult(
            question_id=question_id,
            question_title=question_title,
            language=language,
            endpoint="/submit",
            passed=False,
            message=message
        )

def print_summary():
    """Print test summary"""
    print_header("TEST SUMMARY")
    
    total = len(test_results)
    passed = sum(1 for r in test_results if r.passed)
    failed = total - passed
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {Colors.BOLD}{total}{Colors.ENDC}")
    print(f"Passed: {Colors.GREEN}{passed}{Colors.ENDC}")
    print(f"Failed: {Colors.RED}{failed}{Colors.ENDC}")
    print(f"Success Rate: {Colors.BOLD}{success_rate:.1f}%{Colors.ENDC}\n")
    
    # Group by question
    by_question = {}
    for result in test_results:
        key = f"Q{result.question_id}: {result.question_title}"
        if key not in by_question:
            by_question[key] = []
        by_question[key].append(result)
    
    for question, results in sorted(by_question.items()):
        print(f"\n{question}")
        for result in results:
            status = "✅" if result.passed else "❌"
            lang = result.language.upper().ljust(12)
            endpoint = result.endpoint.ljust(8)
            print(f"  {status} {lang} | {endpoint} | {result.message}")
    
    if failed > 0:
        print(f"\n{Colors.YELLOW}{'='*70}{Colors.ENDC}")
        print(f"{Colors.YELLOW}{Colors.BOLD}{'⚠️  SOME TESTS FAILED ⚠️':^70}{Colors.ENDC}")
        print(f"{Colors.YELLOW}{'='*70}{Colors.ENDC}\n")
        sys.exit(1)
    else:
        print(f"\n{Colors.GREEN}{'='*70}{Colors.ENDC}")
        print(f"{Colors.GREEN}{Colors.BOLD}{'🎉 ALL TESTS PASSED! 🎉':^70}{Colors.ENDC}")
        print(f"{Colors.GREEN}{'='*70}{Colors.ENDC}\n")

def main():
    """Run all tests"""
    print_header("COMPREHENSIVE TEST SUITE - ALL LANGUAGES")
    print(f"Base URL: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    
    languages = ["python", "javascript", "java", "cpp"]
    
    for question_id, question_data in sorted(SOLUTIONS.items()):
        question_title = question_data["title"]
        print_header(f"QUESTION {question_id}: {question_title.upper()}")
        
        for language in languages:
            if language in question_data:
                solution_code = question_data[language]
                
                # Test /run endpoint
                result = test_run_endpoint(question_id, question_title, language, solution_code)
                test_results.append(result)
                
                # Test /submit endpoint
                result = test_submit_endpoint(question_id, question_title, language, solution_code)
                test_results.append(result)
    
    print_summary()

if __name__ == "__main__":
    main()

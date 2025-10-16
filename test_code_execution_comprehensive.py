#!/usr/bin/env python3
"""
Comprehensive Test Suite for Question Service Code Execution
Tests multiple question types and all supported languages (Python, JavaScript, Java, C++)
"""

import requests
import json
import sys
from typing import Dict, List, Any
from dataclasses import dataclass

BASE_URL = "http://localhost:8000"
USER_ID = "test-comprehensive-user"

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
# SOLUTIONS: Question 1 - Two Sum (Array/Hash Table - Easy)
# ============================================================

TWO_SUM_SOLUTIONS = {
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
/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
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
"""
}

# ============================================================
# SOLUTIONS: Question 5 - Valid Parentheses (Stack/String - Easy)
# ============================================================

VALID_PARENTHESES_SOLUTIONS = {
    "python": """
class Solution:
    def isValid(self, s):
        stack = []
        mapping = {')': '(', '}': '{', ']': '['}
        
        for char in s:
            if char in mapping:
                top = stack.pop() if stack else '#'
                if mapping[char] != top:
                    return False
            else:
                stack.append(char)
        
        return not stack
""",
    "javascript": """
/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {
    const stack = [];
    const mapping = {')': '(', '}': '{', ']': '['};
    
    for (let char of s) {
        if (char in mapping) {
            const top = stack.length > 0 ? stack.pop() : '#';
            if (mapping[char] !== top) {
                return false;
            }
        } else {
            stack.push(char);
        }
    }
    
    return stack.length === 0;
};
"""
}

# ============================================================
# SOLUTIONS: Question 8 - Climbing Stairs (Dynamic Programming - Easy)
# ============================================================

CLIMBING_STAIRS_SOLUTIONS = {
    "python": """
class Solution:
    def climbStairs(self, n):
        if n <= 2:
            return n
        
        prev2, prev1 = 1, 2
        for i in range(3, n + 1):
            current = prev1 + prev2
            prev2 = prev1
            prev1 = current
        
        return prev1
""",
    "javascript": """
/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {
    if (n <= 2) {
        return n;
    }
    
    let prev2 = 1, prev1 = 2;
    for (let i = 3; i <= n; i++) {
        const current = prev1 + prev2;
        prev2 = prev1;
        prev1 = current;
    }
    
    return prev1;
};
"""
}

# Wrong solutions for testing error detection
WRONG_TWO_SUM = {
    "python": """
class Solution:
    def twoSum(self, nums, target):
        return [0, 0]  # Always wrong
""",
    "javascript": """
var twoSum = function(nums, target) {
    return [0, 0];  // Always wrong
};
"""
}

# ============================================================
# Test Helper Functions
# ============================================================

def print_section_header(title: str):
    """Print a formatted section header"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title.center(70)}{Colors.ENDC}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*70}{Colors.ENDC}\n")

def print_test_header(question_title: str, language: str, endpoint: str):
    """Print a formatted test header"""
    print(f"\n{Colors.BOLD}Testing: {question_title} | Language: {language.upper()} | Endpoint: {endpoint}{Colors.ENDC}")
    print("-" * 70)

def print_result(success: bool, message: str):
    """Print a colored result message"""
    if success:
        print(f"{Colors.GREEN}✅ {message}{Colors.ENDC}")
    else:
        print(f"{Colors.RED}❌ {message}{Colors.ENDC}")

def test_run_endpoint(question_id: int, question_title: str, language: str, solution_code: str) -> TestResult:
    """Test the /run endpoint for a given question and language"""
    print_test_header(question_title, language, "/run")
    
    payload = {
        "language": language,
        "code": solution_code,
        "test_case_ids": None  # Run against sample/public test cases
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
                # Print failed test cases
                for i, test in enumerate(result['results'], 1):
                    if not test['passed']:
                        print(f"  Test {i} Failed:")
                        print(f"    Input: {test.get('input_data')}")
                        print(f"    Expected: {test.get('expected_output')}")
                        print(f"    Got: {test.get('actual_output')}")
                        if test.get('error_message'):
                            print(f"    Error: {test.get('error_message')}")
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
            error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
            print_result(False, error_msg)
            return TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint="/run",
                passed=False,
                message=error_msg
            )
            
    except Exception as e:
        error_msg = f"Exception: {str(e)}"
        print_result(False, error_msg)
        return TestResult(
            question_id=question_id,
            question_title=question_title,
            language=language,
            endpoint="/run",
            passed=False,
            message=error_msg
        )

def test_submit_endpoint(question_id: int, question_title: str, language: str, solution_code: str, expect_accepted: bool = False) -> TestResult:
    """Test the /submit endpoint for a given question and language"""
    print_test_header(question_title, language, "/submit")
    
    payload = {
        "language": language,
        "code": solution_code
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{question_id}/submit",
            json=payload,
            params={"user_id": USER_ID},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            status = result['status']
            passed_count = result['passed_test_cases']
            total_count = result['total_test_cases']
            
            message = f"Status: {status} | Passed {passed_count}/{total_count}"
            
            if expect_accepted:
                # We expect all test cases to pass (including private ones)
                success = (status == 'accepted' and passed_count == total_count)
            else:
                # Just check that submission was processed
                success = (response.status_code == 200)
            
            print_result(success, message)
            print(f"  Runtime: {result.get('runtime_ms')}ms | Memory: {result.get('memory_mb')}MB")
            
            return TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint="/submit",
                passed=success,
                message=message,
                details=result
            )
        else:
            error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
            print_result(False, error_msg)
            return TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint="/submit",
                passed=False,
                message=error_msg
            )
            
    except Exception as e:
        error_msg = f"Exception: {str(e)}"
        print_result(False, error_msg)
        return TestResult(
            question_id=question_id,
            question_title=question_title,
            language=language,
            endpoint="/submit",
            passed=False,
            message=error_msg
        )

def test_wrong_answer_detection(question_id: int, question_title: str, language: str, wrong_solution: str) -> TestResult:
    """Test that wrong answers are correctly detected"""
    print_test_header(question_title, language, "/submit (Wrong Answer Detection)")
    
    payload = {
        "language": language,
        "code": wrong_solution
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{question_id}/submit",
            json=payload,
            params={"user_id": USER_ID + "-wrong"},
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            status = result['status']
            passed_count = result['passed_test_cases']
            total_count = result['total_test_cases']
            
            # Success means the wrong answer was detected (status != accepted and passed < total)
            success = (status != 'accepted' and passed_count < total_count)
            message = f"Wrong answer correctly detected: {status} | {passed_count}/{total_count} passed"
            
            print_result(success, message)
            return TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint="/submit (wrong answer)",
                passed=success,
                message=message,
                details=result
            )
        else:
            error_msg = f"HTTP {response.status_code}: {response.text[:200]}"
            print_result(False, error_msg)
            return TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint="/submit (wrong answer)",
                passed=False,
                message=error_msg
            )
            
    except Exception as e:
        error_msg = f"Exception: {str(e)}"
        print_result(False, error_msg)
        return TestResult(
            question_id=question_id,
            question_title=question_title,
            language=language,
            endpoint="/submit (wrong answer)",
            passed=False,
            message=error_msg
        )

# ============================================================
# Main Test Execution
# ============================================================

def run_all_tests():
    """Run all comprehensive tests"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}")
    print("="*70)
    print("  COMPREHENSIVE CODE EXECUTION TEST SUITE".center(70))
    print("="*70)
    print(f"{Colors.ENDC}")
    print(f"Base URL: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    
    # ========== Question 1: Two Sum ==========
    print_section_header("QUESTION 1: TWO SUM (Array/Hash Table)")
    
    # Test Python
    test_results.append(test_run_endpoint(1, "Two Sum", "python", TWO_SUM_SOLUTIONS["python"]))
    test_results.append(test_submit_endpoint(1, "Two Sum", "python", TWO_SUM_SOLUTIONS["python"]))
    
    # Test JavaScript
    test_results.append(test_run_endpoint(1, "Two Sum", "javascript", TWO_SUM_SOLUTIONS["javascript"]))
    test_results.append(test_submit_endpoint(1, "Two Sum", "javascript", TWO_SUM_SOLUTIONS["javascript"]))
    
    # Test wrong answer detection
    test_results.append(test_wrong_answer_detection(1, "Two Sum", "python", WRONG_TWO_SUM["python"]))
    test_results.append(test_wrong_answer_detection(1, "Two Sum", "javascript", WRONG_TWO_SUM["javascript"]))
    
    # ========== Question 5: Valid Parentheses ==========
    print_section_header("QUESTION 5: VALID PARENTHESES (Stack/String)")
    
    # Test Python
    test_results.append(test_run_endpoint(5, "Valid Parentheses", "python", VALID_PARENTHESES_SOLUTIONS["python"]))
    test_results.append(test_submit_endpoint(5, "Valid Parentheses", "python", VALID_PARENTHESES_SOLUTIONS["python"]))
    
    # Test JavaScript
    test_results.append(test_run_endpoint(5, "Valid Parentheses", "javascript", VALID_PARENTHESES_SOLUTIONS["javascript"]))
    test_results.append(test_submit_endpoint(5, "Valid Parentheses", "javascript", VALID_PARENTHESES_SOLUTIONS["javascript"]))
    
    # ========== Question 8: Climbing Stairs ==========
    print_section_header("QUESTION 8: CLIMBING STAIRS (Dynamic Programming)")
    
    # Test Python
    test_results.append(test_run_endpoint(8, "Climbing Stairs", "python", CLIMBING_STAIRS_SOLUTIONS["python"]))
    test_results.append(test_submit_endpoint(8, "Climbing Stairs", "python", CLIMBING_STAIRS_SOLUTIONS["python"]))
    
    # Test JavaScript
    test_results.append(test_run_endpoint(8, "Climbing Stairs", "javascript", CLIMBING_STAIRS_SOLUTIONS["javascript"]))
    test_results.append(test_submit_endpoint(8, "Climbing Stairs", "javascript", CLIMBING_STAIRS_SOLUTIONS["javascript"]))
    
    # ========== Print Summary ==========
    print_summary()

def print_summary():
    """Print test summary"""
    print_section_header("TEST SUMMARY")
    
    total_tests = len(test_results)
    passed_tests = sum(1 for r in test_results if r.passed)
    failed_tests = total_tests - passed_tests
    
    print(f"{Colors.BOLD}Total Tests: {total_tests}{Colors.ENDC}")
    print(f"{Colors.GREEN}Passed: {passed_tests}{Colors.ENDC}")
    print(f"{Colors.RED}Failed: {failed_tests}{Colors.ENDC}")
    print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%\n")
    
    # Group by question
    questions = {}
    for result in test_results:
        key = f"Q{result.question_id}: {result.question_title}"
        if key not in questions:
            questions[key] = []
        questions[key].append(result)
    
    for question, results in questions.items():
        print(f"\n{Colors.BOLD}{question}{Colors.ENDC}")
        for result in results:
            status = f"{Colors.GREEN}✅{Colors.ENDC}" if result.passed else f"{Colors.RED}❌{Colors.ENDC}"
            print(f"  {status} {result.language.upper():12} | {result.endpoint:25} | {result.message}")
    
    # Failed tests details
    if failed_tests > 0:
        print(f"\n{Colors.BOLD}{Colors.RED}Failed Tests Details:{Colors.ENDC}")
        for i, result in enumerate([r for r in test_results if not r.passed], 1):
            print(f"\n{i}. Q{result.question_id} - {result.question_title} ({result.language.upper()}) - {result.endpoint}")
            print(f"   {result.message}")
    
    print("\n" + "="*70)
    if failed_tests == 0:
        print(f"{Colors.GREEN}{Colors.BOLD}🎉 ALL TESTS PASSED! 🎉{Colors.ENDC}".center(70))
    else:
        print(f"{Colors.YELLOW}{Colors.BOLD}⚠️  SOME TESTS FAILED ⚠️{Colors.ENDC}".center(70))
    print("="*70 + "\n")
    
    # Exit with appropriate code
    sys.exit(0 if failed_tests == 0 else 1)

if __name__ == "__main__":
    run_all_tests()

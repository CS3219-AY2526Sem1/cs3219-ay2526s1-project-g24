#!/usr/bin/env python3
"""
Test script for Question Service /run and /submit endpoints
"""

import requests
import json

BASE_URL = "http://localhost:8000"
QUESTION_ID = 1  # Two Sum
USER_ID = "test-user-123"

# Sample solution for Two Sum
PYTHON_SOLUTION = """
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
"""

JAVASCRIPT_SOLUTION = """
function twoSum(nums, target) {
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) {
            return [seen[complement], i];
        }
        seen[nums[i]] = i;
    }
    return [];
}
"""

def test_run_endpoint():
    """Test the /run endpoint with sample test cases"""
    print("\n" + "="*60)
    print("Testing POST /questions/{id}/run endpoint")
    print("="*60)
    
    payload = {
        "language": "python",
        "code": PYTHON_SOLUTION,
        "test_case_ids": None  # Run against sample/public test cases
    }
    
    print(f"\nRequest URL: {BASE_URL}/api/questions/{QUESTION_ID}/run")
    print(f"Language: {payload['language']}")
    print(f"Running against sample test cases...\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{QUESTION_ID}/run",
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Success!")
            print(f"Total Test Cases: {result['total_test_cases']}")
            print(f"Passed Test Cases: {result['passed_test_cases']}")
            print(f"Overall Passed: {result['overall_passed']}")
            print(f"Avg Runtime: {result.get('avg_runtime_ms')}ms")
            print(f"Avg Memory: {result.get('avg_memory_mb')}MB")
            
            print("\nTest Case Results:")
            for i, test_result in enumerate(result['results'], 1):
                status = "✅ PASS" if test_result['passed'] else "❌ FAIL"
                print(f"  Test {i}: {status}")
                print(f"    Input: {test_result['input_data']}")
                print(f"    Expected: {test_result['expected_output']}")
                print(f"    Actual: {test_result.get('actual_output', 'N/A')}")
                if test_result.get('error'):
                    print(f"    Error: {test_result['error']}")
        else:
            print(f"\n❌ Failed!")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def test_submit_endpoint():
    """Test the /submit endpoint with all test cases"""
    print("\n" + "="*60)
    print("Testing POST /questions/{id}/submit endpoint")
    print("="*60)
    
    payload = {
        "language": "python",
        "code": PYTHON_SOLUTION
    }
    
    print(f"\nRequest URL: {BASE_URL}/api/questions/{QUESTION_ID}/submit?user_id={USER_ID}")
    print(f"Language: {payload['language']}")
    print(f"Submitting solution...\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{QUESTION_ID}/submit",
            json=payload,
            params={"user_id": USER_ID},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Submission Received!")
            print(f"Submission ID: {result['submission_id']}")
            print(f"Status: {result['status']}")
            print(f"Passed: {result['passed_test_cases']}/{result['total_test_cases']}")
            print(f"Runtime: {result.get('runtime_ms')}ms")
            print(f"Memory: {result.get('memory_mb')}MB")
            print(f"Runtime Percentile: {result.get('runtime_percentile')}%")
            print(f"Memory Percentile: {result.get('memory_percentile')}%")
            
            if result['status'] == 'accepted':
                print("\n🎉 Accepted! All test cases passed!")
            else:
                print(f"\n❌ Status: {result['status']}")
        else:
            print(f"\n❌ Failed!")
            print(f"Response: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")
    except Exception as e:
        print(f"\n❌ Error: {e}")


def test_wrong_solution():
    """Test with an intentionally wrong solution"""
    print("\n" + "="*60)
    print("Testing /submit with WRONG solution")
    print("="*60)
    
    wrong_solution = """
def twoSum(nums, target):
    return [0, 0]  # Always return wrong answer
"""
    
    payload = {
        "language": "python",
        "code": wrong_solution
    }
    
    print(f"\nSubmitting intentionally wrong solution...\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{QUESTION_ID}/submit",
            json=payload,
            params={"user_id": USER_ID},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\nSubmission ID: {result['submission_id']}")
            print(f"Status: {result['status']}")
            print(f"Passed: {result['passed_test_cases']}/{result['total_test_cases']}")
            
            if result['status'] != 'accepted':
                print("\n✅ Correctly identified wrong answer!")
            else:
                print("\n❌ ERROR: Should have failed!")
        else:
            print(f"\n❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")


def test_javascript_solution():
    """Test with JavaScript solution"""
    print("\n" + "="*60)
    print("Testing /run with JavaScript solution")
    print("="*60)
    
    payload = {
        "language": "javascript",
        "code": JAVASCRIPT_SOLUTION
    }
    
    print(f"\nTesting JavaScript solution...\n")
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/questions/{QUESTION_ID}/run",
            json=payload,
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n✅ Success!")
            print(f"Passed: {result['passed_test_cases']}/{result['total_test_cases']}")
            print(f"Overall Passed: {result['overall_passed']}")
        else:
            print(f"\n❌ Failed!")
            print(f"Response: {response.text}")
            
    except Exception as e:
        print(f"\n❌ Error: {e}")


def main():
    print("\n" + "="*60)
    print("Question Service Code Execution Test Suite")
    print("="*60)
    print(f"Base URL: {BASE_URL}")
    print(f"Testing Question ID: {QUESTION_ID} (Two Sum)")
    
    # Test 1: Run endpoint with correct solution
    test_run_endpoint()
    
    # Test 2: Submit endpoint with correct solution
    test_submit_endpoint()
    
    # Test 3: Submit with wrong solution
    test_wrong_solution()
    
    # Test 4: JavaScript solution
    test_javascript_solution()
    
    print("\n" + "="*60)
    print("Test Suite Complete!")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()

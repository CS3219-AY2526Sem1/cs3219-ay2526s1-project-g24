#!/usr/bin/env python3
"""
COMPREHENSIVE TEST SUITE - ALL 8 QUESTIONS, ALL 4 LANGUAGES
Tests every question with correct solutions to ensure wrappers handle all data types
Goal: Verify that regardless of user code, our wrappers execute without issues
"""

import requests
import json
import sys
from typing import Dict, List, Any
from dataclasses import dataclass, field

BASE_URL = "http://localhost:8000/api"
USER_ID = "test-comprehensive-user"

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
    details: Dict[str, Any] = field(default_factory=dict)

test_results: List[TestResult] = []

# ============================================================
# WORKING SOLUTIONS FOR ALL 8 QUESTIONS IN ALL 4 LANGUAGES
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
    2: {  # Reverse Linked List
        "title": "Reverse Linked List",
        "python": """
class Solution:
    def reverseList(self, head):
        prev = None
        current = head
        while current:
            next_node = current.next
            current.next = prev
            prev = current
            current = next_node
        return prev
""",
        "javascript": """
var reverseList = function(head) {
    let prev = null;
    let current = head;
    while (current !== null) {
        let nextNode = current.next;
        current.next = prev;
        prev = current;
        current = nextNode;
    }
    return prev;
};
""",
        "java": """
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode current = head;
        while (current != null) {
            ListNode nextNode = current.next;
            current.next = prev;
            prev = current;
            current = nextNode;
        }
        return prev;
    }
}
""",
        "cpp": """
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* current = head;
        while (current != nullptr) {
            ListNode* nextNode = current->next;
            current->next = prev;
            prev = current;
            current = nextNode;
        }
        return prev;
    }
};
"""
    },
    3: {  # Longest Substring Without Repeating Characters
        "title": "Longest Substring Without Repeating Characters",
        "python": """
class Solution:
    def lengthOfLongestSubstring(self, s):
        char_set = set()
        left = 0
        max_length = 0
        
        for right in range(len(s)):
            while s[right] in char_set:
                char_set.remove(s[left])
                left += 1
            char_set.add(s[right])
            max_length = max(max_length, right - left + 1)
        
        return max_length
""",
        "javascript": """
var lengthOfLongestSubstring = function(s) {
    const charSet = new Set();
    let left = 0;
    let maxLength = 0;
    
    for (let right = 0; right < s.length; right++) {
        while (charSet.has(s[right])) {
            charSet.delete(s[left]);
            left++;
        }
        charSet.add(s[right]);
        maxLength = Math.max(maxLength, right - left + 1);
    }
    
    return maxLength;
};
""",
        "java": """
class Solution {
    public int lengthOfLongestSubstring(String s) {
        java.util.Set<Character> charSet = new java.util.HashSet<>();
        int left = 0;
        int maxLength = 0;
        
        for (int right = 0; right < s.length(); right++) {
            while (charSet.contains(s.charAt(right))) {
                charSet.remove(s.charAt(left));
                left++;
            }
            charSet.add(s.charAt(right));
            maxLength = Math.max(maxLength, right - left + 1);
        }
        
        return maxLength;
    }
}
""",
        "cpp": """
class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        unordered_set<char> charSet;
        int left = 0;
        int maxLength = 0;
        
        for (int right = 0; right < s.length(); right++) {
            while (charSet.find(s[right]) != charSet.end()) {
                charSet.erase(s[left]);
                left++;
            }
            charSet.insert(s[right]);
            maxLength = max(maxLength, right - left + 1);
        }
        
        return maxLength;
    }
};
"""
    },
    4: {  # Median of Two Sorted Arrays
        "title": "Median of Two Sorted Arrays",
        "python": """
class Solution:
    def findMedianSortedArrays(self, nums1, nums2):
        merged = sorted(nums1 + nums2)
        n = len(merged)
        if n % 2 == 0:
            return (merged[n // 2 - 1] + merged[n // 2]) / 2.0
        else:
            return float(merged[n // 2])
""",
        "javascript": """
var findMedianSortedArrays = function(nums1, nums2) {
    const merged = [...nums1, ...nums2].sort((a, b) => a - b);
    const n = merged.length;
    if (n % 2 === 0) {
        return (merged[n / 2 - 1] + merged[n / 2]) / 2.0;
    } else {
        return merged[Math.floor(n / 2)];
    }
};
""",
        "java": """
class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        int[] merged = new int[nums1.length + nums2.length];
        System.arraycopy(nums1, 0, merged, 0, nums1.length);
        System.arraycopy(nums2, 0, merged, nums1.length, nums2.length);
        java.util.Arrays.sort(merged);
        int n = merged.length;
        if (n % 2 == 0) {
            return (merged[n / 2 - 1] + merged[n / 2]) / 2.0;
        } else {
            return (double) merged[n / 2];
        }
    }
}
""",
        "cpp": """
class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        vector<int> merged;
        merged.insert(merged.end(), nums1.begin(), nums1.end());
        merged.insert(merged.end(), nums2.begin(), nums2.end());
        sort(merged.begin(), merged.end());
        int n = merged.size();
        if (n % 2 == 0) {
            return (merged[n / 2 - 1] + merged[n / 2]) / 2.0;
        } else {
            return (double)merged[n / 2];
        }
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
        unordered_map<char, char> pairs = {
            {'(', ')'}, {'{', '}'}, {'[', ']'}
        };
        
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
    6: {  # Merge Two Sorted Lists
        "title": "Merge Two Sorted Lists",
        "python": """
class Solution:
    def mergeTwoLists(self, list1, list2):
        dummy = ListNode(0)
        current = dummy
        
        while list1 and list2:
            if list1.val < list2.val:
                current.next = list1
                list1 = list1.next
            else:
                current.next = list2
                list2 = list2.next
            current = current.next
        
        current.next = list1 if list1 else list2
        return dummy.next
""",
        "javascript": """
var mergeTwoLists = function(list1, list2) {
    const dummy = new ListNode(0);
    let current = dummy;
    
    while (list1 !== null && list2 !== null) {
        if (list1.val < list2.val) {
            current.next = list1;
            list1 = list1.next;
        } else {
            current.next = list2;
            list2 = list2.next;
        }
        current = current.next;
    }
    
    current.next = list1 !== null ? list1 : list2;
    return dummy.next;
};
""",
        "java": """
class Solution {
    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {
        ListNode dummy = new ListNode(0);
        ListNode current = dummy;
        
        while (list1 != null && list2 != null) {
            if (list1.val < list2.val) {
                current.next = list1;
                list1 = list1.next;
            } else {
                current.next = list2;
                list2 = list2.next;
            }
            current = current.next;
        }
        
        current.next = list1 != null ? list1 : list2;
        return dummy.next;
    }
}
""",
        "cpp": """
class Solution {
public:
    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {
        ListNode* dummy = new ListNode(0);
        ListNode* current = dummy;
        
        while (list1 != nullptr && list2 != nullptr) {
            if (list1->val < list2->val) {
                current->next = list1;
                list1 = list1->next;
            } else {
                current->next = list2;
                list2 = list2->next;
            }
            current = current->next;
        }
        
        current->next = list1 != nullptr ? list1 : list2;
        return dummy->next;
    }
};
"""
    },
    7: {  # Maximum Subarray
        "title": "Maximum Subarray",
        "python": """
class Solution:
    def maxSubArray(self, nums):
        max_sum = nums[0]
        current_sum = nums[0]
        
        for i in range(1, len(nums)):
            current_sum = max(nums[i], current_sum + nums[i])
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
        
        for (int i = 1; i < nums.size(); i++) {
            currentSum = max(nums[i], currentSum + nums[i]);
            maxSum = max(maxSum, currentSum);
        }
        
        return maxSum;
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
            int temp = b;
            b = a + b;
            a = temp;
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
            int temp = b;
            b = a + b;
            a = temp;
        }
        return b;
    }
};
"""
    }
}

# ============================================================
# TEST FUNCTIONS
# ============================================================

def print_header(text: str, width: int = 70):
    print(f"\n{'='*width}")
    print(f"{text:^{width}}")
    print(f"{'='*width}\n")

def print_subheader(text: str):
    print(f"\n{text}")
    print("-" * 70)

def test_question_language_endpoint(
    question_id: int,
    language: str,
    endpoint: str,
    solution_code: str,
    question_title: str
):
    """Test a specific question/language/endpoint combination"""
    
    print_subheader(f"Testing: {question_title} | Language: {language.upper()} | Endpoint: {endpoint}")
    
    # For /submit endpoint, user_id goes in query params
    if endpoint == "/submit":
        url = f"{BASE_URL}/questions/{question_id}{endpoint}?user_id={USER_ID}"
    else:
        url = f"{BASE_URL}/questions/{question_id}{endpoint}"
    
    payload = {
        "language": language,
        "code": solution_code
    }
    
    try:
        response = requests.post(url, json=payload, timeout=30)
        
        if response.status_code != 200:
            message = f"❌ HTTP {response.status_code}: {response.text[:100]}"
            print(message)
            test_results.append(TestResult(
                question_id=question_id,
                question_title=question_title,
                language=language,
                endpoint=endpoint,
                passed=False,
                message=message
            ))
            return False
        
        data = response.json()
        
        if endpoint == "/run":
            passed = data.get("passed_test_cases", 0)
            total = data.get("total_test_cases", 0)
            
            if passed == total and total > 0:
                message = f"{Colors.GREEN}✅ Passed {passed}/{total} test cases{Colors.ENDC}"
                print(message)
                test_results.append(TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint=endpoint,
                    passed=True,
                    message=f"Passed {passed}/{total} test cases",
                    details=data
                ))
                return True
            else:
                message = f"{Colors.RED}❌ Failed: {passed}/{total} test cases passed{Colors.ENDC}"
                print(message)
                if "results" in data:
                    for result in data["results"][:2]:  # Show first 2 failures
                        if not result.get("passed"):
                            print(f"  Input: {result.get('input_data')}")
                            print(f"  Expected: {result.get('expected_output')}")
                            print(f"  Got: {result.get('actual_output')}")
                            print(f"  Status: {result.get('status')}")
                
                test_results.append(TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint=endpoint,
                    passed=False,
                    message=f"Failed: {passed}/{total} test cases",
                    details=data
                ))
                return False
        
        elif endpoint == "/submit":
            status = data.get("status")
            passed = data.get("passed_test_cases", 0)
            total = data.get("total_test_cases", 0)
            runtime = data.get("runtime_ms", 0)
            memory = data.get("memory_mb", 0)
            
            if status == "accepted":
                message = f"{Colors.GREEN}✅ Status: {status} | Passed {passed}/{total}{Colors.ENDC}"
                print(f"{message}")
                print(f"  Runtime: {runtime}ms | Memory: {memory}MB")
                test_results.append(TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint=endpoint,
                    passed=True,
                    message=f"Status: {status} | Passed {passed}/{total}",
                    details=data
                ))
                return True
            else:
                message = f"{Colors.RED}❌ Status: {status} | Passed {passed}/{total}{Colors.ENDC}"
                print(message)
                test_results.append(TestResult(
                    question_id=question_id,
                    question_title=question_title,
                    language=language,
                    endpoint=endpoint,
                    passed=False,
                    message=f"Status: {status}",
                    details=data
                ))
                return False
    
    except requests.Timeout:
        message = f"{Colors.RED}❌ Request timeout{Colors.ENDC}"
        print(message)
        test_results.append(TestResult(
            question_id=question_id,
            question_title=question_title,
            language=language,
            endpoint=endpoint,
            passed=False,
            message="Timeout"
        ))
        return False
    
    except Exception as e:
        message = f"{Colors.RED}❌ Error: {str(e)}{Colors.ENDC}"
        print(message)
        test_results.append(TestResult(
            question_id=question_id,
            question_title=question_title,
            language=language,
            endpoint=endpoint,
            passed=False,
            message=f"Error: {str(e)}"
        ))
        return False

def print_summary():
    """Print comprehensive test summary"""
    print_header("TEST SUMMARY")
    
    total = len(test_results)
    passed = sum(1 for r in test_results if r.passed)
    failed = total - passed
    success_rate = (passed / total * 100) if total > 0 else 0
    
    print(f"Total Tests: {total}")
    print(f"{Colors.GREEN}Passed: {passed}{Colors.ENDC}")
    print(f"{Colors.RED}Failed: {failed}{Colors.ENDC}")
    print(f"Success Rate: {success_rate:.1f}%\n")
    
    # Group by question
    questions = {}
    for result in test_results:
        q_id = result.question_id
        if q_id not in questions:
            questions[q_id] = {"title": result.question_title, "results": []}
        questions[q_id]["results"].append(result)
    
    for q_id in sorted(questions.keys()):
        q_data = questions[q_id]
        print(f"\nQ{q_id}: {q_data['title']}")
        
        for result in q_data["results"]:
            status_icon = "✅" if result.passed else "❌"
            color = Colors.GREEN if result.passed else Colors.RED
            print(f"  {color}{status_icon} {result.language.upper():12} | {result.endpoint:8} | {result.message}{Colors.ENDC}")
    
    print_header("🎉 ALL TESTS PASSED! 🎉" if failed == 0 else "⚠️  SOME TESTS FAILED")
    
    return failed == 0

def main():
    print_header("COMPREHENSIVE TEST SUITE - ALL LANGUAGES")
    print(f"Base URL: {BASE_URL}")
    print(f"User ID: {USER_ID}")
    
    # Test all questions
    languages = ["python", "javascript", "java", "cpp"]
    endpoints = ["/run", "/submit"]
    
    for question_id, question_data in sorted(SOLUTIONS.items()):
        question_title = question_data["title"]
        print_header(f"QUESTION {question_id}: {question_title.upper()}")
        
        for language in languages:
            solution_code = question_data[language]
            
            for endpoint in endpoints:
                test_question_language_endpoint(
                    question_id=question_id,
                    language=language,
                    endpoint=endpoint,
                    solution_code=solution_code,
                    question_title=question_title
                )
    
    # Print summary
    all_passed = print_summary()
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()

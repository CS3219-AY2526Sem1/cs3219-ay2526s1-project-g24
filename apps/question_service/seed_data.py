"""
Seed data for Question Service
Contains realistic questions, topics, companies, and test cases
"""

from datetime import datetime

from app.questions.models import (
    Company,
    DifficultyEnum,
    Question,
    TestCase,
    TestCaseVisibilityEnum,
    Topic,
)


def get_topics():
    """Return list of common coding topics"""
    return [
        {"name": "Array", "description": "Problems involving arrays and lists"},
        {"name": "String", "description": "String manipulation and processing"},
        {"name": "Hash Table", "description": "Problems using hash maps and sets"},
        {"name": "Dynamic Programming", "description": "DP optimization problems"},
        {"name": "Math", "description": "Mathematical and number theory problems"},
        {"name": "Sorting", "description": "Sorting algorithms and techniques"},
        {"name": "Greedy", "description": "Greedy algorithm problems"},
        {"name": "Depth-First Search", "description": "DFS traversal problems"},
        {"name": "Binary Search", "description": "Binary search and variants"},
        {"name": "Breadth-First Search", "description": "BFS traversal problems"},
        {"name": "Tree", "description": "Binary trees and tree structures"},
        {"name": "Graph", "description": "Graph theory and algorithms"},
        {"name": "Linked List", "description": "Singly and doubly linked lists"},
        {"name": "Stack", "description": "Stack data structure problems"},
        {"name": "Heap", "description": "Priority queue and heap problems"},
        {"name": "Backtracking", "description": "Backtracking algorithm problems"},
        {"name": "Sliding Window", "description": "Sliding window technique"},
        {"name": "Two Pointers", "description": "Two pointer technique"},
        {"name": "Bit Manipulation", "description": "Bitwise operations"},
        {"name": "Divide and Conquer", "description": "Divide and conquer strategy"},
    ]


def get_companies():
    """Return list of top tech companies"""
    return [
        {"name": "Google"},
        {"name": "Amazon"},
        {"name": "Meta"},
        {"name": "Microsoft"},
        {"name": "Apple"},
        {"name": "Netflix"},
        {"name": "Tesla"},
        {"name": "Bloomberg"},
        {"name": "Adobe"},
        {"name": "Uber"},
        {"name": "Airbnb"},
        {"name": "LinkedIn"},
        {"name": "Salesforce"},
        {"name": "Oracle"},
        {"name": "Twitter"},
    ]


def get_questions():
    """Return list of questions with test cases"""
    return [
        {
            "title": "Two Sum",
            "description": """Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.

**Example 1:**
```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].
```

**Example 2:**
```
Input: nums = [3,2,4], target = 6
Output: [1,2]
```

**Example 3:**
```
Input: nums = [3,3], target = 6
Output: [0,1]
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    \n};",
                "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "twoSum",
                "arguments": [
                    {"name": "nums", "type": "int[]"},
                    {"name": "target", "type": "int"},
                ],
                "return_type": "int[]",
            },
            "constraints": "* 2 <= nums.length <= 10^4\n* -10^9 <= nums[i] <= 10^9\n* -10^9 <= target <= 10^9\n* Only one valid answer exists.",
            "hints": [
                "A brute force approach would be O(n²) - can you do better?",
                "Think about what data structure allows O(1) lookup",
                "Use a hash map to store numbers you've seen and their indices",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 49,
            "total_submissions": 1234567,
            "total_accepted": 604958,
            "likes": 42891,
            "dislikes": 1432,
            "topics": ["Array", "Hash Table"],
            "companies": ["Google", "Amazon", "Microsoft", "Meta", "Apple"],
            "test_cases": [
                {
                    "input_data": {"nums": [2, 7, 11, 15], "target": 9},
                    "expected_output": [0, 1],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                    "explanation": "nums[0] + nums[1] = 2 + 7 = 9",
                },
                {
                    "input_data": {"nums": [3, 2, 4], "target": 6},
                    "expected_output": [1, 2],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [3, 3], "target": 6},
                    "expected_output": [0, 1],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1, 5, 3, 8, 9], "target": 12},
                    "expected_output": [2, 4],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Reverse Linked List",
            "description": """Given the head of a singly linked list, reverse the list, and return the reversed list.

**Example 1:**
```
Input: head = [1,2,3,4,5]
Output: [5,4,3,2,1]
```

**Example 2:**
```
Input: head = [1,2]
Output: [2,1]
```

**Example 3:**
```
Input: head = []
Output: []
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:\n        ",
                "javascript": "/**\n * @param {ListNode} head\n * @return {ListNode}\n */\nvar reverseList = function(head) {\n    \n};",
                "java": "class Solution {\n    public ListNode reverseList(ListNode head) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "reverseList",
                "arguments": [{"name": "head", "type": "ListNode"}],
                "return_type": "ListNode",
            },
            "constraints": "* The number of nodes in the list is in the range [0, 5000]\n* -5000 <= Node.val <= 5000",
            "hints": [
                "Can you solve it iteratively?",
                "Can you solve it recursively?",
                "Think about maintaining previous, current, and next pointers",
            ],
            "time_limit": {"python": 4, "javascript": 4, "java": 6, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 72,
            "total_submissions": 890234,
            "total_accepted": 640968,
            "likes": 18234,
            "dislikes": 321,
            "topics": ["Linked List"],
            "companies": ["Amazon", "Microsoft", "Adobe", "Bloomberg"],
            "test_cases": [
                {
                    "input_data": {"head": [1, 2, 3, 4, 5]},
                    "expected_output": [5, 4, 3, 2, 1],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"head": [1, 2]},
                    "expected_output": [2, 1],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"head": []},
                    "expected_output": [],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
            ],
        },
        {
            "title": "Longest Substring Without Repeating Characters",
            "description": """Given a string `s`, find the length of the longest substring without repeating characters.

**Example 1:**
```
Input: s = "abcabcbb"
Output: 3
Explanation: The answer is "abc", with the length of 3.
```

**Example 2:**
```
Input: s = "bbbbb"
Output: 1
Explanation: The answer is "b", with the length of 1.
```

**Example 3:**
```
Input: s = "pwwkew"
Output: 3
Explanation: The answer is "wke", with the length of 3.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ",
                "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nvar lengthOfLongestSubstring = function(s) {\n    \n};",
                "java": "class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "lengthOfLongestSubstring",
                "arguments": [{"name": "s", "type": "string"}],
                "return_type": "int",
            },
            "constraints": "* 0 <= s.length <= 5 * 10^4\n* s consists of English letters, digits, symbols and spaces.",
            "hints": [
                "Use the sliding window technique",
                "Keep track of characters seen in current window",
                "When you find a repeat, move the left pointer",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 33,
            "total_submissions": 2345678,
            "total_accepted": 774173,
            "likes": 35612,
            "dislikes": 1589,
            "topics": ["String", "Hash Table", "Sliding Window"],
            "companies": ["Amazon", "Google", "Meta", "Adobe", "Bloomberg"],
            "test_cases": [
                {
                    "input_data": {"s": "abcabcbb"},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                    "explanation": 'The answer is "abc", with the length of 3',
                },
                {
                    "input_data": {"s": "bbbbb"},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"s": "pwwkew"},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"s": ""},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Median of Two Sorted Arrays",
            "description": """Given two sorted arrays `nums1` and `nums2` of size m and n respectively, return the median of the two sorted arrays.

The overall run time complexity should be O(log (m+n)).

**Example 1:**
```
Input: nums1 = [1,3], nums2 = [2]
Output: 2.00000
Explanation: merged array = [1,2,3] and median is 2.
```

**Example 2:**
```
Input: nums1 = [1,2], nums2 = [3,4]
Output: 2.50000
Explanation: merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.
```""",
            "difficulty": DifficultyEnum.HARD,
            "code_templates": {
                "python": "class Solution:\n    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:\n        ",
                "javascript": "/**\n * @param {number[]} nums1\n * @param {number[]} nums2\n * @return {number}\n */\nvar findMedianSortedArrays = function(nums1, nums2) {\n    \n};",
                "java": "class Solution {\n    public double findMedianSortedArrays(int[] nums1, int[] nums2) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "findMedianSortedArrays",
                "arguments": [
                    {"name": "nums1", "type": "int[]"},
                    {"name": "nums2", "type": "int[]"},
                ],
                "return_type": "double",
            },
            "constraints": "* nums1.length == m\n* nums2.length == n\n* 0 <= m <= 1000\n* 0 <= n <= 1000\n* 1 <= m + n <= 2000\n* -10^6 <= nums1[i], nums2[i] <= 10^6",
            "hints": [
                "The key is to use binary search, not merge the arrays",
                "Think about partitioning both arrays",
                "Ensure left partition elements <= right partition elements",
            ],
            "time_limit": {"python": 10, "javascript": 10, "java": 15, "cpp": 5},
            "memory_limit": {"python": 128000, "javascript": 128000, "java": 196000, "cpp": 96000},
            "acceptance_rate": 35,
            "total_submissions": 567890,
            "total_accepted": 198761,
            "likes": 23456,
            "dislikes": 2891,
            "topics": ["Array", "Binary Search", "Divide and Conquer"],
            "companies": ["Google", "Meta", "Amazon", "Microsoft", "Apple"],
            "test_cases": [
                {
                    "input_data": {"nums1": [1, 3], "nums2": [2]},
                    "expected_output": 2.0,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums1": [1, 2], "nums2": [3, 4]},
                    "expected_output": 2.5,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
            ],
        },
        {
            "title": "Valid Parentheses",
            "description": """Given a string `s` containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.

**Example 1:**
```
Input: s = "()"
Output: true
```

**Example 2:**
```
Input: s = "()[]{}"
Output: true
```

**Example 3:**
```
Input: s = "(]"
Output: false
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def isValid(self, s: str) -> bool:\n        ",
                "javascript": "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isValid = function(s) {\n    \n};",
                "java": "class Solution {\n    public boolean isValid(String s) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool isValid(string s) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "isValid",
                "arguments": [{"name": "s", "type": "string"}],
                "return_type": "boolean",
            },
            "constraints": "* 1 <= s.length <= 10^4\n* s consists of parentheses only '()[]{}'.",
            "hints": ["Use a stack to keep track of opening brackets"],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 40,
            "total_submissions": 1567234,
            "total_accepted": 626893,
            "likes": 19234,
            "dislikes": 1123,
            "topics": ["String", "Stack"],
            "companies": ["Amazon", "Bloomberg", "Meta", "Microsoft"],
            "test_cases": [
                {
                    "input_data": {"s": "()"},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"s": "()[]{}"},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"s": "(]"},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"s": "([)]"},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Merge Two Sorted Lists",
            "description": """You are given the heads of two sorted linked lists `list1` and `list2`.

Merge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.

Return the head of the merged linked list.

**Example 1:**
```
Input: list1 = [1,2,4], list2 = [1,3,4]
Output: [1,1,2,3,4,4]
```

**Example 2:**
```
Input: list1 = [], list2 = []
Output: []
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def mergeTwoLists(self, list1: Optional[ListNode], list2: Optional[ListNode]) -> Optional[ListNode]:\n        ",
                "javascript": "/**\n * @param {ListNode} list1\n * @param {ListNode} list2\n * @return {ListNode}\n */\nvar mergeTwoLists = function(list1, list2) {\n    \n};",
                "java": "class Solution {\n    public ListNode mergeTwoLists(ListNode list1, ListNode list2) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    ListNode* mergeTwoLists(ListNode* list1, ListNode* list2) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "mergeTwoLists",
                "arguments": [
                    {"name": "list1", "type": "ListNode"},
                    {"name": "list2", "type": "ListNode"},
                ],
                "return_type": "ListNode",
            },
            "constraints": "* The number of nodes in both lists is in the range [0, 50]\n* -100 <= Node.val <= 100\n* Both list1 and list2 are sorted in non-decreasing order.",
            "hints": ["Use a dummy node to simplify edge cases"],
            "time_limit": {"python": 4, "javascript": 4, "java": 6, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 61,
            "total_submissions": 789456,
            "total_accepted": 481568,
            "likes": 15678,
            "dislikes": 892,
            "topics": ["Linked List"],
            "companies": ["Amazon", "Microsoft", "Adobe"],
            "test_cases": [
                {
                    "input_data": {"list1": [1, 2, 4], "list2": [1, 3, 4]},
                    "expected_output": [1, 1, 2, 3, 4, 4],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"list1": [], "list2": []},
                    "expected_output": [],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
            ],
        },
        {
            "title": "Maximum Subarray",
            "description": """Given an integer array `nums`, find the subarray with the largest sum, and return its sum.

**Example 1:**
```
Input: nums = [-2,1,-3,4,-1,2,1,-5,4]
Output: 6
Explanation: The subarray [4,-1,2,1] has the largest sum 6.
```

**Example 2:**
```
Input: nums = [1]
Output: 1
```

**Example 3:**
```
Input: nums = [5,4,-1,7,8]
Output: 23
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def maxSubArray(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int maxSubArray(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "maxSubArray",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 10^5\n* -10^4 <= nums[i] <= 10^4",
            "hints": [
                "Try using Kadane's algorithm",
                "At each position, decide whether to extend the current subarray or start a new one",
            ],
            "time_limit": {"python": 6, "javascript": 6, "java": 10, "cpp": 4},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 50,
            "total_submissions": 1890234,
            "total_accepted": 945117,
            "likes": 28901,
            "dislikes": 1234,
            "topics": ["Array", "Dynamic Programming", "Divide and Conquer"],
            "companies": ["Amazon", "Microsoft", "Google", "LinkedIn"],
            "test_cases": [
                {
                    "input_data": {"nums": [-2, 1, -3, 4, -1, 2, 1, -5, 4]},
                    "expected_output": 6,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [5, 4, -1, 7, 8]},
                    "expected_output": 23,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
            ],
        },
        {
            "title": "Climbing Stairs",
            "description": """You are climbing a staircase. It takes `n` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

**Example 1:**
```
Input: n = 2
Output: 2
Explanation: There are two ways to climb to the top.
1. 1 step + 1 step
2. 2 steps
```

**Example 2:**
```
Input: n = 3
Output: 3
Explanation: There are three ways to climb to the top.
1. 1 step + 1 step + 1 step
2. 1 step + 2 steps
3. 2 steps + 1 step
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def climbStairs(self, n: int) -> int:\n        ",
                "javascript": "/**\n * @param {number} n\n * @return {number}\n */\nvar climbStairs = function(n) {\n    \n};",
                "java": "class Solution {\n    public int climbStairs(int n) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int climbStairs(int n) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "climbStairs",
                "arguments": [{"name": "n", "type": "int"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= n <= 45",
            "hints": [
                "This is actually a Fibonacci sequence!",
                "Try dynamic programming or recursion with memoization",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 52,
            "total_submissions": 1456789,
            "total_accepted": 757530,
            "likes": 18234,
            "dislikes": 567,
            "topics": ["Math", "Dynamic Programming"],
            "companies": ["Amazon", "Adobe", "Google"],
            "test_cases": [
                {
                    "input_data": {"n": 2},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"n": 3},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"n": 5},
                    "expected_output": 8,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 2,
                },
            ],
        },
    ]

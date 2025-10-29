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
        {
            "title": "Best Time to Buy and Sell Stock",
            "description": """You are given an array `prices` where `prices[i]` is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.

**Example 1:**
```
Input: prices = [7,1,5,3,6,4]
Output: 5
Explanation: Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5.
Note that buying on day 2 and selling on day 1 is not allowed because you must buy before you sell.
```

**Example 2:**
```
Input: prices = [7,6,4,3,1]
Output: 0
Explanation: In this case, no transactions are done and the max profit = 0.
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def maxProfit(self, prices: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} prices\n * @return {number}\n */\nvar maxProfit = function(prices) {\n    \n};",
                "java": "class Solution {\n    public int maxProfit(int[] prices) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int maxProfit(vector<int>& prices) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "maxProfit",
                "arguments": [{"name": "prices", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= prices.length <= 10^5\n* 0 <= prices[i] <= 10^4",
            "hints": [
                "Keep track of the minimum price seen so far",
                "Calculate profit if you sell at current price",
                "Update maximum profit as you iterate",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 54,
            "total_submissions": 3456789,
            "total_accepted": 1866666,
            "likes": 24567,
            "dislikes": 891,
            "topics": ["Array", "Dynamic Programming"],
            "companies": ["Amazon", "Microsoft", "Google", "Bloomberg", "Meta"],
            "test_cases": [
                {
                    "input_data": {"prices": [7, 1, 5, 3, 6, 4]},
                    "expected_output": 5,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                    "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5",
                },
                {
                    "input_data": {"prices": [7, 6, 4, 3, 1]},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"prices": [2, 4, 1]},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"prices": [1]},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"prices": [3, 2, 6, 5, 0, 3]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Contains Duplicate",
            "description": """Given an integer array `nums`, return `true` if any value appears at least twice in the array, and return `false` if every element is distinct.

**Example 1:**
```
Input: nums = [1,2,3,1]
Output: true
```

**Example 2:**
```
Input: nums = [1,2,3,4]
Output: false
```

**Example 3:**
```
Input: nums = [1,1,1,3,3,4,3,2,4,2]
Output: true
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def containsDuplicate(self, nums: List[int]) -> bool:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar containsDuplicate = function(nums) {\n    \n};",
                "java": "class Solution {\n    public boolean containsDuplicate(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool containsDuplicate(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "containsDuplicate",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "boolean",
            },
            "constraints": "* 1 <= nums.length <= 10^5\n* -10^9 <= nums[i] <= 10^9",
            "hints": [
                "Use a hash set to track seen numbers",
                "Return true as soon as you find a duplicate",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 61,
            "total_submissions": 2345678,
            "total_accepted": 1430863,
            "likes": 9876,
            "dislikes": 1234,
            "topics": ["Array", "Hash Table", "Sorting"],
            "companies": ["Amazon", "Apple", "Adobe", "Google"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 2, 3, 1]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [1, 2, 3, 4]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1, 1, 1, 3, 3, 4, 3, 2, 4, 2]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [0, 0]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Move Zeroes",
            "description": """Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.

**Note:** You must do this in-place without making a copy of the array.

**Example 1:**
```
Input: nums = [0,1,0,3,12]
Output: [1,3,12,0,0]
```

**Example 2:**
```
Input: nums = [0]
Output: [0]
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def moveZeroes(self, nums: List[int]) -> None:\n        \"\"\"\n        Do not return anything, modify nums in-place instead.\n        \"\"\"\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {void} Do not return anything, modify nums in-place instead.\n */\nvar moveZeroes = function(nums) {\n    \n};",
                "java": "class Solution {\n    public void moveZeroes(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    void moveZeroes(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "moveZeroes",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "void",
            },
            "constraints": "* 1 <= nums.length <= 10^4\n* -2^31 <= nums[i] <= 2^31 - 1",
            "hints": [
                "Use a two-pointer approach",
                "Keep track of position for next non-zero element",
                "Swap elements to maintain order",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 61,
            "total_submissions": 1789456,
            "total_accepted": 1091568,
            "likes": 13456,
            "dislikes": 342,
            "topics": ["Array", "Two Pointers"],
            "companies": ["Meta", "Bloomberg", "Apple"],
            "test_cases": [
                {
                    "input_data": {"nums": [0, 1, 0, 3, 12]},
                    "expected_output": [1, 3, 12, 0, 0],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [0]},
                    "expected_output": [0],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1, 2, 3]},
                    "expected_output": [1, 2, 3],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [0, 0, 1]},
                    "expected_output": [1, 0, 0],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [2, 1]},
                    "expected_output": [2, 1],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Find All Numbers Disappeared in an Array",
            "description": """Given an array `nums` of `n` integers where `nums[i]` is in the range `[1, n]`, return an array of all the integers in the range `[1, n]` that do not appear in `nums`.

**Example 1:**
```
Input: nums = [4,3,2,7,8,2,3,1]
Output: [5,6]
```

**Example 2:**
```
Input: nums = [1,1]
Output: [2]
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def findDisappearedNumbers(self, nums: List[int]) -> List[int]:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar findDisappearedNumbers = function(nums) {\n    \n};",
                "java": "class Solution {\n    public List<Integer> findDisappearedNumbers(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<int> findDisappearedNumbers(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "findDisappearedNumbers",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int[]",
            },
            "constraints": "* n == nums.length\n* 1 <= n <= 10^5\n* 1 <= nums[i] <= n",
            "hints": [
                "Can you do it without extra space? (O(1) space)",
                "Use the input array itself to mark which numbers have appeared",
                "Consider using negative numbers or indices as markers",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 58,
            "total_submissions": 987654,
            "total_accepted": 572639,
            "likes": 8765,
            "dislikes": 456,
            "topics": ["Array", "Hash Table"],
            "companies": ["Google", "Amazon"],
            "test_cases": [
                {
                    "input_data": {"nums": [4, 3, 2, 7, 8, 2, 3, 1]},
                    "expected_output": [5, 6],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [1, 1]},
                    "expected_output": [2],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": [],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [2, 2]},
                    "expected_output": [1],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [1, 2, 3, 4, 5]},
                    "expected_output": [],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Valid Anagram",
            "description": """Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example 1:**
```
Input: s = "anagram", t = "nagaram"
Output: true
```

**Example 2:**
```
Input: s = "rat", t = "car"
Output: false
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        ",
                "javascript": "/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nvar isAnagram = function(s, t) {\n    \n};",
                "java": "class Solution {\n    public boolean isAnagram(String s, String t) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "isAnagram",
                "arguments": [
                    {"name": "s", "type": "string"},
                    {"name": "t", "type": "string"},
                ],
                "return_type": "boolean",
            },
            "constraints": "* 1 <= s.length, t.length <= 5 * 10^4\n* s and t consist of lowercase English letters.",
            "hints": [
                "Use a hash map to count character frequencies",
                "Or sort both strings and compare them",
            ],
            "time_limit": {"python": 4, "javascript": 4, "java": 6, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 63,
            "total_submissions": 2456789,
            "total_accepted": 1547777,
            "likes": 9876,
            "dislikes": 234,
            "topics": ["String", "Hash Table", "Sorting"],
            "companies": ["Amazon", "Google", "Bloomberg"],
            "test_cases": [
                {
                    "input_data": {"s": "anagram", "t": "nagaram"},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"s": "rat", "t": "car"},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"s": "a", "t": "a"},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 2,
                },
                {
                    "input_data": {"s": "ab", "t": "ba"},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Longest Common Prefix",
            "description": """Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string `""`.

**Example 1:**
```
Input: strs = ["flower","flow","flight"]
Output: "fl"
```

**Example 2:**
```
Input: strs = ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def longestCommonPrefix(self, strs: List[str]) -> str:\n        ",
                "javascript": "/**\n * @param {string[]} strs\n * @return {string}\n */\nvar longestCommonPrefix = function(strs) {\n    \n};",
                "java": "class Solution {\n    public String longestCommonPrefix(String[] strs) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    string longestCommonPrefix(vector<string>& strs) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "longestCommonPrefix",
                "arguments": [{"name": "strs", "type": "string[]"}],
                "return_type": "string",
            },
            "constraints": "* 1 <= strs.length <= 200\n* 0 <= strs[i].length <= 200\n* strs[i] consists of only lowercase English letters.",
            "hints": [
                "Compare characters of the first string with all other strings",
                "Stop when you find a mismatch",
            ],
            "time_limit": {"python": 4, "javascript": 4, "java": 6, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 41,
            "total_submissions": 3456789,
            "total_accepted": 1417283,
            "likes": 12345,
            "dislikes": 3456,
            "topics": ["String"],
            "companies": ["Amazon", "Google", "Microsoft"],
            "test_cases": [
                {
                    "input_data": {"strs": ["flower", "flow", "flight"]},
                    "expected_output": "fl",
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"strs": ["dog", "racecar", "car"]},
                    "expected_output": "",
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"strs": ["a"]},
                    "expected_output": "a",
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 2,
                },
                {
                    "input_data": {"strs": ["ab", "a"]},
                    "expected_output": "a",
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Palindrome Number",
            "description": """Given an integer `x`, return `true` if `x` is a palindrome, and `false` otherwise.

**Example 1:**
```
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.
```

**Example 2:**
```
Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.
```

**Example 3:**
```
Input: x = 10
Output: false
Explanation: Reads 01 from right to left. Therefore it is not a palindrome.
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def isPalindrome(self, x: int) -> bool:\n        ",
                "javascript": "/**\n * @param {number} x\n * @return {boolean}\n */\nvar isPalindrome = function(x) {\n    \n};",
                "java": "class Solution {\n    public boolean isPalindrome(int x) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool isPalindrome(int x) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "isPalindrome",
                "arguments": [{"name": "x", "type": "int"}],
                "return_type": "boolean",
            },
            "constraints": "* -2^31 <= x <= 2^31 - 1",
            "hints": [
                "Negative numbers are not palindromes",
                "Can you solve it without converting to string?",
                "Reverse the number and compare",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 53,
            "total_submissions": 4567890,
            "total_accepted": 2420941,
            "likes": 9876,
            "dislikes": 2345,
            "topics": ["Math"],
            "companies": ["Amazon", "Microsoft", "Adobe"],
            "test_cases": [
                {
                    "input_data": {"x": 121},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"x": -121},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"x": 10},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"x": 0},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"x": 12321},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Remove Duplicates from Sorted Array",
            "description": """Given an integer array `nums` sorted in **non-decreasing order**, remove the duplicates **in-place** such that each unique element appears only **once**. The **relative order** of the elements should be kept the **same**.

Return `k` after placing the final result in the first `k` slots of `nums`.

Do **not** allocate extra space for another array. You must do this by modifying the input array **in-place** with O(1) extra memory.

**Example 1:**
```
Input: nums = [1,1,2]
Output: 2, nums = [1,2,_]
Explanation: Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively.
```

**Example 2:**
```
Input: nums = [0,0,1,1,1,2,2,3,3,4]
Output: 5, nums = [0,1,2,3,4,_,_,_,_,_]
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def removeDuplicates(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar removeDuplicates = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int removeDuplicates(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int removeDuplicates(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "removeDuplicates",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 3 * 10^4\n* -100 <= nums[i] <= 100\n* nums is sorted in non-decreasing order.",
            "hints": [
                "Use two pointers approach",
                "One pointer for reading, one for writing unique elements",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 51,
            "total_submissions": 3456789,
            "total_accepted": 1763042,
            "likes": 10234,
            "dislikes": 13456,
            "topics": ["Array", "Two Pointers"],
            "companies": ["Microsoft", "Adobe", "Google"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 1, 2]},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]},
                    "expected_output": 5,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1, 2, 3]},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Plus One",
            "description": """You are given a **large integer** represented as an integer array `digits`, where each `digits[i]` is the ith digit of the integer. The digits are ordered from most significant to least significant in left-to-right order. The large integer does not contain any leading `0`'s.

Increment the large integer by one and return the resulting array of digits.

**Example 1:**
```
Input: digits = [1,2,3]
Output: [1,2,4]
Explanation: The array represents the integer 123. Incrementing by one gives 123 + 1 = 124.
```

**Example 2:**
```
Input: digits = [4,3,2,1]
Output: [4,3,2,2]
```

**Example 3:**
```
Input: digits = [9]
Output: [1,0]
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def plusOne(self, digits: List[int]) -> List[int]:\n        ",
                "javascript": "/**\n * @param {number[]} digits\n * @return {number[]}\n */\nvar plusOne = function(digits) {\n    \n};",
                "java": "class Solution {\n    public int[] plusOne(int[] digits) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<int> plusOne(vector<int>& digits) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "plusOne",
                "arguments": [{"name": "digits", "type": "int[]"}],
                "return_type": "int[]",
            },
            "constraints": "* 1 <= digits.length <= 100\n* 0 <= digits[i] <= 9\n* digits does not contain any leading 0's.",
            "hints": [
                "Start from the last digit and add 1",
                "Handle carry-over if digit becomes 10",
                "Handle the case where all digits are 9 (e.g., [9,9,9])",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 45,
            "total_submissions": 2345678,
            "total_accepted": 1055555,
            "likes": 6789,
            "dislikes": 4567,
            "topics": ["Array", "Math"],
            "companies": ["Google", "Amazon"],
            "test_cases": [
                {
                    "input_data": {"digits": [1, 2, 3]},
                    "expected_output": [1, 2, 4],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"digits": [4, 3, 2, 1]},
                    "expected_output": [4, 3, 2, 2],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"digits": [9]},
                    "expected_output": [1, 0],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"digits": [9, 9]},
                    "expected_output": [1, 0, 0],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"digits": [8, 9, 9]},
                    "expected_output": [9, 0, 0],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Single Number",
            "description": """Given a **non-empty** array of integers `nums`, every element appears **twice** except for one. Find that single one.

You must implement a solution with a linear runtime complexity and use only constant extra space.

**Example 1:**
```
Input: nums = [2,2,1]
Output: 1
```

**Example 2:**
```
Input: nums = [4,1,2,1,2]
Output: 4
```

**Example 3:**
```
Input: nums = [1]
Output: 1
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def singleNumber(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar singleNumber = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int singleNumber(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int singleNumber(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "singleNumber",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 3 * 10^4\n* -3 * 10^4 <= nums[i] <= 3 * 10^4\n* Each element in the array appears twice except for one element which appears only once.",
            "hints": [
                "Use XOR operation: a XOR a = 0, a XOR 0 = a",
                "XOR all numbers together - pairs will cancel out",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 70,
            "total_submissions": 2234567,
            "total_accepted": 1564197,
            "likes": 13456,
            "dislikes": 567,
            "topics": ["Array", "Bit Manipulation"],
            "companies": ["Amazon", "Google", "Apple"],
            "test_cases": [
                {
                    "input_data": {"nums": [2, 2, 1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [4, 1, 2, 1, 2]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1, 3, 1, 3, 5]},
                    "expected_output": 5,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Majority Element",
            "description": """Given an array `nums` of size `n`, return the majority element.

The majority element is the element that appears more than `⌊n / 2⌋` times. You may assume that the majority element always exists in the array.

**Example 1:**
```
Input: nums = [3,2,3]
Output: 3
```

**Example 2:**
```
Input: nums = [2,2,1,1,1,2,2]
Output: 2
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def majorityElement(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar majorityElement = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int majorityElement(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int majorityElement(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "majorityElement",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* n == nums.length\n* 1 <= n <= 5 * 10^4\n* -10^9 <= nums[i] <= 10^9",
            "hints": [
                "Use Boyer-Moore Voting Algorithm for O(1) space",
                "Or use a hash map to count frequencies",
                "Or sort the array - the middle element will be the majority",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 64,
            "total_submissions": 1987654,
            "total_accepted": 1272098,
            "likes": 14567,
            "dislikes": 456,
            "topics": ["Array", "Hash Table", "Sorting"],
            "companies": ["Amazon", "Adobe", "Apple"],
            "test_cases": [
                {
                    "input_data": {"nums": [3, 2, 3]},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [2, 2, 1, 1, 1, 2, 2]},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [6, 5, 5]},
                    "expected_output": 5,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
            ],
        },
        {
            "title": "Search Insert Position",
            "description": """Given a sorted array of distinct integers and a target value, return the index if the target is found. If not, return the index where it would be if it were inserted in order.

You must write an algorithm with **O(log n)** runtime complexity.

**Example 1:**
```
Input: nums = [1,3,5,6], target = 5
Output: 2
```

**Example 2:**
```
Input: nums = [1,3,5,6], target = 2
Output: 1
```

**Example 3:**
```
Input: nums = [1,3,5,6], target = 7
Output: 4
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def searchInsert(self, nums: List[int], target: int) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar searchInsert = function(nums, target) {\n    \n};",
                "java": "class Solution {\n    public int searchInsert(int[] nums, int target) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int searchInsert(vector<int>& nums, int target) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "searchInsert",
                "arguments": [
                    {"name": "nums", "type": "int[]"},
                    {"name": "target", "type": "int"},
                ],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 10^4\n* -10^4 <= nums[i] <= 10^4\n* nums contains distinct values sorted in ascending order.\n* -10^4 <= target <= 10^4",
            "hints": [
                "Use binary search",
                "When target is not found, left pointer will be at the insert position",
            ],
            "time_limit": {"python": 4, "javascript": 4, "java": 6, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 43,
            "total_submissions": 2456789,
            "total_accepted": 1056419,
            "likes": 12345,
            "dislikes": 567,
            "topics": ["Array", "Binary Search"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 3, 5, 6], "target": 5},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [1, 3, 5, 6], "target": 2},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1, 3, 5, 6], "target": 7},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1, 3, 5, 6], "target": 0},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [1], "target": 1},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        # Batch 3: Core Medium - Dynamic Programming (21-28)
        {
            "title": "House Robber",
            "description": """You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected and **it will automatically contact the police if two adjacent houses were broken into on the same night**.

Given an integer array `nums` representing the amount of money of each house, return the maximum amount of money you can rob tonight **without alerting the police**.

**Example 1:**
```
Input: nums = [1,2,3,1]
Output: 4
Explanation: Rob house 1 (money = 1) and then rob house 3 (money = 3).
Total amount you can rob = 1 + 3 = 4.
```

**Example 2:**
```
Input: nums = [2,7,9,3,1]
Output: 12
Explanation: Rob house 1 (money = 2), rob house 3 (money = 9) and rob house 5 (money = 1).
Total amount you can rob = 2 + 9 + 1 = 12.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def rob(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar rob = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int rob(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int rob(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "rob",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 100\n* 0 <= nums[i] <= 400",
            "hints": [
                "Use dynamic programming",
                "For each house, decide whether to rob it or not",
                "dp[i] = max(dp[i-1], dp[i-2] + nums[i])",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 49,
            "total_submissions": 1987654,
            "total_accepted": 973750,
            "likes": 17890,
            "dislikes": 345,
            "topics": ["Array", "Dynamic Programming"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 2, 3, 1]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [2, 7, 9, 3, 1]},
                    "expected_output": 12,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [2, 1, 1, 2]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [5, 3, 4, 11, 2]},
                    "expected_output": 16,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Coin Change",
            "description": """You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.

You may assume that you have an infinite number of each kind of coin.

**Example 1:**
```
Input: coins = [1,2,5], amount = 11
Output: 3
Explanation: 11 = 5 + 5 + 1
```

**Example 2:**
```
Input: coins = [2], amount = 3
Output: -1
```

**Example 3:**
```
Input: coins = [1], amount = 0
Output: 0
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def coinChange(self, coins: List[int], amount: int) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nvar coinChange = function(coins, amount) {\n    \n};",
                "java": "class Solution {\n    public int coinChange(int[] coins, int amount) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int coinChange(vector<int>& coins, int amount) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "coinChange",
                "arguments": [
                    {"name": "coins", "type": "int[]"},
                    {"name": "amount", "type": "int"},
                ],
                "return_type": "int",
            },
            "constraints": "* 1 <= coins.length <= 12\n* 1 <= coins[i] <= 2^31 - 1\n* 0 <= amount <= 10^4",
            "hints": [
                "Use bottom-up dynamic programming",
                "dp[i] = minimum coins needed for amount i",
                "dp[i] = min(dp[i], dp[i - coin] + 1) for each coin",
            ],
            "time_limit": {"python": 8, "javascript": 8, "java": 12, "cpp": 5},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 41,
            "total_submissions": 2456789,
            "total_accepted": 1007283,
            "likes": 16789,
            "dislikes": 389,
            "topics": ["Array", "Dynamic Programming"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"coins": [1, 2, 5], "amount": 11},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"coins": [2], "amount": 3},
                    "expected_output": -1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"coins": [1], "amount": 0},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"coins": [1, 2, 5], "amount": 100},
                    "expected_output": 20,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"coins": [186, 419, 83, 408], "amount": 6249},
                    "expected_output": 20,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Longest Increasing Subsequence",
            "description": """Given an integer array `nums`, return the length of the longest strictly increasing subsequence.

**Example 1:**
```
Input: nums = [10,9,2,5,3,7,101,18]
Output: 4
Explanation: The longest increasing subsequence is [2,3,7,101], therefore the length is 4.
```

**Example 2:**
```
Input: nums = [0,1,0,3,2,3]
Output: 4
```

**Example 3:**
```
Input: nums = [7,7,7,7,7,7,7]
Output: 1
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def lengthOfLIS(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar lengthOfLIS = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int lengthOfLIS(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int lengthOfLIS(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "lengthOfLIS",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 2500\n* -10^4 <= nums[i] <= 10^4",
            "hints": [
                "Use dynamic programming where dp[i] is the length of LIS ending at index i",
                "For each element, check all previous elements",
                "Can optimize to O(n log n) using binary search",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 52,
            "total_submissions": 1876543,
            "total_accepted": 975722,
            "likes": 18234,
            "dislikes": 345,
            "topics": ["Array", "Binary Search", "Dynamic Programming"],
            "companies": ["Google", "Amazon", "Meta"],
            "test_cases": [
                {
                    "input_data": {"nums": [10, 9, 2, 5, 3, 7, 101, 18]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [0, 1, 0, 3, 2, 3]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [7, 7, 7, 7, 7, 7, 7]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [1, 3, 6, 7, 9, 4, 10, 5, 6]},
                    "expected_output": 6,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Word Break",
            "description": """Given a string `s` and a dictionary of strings `wordDict`, return `true` if `s` can be segmented into a space-separated sequence of one or more dictionary words.

**Note** that the same word in the dictionary may be reused multiple times in the segmentation.

**Example 1:**
```
Input: s = "leetcode", wordDict = ["leet","code"]
Output: true
Explanation: Return true because "leetcode" can be segmented as "leet code".
```

**Example 2:**
```
Input: s = "applepenapple", wordDict = ["apple","pen"]
Output: true
Explanation: Return true because "applepenapple" can be segmented as "apple pen apple".
Note that you are allowed to reuse a dictionary word.
```

**Example 3:**
```
Input: s = "catsandog", wordDict = ["cats","dog","sand","and","cat"]
Output: false
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def wordBreak(self, s: str, wordDict: List[str]) -> bool:\n        ",
                "javascript": "/**\n * @param {string} s\n * @param {string[]} wordDict\n * @return {boolean}\n */\nvar wordBreak = function(s, wordDict) {\n    \n};",
                "java": "class Solution {\n    public boolean wordBreak(String s, List<String> wordDict) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool wordBreak(string s, vector<string>& wordDict) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "wordBreak",
                "arguments": [
                    {"name": "s", "type": "string"},
                    {"name": "wordDict", "type": "string[]"},
                ],
                "return_type": "boolean",
            },
            "constraints": "* 1 <= s.length <= 300\n* 1 <= wordDict.length <= 1000\n* 1 <= wordDict[i].length <= 20\n* s and wordDict[i] consist of only lowercase English letters\n* All the strings of wordDict are unique",
            "hints": [
                "Use dynamic programming",
                "dp[i] = true if s[0..i] can be segmented",
                "Check if s[j..i] is in wordDict and dp[j] is true",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 45,
            "total_submissions": 1765432,
            "total_accepted": 794444,
            "likes": 14567,
            "dislikes": 567,
            "topics": ["String", "Dynamic Programming", "Hash Table"],
            "companies": ["Google", "Amazon", "Microsoft"],
            "test_cases": [
                {
                    "input_data": {"s": "leetcode", "wordDict": ["leet", "code"]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"s": "applepenapple", "wordDict": ["apple", "pen"]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"s": "catsandog", "wordDict": ["cats", "dog", "sand", "and", "cat"]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"s": "a", "wordDict": ["a"]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"s": "aaaaaaa", "wordDict": ["aaaa", "aaa"]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Maximum Product Subarray",
            "description": """Given an integer array `nums`, find a subarray that has the largest product, and return the product.

The test cases are generated so that the answer will fit in a **32-bit** integer.

**Example 1:**
```
Input: nums = [2,3,-2,4]
Output: 6
Explanation: [2,3] has the largest product 6.
```

**Example 2:**
```
Input: nums = [-2,0,-1]
Output: 0
Explanation: The result cannot be 2, because [-2,-1] is not a subarray.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def maxProduct(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxProduct = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int maxProduct(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int maxProduct(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "maxProduct",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 2 * 10^4\n* -10 <= nums[i] <= 10\n* The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer",
            "hints": [
                "Track both maximum and minimum products",
                "Negative numbers can flip max and min",
                "Update max_prod and min_prod at each step",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 35,
            "total_submissions": 1654321,
            "total_accepted": 579012,
            "likes": 15234,
            "dislikes": 678,
            "topics": ["Array", "Dynamic Programming"],
            "companies": ["Amazon", "Microsoft", "LinkedIn"],
            "test_cases": [
                {
                    "input_data": {"nums": [2, 3, -2, 4]},
                    "expected_output": 6,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [-2, 0, -1]},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [-2]},
                    "expected_output": -2,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [-2, 3, -4]},
                    "expected_output": 24,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [0, 2]},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Decode Ways",
            "description": """A message containing letters from `A-Z` can be **encoded** into numbers using the following mapping:

```
'A' -> "1"
'B' -> "2"
...
'Z' -> "26"
```

To **decode** an encoded message, all the digits must be grouped then mapped back into letters using the reverse of the mapping above (there may be multiple ways). For example, `"11106"` can be mapped into:

- `"AAJF"` with the grouping `(1 1 10 6)`
- `"KJF"` with the grouping `(11 10 6)`

Note that the grouping `(1 11 06)` is invalid because `"06"` cannot be mapped into `'F'` since `"6"` is different from `"06"`.

Given a string `s` containing only digits, return the **number** of ways to **decode** it.

The test cases are generated so that the answer fits in a **32-bit** integer.

**Example 1:**
```
Input: s = "12"
Output: 2
Explanation: "12" could be decoded as "AB" (1 2) or "L" (12).
```

**Example 2:**
```
Input: s = "226"
Output: 3
Explanation: "226" could be decoded as "BZ" (2 26), "VF" (22 6), or "BBF" (2 2 6).
```

**Example 3:**
```
Input: s = "06"
Output: 0
Explanation: "06" cannot be mapped to "F" because of the leading zero ("6" is different from "06").
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def numDecodings(self, s: str) -> int:\n        ",
                "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nvar numDecodings = function(s) {\n    \n};",
                "java": "class Solution {\n    public int numDecodings(String s) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int numDecodings(string s) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "numDecodings",
                "arguments": [{"name": "s", "type": "string"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= s.length <= 100\n* s contains only digits and may contain leading zero(s)",
            "hints": [
                "Use dynamic programming",
                "dp[i] = ways to decode s[0..i]",
                "Check single digit (1-9) and two digits (10-26)",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 32,
            "total_submissions": 1543210,
            "total_accepted": 493827,
            "likes": 9876,
            "dislikes": 4123,
            "topics": ["String", "Dynamic Programming"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"s": "12"},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"s": "226"},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"s": "06"},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"s": "10"},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"s": "2101"},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Unique Paths",
            "description": """There is a robot on an `m x n` grid. The robot is initially located at the **top-left corner** (i.e., `grid[0][0]`). The robot tries to move to the **bottom-right corner** (i.e., `grid[m - 1][n - 1]`). The robot can only move either down or right at any point in time.

Given the two integers `m` and `n`, return the number of possible unique paths that the robot can take to reach the bottom-right corner.

The test cases are generated so that the answer will be less than or equal to `2 * 10^9`.

**Example 1:**
```
Input: m = 3, n = 7
Output: 28
```

**Example 2:**
```
Input: m = 3, n = 2
Output: 3
Explanation: From the top-left corner, there are a total of 3 ways to reach the bottom-right corner:
1. Right -> Down -> Down
2. Down -> Down -> Right
3. Down -> Right -> Down
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def uniquePaths(self, m: int, n: int) -> int:\n        ",
                "javascript": "/**\n * @param {number} m\n * @param {number} n\n * @return {number}\n */\nvar uniquePaths = function(m, n) {\n    \n};",
                "java": "class Solution {\n    public int uniquePaths(int m, int n) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int uniquePaths(int m, int n) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "uniquePaths",
                "arguments": [
                    {"name": "m", "type": "int"},
                    {"name": "n", "type": "int"},
                ],
                "return_type": "int",
            },
            "constraints": "* 1 <= m, n <= 100",
            "hints": [
                "Use dynamic programming",
                "dp[i][j] = number of paths to reach (i, j)",
                "dp[i][j] = dp[i-1][j] + dp[i][j-1]",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 63,
            "total_submissions": 1456789,
            "total_accepted": 917777,
            "likes": 13456,
            "dislikes": 234,
            "topics": ["Array", "Dynamic Programming"],
            "companies": ["Google", "Amazon", "Meta"],
            "test_cases": [
                {
                    "input_data": {"m": 3, "n": 7},
                    "expected_output": 28,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"m": 3, "n": 2},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"m": 1, "n": 1},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"m": 10, "n": 10},
                    "expected_output": 48620,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"m": 23, "n": 12},
                    "expected_output": 193536720,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Jump Game",
            "description": """You are given an integer array `nums`. You are initially positioned at the array's **first index**, and each element in the array represents your maximum jump length at that position.

Return `true` if you can reach the last index, or `false` otherwise.

**Example 1:**
```
Input: nums = [2,3,1,1,4]
Output: true
Explanation: Jump 1 step from index 0 to 1, then 3 steps to the last index.
```

**Example 2:**
```
Input: nums = [3,2,1,0,4]
Output: false
Explanation: You will always arrive at index 3 no matter what. Its maximum jump length is 0, which makes it impossible to reach the last index.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def canJump(self, nums: List[int]) -> bool:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nvar canJump = function(nums) {\n    \n};",
                "java": "class Solution {\n    public boolean canJump(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool canJump(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "canJump",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "boolean",
            },
            "constraints": "* 1 <= nums.length <= 10^4\n* 0 <= nums[i] <= 10^5",
            "hints": [
                "Use greedy approach",
                "Track the maximum reachable position",
                "If current index > max reachable, return false",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 38,
            "total_submissions": 2123456,
            "total_accepted": 806913,
            "likes": 16789,
            "dislikes": 987,
            "topics": ["Array", "Dynamic Programming", "Greedy"],
            "companies": ["Amazon", "Microsoft", "Adobe"],
            "test_cases": [
                {
                    "input_data": {"nums": [2, 3, 1, 1, 4]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [3, 2, 1, 0, 4]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [0]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [2, 0, 0]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [1, 1, 1, 0]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        # Batch 4: Medium - Arrays & Two Pointers (29-36)
        {
            "title": "Product of Array Except Self",
            "description": """Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.

The product of any prefix or suffix of `nums` is **guaranteed** to fit in a **32-bit** integer.

You must write an algorithm that runs in `O(n)` time and without using the division operation.

**Example 1:**
```
Input: nums = [1,2,3,4]
Output: [24,12,8,6]
```

**Example 2:**
```
Input: nums = [-1,1,0,-3,3]
Output: [0,0,9,0,0]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def productExceptSelf(self, nums: List[int]) -> List[int]:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number[]}\n */\nvar productExceptSelf = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int[] productExceptSelf(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<int> productExceptSelf(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "productExceptSelf",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int[]",
            },
            "constraints": "* 2 <= nums.length <= 10^5\n* -30 <= nums[i] <= 30\n* The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer",
            "hints": [
                "Use prefix and suffix products",
                "First pass: calculate prefix products",
                "Second pass: calculate suffix products and combine",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 64,
            "total_submissions": 1987654,
            "total_accepted": 1272098,
            "likes": 18765,
            "dislikes": 1123,
            "topics": ["Array", "Prefix Sum"],
            "companies": ["Amazon", "Microsoft", "Meta"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 2, 3, 4]},
                    "expected_output": [24, 12, 8, 6],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [-1, 1, 0, -3, 3]},
                    "expected_output": [0, 0, 9, 0, 0],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1, 2]},
                    "expected_output": [2, 1],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [2, 3, 4, 5]},
                    "expected_output": [60, 40, 30, 24],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [0, 0]},
                    "expected_output": [0, 0],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "3Sum",
            "description": """Given an integer array nums, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.

Notice that the solution set must not contain duplicate triplets.

**Example 1:**
```
Input: nums = [-1,0,1,2,-1,-4]
Output: [[-1,-1,2],[-1,0,1]]
Explanation: 
nums[0] + nums[1] + nums[2] = (-1) + 0 + 1 = 0.
nums[1] + nums[2] + nums[4] = 0 + 1 + (-1) = 0.
nums[0] + nums[3] + nums[4] = (-1) + 2 + (-1) = 0.
The distinct triplets are [-1,0,1] and [-1,-1,2].
Notice that the order of the output and the order of the triplets does not matter.
```

**Example 2:**
```
Input: nums = [0,1,1]
Output: []
Explanation: The only possible triplet does not sum up to 0.
```

**Example 3:**
```
Input: nums = [0,0,0]
Output: [[0,0,0]]
Explanation: The only possible triplet sums up to 0.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def threeSum(self, nums: List[int]) -> List[List[int]]:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar threeSum = function(nums) {\n    \n};",
                "java": "class Solution {\n    public List<List<Integer>> threeSum(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<vector<int>> threeSum(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "threeSum",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int[][]",
            },
            "constraints": "* 3 <= nums.length <= 3000\n* -10^5 <= nums[i] <= 10^5",
            "hints": [
                "Sort the array first",
                "Use two pointers for each fixed element",
                "Skip duplicates to avoid duplicate triplets",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 32,
            "total_submissions": 3456789,
            "total_accepted": 1106172,
            "likes": 25678,
            "dislikes": 2345,
            "topics": ["Array", "Two Pointers", "Sorting"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"nums": [-1, 0, 1, 2, -1, -4]},
                    "expected_output": [[-1, -1, 2], [-1, 0, 1]],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [0, 1, 1]},
                    "expected_output": [],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [0, 0, 0]},
                    "expected_output": [[0, 0, 0]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [-2, 0, 1, 1, 2]},
                    "expected_output": [[-2, 0, 2], [-2, 1, 1]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [1, 2, -2, -1]},
                    "expected_output": [],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Container With Most Water",
            "description": """You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `ith` line are `(i, 0)` and `(i, height[i])`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return the maximum amount of water a container can store.

**Notice** that you may not slant the container.

**Example 1:**
```
Input: height = [1,8,6,2,5,4,8,3,7]
Output: 49
Explanation: The above vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (blue section) the container can contain is 49.
```

**Example 2:**
```
Input: height = [1,1]
Output: 1
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def maxArea(self, height: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} height\n * @return {number}\n */\nvar maxArea = function(height) {\n    \n};",
                "java": "class Solution {\n    public int maxArea(int[] height) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "maxArea",
                "arguments": [{"name": "height", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* n == height.length\n* 2 <= n <= 10^5\n* 0 <= height[i] <= 10^4",
            "hints": [
                "Use two pointers, one at each end",
                "Move the pointer with smaller height",
                "Track maximum area seen",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 54,
            "total_submissions": 2345678,
            "total_accepted": 1266666,
            "likes": 23456,
            "dislikes": 1789,
            "topics": ["Array", "Two Pointers", "Greedy"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"height": [1, 8, 6, 2, 5, 4, 8, 3, 7]},
                    "expected_output": 49,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"height": [1, 1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"height": [4, 3, 2, 1, 4]},
                    "expected_output": 16,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"height": [1, 2, 1]},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"height": [2, 3, 4, 5, 18, 17, 6]},
                    "expected_output": 17,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Group Anagrams",
            "description": """Given an array of strings `strs`, group the anagrams together. You can return the answer in **any order**.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

**Example 1:**
```
Input: strs = ["eat","tea","tan","ate","nat","bat"]
Output: [["bat"],["nat","tan"],["ate","eat","tea"]]
```

**Example 2:**
```
Input: strs = [""]
Output: [[""]]
```

**Example 3:**
```
Input: strs = ["a"]
Output: [["a"]]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def groupAnagrams(self, strs: List[str]) -> List[List[str]]:\n        ",
                "javascript": "/**\n * @param {string[]} strs\n * @return {string[][]}\n */\nvar groupAnagrams = function(strs) {\n    \n};",
                "java": "class Solution {\n    public List<List<String>> groupAnagrams(String[] strs) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<vector<string>> groupAnagrams(vector<string>& strs) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "groupAnagrams",
                "arguments": [{"name": "strs", "type": "string[]"}],
                "return_type": "string[][]",
            },
            "constraints": "* 1 <= strs.length <= 10^4\n* 0 <= strs[i].length <= 100\n* strs[i] consists of lowercase English letters",
            "hints": [
                "Use a hash map with sorted string as key",
                "All anagrams will have the same sorted string",
                "Group strings with the same key together",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 65,
            "total_submissions": 1876543,
            "total_accepted": 1219753,
            "likes": 15678,
            "dislikes": 456,
            "topics": ["String", "Hash Table", "Sorting"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {"strs": ["eat", "tea", "tan", "ate", "nat", "bat"]},
                    "expected_output": [["bat"], ["nat", "tan"], ["ate", "eat", "tea"]],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"strs": [""]},
                    "expected_output": [[""]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"strs": ["a"]},
                    "expected_output": [["a"]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"strs": ["ddddddddddg", "dgggggggggg"]},
                    "expected_output": [["ddddddddddg"], ["dgggggggggg"]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"strs": ["abc", "bca", "cab", "xyz", "zyx"]},
                    "expected_output": [["abc", "bca", "cab"], ["xyz", "zyx"]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Top K Frequent Elements",
            "description": """Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in **any order**.

**Example 1:**
```
Input: nums = [1,1,1,2,2,3], k = 2
Output: [1,2]
```

**Example 2:**
```
Input: nums = [1], k = 1
Output: [1]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def topKFrequent(self, nums: List[int], k: int) -> List[int]:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @param {number} k\n * @return {number[]}\n */\nvar topKFrequent = function(nums, k) {\n    \n};",
                "java": "class Solution {\n    public int[] topKFrequent(int[] nums, int k) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<int> topKFrequent(vector<int>& nums, int k) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "topKFrequent",
                "arguments": [
                    {"name": "nums", "type": "int[]"},
                    {"name": "k", "type": "int"},
                ],
                "return_type": "int[]",
            },
            "constraints": "* 1 <= nums.length <= 10^5\n* -10^4 <= nums[i] <= 10^4\n* k is in the range [1, the number of unique elements in the array]\n* It is guaranteed that the answer is unique",
            "hints": [
                "Use a hash map to count frequencies",
                "Use bucket sort or heap to find top k",
                "Bucket sort: frequency as index, elements as values",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 64,
            "total_submissions": 1654321,
            "total_accepted": 1058765,
            "likes": 14567,
            "dislikes": 567,
            "topics": ["Array", "Hash Table", "Sorting"],
            "companies": ["Amazon", "Meta", "Google"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 1, 1, 2, 2, 3], "k": 2},
                    "expected_output": [1, 2],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [1], "k": 1},
                    "expected_output": [1],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [4, 1, -1, 2, -1, 2, 3], "k": 2},
                    "expected_output": [-1, 2],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1, 2], "k": 2},
                    "expected_output": [1, 2],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [5, 5, 5, 3, 3, 1], "k": 1},
                    "expected_output": [5],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Valid Sudoku",
            "description": """Determine if a `9 x 9` Sudoku board is valid. Only the filled cells need to be validated **according to the following rules**:

1. Each row must contain the digits `1-9` without repetition.
2. Each column must contain the digits `1-9` without repetition.
3. Each of the nine `3 x 3` sub-boxes of the grid must contain the digits `1-9` without repetition.

**Note:**

- A Sudoku board (partially filled) could be valid but is not necessarily solvable.
- Only the filled cells need to be validated according to the mentioned rules.

**Example 1:**
```
Input: board = 
[["5","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Output: true
```

**Example 2:**
```
Input: board = 
[["8","3",".",".","7",".",".",".","."]
,["6",".",".","1","9","5",".",".","."]
,[".","9","8",".",".",".",".","6","."]
,["8",".",".",".","6",".",".",".","3"]
,["4",".",".","8",".","3",".",".","1"]
,["7",".",".",".","2",".",".",".","6"]
,[".","6",".",".",".",".","2","8","."]
,[".",".",".","4","1","9",".",".","5"]
,[".",".",".",".","8",".",".","7","9"]]
Output: false
Explanation: Same as Example 1, except with the 5 in the top left corner being modified to 8. Since there are two 8's in the top left 3x3 sub-box, it is invalid.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def isValidSudoku(self, board: List[List[str]]) -> bool:\n        ",
                "javascript": "/**\n * @param {character[][]} board\n * @return {boolean}\n */\nvar isValidSudoku = function(board) {\n    \n};",
                "java": "class Solution {\n    public boolean isValidSudoku(char[][] board) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool isValidSudoku(vector<vector<char>>& board) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "isValidSudoku",
                "arguments": [{"name": "board", "type": "string[][]"}],
                "return_type": "boolean",
            },
            "constraints": "* board.length == 9\n* board[i].length == 9\n* board[i][j] is a digit 1-9 or '.'",
            "hints": [
                "Use hash sets to track seen numbers",
                "Check rows, columns, and 3x3 boxes separately",
                "Box index can be calculated as (row/3)*3 + col/3",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 57,
            "total_submissions": 1234567,
            "total_accepted": 703703,
            "likes": 8765,
            "dislikes": 987,
            "topics": ["Array", "Hash Table"],
            "companies": ["Amazon", "Google", "Apple"],
            "test_cases": [
                {
                    "input_data": {
                        "board": [
                            ["5", "3", ".", ".", "7", ".", ".", ".", "."],
                            ["6", ".", ".", "1", "9", "5", ".", ".", "."],
                            [".", "9", "8", ".", ".", ".", ".", "6", "."],
                            ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
                            ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
                            ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
                            [".", "6", ".", ".", ".", ".", "2", "8", "."],
                            [".", ".", ".", "4", "1", "9", ".", ".", "5"],
                            [".", ".", ".", ".", "8", ".", ".", "7", "9"],
                        ]
                    },
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {
                        "board": [
                            ["8", "3", ".", ".", "7", ".", ".", ".", "."],
                            ["6", ".", ".", "1", "9", "5", ".", ".", "."],
                            [".", "9", "8", ".", ".", ".", ".", "6", "."],
                            ["8", ".", ".", ".", "6", ".", ".", ".", "3"],
                            ["4", ".", ".", "8", ".", "3", ".", ".", "1"],
                            ["7", ".", ".", ".", "2", ".", ".", ".", "6"],
                            [".", "6", ".", ".", ".", ".", "2", "8", "."],
                            [".", ".", ".", "4", "1", "9", ".", ".", "5"],
                            [".", ".", ".", ".", "8", ".", ".", "7", "9"],
                        ]
                    },
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {
                        "board": [
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                        ]
                    },
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {
                        "board": [
                            [".", ".", "4", ".", ".", ".", "6", "3", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            ["5", ".", ".", ".", ".", ".", ".", "9", "."],
                            [".", ".", ".", "5", "6", ".", ".", ".", "."],
                            ["4", ".", "3", ".", ".", ".", ".", ".", "1"],
                            [".", ".", ".", "7", ".", ".", ".", ".", "."],
                            [".", ".", ".", "5", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                        ]
                    },
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {
                        "board": [
                            ["7", ".", ".", ".", "4", ".", ".", ".", "."],
                            [".", ".", ".", "8", "6", "5", ".", ".", "."],
                            [".", "1", ".", "2", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", "9", ".", ".", "."],
                            [".", ".", ".", ".", "5", ".", "5", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", "2", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                            [".", ".", ".", ".", ".", ".", ".", ".", "."],
                        ]
                    },
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Rotate Image",
            "description": """You are given an `n x n` 2D `matrix` representing an image, rotate the image by **90** degrees (clockwise).

You have to rotate the image **in-place**, which means you have to modify the input 2D matrix directly. **DO NOT** allocate another 2D matrix and do the rotation.

**Example 1:**
```
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [[7,4,1],[8,5,2],[9,6,3]]
```

**Example 2:**
```
Input: matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]
Output: [[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def rotate(self, matrix: List[List[int]]) -> None:\n        \"\"\"\n        Do not return anything, modify matrix in-place instead.\n        \"\"\"\n        ",
                "javascript": "/**\n * @param {number[][]} matrix\n * @return {void} Do not return anything, modify matrix in-place instead.\n */\nvar rotate = function(matrix) {\n    \n};",
                "java": "class Solution {\n    public void rotate(int[][] matrix) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    void rotate(vector<vector<int>>& matrix) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "rotate",
                "arguments": [{"name": "matrix", "type": "int[][]"}],
                "return_type": "void",
            },
            "constraints": "* n == matrix.length == matrix[i].length\n* 1 <= n <= 20\n* -1000 <= matrix[i][j] <= 1000",
            "hints": [
                "Transpose the matrix first (swap matrix[i][j] with matrix[j][i])",
                "Then reverse each row",
                "Or rotate layer by layer from outside to inside",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 68,
            "total_submissions": 1456789,
            "total_accepted": 990617,
            "likes": 13456,
            "dislikes": 678,
            "topics": ["Array", "Matrix"],
            "companies": ["Amazon", "Microsoft", "Apple"],
            "test_cases": [
                {
                    "input_data": {"matrix": [[1, 2, 3], [4, 5, 6], [7, 8, 9]]},
                    "expected_output": [[7, 4, 1], [8, 5, 2], [9, 6, 3]],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"matrix": [[5, 1, 9, 11], [2, 4, 8, 10], [13, 3, 6, 7], [15, 14, 12, 16]]},
                    "expected_output": [[15, 13, 2, 5], [14, 3, 4, 1], [12, 6, 8, 9], [16, 7, 10, 11]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"matrix": [[1]]},
                    "expected_output": [[1]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"matrix": [[1, 2], [3, 4]]},
                    "expected_output": [[3, 1], [4, 2]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"matrix": [[1, 2, 3], [4, 5, 6], [7, 8, 9]]},
                    "expected_output": [[7, 4, 1], [8, 5, 2], [9, 6, 3]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Spiral Matrix",
            "description": """Given an `m x n` `matrix`, return all elements of the `matrix` in spiral order.

**Example 1:**
```
Input: matrix = [[1,2,3],[4,5,6],[7,8,9]]
Output: [1,2,3,6,9,8,7,4,5]
```

**Example 2:**
```
Input: matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]
Output: [1,2,3,4,8,12,11,10,9,5,6,7]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def spiralOrder(self, matrix: List[List[int]]) -> List[int]:\n        ",
                "javascript": "/**\n * @param {number[][]} matrix\n * @return {number[]}\n */\nvar spiralOrder = function(matrix) {\n    \n};",
                "java": "class Solution {\n    public List<Integer> spiralOrder(int[][] matrix) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<int> spiralOrder(vector<vector<int>>& matrix) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "spiralOrder",
                "arguments": [{"name": "matrix", "type": "int[][]"}],
                "return_type": "int[]",
            },
            "constraints": "* m == matrix.length\n* n == matrix[i].length\n* 1 <= m, n <= 10\n* -100 <= matrix[i][j] <= 100",
            "hints": [
                "Track boundaries: top, bottom, left, right",
                "Move in spiral: right, down, left, up",
                "Shrink boundaries after each direction",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 43,
            "total_submissions": 1654321,
            "total_accepted": 711358,
            "likes": 11234,
            "dislikes": 1234,
            "topics": ["Array", "Matrix"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {"matrix": [[1, 2, 3], [4, 5, 6], [7, 8, 9]]},
                    "expected_output": [1, 2, 3, 6, 9, 8, 7, 4, 5],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"matrix": [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]]},
                    "expected_output": [1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"matrix": [[1]]},
                    "expected_output": [1],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"matrix": [[1, 2], [3, 4]]},
                    "expected_output": [1, 2, 4, 3],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"matrix": [[1, 2, 3]]},
                    "expected_output": [1, 2, 3],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        # Batch 5: Stack & Binary Search (37-42)
        {
            "title": "Min Stack",
            "description": """Design a stack that supports push, pop, top, and retrieving the minimum element in constant time.

Implement the `MinStack` class:

* `MinStack()` initializes the stack object.
* `void push(int val)` pushes the element `val` onto the stack.
* `void pop()` removes the element on the top of the stack.
* `int top()` gets the top element of the stack.
* `int getMin()` retrieves the minimum element in the stack.

You must implement a solution with `O(1)` time complexity for each function.

**Example 1:**
```
Input
["MinStack","push","push","push","getMin","pop","top","getMin"]
[[],[-2],[0],[-3],[],[],[],[]]

Output
[null,null,null,null,-3,null,0,-2]

Explanation
MinStack minStack = new MinStack();
minStack.push(-2);
minStack.push(0);
minStack.push(-3);
minStack.getMin(); // return -3
minStack.pop();
minStack.top();    // return 0
minStack.getMin(); // return -2
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class MinStack:\n\n    def __init__(self):\n        \n\n    def push(self, val: int) -> None:\n        \n\n    def pop(self) -> None:\n        \n\n    def top(self) -> int:\n        \n\n    def getMin(self) -> int:\n        ",
                "javascript": "var MinStack = function() {\n    \n};\n\n/** \n * @param {number} val\n * @return {void}\n */\nMinStack.prototype.push = function(val) {\n    \n};\n\n/**\n * @return {void}\n */\nMinStack.prototype.pop = function() {\n    \n};\n\n/**\n * @return {number}\n */\nMinStack.prototype.top = function() {\n    \n};\n\n/**\n * @return {number}\n */\nMinStack.prototype.getMin = function() {\n    \n};",
                "java": "class MinStack {\n\n    public MinStack() {\n        \n    }\n    \n    public void push(int val) {\n        \n    }\n    \n    public void pop() {\n        \n    }\n    \n    public int top() {\n        \n    }\n    \n    public int getMin() {\n        \n    }\n}",
                "cpp": "class MinStack {\npublic:\n    MinStack() {\n        \n    }\n    \n    void push(int val) {\n        \n    }\n    \n    void pop() {\n        \n    }\n    \n    int top() {\n        \n    }\n    \n    int getMin() {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "MinStack",
                "arguments": [],
                "return_type": "void",
            },
            "constraints": "* -2^31 <= val <= 2^31 - 1\n* Methods pop, top and getMin operations will always be called on non-empty stacks\n* At most 3 * 10^4 calls will be made to push, pop, top, and getMin",
            "hints": [
                "Use two stacks: one for values, one for minimums",
                "Or store pairs (value, current_min) in single stack",
                "Update minimum when pushing/popping",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 51,
            "total_submissions": 1876543,
            "total_accepted": 957037,
            "likes": 11234,
            "dislikes": 789,
            "topics": ["Stack", "Design"],
            "companies": ["Amazon", "Microsoft", "Bloomberg"],
            "test_cases": [
                {
                    "input_data": {
                        "operations": ["MinStack", "push", "push", "push", "getMin", "pop", "top", "getMin"],
                        "arguments": [[], [-2], [0], [-3], [], [], [], []],
                    },
                    "expected_output": [None, None, None, None, -3, None, 0, -2],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {
                        "operations": ["MinStack", "push", "push", "getMin", "getMin", "push", "getMin"],
                        "arguments": [[], [0], [1], [], [], [0], []],
                    },
                    "expected_output": [None, None, None, 0, 0, None, 0],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {
                        "operations": ["MinStack", "push", "getMin", "top"],
                        "arguments": [[], [1], [], []],
                    },
                    "expected_output": [None, None, 1, 1],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {
                        "operations": ["MinStack", "push", "push", "push", "top", "pop", "getMin", "pop", "getMin", "pop", "push", "top", "getMin", "push", "top", "getMin", "pop", "getMin"],
                        "arguments": [[], [2147483646], [2147483646], [2147483647], [], [], [], [], [], [], [2147483647], [], [], [-2147483648], [], [], [], []],
                    },
                    "expected_output": [None, None, None, None, 2147483647, None, 2147483646, None, 2147483646, None, None, 2147483647, 2147483647, None, -2147483648, -2147483648, None, 2147483647],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {
                        "operations": ["MinStack", "push", "push", "push", "getMin", "pop", "getMin"],
                        "arguments": [[], [-1], [0], [-2], [], [], []],
                    },
                    "expected_output": [None, None, None, None, -2, None, -1],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Daily Temperatures",
            "description": """Given an array of integers `temperatures` represents the daily temperatures, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `ith` day to get a warmer temperature. If there is no future day for which this is possible, keep `answer[i] == 0` instead.

**Example 1:**
```
Input: temperatures = [73,74,75,71,69,72,76,73]
Output: [1,1,4,2,1,1,0,0]
```

**Example 2:**
```
Input: temperatures = [30,40,50,60]
Output: [1,1,1,0]
```

**Example 3:**
```
Input: temperatures = [30,60,90]
Output: [1,1,0]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def dailyTemperatures(self, temperatures: List[int]) -> List[int]:\n        ",
                "javascript": "/**\n * @param {number[]} temperatures\n * @return {number[]}\n */\nvar dailyTemperatures = function(temperatures) {\n    \n};",
                "java": "class Solution {\n    public int[] dailyTemperatures(int[] temperatures) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<int> dailyTemperatures(vector<int>& temperatures) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "dailyTemperatures",
                "arguments": [{"name": "temperatures", "type": "int[]"}],
                "return_type": "int[]",
            },
            "constraints": "* 1 <= temperatures.length <= 10^5\n* 30 <= temperatures[i] <= 100",
            "hints": [
                "Use a monotonic stack",
                "Stack stores indices of temperatures",
                "Pop when current temperature is warmer",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 66,
            "total_submissions": 1234567,
            "total_accepted": 814814,
            "likes": 9876,
            "dislikes": 234,
            "topics": ["Array", "Stack", "Monotonic Stack"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"temperatures": [73, 74, 75, 71, 69, 72, 76, 73]},
                    "expected_output": [1, 1, 4, 2, 1, 1, 0, 0],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"temperatures": [30, 40, 50, 60]},
                    "expected_output": [1, 1, 1, 0],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"temperatures": [30, 60, 90]},
                    "expected_output": [1, 1, 0],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"temperatures": [89, 62, 70, 58, 47, 47, 46, 76, 100, 70]},
                    "expected_output": [8, 1, 5, 4, 3, 2, 1, 1, 0, 0],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"temperatures": [100]},
                    "expected_output": [0],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Evaluate Reverse Polish Notation",
            "description": """You are given an array of strings `tokens` that represents an arithmetic expression in a Reverse Polish Notation.

Evaluate the expression. Return an integer that represents the value of the expression.

**Note** that:

* The valid operators are `'+'`, `'-'`, `'*'`, and `'/'`.
* Each operand may be an integer or another expression.
* The division between two integers always **truncates toward zero**.
* There will not be any division by zero.
* The input represents a valid arithmetic expression in a reverse polish notation.
* The answer and all the intermediate calculations can be represented in a **32-bit** integer.

**Example 1:**
```
Input: tokens = ["2","1","+","3","*"]
Output: 9
Explanation: ((2 + 1) * 3) = 9
```

**Example 2:**
```
Input: tokens = ["4","13","5","/","+"]
Output: 6
Explanation: (4 + (13 / 5)) = 6
```

**Example 3:**
```
Input: tokens = ["10","6","9","3","+","-11","*","/","*","17","+","5","+"]
Output: 22
Explanation: ((10 * (6 / ((9 + 3) * -11))) + 17) + 5
= ((10 * (6 / (12 * -11))) + 17) + 5
= ((10 * (6 / -132)) + 17) + 5
= ((10 * 0) + 17) + 5
= (0 + 17) + 5
= 22
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def evalRPN(self, tokens: List[str]) -> int:\n        ",
                "javascript": "/**\n * @param {string[]} tokens\n * @return {number}\n */\nvar evalRPN = function(tokens) {\n    \n};",
                "java": "class Solution {\n    public int evalRPN(String[] tokens) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int evalRPN(vector<string>& tokens) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "evalRPN",
                "arguments": [{"name": "tokens", "type": "string[]"}],
                "return_type": "int",
            },
            "constraints": "* 1 <= tokens.length <= 10^4\n* tokens[i] is either an operator: \"+\", \"-\", \"*\", or \"/\", or an integer in the range [-200, 200]",
            "hints": [
                "Use a stack to store operands",
                "When you see an operator, pop two operands",
                "Apply operation and push result back",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 44,
            "total_submissions": 1098765,
            "total_accepted": 483456,
            "likes": 5678,
            "dislikes": 890,
            "topics": ["Array", "Math", "Stack"],
            "companies": ["Amazon", "LinkedIn", "Microsoft"],
            "test_cases": [
                {
                    "input_data": {"tokens": ["2", "1", "+", "3", "*"]},
                    "expected_output": 9,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"tokens": ["4", "13", "5", "/", "+"]},
                    "expected_output": 6,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"tokens": ["10", "6", "9", "3", "+", "-11", "*", "/", "*", "17", "+", "5", "+"]},
                    "expected_output": 22,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"tokens": ["3", "11", "+", "5", "-"]},
                    "expected_output": 9,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"tokens": ["18"]},
                    "expected_output": 18,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Search in Rotated Sorted Array",
            "description": """There is an integer array `nums` sorted in ascending order (with **distinct** values).

Prior to being passed to your function, `nums` is **possibly rotated** at an unknown pivot index `k` (`1 <= k < nums.length`) such that the resulting array is `[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]` (**0-indexed**). For example, `[0,1,2,4,5,6,7]` might be rotated at pivot index `3` and become `[4,5,6,7,0,1,2]`.

Given the array `nums` **after** the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.

You must write an algorithm with `O(log n)` runtime complexity.

**Example 1:**
```
Input: nums = [4,5,6,7,0,1,2], target = 0
Output: 4
```

**Example 2:**
```
Input: nums = [4,5,6,7,0,1,2], target = 3
Output: -1
```

**Example 3:**
```
Input: nums = [1], target = 0
Output: -1
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def search(self, nums: List[int], target: int) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nvar search = function(nums, target) {\n    \n};",
                "java": "class Solution {\n    public int search(int[] nums, int target) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "search",
                "arguments": [
                    {"name": "nums", "type": "int[]"},
                    {"name": "target", "type": "int"},
                ],
                "return_type": "int",
            },
            "constraints": "* 1 <= nums.length <= 5000\n* -10^4 <= nums[i] <= 10^4\n* All values of nums are unique\n* nums is an ascending array that is possibly rotated\n* -10^4 <= target <= 10^4",
            "hints": [
                "Use modified binary search",
                "Determine which half is sorted",
                "Check if target is in the sorted half",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 39,
            "total_submissions": 2345678,
            "total_accepted": 914814,
            "likes": 21345,
            "dislikes": 1234,
            "topics": ["Array", "Binary Search"],
            "companies": ["Amazon", "Microsoft", "LinkedIn"],
            "test_cases": [
                {
                    "input_data": {"nums": [4, 5, 6, 7, 0, 1, 2], "target": 0},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [4, 5, 6, 7, 0, 1, 2], "target": 3},
                    "expected_output": -1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1], "target": 0},
                    "expected_output": -1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1], "target": 1},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [5, 1, 3], "target": 5},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Find Minimum in Rotated Sorted Array",
            "description": """Suppose an array of length `n` sorted in ascending order is **rotated** between `1` and `n` times. For example, the array `nums = [0,1,2,4,5,6,7]` might become:

* `[4,5,6,7,0,1,2]` if it was rotated `4` times.
* `[0,1,2,4,5,6,7]` if it was rotated `7` times.

Notice that **rotating** an array `[a[0], a[1], a[2], ..., a[n-1]]` 1 time results in the array `[a[n-1], a[0], a[1], a[2], ..., a[n-2]]`.

Given the sorted rotated array `nums` of **unique** elements, return the minimum element of this array.

You must write an algorithm that runs in `O(log n) time`.

**Example 1:**
```
Input: nums = [3,4,5,1,2]
Output: 1
Explanation: The original array was [1,2,3,4,5] rotated 3 times.
```

**Example 2:**
```
Input: nums = [4,5,6,7,0,1,2]
Output: 0
Explanation: The original array was [0,1,2,4,5,6,7] and it was rotated 4 times.
```

**Example 3:**
```
Input: nums = [11,13,15,17]
Output: 11
Explanation: The original array was [11,13,15,17] and it was rotated 4 times.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def findMin(self, nums: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar findMin = function(nums) {\n    \n};",
                "java": "class Solution {\n    public int findMin(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int findMin(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "findMin",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* n == nums.length\n* 1 <= n <= 5000\n* -5000 <= nums[i] <= 5000\n* All the integers of nums are unique\n* nums is sorted and rotated between 1 and n times",
            "hints": [
                "Use binary search",
                "Compare mid with right to determine which half to search",
                "If nums[mid] > nums[right], minimum is in right half",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 49,
            "total_submissions": 1456789,
            "total_accepted": 713827,
            "likes": 10234,
            "dislikes": 456,
            "topics": ["Array", "Binary Search"],
            "companies": ["Amazon", "Microsoft", "Bloomberg"],
            "test_cases": [
                {
                    "input_data": {"nums": [3, 4, 5, 1, 2]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [4, 5, 6, 7, 0, 1, 2]},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [11, 13, 15, 17]},
                    "expected_output": 11,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [2, 1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Koko Eating Bananas",
            "description": """Koko loves to eat bananas. There are `n` piles of bananas, the `ith` pile has `piles[i]` bananas. The guards have gone and will come back in `h` hours.

Koko can decide her bananas-per-hour eating speed of `k`. Each hour, she chooses some pile of bananas and eats `k` bananas from that pile. If the pile has less than `k` bananas, she eats all of them instead and will not eat any more bananas during this hour.

Koko likes to eat slowly but still wants to finish eating all the bananas before the guards return.

Return the minimum integer `k` such that she can eat all the bananas within `h` hours.

**Example 1:**
```
Input: piles = [3,6,7,11], h = 8
Output: 4
```

**Example 2:**
```
Input: piles = [30,11,23,4,20], h = 5
Output: 30
```

**Example 3:**
```
Input: piles = [30,11,23,4,20], h = 6
Output: 23
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def minEatingSpeed(self, piles: List[int], h: int) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} piles\n * @param {number} h\n * @return {number}\n */\nvar minEatingSpeed = function(piles, h) {\n    \n};",
                "java": "class Solution {\n    public int minEatingSpeed(int[] piles, int h) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int minEatingSpeed(vector<int>& piles, int h) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "minEatingSpeed",
                "arguments": [
                    {"name": "piles", "type": "int[]"},
                    {"name": "h", "type": "int"},
                ],
                "return_type": "int",
            },
            "constraints": "* 1 <= piles.length <= 10^4\n* piles.length <= h <= 10^9\n* 1 <= piles[i] <= 10^9",
            "hints": [
                "Use binary search on the answer",
                "Binary search range: 1 to max(piles)",
                "Check if speed k allows eating all bananas in h hours",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 55,
            "total_submissions": 876543,
            "total_accepted": 481898,
            "likes": 7890,
            "dislikes": 345,
            "topics": ["Array", "Binary Search"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"piles": [3, 6, 7, 11], "h": 8},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"piles": [30, 11, 23, 4, 20], "h": 5},
                    "expected_output": 30,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"piles": [30, 11, 23, 4, 20], "h": 6},
                    "expected_output": 23,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"piles": [1000000000], "h": 2},
                    "expected_output": 500000000,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"piles": [312884470], "h": 312884469},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        # Batch 6: Graph Algorithms (43-48)
        {
            "title": "Number of Islands",
            "description": """Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.

An **island** is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

**Example 1:**
```
Input: grid = [
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]
Output: 1
```

**Example 2:**
```
Input: grid = [
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]
Output: 3
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def numIslands(self, grid: List[List[str]]) -> int:\n        ",
                "javascript": "/**\n * @param {character[][]} grid\n * @return {number}\n */\nvar numIslands = function(grid) {\n    \n};",
                "java": "class Solution {\n    public int numIslands(char[][] grid) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int numIslands(vector<vector<char>>& grid) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "numIslands",
                "arguments": [{"name": "grid", "type": "string[][]"}],
                "return_type": "int",
            },
            "constraints": "* m == grid.length\n* n == grid[i].length\n* 1 <= m, n <= 300\n* grid[i][j] is '0' or '1'",
            "hints": [
                "Use DFS or BFS to explore each island",
                "Mark visited cells to avoid counting twice",
                "Count the number of DFS/BFS calls needed",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 57,
            "total_submissions": 2345678,
            "total_accepted": 1337037,
            "likes": 19876,
            "dislikes": 456,
            "topics": ["Array", "Depth-First Search", "Breadth-First Search", "Graph"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {
                        "grid": [
                            ["1", "1", "1", "1", "0"],
                            ["1", "1", "0", "1", "0"],
                            ["1", "1", "0", "0", "0"],
                            ["0", "0", "0", "0", "0"],
                        ]
                    },
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {
                        "grid": [
                            ["1", "1", "0", "0", "0"],
                            ["1", "1", "0", "0", "0"],
                            ["0", "0", "1", "0", "0"],
                            ["0", "0", "0", "1", "1"],
                        ]
                    },
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"grid": [["1"]]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"grid": [["0"]]},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {
                        "grid": [
                            ["1", "0", "1", "0", "1"],
                            ["0", "1", "0", "1", "0"],
                            ["1", "0", "1", "0", "1"],
                        ]
                    },
                    "expected_output": 10,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Max Area of Island",
            "description": """You are given an `m x n` binary matrix `grid`. An island is a group of `1`'s (representing land) connected **4-directionally** (horizontal or vertical). You may assume all four edges of the grid are surrounded by water.

The **area** of an island is the number of cells with a value `1` in the island.

Return the maximum **area** of an island in `grid`. If there is no island, return `0`.

**Example 1:**
```
Input: grid = [[0,0,1,0,0,0,0,1,0,0,0,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,1,1,0,1,0,0,0,0,0,0,0,0],[0,1,0,0,1,1,0,0,1,0,1,0,0],[0,1,0,0,1,1,0,0,1,1,1,0,0],[0,0,0,0,0,0,0,0,0,0,1,0,0],[0,0,0,0,0,0,0,1,1,1,0,0,0],[0,0,0,0,0,0,0,1,1,0,0,0,0]]
Output: 6
Explanation: The answer is not 11, because the island must be connected 4-directionally.
```

**Example 2:**
```
Input: grid = [[0,0,0,0,0,0,0,0]]
Output: 0
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def maxAreaOfIsland(self, grid: List[List[int]]) -> int:\n        ",
                "javascript": "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar maxAreaOfIsland = function(grid) {\n    \n};",
                "java": "class Solution {\n    public int maxAreaOfIsland(int[][] grid) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int maxAreaOfIsland(vector<vector<int>>& grid) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "maxAreaOfIsland",
                "arguments": [{"name": "grid", "type": "int[][]"}],
                "return_type": "int",
            },
            "constraints": "* m == grid.length\n* n == grid[i].length\n* 1 <= m, n <= 50\n* grid[i][j] is either 0 or 1",
            "hints": [
                "Use DFS or BFS to explore each island",
                "Count cells in each island",
                "Track maximum area seen",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 70,
            "total_submissions": 1234567,
            "total_accepted": 864197,
            "likes": 8765,
            "dislikes": 234,
            "topics": ["Array", "Depth-First Search", "Breadth-First Search"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {
                        "grid": [
                            [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                            [0, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
                            [0, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
                        ]
                    },
                    "expected_output": 6,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"grid": [[0, 0, 0, 0, 0, 0, 0, 0]]},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"grid": [[1, 1, 0, 0, 0], [1, 1, 0, 0, 0], [0, 0, 0, 1, 1], [0, 0, 0, 1, 1]]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"grid": [[1]]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"grid": [[1, 1, 1], [1, 0, 1], [1, 1, 1]]},
                    "expected_output": 8,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Surrounded Regions",
            "description": """Given an `m x n` matrix `board` containing `'X'` and `'O'`, capture all regions that are 4-directionally surrounded by `'X'`.

A region is **captured** by flipping all `'O'`s into `'X'`s in that surrounded region.

**Example 1:**
```
Input: board = [["X","X","X","X"],["X","O","O","X"],["X","X","O","X"],["X","O","X","X"]]
Output: [["X","X","X","X"],["X","X","X","X"],["X","X","X","X"],["X","O","X","X"]]
Explanation: Notice that an 'O' should not be flipped if:
- It is on the border, or
- It is adjacent to an 'O' that should not be flipped.
The bottom 'O' is on the border, so it is not flipped.
The other three 'O' form a surrounded region, so they are flipped.
```

**Example 2:**
```
Input: board = [["X"]]
Output: [["X"]]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def solve(self, board: List[List[str]]) -> None:\n        \"\"\"\n        Do not return anything, modify board in-place instead.\n        \"\"\"\n        ",
                "javascript": "/**\n * @param {character[][]} board\n * @return {void} Do not return anything, modify board in-place instead.\n */\nvar solve = function(board) {\n    \n};",
                "java": "class Solution {\n    public void solve(char[][] board) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    void solve(vector<vector<char>>& board) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "solve",
                "arguments": [{"name": "board", "type": "string[][]"}],
                "return_type": "void",
            },
            "constraints": "* m == board.length\n* n == board[i].length\n* 1 <= m, n <= 200\n* board[i][j] is 'X' or 'O'",
            "hints": [
                "Start from border 'O's and mark them as safe",
                "Use DFS/BFS from border to find connected 'O's",
                "Flip remaining 'O's to 'X'",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 35,
            "total_submissions": 987654,
            "total_accepted": 345679,
            "likes": 6789,
            "dislikes": 1456,
            "topics": ["Array", "Depth-First Search", "Breadth-First Search"],
            "companies": ["Amazon", "Microsoft", "Bloomberg"],
            "test_cases": [
                {
                    "input_data": {
                        "board": [
                            ["X", "X", "X", "X"],
                            ["X", "O", "O", "X"],
                            ["X", "X", "O", "X"],
                            ["X", "O", "X", "X"],
                        ]
                    },
                    "expected_output": [
                        ["X", "X", "X", "X"],
                        ["X", "X", "X", "X"],
                        ["X", "X", "X", "X"],
                        ["X", "O", "X", "X"],
                    ],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"board": [["X"]]},
                    "expected_output": [["X"]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"board": [["O", "O"], ["O", "O"]]},
                    "expected_output": [["O", "O"], ["O", "O"]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {
                        "board": [
                            ["X", "O", "X"],
                            ["O", "X", "O"],
                            ["X", "O", "X"],
                        ]
                    },
                    "expected_output": [
                        ["X", "O", "X"],
                        ["O", "X", "O"],
                        ["X", "O", "X"],
                    ],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {
                        "board": [
                            ["O", "X", "X", "O", "X"],
                            ["X", "O", "O", "X", "O"],
                            ["X", "O", "X", "O", "X"],
                            ["O", "X", "O", "O", "O"],
                            ["X", "X", "O", "X", "O"],
                        ]
                    },
                    "expected_output": [
                        ["O", "X", "X", "O", "X"],
                        ["X", "X", "X", "X", "O"],
                        ["X", "X", "X", "O", "X"],
                        ["O", "X", "O", "O", "O"],
                        ["X", "X", "O", "X", "O"],
                    ],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Rotting Oranges",
            "description": """You are given an `m x n` `grid` where each cell can have one of three values:

* `0` representing an empty cell,
* `1` representing a fresh orange, or
* `2` representing a rotten orange.

Every minute, any fresh orange that is **4-directionally adjacent** to a rotten orange becomes rotten.

Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return `-1`.

**Example 1:**
```
Input: grid = [[2,1,1],[1,1,0],[0,1,1]]
Output: 4
```

**Example 2:**
```
Input: grid = [[2,1,1],[0,1,1],[1,0,1]]
Output: -1
Explanation: The orange in the bottom left corner (row 2, column 0) is never rotten, because rotting only happens 4-directionally.
```

**Example 3:**
```
Input: grid = [[0,2]]
Output: 0
Explanation: Since there are already no fresh oranges at minute 0, the answer is just 0.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def orangesRotting(self, grid: List[List[int]]) -> int:\n        ",
                "javascript": "/**\n * @param {number[][]} grid\n * @return {number}\n */\nvar orangesRotting = function(grid) {\n    \n};",
                "java": "class Solution {\n    public int orangesRotting(int[][] grid) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int orangesRotting(vector<vector<int>>& grid) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "orangesRotting",
                "arguments": [{"name": "grid", "type": "int[][]"}],
                "return_type": "int",
            },
            "constraints": "* m == grid.length\n* n == grid[i].length\n* 1 <= m, n <= 10\n* grid[i][j] is 0, 1, or 2",
            "hints": [
                "Use BFS starting from all rotten oranges",
                "Track time/depth in BFS",
                "Check if any fresh oranges remain",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 52,
            "total_submissions": 1456789,
            "total_accepted": 757530,
            "likes": 10234,
            "dislikes": 345,
            "topics": ["Array", "Breadth-First Search", "Graph"],
            "companies": ["Amazon", "Google", "Bloomberg"],
            "test_cases": [
                {
                    "input_data": {"grid": [[2, 1, 1], [1, 1, 0], [0, 1, 1]]},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"grid": [[2, 1, 1], [0, 1, 1], [1, 0, 1]]},
                    "expected_output": -1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"grid": [[0, 2]]},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"grid": [[1]]},
                    "expected_output": -1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"grid": [[2, 2], [1, 1], [0, 0], [2, 1]]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Course Schedule",
            "description": """There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you **must** take course `bi` first if you want to take course `ai`.

* For example, the pair `[0, 1]`, indicates that to take course `0` you have to first take course `1`.

Return `true` if you can finish all courses. Otherwise, return `false`.

**Example 1:**
```
Input: numCourses = 2, prerequisites = [[1,0]]
Output: true
Explanation: There are a total of 2 courses to take. 
To take course 1 you should have finished course 0. So it is possible.
```

**Example 2:**
```
Input: numCourses = 2, prerequisites = [[1,0],[0,1]]
Output: false
Explanation: There are a total of 2 courses to take. 
To take course 1 you should have finished course 0, and to take course 0 you should also have finished course 1. So it is impossible.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def canFinish(self, numCourses: int, prerequisites: List[List[int]]) -> bool:\n        ",
                "javascript": "/**\n * @param {number} numCourses\n * @param {number[][]} prerequisites\n * @return {boolean}\n */\nvar canFinish = function(numCourses, prerequisites) {\n    \n};",
                "java": "class Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "canFinish",
                "arguments": [
                    {"name": "numCourses", "type": "int"},
                    {"name": "prerequisites", "type": "int[][]"},
                ],
                "return_type": "boolean",
            },
            "constraints": "* 1 <= numCourses <= 2000\n* 0 <= prerequisites.length <= 5000\n* prerequisites[i].length == 2\n* 0 <= ai, bi < numCourses\n* All the pairs prerequisites[i] are unique",
            "hints": [
                "Detect cycle in directed graph",
                "Use topological sort or DFS with visited states",
                "If cycle exists, return false",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 46,
            "total_submissions": 1765432,
            "total_accepted": 812099,
            "likes": 13456,
            "dislikes": 567,
            "topics": ["Graph", "Depth-First Search", "Topological Sort"],
            "companies": ["Amazon", "Microsoft", "Meta"],
            "test_cases": [
                {
                    "input_data": {"numCourses": 2, "prerequisites": [[1, 0]]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"numCourses": 2, "prerequisites": [[1, 0], [0, 1]]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"numCourses": 1, "prerequisites": []},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"numCourses": 3, "prerequisites": [[1, 0], [2, 1]]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"numCourses": 4, "prerequisites": [[1, 0], [2, 0], [3, 1], [3, 2]]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Pacific Atlantic Water Flow",
            "description": """There is an `m x n` rectangular island that borders both the **Pacific Ocean** and **Atlantic Ocean**. The **Pacific Ocean** touches the island's left and top edges, and the **Atlantic Ocean** touches the island's right and bottom edges.

The island is partitioned into a grid of square cells. You are given an `m x n` integer matrix `heights` where `heights[r][c]` represents the **height above sea level** of the cell at coordinate `(r, c)`.

The island receives a lot of rain, and the rain water can flow to neighboring cells directly north, south, east, and west if the neighboring cell's height is **less than or equal to** the current cell's height. Water can flow from any cell adjacent to an ocean into the ocean.

Return a **2D list** of grid coordinates `result` where `result[i] = [ri, ci]` denotes that rain water can flow from cell `(ri, ci)` to **both** the Pacific and Atlantic oceans.

**Example 1:**
```
Input: heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]
Output: [[0,4],[1,3],[1,4],[2,2],[3,0],[3,1],[4,0]]
Explanation: The following cells can flow to the Pacific and Atlantic oceans:
[0,4]: [0,4] -> Pacific Ocean 
       [0,4] -> Atlantic Ocean
[1,3]: [1,3] -> [0,3] -> Pacific Ocean 
       [1,3] -> [1,4] -> Atlantic Ocean
[1,4]: [1,4] -> [1,3] -> [0,3] -> Pacific Ocean 
       [1,4] -> Atlantic Ocean
[2,2]: [2,2] -> [1,2] -> [0,2] -> Pacific Ocean 
       [2,2] -> [2,3] -> [2,4] -> Atlantic Ocean
[3,0]: [3,0] -> Pacific Ocean 
       [3,0] -> [4,0] -> Atlantic Ocean
[3,1]: [3,1] -> [3,0] -> Pacific Ocean 
       [3,1] -> [4,1] -> Atlantic Ocean
[4,0]: [4,0] -> Pacific Ocean 
       [4,0] -> Atlantic Ocean
```

**Example 2:**
```
Input: heights = [[1]]
Output: [[0,0]]
Explanation: The water can flow from the only cell to both oceans.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def pacificAtlantic(self, heights: List[List[int]]) -> List[List[int]]:\n        ",
                "javascript": "/**\n * @param {number[][]} heights\n * @return {number[][]}\n */\nvar pacificAtlantic = function(heights) {\n    \n};",
                "java": "class Solution {\n    public List<List<Integer>> pacificAtlantic(int[][] heights) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<vector<int>> pacificAtlantic(vector<vector<int>>& heights) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "pacificAtlantic",
                "arguments": [{"name": "heights", "type": "int[][]"}],
                "return_type": "int[][]",
            },
            "constraints": "* m == heights.length\n* n == heights[r].length\n* 1 <= m, n <= 200\n* 0 <= heights[r][c] <= 10^5",
            "hints": [
                "Start DFS from both oceans",
                "Mark cells reachable from each ocean",
                "Return cells reachable from both",
            ],
            "time_limit": {"python": 5, "javascript": 5, "java": 8, "cpp": 3},
            "memory_limit": {"python": 96000, "javascript": 96000, "java": 128000, "cpp": 64000},
            "acceptance_rate": 51,
            "total_submissions": 654321,
            "total_accepted": 333703,
            "likes": 6789,
            "dislikes": 1234,
            "topics": ["Array", "Depth-First Search", "Breadth-First Search"],
            "companies": ["Google", "Amazon", "Microsoft"],
            "test_cases": [
                {
                    "input_data": {
                        "heights": [
                            [1, 2, 2, 3, 5],
                            [3, 2, 3, 4, 4],
                            [2, 4, 5, 3, 1],
                            [6, 7, 1, 4, 5],
                            [5, 1, 1, 2, 4],
                        ]
                    },
                    "expected_output": [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"heights": [[1]]},
                    "expected_output": [[0, 0]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"heights": [[1, 1], [1, 1]]},
                    "expected_output": [[0, 0], [0, 1], [1, 0], [1, 1]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"heights": [[1, 2, 3], [8, 9, 4], [7, 6, 5]]},
                    "expected_output": [[0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"heights": [[10, 10, 10], [10, 1, 10], [10, 10, 10]]},
                    "expected_output": [[0, 0], [0, 1], [0, 2], [1, 0], [1, 2], [2, 0], [2, 1], [2, 2]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        # Batch 7: Hard Questions (49-50)
        {
            "title": "Trapping Rain Water",
            "description": """Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.

**Example 1:**
```
Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6
Explanation: The above elevation map (black section) is represented by array [0,1,0,2,1,0,1,3,2,1,2,1]. In this case, 6 units of rain water (blue section) are being trapped.
```

**Example 2:**
```
Input: height = [4,2,0,3,2,5]
Output: 9
```""",
            "difficulty": DifficultyEnum.HARD,
            "code_templates": {
                "python": "class Solution:\n    def trap(self, height: List[int]) -> int:\n        ",
                "javascript": "/**\n * @param {number[]} height\n * @return {number}\n */\nvar trap = function(height) {\n    \n};",
                "java": "class Solution {\n    public int trap(int[] height) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "trap",
                "arguments": [{"name": "height", "type": "int[]"}],
                "return_type": "int",
            },
            "constraints": "* n == height.length\n* 1 <= n <= 2 * 10^4\n* 0 <= height[i] <= 10^5",
            "hints": [
                "Use two pointers from both ends",
                "Track max height from left and right",
                "Water level = min(left_max, right_max) - current_height",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 57,
            "total_submissions": 2345678,
            "total_accepted": 1337037,
            "likes": 27890,
            "dislikes": 456,
            "topics": ["Array", "Two Pointers", "Dynamic Programming", "Stack"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"height": [0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]},
                    "expected_output": 6,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"height": [4, 2, 0, 3, 2, 5]},
                    "expected_output": 9,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"height": [0, 1, 0, 1, 0]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"height": [3, 0, 2, 0, 4]},
                    "expected_output": 7,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"height": [5, 4, 1, 2]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Longest Valid Parentheses",
            "description": """Given a string containing just the characters `'('` and `')'`, return the length of the longest valid (well-formed) parentheses substring.

**Example 1:**
```
Input: s = "(()"
Output: 2
Explanation: The longest valid parentheses substring is "()".
```

**Example 2:**
```
Input: s = ")()())"
Output: 4
Explanation: The longest valid parentheses substring is "()()".
```

**Example 3:**
```
Input: s = ""
Output: 0
```""",
            "difficulty": DifficultyEnum.HARD,
            "code_templates": {
                "python": "class Solution:\n    def longestValidParentheses(self, s: str) -> int:\n        ",
                "javascript": "/**\n * @param {string} s\n * @return {number}\n */\nvar longestValidParentheses = function(s) {\n    \n};",
                "java": "class Solution {\n    public int longestValidParentheses(String s) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int longestValidParentheses(string s) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "longestValidParentheses",
                "arguments": [{"name": "s", "type": "string"}],
                "return_type": "int",
            },
            "constraints": "* 0 <= s.length <= 3 * 10^4\n* s[i] is '(' or ')'",
            "hints": [
                "Use stack to track indices",
                "Push -1 initially as base",
                "Calculate length when popping matched parentheses",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 32,
            "total_submissions": 1234567,
            "total_accepted": 395062,
            "likes": 11234,
            "dislikes": 345,
            "topics": ["String", "Dynamic Programming", "Stack"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {"s": "(()"},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"s": ")()())"},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"s": ""},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"s": "()(())"},
                    "expected_output": 6,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"s": "(()()("},
                    "expected_output": 4,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        # Additional: Tree Questions (51-53)
        {
            "title": "Maximum Depth of Binary Tree",
            "description": """Given the `root` of a binary tree, return its maximum depth.

A binary tree's **maximum depth** is the number of nodes along the longest path from the root node down to the farthest leaf node.

**Example 1:**
```
Input: root = [3,9,20,null,null,15,7]
Output: 3
```

**Example 2:**
```
Input: root = [1,null,2]
Output: 2
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def maxDepth(self, root: Optional[TreeNode]) -> int:\n        ",
                "javascript": "/**\n * @param {TreeNode} root\n * @return {number}\n */\nvar maxDepth = function(root) {\n    \n};",
                "java": "class Solution {\n    public int maxDepth(TreeNode root) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    int maxDepth(TreeNode* root) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "maxDepth",
                "arguments": [{"name": "root", "type": "TreeNode"}],
                "return_type": "int",
            },
            "constraints": "* The number of nodes in the tree is in the range [0, 10^4]\n* -100 <= Node.val <= 100",
            "hints": [
                "Use recursion",
                "Depth = 1 + max(left depth, right depth)",
                "Base case: null node has depth 0",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 74,
            "total_submissions": 2345678,
            "total_accepted": 1735801,
            "likes": 9876,
            "dislikes": 123,
            "topics": ["Tree", "Depth-First Search", "Breadth-First Search"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {"root": [3, 9, 20, None, None, 15, 7]},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"root": [1, None, 2]},
                    "expected_output": 2,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"root": []},
                    "expected_output": 0,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"root": [1]},
                    "expected_output": 1,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"root": [1, 2, 3, 4, 5]},
                    "expected_output": 3,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Invert Binary Tree",
            "description": """Given the `root` of a binary tree, invert the tree, and return its root.

**Example 1:**
```
Input: root = [4,2,7,1,3,6,9]
Output: [4,7,2,9,6,3,1]
```

**Example 2:**
```
Input: root = [2,1,3]
Output: [2,3,1]
```

**Example 3:**
```
Input: root = []
Output: []
```""",
            "difficulty": DifficultyEnum.EASY,
            "code_templates": {
                "python": "class Solution:\n    def invertTree(self, root: Optional[TreeNode]) -> Optional[TreeNode]:\n        ",
                "javascript": "/**\n * @param {TreeNode} root\n * @return {TreeNode}\n */\nvar invertTree = function(root) {\n    \n};",
                "java": "class Solution {\n    public TreeNode invertTree(TreeNode root) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    TreeNode* invertTree(TreeNode* root) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "invertTree",
                "arguments": [{"name": "root", "type": "TreeNode"}],
                "return_type": "TreeNode",
            },
            "constraints": "* The number of nodes in the tree is in the range [0, 100]\n* -100 <= Node.val <= 100",
            "hints": [
                "Swap left and right children",
                "Recursively invert left and right subtrees",
                "Can be done iteratively with a queue",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 73,
            "total_submissions": 1876543,
            "total_accepted": 1369876,
            "likes": 12345,
            "dislikes": 234,
            "topics": ["Tree", "Depth-First Search", "Breadth-First Search"],
            "companies": ["Google", "Amazon", "Microsoft"],
            "test_cases": [
                {
                    "input_data": {"root": [4, 2, 7, 1, 3, 6, 9]},
                    "expected_output": [4, 7, 2, 9, 6, 3, 1],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"root": [2, 1, 3]},
                    "expected_output": [2, 3, 1],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"root": []},
                    "expected_output": [],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"root": [1]},
                    "expected_output": [1],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"root": [1, 2]},
                    "expected_output": [1, None, 2],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Validate Binary Search Tree",
            "description": """Given the `root` of a binary tree, determine if it is a valid binary search tree (BST).

A **valid BST** is defined as follows:

* The left subtree of a node contains only nodes with keys **less than** the node's key.
* The right subtree of a node contains only nodes with keys **greater than** the node's key.
* Both the left and right subtrees must also be binary search trees.

**Example 1:**
```
Input: root = [2,1,3]
Output: true
```

**Example 2:**
```
Input: root = [5,1,4,null,null,3,6]
Output: false
Explanation: The root node's value is 5 but its right child's value is 4.
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def isValidBST(self, root: Optional[TreeNode]) -> bool:\n        ",
                "javascript": "/**\n * @param {TreeNode} root\n * @return {boolean}\n */\nvar isValidBST = function(root) {\n    \n};",
                "java": "class Solution {\n    public boolean isValidBST(TreeNode root) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    bool isValidBST(TreeNode* root) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "isValidBST",
                "arguments": [{"name": "root", "type": "TreeNode"}],
                "return_type": "boolean",
            },
            "constraints": "* The number of nodes in the tree is in the range [1, 10^4]\n* -2^31 <= Node.val <= 2^31 - 1",
            "hints": [
                "Use recursion with min and max bounds",
                "Left subtree values must be < node.val",
                "Right subtree values must be > node.val",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 32,
            "total_submissions": 2654321,
            "total_accepted": 849382,
            "likes": 14567,
            "dislikes": 1234,
            "topics": ["Tree", "Depth-First Search"],
            "companies": ["Amazon", "Microsoft", "Meta"],
            "test_cases": [
                {
                    "input_data": {"root": [2, 1, 3]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"root": [5, 1, 4, None, None, 3, 6]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"root": [1]},
                    "expected_output": True,
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"root": [5, 4, 6, None, None, 3, 7]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"root": [2, 2, 2]},
                    "expected_output": False,
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        # Additional: Backtracking Questions (54-55)
        {
            "title": "Subsets",
            "description": """Given an integer array `nums` of **unique** elements, return all possible subsets (the power set).

The solution set **must not** contain duplicate subsets. Return the solution in **any order**.

**Example 1:**
```
Input: nums = [1,2,3]
Output: [[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]
```

**Example 2:**
```
Input: nums = [0]
Output: [[],[0]]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def subsets(self, nums: List[int]) -> List[List[int]]:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar subsets = function(nums) {\n    \n};",
                "java": "class Solution {\n    public List<List<Integer>> subsets(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<vector<int>> subsets(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "subsets",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int[][]",
            },
            "constraints": "* 1 <= nums.length <= 10\n* -10 <= nums[i] <= 10\n* All the numbers of nums are unique",
            "hints": [
                "Use backtracking",
                "For each element, choose to include it or not",
                "Build subsets incrementally",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 73,
            "total_submissions": 1654321,
            "total_accepted": 1207654,
            "likes": 13456,
            "dislikes": 234,
            "topics": ["Array", "Backtracking", "Bit Manipulation"],
            "companies": ["Amazon", "Google", "Meta"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 2, 3]},
                    "expected_output": [[], [1], [2], [1, 2], [3], [1, 3], [2, 3], [1, 2, 3]],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [0]},
                    "expected_output": [[], [0]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1, 2]},
                    "expected_output": [[], [1], [2], [1, 2]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [9, 0, 3, 5, 7]},
                    "expected_output": [[], [9], [0], [9, 0], [3], [9, 3], [0, 3], [9, 0, 3], [5], [9, 5], [0, 5], [9, 0, 5], [3, 5], [9, 3, 5], [0, 3, 5], [9, 0, 3, 5], [7], [9, 7], [0, 7], [9, 0, 7], [3, 7], [9, 3, 7], [0, 3, 7], [9, 0, 3, 7], [5, 7], [9, 5, 7], [0, 5, 7], [9, 0, 5, 7], [3, 5, 7], [9, 3, 5, 7], [0, 3, 5, 7], [9, 0, 3, 5, 7]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": [[], [1]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
        {
            "title": "Permutations",
            "description": """Given an array `nums` of distinct integers, return all the possible permutations. You can return the answer in **any order**.

**Example 1:**
```
Input: nums = [1,2,3]
Output: [[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]
```

**Example 2:**
```
Input: nums = [0,1]
Output: [[0,1],[1,0]]
```

**Example 3:**
```
Input: nums = [1]
Output: [[1]]
```""",
            "difficulty": DifficultyEnum.MEDIUM,
            "code_templates": {
                "python": "class Solution:\n    def permute(self, nums: List[int]) -> List[List[int]]:\n        ",
                "javascript": "/**\n * @param {number[]} nums\n * @return {number[][]}\n */\nvar permute = function(nums) {\n    \n};",
                "java": "class Solution {\n    public List<List<Integer>> permute(int[] nums) {\n        \n    }\n}",
                "cpp": "class Solution {\npublic:\n    vector<vector<int>> permute(vector<int>& nums) {\n        \n    }\n};",
            },
            "function_signature": {
                "function_name": "permute",
                "arguments": [{"name": "nums", "type": "int[]"}],
                "return_type": "int[][]",
            },
            "constraints": "* 1 <= nums.length <= 6\n* -10 <= nums[i] <= 10\n* All the integers of nums are unique",
            "hints": [
                "Use backtracking",
                "Swap elements to generate permutations",
                "Track used elements or use visited array",
            ],
            "time_limit": {"python": 3, "javascript": 3, "java": 5, "cpp": 2},
            "memory_limit": {"python": 64000, "javascript": 64000, "java": 96000, "cpp": 48000},
            "acceptance_rate": 74,
            "total_submissions": 1876543,
            "total_accepted": 1388641,
            "likes": 16789,
            "dislikes": 289,
            "topics": ["Array", "Backtracking"],
            "companies": ["Amazon", "Microsoft", "Google"],
            "test_cases": [
                {
                    "input_data": {"nums": [1, 2, 3]},
                    "expected_output": [[1, 2, 3], [1, 3, 2], [2, 1, 3], [2, 3, 1], [3, 1, 2], [3, 2, 1]],
                    "visibility": TestCaseVisibilityEnum.SAMPLE,
                    "order_index": 0,
                },
                {
                    "input_data": {"nums": [0, 1]},
                    "expected_output": [[0, 1], [1, 0]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 1,
                },
                {
                    "input_data": {"nums": [1]},
                    "expected_output": [[1]],
                    "visibility": TestCaseVisibilityEnum.PUBLIC,
                    "order_index": 2,
                },
                {
                    "input_data": {"nums": [1, 2]},
                    "expected_output": [[1, 2], [2, 1]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 3,
                },
                {
                    "input_data": {"nums": [5, 4, 6, 2]},
                    "expected_output": [[5, 4, 6, 2], [5, 4, 2, 6], [5, 6, 4, 2], [5, 6, 2, 4], [5, 2, 4, 6], [5, 2, 6, 4], [4, 5, 6, 2], [4, 5, 2, 6], [4, 6, 5, 2], [4, 6, 2, 5], [4, 2, 5, 6], [4, 2, 6, 5], [6, 5, 4, 2], [6, 5, 2, 4], [6, 4, 5, 2], [6, 4, 2, 5], [6, 2, 5, 4], [6, 2, 4, 5], [2, 5, 4, 6], [2, 5, 6, 4], [2, 4, 5, 6], [2, 4, 6, 5], [2, 6, 5, 4], [2, 6, 4, 5]],
                    "visibility": TestCaseVisibilityEnum.PRIVATE,
                    "order_index": 4,
                },
            ],
        },
    ]

"""
Utility to generate commented data structure definitions for code editor.
Similar to LeetCode's approach of showing commented class definitions above user code.
"""

from typing import Any, Dict, List, Set


DATA_STRUCTURE_DEFINITIONS = {
    "ListNode": {
        "python": """# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
""",
        "javascript": """/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
""",
        "java": """/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
""",
        "cpp": """/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
"""
    },
    "TreeNode": {
        "python": """# Definition for a binary tree node.
# class TreeNode:
#     def __init__(self, val=0, left=None, right=None):
#         self.val = val
#         self.left = left
#         self.right = right
""",
        "javascript": """/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
""",
        "java": """/**
 * Definition for a binary tree node.
 * public class TreeNode {
 *     int val;
 *     TreeNode left;
 *     TreeNode right;
 *     TreeNode() {}
 *     TreeNode(int val) { this.val = val; }
 *     TreeNode(int val, TreeNode left, TreeNode right) {
 *         this.val = val;
 *         this.left = left;
 *         this.right = right;
 *     }
 * }
 */
""",
        "cpp": """/**
 * Definition for a binary tree node.
 * struct TreeNode {
 *     int val;
 *     TreeNode *left;
 *     TreeNode *right;
 *     TreeNode() : val(0), left(nullptr), right(nullptr) {}
 *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
 *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
 * };
 */
"""
    }
}


def detect_data_structures(function_signature: Dict[str, Any]) -> Set[str]:
    """
    Detect which custom data structures are used in the function signature.
    
    Args:
        function_signature: Dictionary with function_name, arguments, and return_type
        
    Returns:
        Set of data structure names (e.g., {"ListNode", "TreeNode"})
    """
    data_structures = set()
    
    # Check arguments
    for arg in function_signature.get("arguments", []):
        arg_type = arg.get("type", "")
        if arg_type in DATA_STRUCTURE_DEFINITIONS:
            data_structures.add(arg_type)
    
    # Check return type
    return_type = function_signature.get("return_type", "")
    if return_type in DATA_STRUCTURE_DEFINITIONS:
        data_structures.add(return_type)
    
    return data_structures


def generate_data_structure_comments(
    function_signature: Dict[str, Any],
    languages: List[str]
) -> Dict[str, str]:
    """
    Generate commented data structure definitions for each language.
    
    Args:
        function_signature: Dictionary with function_name, arguments, and return_type
        languages: List of language codes (e.g., ["python", "javascript"])
        
    Returns:
        Dictionary mapping language to commented definitions
        Example: {"python": "# Definition for...\n", "javascript": "/**...\n"}
    """
    data_structures = detect_data_structures(function_signature)
    
    result = {}
    for language in languages:
        comments = []
        for ds_name in sorted(data_structures):  # Sort for consistent ordering
            if ds_name in DATA_STRUCTURE_DEFINITIONS:
                definition = DATA_STRUCTURE_DEFINITIONS[ds_name].get(language, "")
                if definition:
                    comments.append(definition)
        
        result[language] = "".join(comments)
    
    return result


def prepend_data_structure_comments(
    code_templates: Dict[str, str],
    function_signature: Dict[str, Any]
) -> Dict[str, str]:
    """
    Prepend commented data structure definitions to existing code templates.
    
    Args:
        code_templates: Dictionary mapping language to code template
        function_signature: Dictionary with function_name, arguments, and return_type
        
    Returns:
        New dictionary with comments prepended to each template
    """
    languages = list(code_templates.keys())
    comments = generate_data_structure_comments(function_signature, languages)
    
    result = {}
    for language, template in code_templates.items():
        comment = comments.get(language, "")
        if comment:
            result[language] = comment + template
        else:
            result[language] = template
    
    return result

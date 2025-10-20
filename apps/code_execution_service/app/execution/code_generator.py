"""
Code Generator for Judge0 Integration

Generates language-specific executable code from user code and function signatures.
Based on the approach from: https://medium.com/@atish.gaikwad/leetcode-coding-platform-judge0-angular19-084e6e5aa71d

This eliminates the need for regex parsing and provides a robust, language-agnostic approach.
"""

import base64
import io
import json
import os
import zipfile
from enum import Enum
from typing import Any, Dict, Optional, Tuple


class LanguageEnum(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"
    JAVA = "java"
    CPP = "cpp"


# Type mappings from generic types to language-specific types
TYPE_MAPPINGS = {
    "int": {
        "python": "int",
        "javascript": "number",
        "java": "int",
        "cpp": "int"
    },
    "int[]": {
        "python": "List[int]",
        "javascript": "number[]",
        "java": "int[]",
        "cpp": "vector<int>"
    },
    "string": {
        "python": "str",
        "javascript": "string",
        "java": "String",
        "cpp": "string"
    },
    "string[]": {
        "python": "List[str]",
        "javascript": "string[]",
        "java": "String[]",
        "cpp": "vector<string>"
    },
    "boolean": {
        "python": "bool",
        "javascript": "boolean",
        "java": "boolean",
        "cpp": "bool"
    },
    "ListNode": {
        "python": "Optional[ListNode]",
        "javascript": "ListNode",
        "java": "ListNode",
        "cpp": "ListNode*"
    },
    "TreeNode": {
        "python": "Optional[TreeNode]",
        "javascript": "TreeNode",
        "java": "TreeNode",
        "cpp": "TreeNode*"
    },
    "void": {
        "python": "None",
        "javascript": "void",
        "java": "void",
        "cpp": "void"
    }
}


class CodeGenerator:
    """Generates executable code with wrappers for Judge0 execution"""
    
    def generate_wrapper(
        self,
        language: LanguageEnum,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str, Optional[str]]:
        """
        Generate complete executable code with stdin/stdout wrapper.
        
        Args:
            language: Target programming language
            user_code: User's code (function/class implementation)
            function_signature: Function metadata with arguments and return type
            input_data: Test case input data
            
        Returns:
            Tuple of (complete_code, stdin_data, additional_files_base64)
            - For Python/JS: (wrapped_code, stdin, None)
            - For Java/C++: ("", stdin, base64_zip_with_libraries)
        """
        if language == LanguageEnum.PYTHON:
            return self._generate_python_wrapper(user_code, function_signature, input_data)
        elif language == LanguageEnum.JAVASCRIPT:
            return self._generate_javascript_wrapper(user_code, function_signature, input_data)
        elif language == LanguageEnum.JAVA:
            return self._generate_java_wrapper(user_code, function_signature, input_data)
        elif language == LanguageEnum.CPP:
            return self._generate_cpp_wrapper(user_code, function_signature, input_data)
        else:
            raise ValueError(f"Unsupported language: {language}")
    
    def _generate_python_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str, None]:
        """Generate Python wrapper with stdin/stdout"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        return_type = function_signature["return_type"]
        
        # Check if we need ListNode or TreeNode classes
        needs_listnode = (any(arg["type"] == "ListNode" for arg in arguments) 
                          or return_type == "ListNode")
        needs_treenode = (any(arg["type"] == "TreeNode" for arg in arguments) 
                          or return_type == "TreeNode")
        
        # Generate helper classes and functions
        helper_code = ""
        if needs_listnode:
            helper_code += """
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

"""
        
        if needs_treenode:
            helper_code += """
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

"""
        
        # Generate conversion functions (after class definitions)
        conversion_functions = ""
        if needs_listnode:
            conversion_functions += """
def array_to_listnode(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    current = head
    for val in arr[1:]:
        current.next = ListNode(val)
        current = current.next
    return head

def listnode_to_array(head):
    result = []
    current = head
    while current:
        result.append(current.val)
        current = current.next
    return result

"""
        
        if needs_treenode:
            conversion_functions += """
def array_to_treenode(arr):
    if not arr:
        return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def treenode_to_array(root):
    if not root:
        return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    # Remove trailing None values
    while result and result[-1] is None:
        result.pop()
    return result

"""
        
        # Generate argument extraction and conversion
        arg_conversions = []
        arg_names = []
        for arg in arguments:
            arg_name = arg["name"]
            arg_type = arg["type"]
            arg_names.append(arg_name)
            
            if arg_type == "ListNode":
                arg_conversions.append(f'    {arg_name} = array_to_listnode(input_data["{arg_name}"])')
            elif arg_type == "TreeNode":
                arg_conversions.append(f'    {arg_name} = array_to_treenode(input_data["{arg_name}"])')
            else:
                arg_conversions.append(f'    {arg_name} = input_data["{arg_name}"]')
        
        args_str = ", ".join(arg_names)
        conversion_code = "\n".join(arg_conversions)
        
        # Generate result conversion
        if return_type == "ListNode":
            result_conversion = "result = listnode_to_array(result)"
        elif return_type == "TreeNode":
            result_conversion = "result = treenode_to_array(result)"
        else:
            result_conversion = ""
        
        wrapper_code = f'''{helper_code}{conversion_functions}{user_code}

if __name__ == "__main__":
    import json
    import sys
    
    input_data = json.loads(sys.stdin.read())
{conversion_code}
    solution = Solution()
    result = solution.{function_name}({args_str})
    {result_conversion}
    print(json.dumps(result))
'''
        
        stdin_data = json.dumps(input_data)
        return wrapper_code, stdin_data, None
    
    def _generate_javascript_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str, None]:
        """Generate JavaScript wrapper with stdin/stdout"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        return_type = function_signature["return_type"]
        
        # Check if we need ListNode or TreeNode classes
        needs_listnode = (
            any(arg["type"] == "ListNode" for arg in arguments) or
            return_type == "ListNode"
        )
        needs_treenode = (
            any(arg["type"] == "TreeNode" for arg in arguments) or
            return_type == "TreeNode"
        )
        
        # Generate helper classes and functions
        helper_code = ""
        if needs_listnode:
            helper_code += """
class ListNode {
    constructor(val = 0, next = null) {
        this.val = val;
        this.next = next;
    }
}

"""
        
        if needs_treenode:
            helper_code += """
class TreeNode {
    constructor(val = 0, left = null, right = null) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

"""
        
        # Generate conversion functions
        conversion_functions = ""
        if needs_listnode:
            conversion_functions += """
function arrayToListNode(arr) {
    if (!arr || arr.length === 0) return null;
    const head = new ListNode(arr[0]);
    let current = head;
    for (let i = 1; i < arr.length; i++) {
        current.next = new ListNode(arr[i]);
        current = current.next;
    }
    return head;
}

function listNodeToArray(head) {
    const result = [];
    let current = head;
    while (current) {
        result.push(current.val);
        current = current.next;
    }
    return result;
}

"""
        
        if needs_treenode:
            conversion_functions += """
function arrayToTreeNode(arr) {
    if (!arr || arr.length === 0) return null;
    const root = new TreeNode(arr[0]);
    const queue = [root];
    let i = 1;
    while (queue.length > 0 && i < arr.length) {
        const node = queue.shift();
        if (i < arr.length && arr[i] !== null) {
            node.left = new TreeNode(arr[i]);
            queue.push(node.left);
        }
        i++;
        if (i < arr.length && arr[i] !== null) {
            node.right = new TreeNode(arr[i]);
            queue.push(node.right);
        }
        i++;
    }
    return root;
}

function treeNodeToArray(root) {
    if (!root) return [];
    const result = [];
    const queue = [root];
    while (queue.length > 0) {
        const node = queue.shift();
        if (node) {
            result.push(node.val);
            queue.push(node.left);
            queue.push(node.right);
        } else {
            result.push(null);
        }
    }
    // Remove trailing null values
    while (result.length > 0 && result[result.length - 1] === null) {
        result.pop();
    }
    return result;
}

"""
        
        # Generate argument extraction and conversion
        arg_conversions = []
        arg_names = []
        for arg in arguments:
            arg_name = arg["name"]
            arg_type = arg["type"]
            arg_names.append(arg_name)
            
            if arg_type == "ListNode":
                arg_conversions.append(
                    f'const {arg_name} = '
                    f'arrayToListNode(inputData.{arg_name});'
                )
            elif arg_type == "TreeNode":
                arg_conversions.append(
                    f'const {arg_name} = '
                    f'arrayToTreeNode(inputData.{arg_name});'
                )
            else:
                arg_conversions.append(f'const {arg_name} = inputData.{arg_name};')
        
        args_str = ", ".join(arg_names)
        conversion_code = "\n".join(arg_conversions)
        
        # Generate result conversion
        if return_type == "ListNode":
            result_line = (
                f'let result = {function_name}({args_str});\n'
                f'result = listNodeToArray(result);'
            )
        elif return_type == "TreeNode":
            result_line = (
                f'let result = {function_name}({args_str});\n'
                f'result = treeNodeToArray(result);'
            )
        else:
            result_line = f'const result = {function_name}({args_str});'
        
        wrapper_code = f'''{helper_code}{conversion_functions}{user_code}

// Read all stdin synchronously
const input = require('fs').readFileSync('/dev/stdin', 'utf-8');
const inputData = JSON.parse(input);
{conversion_code}
{result_line}
console.log(JSON.stringify(result));
'''
        
        stdin_data = json.dumps(input_data)
        return wrapper_code, stdin_data, None
    
    def _generate_java_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str, Optional[str]]:
        """
        Generate Java wrapper with GSON library bundled as additional_files.
        Uses language_id 89 (Multi-file program) with compile and run scripts.
        """
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        return_type = function_signature["return_type"]
        
        # Check if we need ListNode or TreeNode classes
        needs_listnode = (
            any(arg["type"] == "ListNode" for arg in arguments) or
            return_type == "ListNode"
        )
        needs_treenode = (
            any(arg["type"] == "TreeNode" for arg in arguments) or
            return_type == "TreeNode"
        )
        
        # Generate helper classes
        helper_classes = ""
        if needs_listnode:
            helper_classes += """
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

"""
        
        if needs_treenode:
            helper_classes += """
class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

"""
        
        # Generate helper methods
        helper_methods = ""
        if needs_listnode:
            helper_methods += """
    static ListNode arrayToListNode(JsonArray arr) {
        if (arr == null || arr.size() == 0) return null;
        ListNode head = new ListNode(arr.get(0).getAsInt());
        ListNode current = head;
        for (int i = 1; i < arr.size(); i++) {
            current.next = new ListNode(arr.get(i).getAsInt());
            current = current.next;
        }
        return head;
    }
    
    static JsonArray listNodeToArray(ListNode head) {
        JsonArray result = new JsonArray();
        ListNode current = head;
        while (current != null) {
            result.add(current.val);
            current = current.next;
        }
        return result;
    }

"""
        
        if needs_treenode:
            helper_methods += """
    static TreeNode arrayToTreeNode(JsonArray arr) {
        if (arr == null || arr.size() == 0) return null;
        TreeNode root = new TreeNode(arr.get(0).getAsInt());
        java.util.Queue<TreeNode> queue = new java.util.LinkedList<>();
        queue.add(root);
        int i = 1;
        while (!queue.isEmpty() && i < arr.size()) {
            TreeNode node = queue.poll();
            if (i < arr.size() && !arr.get(i).isJsonNull()) {
                node.left = new TreeNode(arr.get(i).getAsInt());
                queue.add(node.left);
            }
            i++;
            if (i < arr.size() && !arr.get(i).isJsonNull()) {
                node.right = new TreeNode(arr.get(i).getAsInt());
                queue.add(node.right);
            }
            i++;
        }
        return root;
    }
    
    static JsonArray treeNodeToArray(TreeNode root) {
        if (root == null) return new JsonArray();
        JsonArray result = new JsonArray();
        java.util.Queue<TreeNode> queue = new java.util.LinkedList<>();
        queue.add(root);
        while (!queue.isEmpty()) {
            TreeNode node = queue.poll();
            if (node != null) {
                result.add(node.val);
                queue.add(node.left);
                queue.add(node.right);
            } else {
                result.add((Integer) null);
            }
        }
        // Remove trailing nulls
        while (result.size() > 0 && result.get(result.size() - 1).isJsonNull()) {
            result.remove(result.size() - 1);
        }
        return result;
    }

"""
        
        # Generate argument parsing code
        arg_parsing = []
        arg_names = []
        for arg in arguments:
            arg_name = arg["name"]
            arg_type = arg["type"]
            arg_names.append(arg_name)
            
            # Generate type-specific parsing with GSON
            if arg_type == "int":
                arg_parsing.append(
                    f'        int {arg_name} = json.get("{arg_name}").getAsInt();'
                )
            elif arg_type == "int[]":
                arg_parsing.append(
                    f'        JsonArray {arg_name}Array = '
                    f'json.get("{arg_name}").getAsJsonArray();\n'
                    f'        int[] {arg_name} = new int[{arg_name}Array.size()];\n'
                    f'        for (int i = 0; i < {arg_name}Array.size(); i++) {{\n'
                    f'            {arg_name}[i] = {arg_name}Array.get(i).getAsInt();\n'
                    f'        }}'
                )
            elif arg_type == "string":
                arg_parsing.append(
                    f'        String {arg_name} = '
                    f'json.get("{arg_name}").getAsString();'
                )
            elif arg_type == "string[]":
                arg_parsing.append(
                    f'        JsonArray {arg_name}Array = '
                    f'json.get("{arg_name}").getAsJsonArray();\n'
                    f'        String[] {arg_name} = '
                    f'new String[{arg_name}Array.size()];\n'
                    f'        for (int i = 0; i < {arg_name}Array.size(); i++) {{\n'
                    f'            {arg_name}[i] = '
                    f'{arg_name}Array.get(i).getAsString();\n'
                    f'        }}'
                )
            elif arg_type == "boolean":
                arg_parsing.append(
                    f'        boolean {arg_name} = '
                    f'json.get("{arg_name}").getAsBoolean();'
                )
            elif arg_type == "ListNode":
                arg_parsing.append(
                    f'        ListNode {arg_name} = '
                    f'arrayToListNode(json.get("{arg_name}").getAsJsonArray());'
                )
            elif arg_type == "TreeNode":
                arg_parsing.append(
                    f'        TreeNode {arg_name} = '
                    f'arrayToTreeNode(json.get("{arg_name}").getAsJsonArray());'
                )
        
        args_str = ", ".join(arg_names)
        parsing_code = "\n".join(arg_parsing)
        
        # Map return type to Java
        java_return_type = (
            TYPE_MAPPINGS.get(return_type, {}).get("java", return_type)
        )
        
        # Generate result conversion
        if return_type == "ListNode":
            result_conversion = (
                f'        {java_return_type} result = '
                f'solution.{function_name}({args_str});\n'
                f'        JsonElement output = listNodeToArray(result);'
            )
        elif return_type == "TreeNode":
            result_conversion = (
                f'        {java_return_type} result = '
                f'solution.{function_name}({args_str});\n'
                f'        JsonElement output = treeNodeToArray(result);'
            )
        else:
            result_conversion = (
                f'        {java_return_type} result = '
                f'solution.{function_name}({args_str});\n'
                f'        JsonElement output = new Gson().toJsonTree(result);'
            )
        
        # Create Main.java with user's Solution class
        main_java = f'''import com.google.gson.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.IOException;

{helper_classes}{user_code}

public class Main {{
{helper_methods}
    public static void main(String[] args) throws IOException {{
        BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
        String input = reader.readLine();
        reader.close();
        JsonObject json = JsonParser.parseString(input).getAsJsonObject();
        
{parsing_code}
        
        Solution solution = new Solution();
{result_conversion}
        System.out.println(new Gson().toJson(output));
    }}
}}
'''
        
        # Create compile script
        compile_script = '''#!/bin/bash
/usr/local/openjdk13/bin/javac -classpath ".:gson-2.11.0.jar" Main.java
'''
        
        # Create run script
        run_script = '''#!/bin/bash
/usr/local/openjdk13/bin/java -classpath ".:gson-2.11.0.jar" Main
'''
        
        # Load GSON library
        lib_path = os.path.join(
            os.path.dirname(__file__), 
            "libraries", 
            "gson-2.11.0.jar"
        )
        with open(lib_path, 'rb') as f:
            gson_jar = f.read()
        
        # Create zip file with all necessary files
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('Main.java', main_java)
            zip_file.writestr('compile', compile_script)
            zip_file.writestr('run', run_script)
            zip_file.writestr('gson-2.11.0.jar', gson_jar)
        
        # Encode as base64
        additional_files_b64 = base64.b64encode(zip_buffer.getvalue()).decode('utf-8')
        
        stdin_data = json.dumps(input_data)
        # Return empty source_code since code is in additional_files
        return "", stdin_data, additional_files_b64
    
    def _generate_cpp_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str, Optional[str]]:
        """
        Generate C++ wrapper with nlohmann/json library bundled as additional_files.
        Uses language_id 89 (Multi-file program) with compile and run scripts.
        """
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        return_type = function_signature["return_type"]
        
        # Check if we need ListNode or TreeNode classes
        needs_listnode = (
            any(arg["type"] == "ListNode" for arg in arguments) or
            return_type == "ListNode"
        )
        needs_treenode = (
            any(arg["type"] == "TreeNode" for arg in arguments) or
            return_type == "TreeNode"
        )
        
        # Generate helper classes and functions
        helper_code = ""
        if needs_listnode:
            helper_code += """
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

"""
        
        if needs_treenode:
            helper_code += """
struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

"""
        
        # Generate conversion functions
        conversion_functions = ""
        if needs_listnode:
            conversion_functions += """
ListNode* arrayToListNode(const json& arr) {
    if (arr.empty()) return nullptr;
    ListNode* head = new ListNode(arr[0]);
    ListNode* current = head;
    for (size_t i = 1; i < arr.size(); i++) {
        current->next = new ListNode(arr[i]);
        current = current->next;
    }
    return head;
}

json listNodeToArray(ListNode* head) {
    json result = json::array();
    ListNode* current = head;
    while (current) {
        result.push_back(current->val);
        current = current->next;
    }
    return result;
}

"""
        
        if needs_treenode:
            conversion_functions += """
TreeNode* arrayToTreeNode(const json& arr) {
    if (arr.empty()) return nullptr;
    TreeNode* root = new TreeNode(arr[0]);
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < arr.size()) {
        TreeNode* node = q.front();
        q.pop();
        if (i < arr.size() && !arr[i].is_null()) {
            node->left = new TreeNode(arr[i]);
            q.push(node->left);
        }
        i++;
        if (i < arr.size() && !arr[i].is_null()) {
            node->right = new TreeNode(arr[i]);
            q.push(node->right);
        }
        i++;
    }
    return root;
}

json treeNodeToArray(TreeNode* root) {
    if (!root) return json::array();
    json result = json::array();
    queue<TreeNode*> q;
    q.push(root);
    while (!q.empty()) {
        TreeNode* node = q.front();
        q.pop();
        if (node) {
            result.push_back(node->val);
            q.push(node->left);
            q.push(node->right);
        } else {
            result.push_back(nullptr);
        }
    }
    // Remove trailing nulls
    while (!result.empty() && result.back().is_null()) {
        result.erase(result.end() - 1);
    }
    return result;
}

"""
        
        # Generate argument parsing code
        arg_parsing = []
        arg_names = []
        for arg in arguments:
            arg_name = arg["name"]
            arg_type = arg["type"]
            arg_names.append(arg_name)
            
            # Generate type-specific parsing with nlohmann/json
            if arg_type == "int":
                arg_parsing.append(f'    int {arg_name} = j["{arg_name}"];')
            elif arg_type == "int[]":
                arg_parsing.append(f'''    vector<int> {arg_name};
    for (auto& item : j["{arg_name}"]) {{
        {arg_name}.push_back(item);
    }}''')
            elif arg_type == "string":
                arg_parsing.append(f'    string {arg_name} = j["{arg_name}"];')
            elif arg_type == "string[]":
                arg_parsing.append(f'''    vector<string> {arg_name};
    for (auto& item : j["{arg_name}"]) {{
        {arg_name}.push_back(item);
    }}''')
            elif arg_type == "boolean":
                arg_parsing.append(f'    bool {arg_name} = j["{arg_name}"];')
            elif arg_type == "ListNode":
                arg_parsing.append(
                    f'    ListNode* {arg_name} = '
                    f'arrayToListNode(j["{arg_name}"]);'
                )
            elif arg_type == "TreeNode":
                arg_parsing.append(
                    f'    TreeNode* {arg_name} = '
                    f'arrayToTreeNode(j["{arg_name}"]);'
                )
        
        args_str = ", ".join(arg_names)
        parsing_code = "\n".join(arg_parsing)
        
        # Map return type to C++
        cpp_return_type = TYPE_MAPPINGS.get(return_type, {}).get("cpp", return_type)
        
        # Generate result handling based on return type
        if return_type == "ListNode":
            result_code = f'''    {cpp_return_type} result = solution.{function_name}({args_str});
    json output = listNodeToArray(result);'''
        elif return_type == "TreeNode":
            result_code = f'''    {cpp_return_type} result = solution.{function_name}({args_str});
    json output = treeNodeToArray(result);'''
        else:
            result_code = f'''    {cpp_return_type} result = solution.{function_name}({args_str});
    json output = result;'''
        
        # Create main.cpp with user's Solution class
        main_cpp = f'''#include <iostream>
#include <vector>
#include <string>
#include <stack>
#include <queue>
#include <unordered_map>
#include <unordered_set>
#include "json.hpp"

using namespace std;
using json = nlohmann::json;

{helper_code}{conversion_functions}{user_code}

int main() {{
    // Read JSON input from stdin
    json j;
    cin >> j;
    
{parsing_code}
    
    Solution solution;
{result_code}
    cout << output << endl;
    
    return 0;
}}
'''
        
        # Create compile script
        compile_script = '''#!/bin/bash
/usr/local/gcc-9.2.0/bin/g++ -std=c++14 -I. main.cpp -o main
'''
        
        # Create run script
        run_script = '''#!/bin/bash
./main
'''
        
        # Load nlohmann/json library
        lib_path = os.path.join(
            os.path.dirname(__file__), 
            "libraries", 
            "json.hpp"
        )
        with open(lib_path, 'rb') as f:
            json_hpp = f.read()
        
        # Create zip file with all necessary files
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr('main.cpp', main_cpp)
            zip_file.writestr('compile', compile_script)
            zip_file.writestr('run', run_script)
            zip_file.writestr('json.hpp', json_hpp)
        
        # Encode as base64
        additional_files_b64 = base64.b64encode(zip_buffer.getvalue()).decode('utf-8')
        
        stdin_data = json.dumps(input_data)
        # Return empty source_code since code is in additional_files
        return "", stdin_data, additional_files_b64
    
    def get_helper_definitions(
        self,
        language: LanguageEnum,
        function_signature: Dict[str, Any]
    ) -> str:
        """
        Generate commented helper class definitions (like LeetCode) that show users
        what data structures are available for use.
        
        Returns empty string if no helper classes are needed.
        """
        arguments = function_signature.get("arguments", [])
        return_type = function_signature.get("return_type", "")
        
        # Check if we need ListNode or TreeNode
        needs_listnode = (
            any(arg.get("type") == "ListNode" for arg in arguments) or
            return_type == "ListNode"
        )
        needs_treenode = (
            any(arg.get("type") == "TreeNode" for arg in arguments) or
            return_type == "TreeNode"
        )
        
        if not needs_listnode and not needs_treenode:
            return ""
        
        if language == LanguageEnum.PYTHON:
            return self._get_python_helper_definitions(needs_listnode, needs_treenode)
        elif language == LanguageEnum.JAVASCRIPT:
            return self._get_javascript_helper_definitions(needs_listnode, needs_treenode)
        elif language == LanguageEnum.JAVA:
            return self._get_java_helper_definitions(needs_listnode, needs_treenode)
        elif language == LanguageEnum.CPP:
            return self._get_cpp_helper_definitions(needs_listnode, needs_treenode)
        else:
            raise ValueError(f"Unsupported language: {language}")
    
    def _get_python_helper_definitions(self, needs_listnode: bool, needs_treenode: bool) -> str:
        """Generate Python helper class definitions as comments"""
        definitions = []
        
        if needs_listnode:
            definitions.append(
                "# Definition for singly-linked list.\n"
                "# class ListNode:\n"
                "#     def __init__(self, val=0, next=None):\n"
                "#         self.val = val\n"
                "#         self.next = next"
            )
        
        if needs_treenode:
            definitions.append(
                "# Definition for a binary tree node.\n"
                "# class TreeNode:\n"
                "#     def __init__(self, val=0, left=None, right=None):\n"
                "#         self.val = val\n"
                "#         self.left = left\n"
                "#         self.right = right"
            )
        
        return "\n".join(definitions)
    
    def _get_javascript_helper_definitions(self, needs_listnode: bool, needs_treenode: bool) -> str:
        """Generate JavaScript helper class definitions as comments"""
        definitions = []
        
        if needs_listnode:
            definitions.append(
                "/**\n"
                " * Definition for singly-linked list.\n"
                " * function ListNode(val, next) {\n"
                " *     this.val = (val===undefined ? 0 : val)\n"
                " *     this.next = (next===undefined ? null : next)\n"
                " * }\n"
                " */"
            )
        
        if needs_treenode:
            definitions.append(
                "/**\n"
                " * Definition for a binary tree node.\n"
                " * function TreeNode(val, left, right) {\n"
                " *     this.val = (val===undefined ? 0 : val)\n"
                " *     this.left = (left===undefined ? null : left)\n"
                " *     this.right = (right===undefined ? null : right)\n"
                " * }\n"
                " */"
            )
        
        return "\n".join(definitions)
    
    def _get_java_helper_definitions(self, needs_listnode: bool, needs_treenode: bool) -> str:
        """Generate Java helper class definitions as comments"""
        definitions = []
        
        if needs_listnode:
            definitions.append(
                "/**\n"
                " * Definition for singly-linked list.\n"
                " * public class ListNode {\n"
                " *     int val;\n"
                " *     ListNode next;\n"
                " *     ListNode() {}\n"
                " *     ListNode(int val) { this.val = val; }\n"
                " *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }\n"
                " * }\n"
                " */"
            )
        
        if needs_treenode:
            definitions.append(
                "/**\n"
                " * Definition for a binary tree node.\n"
                " * public class TreeNode {\n"
                " *     int val;\n"
                " *     TreeNode left;\n"
                " *     TreeNode right;\n"
                " *     TreeNode() {}\n"
                " *     TreeNode(int val) { this.val = val; }\n"
                " *     TreeNode(int val, TreeNode left, TreeNode right) {\n"
                " *         this.val = val;\n"
                " *         this.left = left;\n"
                " *         this.right = right;\n"
                " *     }\n"
                " * }\n"
                " */"
            )
        
        return "\n".join(definitions)
    
    def _get_cpp_helper_definitions(self, needs_listnode: bool, needs_treenode: bool) -> str:
        """Generate C++ helper class definitions as comments"""
        definitions = []
        
        if needs_listnode:
            definitions.append(
                "/**\n"
                " * Definition for singly-linked list.\n"
                " * struct ListNode {\n"
                " *     int val;\n"
                " *     ListNode *next;\n"
                " *     ListNode() : val(0), next(nullptr) {}\n"
                " *     ListNode(int x) : val(x), next(nullptr) {}\n"
                " *     ListNode(int x, ListNode *next) : val(x), next(next) {}\n"
                " * };\n"
                " */"
            )
        
        if needs_treenode:
            definitions.append(
                "/**\n"
                " * Definition for a binary tree node.\n"
                " * struct TreeNode {\n"
                " *     int val;\n"
                " *     TreeNode *left;\n"
                " *     TreeNode *right;\n"
                " *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n"
                " *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n"
                " *     TreeNode(int x, TreeNode *left, TreeNode *right) :\n"
                " *         val(x), left(left), right(right) {}\n"
                " * };\n"
                " */"
            )
        
        return "\n".join(definitions)
    
    def get_template_code(
        self,
        language: LanguageEnum,
        function_signature: Dict[str, Any]
    ) -> str:
        """
        Generate the template code that users see in the editor.
        This is just the function signature with an empty body.
        """
        if language == LanguageEnum.PYTHON:
            return self._get_python_template(function_signature)
        elif language == LanguageEnum.JAVASCRIPT:
            return self._get_javascript_template(function_signature)
        elif language == LanguageEnum.JAVA:
            return self._get_java_template(function_signature)
        elif language == LanguageEnum.CPP:
            return self._get_cpp_template(function_signature)
        else:
            raise ValueError(f"Unsupported language: {language}")
    
    def _get_python_template(self, function_signature: Dict[str, Any]) -> str:
        """Generate Python template code"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        
        # Generate parameter list with type hints
        params = []
        for arg in arguments:
            arg_name = arg["name"]
            arg_type_hint = TYPE_MAPPINGS.get(arg["type"], {}).get("python", arg["type"])
            params.append(f"{arg_name}: {arg_type_hint}")
        
        params_str = ", ".join(params)
        return_type_hint = TYPE_MAPPINGS.get(
            function_signature["return_type"], {}
        ).get("python", function_signature["return_type"])
        
        return f'''class Solution:
    def {function_name}(self, {params_str}) -> {return_type_hint}:
        '''
    
    def _get_javascript_template(self, function_signature: Dict[str, Any]) -> str:
        """Generate JavaScript template code"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        
        params = [arg["name"] for arg in arguments]
        params_str = ", ".join(params)
        
        return f'''var {function_name} = function({params_str}) {{
    
}};'''
    
    def _get_java_template(self, function_signature: Dict[str, Any]) -> str:
        """Generate Java template code"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        return_type = function_signature["return_type"]
        
        # Generate parameter list
        params = []
        for arg in arguments:
            arg_name = arg["name"]
            java_type = TYPE_MAPPINGS.get(arg["type"], {}).get("java", arg["type"])
            params.append(f"{java_type} {arg_name}")
        
        params_str = ", ".join(params)
        java_return_type = TYPE_MAPPINGS.get(return_type, {}).get("java", return_type)
        
        return f'''class Solution {{
    public {java_return_type} {function_name}({params_str}) {{
        
    }}
}}'''
    
    def _get_cpp_template(self, function_signature: Dict[str, Any]) -> str:
        """Generate C++ template code"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        return_type = function_signature["return_type"]
        
        # Generate parameter list
        params = []
        for arg in arguments:
            arg_name = arg["name"]
            cpp_type = TYPE_MAPPINGS.get(arg["type"], {}).get("cpp", arg["type"])
            params.append(f"{cpp_type} {arg_name}")
        
        params_str = ", ".join(params)
        cpp_return_type = TYPE_MAPPINGS.get(return_type, {}).get("cpp", return_type)
        
        return f'''class Solution {{
public:
    {cpp_return_type} {function_name}({params_str}) {{
        
    }}
}};'''


# Singleton instance
code_generator = CodeGenerator()

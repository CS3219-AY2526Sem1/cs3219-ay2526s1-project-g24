"""
Code Generator for Judge0 Integration

Generates language-specific executable code from user code and function signatures.
Based on the approach from: https://medium.com/@atish.gaikwad/leetcode-coding-platform-judge0-angular19-084e6e5aa71d

This eliminates the need for regex parsing and provides a robust, language-agnostic approach.
"""

import json
from typing import Dict, Any, Tuple
from enum import Enum


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
    ) -> Tuple[str, str]:
        """
        Generate complete executable code with stdin/stdout wrapper.
        
        Args:
            language: Target programming language
            user_code: User's code (function/class implementation)
            function_signature: Function metadata with arguments and return type
            input_data: Test case input data
            
        Returns:
            Tuple of (complete_code, stdin_data)
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
    ) -> Tuple[str, str]:
        """Generate Python wrapper with stdin/stdout"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        
        # Generate argument extraction from input_data
        arg_names = [arg["name"] for arg in arguments]
        args_str = ", ".join([f'input_data["{name}"]' for name in arg_names])
        
        wrapper_code = f'''{user_code}

if __name__ == "__main__":
    import json
    import sys
    
    input_data = json.loads(sys.stdin.read())
    solution = Solution()
    result = solution.{function_name}({args_str})
    print(json.dumps(result))
'''
        
        stdin_data = json.dumps(input_data)
        return wrapper_code, stdin_data
    
    def _generate_javascript_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Generate JavaScript wrapper with stdin/stdout using readlineSync"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        
        # Generate argument extraction from input_data
        arg_names = [arg["name"] for arg in arguments]
        args_str = ", ".join([f'inputData.{name}' for name in arg_names])
        
        # Use process.stdin with synchronous reading
        wrapper_code = f'''{user_code}

// Read all stdin synchronously
const input = require('fs').readFileSync('/dev/stdin', 'utf-8');
const inputData = JSON.parse(input);
const result = {function_name}({args_str});
console.log(JSON.stringify(result));
'''
        
        stdin_data = json.dumps(input_data)
        return wrapper_code, stdin_data
    
    def _generate_java_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Generate Java wrapper with stdin/stdout"""
        function_name = function_signature["function_name"]
        arguments = function_signature["arguments"]
        return_type = function_signature["return_type"]
        
        # Generate argument parsing code
        arg_parsing = []
        arg_names = []
        for arg in arguments:
            arg_name = arg["name"]
            arg_type = arg["type"]
            arg_names.append(arg_name)
            
            # Generate type-specific parsing
            if arg_type == "int":
                arg_parsing.append(f'        int {arg_name} = json.get("{arg_name}").getAsInt();')
            elif arg_type == "int[]":
                arg_parsing.append(f'''        JsonArray {arg_name}Array = json.get("{arg_name}").getAsJsonArray();
        int[] {arg_name} = new int[{arg_name}Array.size()];
        for (int i = 0; i < {arg_name}Array.size(); i++) {{
            {arg_name}[i] = {arg_name}Array.get(i).getAsInt();
        }}''')
            elif arg_type == "string":
                arg_parsing.append(f'        String {arg_name} = json.get("{arg_name}").getAsString();')
        
        args_str = ", ".join(arg_names)
        parsing_code = "\n".join(arg_parsing)
        
        # Map return type to Java
        java_return_type = TYPE_MAPPINGS.get(return_type, {}).get("java", return_type)
        
        wrapper_code = f'''import com.google.gson.*;
import java.util.Scanner;

{user_code}

public class Main {{
    public static void main(String[] args) {{
        Scanner scanner = new Scanner(System.in);
        String input = scanner.nextLine();
        JsonObject json = JsonParser.parseString(input).getAsJsonObject();
        
{parsing_code}
        
        Solution solution = new Solution();
        {java_return_type} result = solution.{function_name}({args_str});
        System.out.println(new Gson().toJson(result));
    }}
}}
'''
        
        stdin_data = json.dumps(input_data)
        return wrapper_code, stdin_data
    
    def _generate_cpp_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str]:
        """Generate C++ wrapper with stdin/stdout"""
        # Placeholder for C++ implementation
        raise NotImplementedError("C++ code generation not yet implemented")
    
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
        return_type = TYPE_MAPPINGS.get(function_signature["return_type"], {}).get("python", function_signature["return_type"])
        
        return f'''class Solution:
    def {function_name}(self, {params_str}) -> {return_type}:
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
        # Placeholder for C++ implementation
        raise NotImplementedError("C++ template generation not yet implemented")


# Singleton instance
code_generator = CodeGenerator()

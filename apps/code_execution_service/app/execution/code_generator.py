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
from typing import Dict, Any, Tuple, Optional
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
        return wrapper_code, stdin_data, None
    
    def _generate_javascript_wrapper(
        self,
        user_code: str,
        function_signature: Dict[str, Any],
        input_data: Dict[str, Any]
    ) -> Tuple[str, str, None]:
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
                arg_parsing.append(f'''        JsonArray {arg_name}Array = json.get("{arg_name}").getAsJsonArray();
        int[] {arg_name} = new int[{arg_name}Array.size()];
        for (int i = 0; i < {arg_name}Array.size(); i++) {{
            {arg_name}[i] = {arg_name}Array.get(i).getAsInt();
        }}''')
            elif arg_type == "string":
                arg_parsing.append(
                    f'        String {arg_name} = '
                    f'json.get("{arg_name}").getAsString();'
                )
            elif arg_type == "string[]":
                arg_parsing.append(f'''        JsonArray {arg_name}Array = json.get("{arg_name}").getAsJsonArray();
        String[] {arg_name} = new String[{arg_name}Array.size()];
        for (int i = 0; i < {arg_name}Array.size(); i++) {{
            {arg_name}[i] = {arg_name}Array.get(i).getAsString();
        }}''')
            elif arg_type == "boolean":
                arg_parsing.append(
                    f'        boolean {arg_name} = '
                    f'json.get("{arg_name}").getAsBoolean();'
                )
        
        args_str = ", ".join(arg_names)
        parsing_code = "\n".join(arg_parsing)
        
        # Map return type to Java
        java_return_type = TYPE_MAPPINGS.get(return_type, {}).get("java", return_type)
        
        # Create Main.java with user's Solution class
        main_java = f'''import com.google.gson.*;
import java.util.Scanner;

{user_code}

public class Main {{
    public static void main(String[] args) {{
        Scanner scanner = new Scanner(System.in);
        scanner.useDelimiter("\\\\Z");
        String input = scanner.next();
        scanner.close();
        JsonObject json = JsonParser.parseString(input).getAsJsonObject();
        
{parsing_code}
        
        Solution solution = new Solution();
        {java_return_type} result = solution.{function_name}({args_str});
        System.out.println(new Gson().toJson(result));
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
        
        args_str = ", ".join(arg_names)
        parsing_code = "\n".join(arg_parsing)
        
        # Map return type to C++
        cpp_return_type = TYPE_MAPPINGS.get(return_type, {}).get("cpp", return_type)
        
        # Determine result serialization based on return type
        if return_type in ["int", "string", "boolean"]:
            result_serialization = "result"
        else:
            result_serialization = "result"  # nlohmann/json handles vectors automatically
        
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

{user_code}

int main() {{
    // Read JSON input from stdin
    json j;
    cin >> j;
    
{parsing_code}
    
    Solution solution;
    {cpp_return_type} result = solution.{function_name}({args_str});
    
    // Output result as JSON
    json output = {result_serialization};
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

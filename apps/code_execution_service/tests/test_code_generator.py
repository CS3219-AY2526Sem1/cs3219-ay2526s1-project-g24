"""
Unit tests for CodeGenerator class
Tests wrapper generation for all languages and custom data structures
"""
import base64
import json
import zipfile
from io import BytesIO

import pytest

from app.execution.code_generator import LanguageEnum
from tests.conftest import SAMPLE_FUNCTION_SIGNATURES, SAMPLE_TEST_DATA, SAMPLE_USER_CODE


class TestCodeGeneratorPython:
    """Test Python code generation"""
    
    def test_python_simple_function(self, code_generator):
        """Test Python wrapper for simple function (two sum)"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.PYTHON,
            user_code=SAMPLE_USER_CODE["python"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # Should return code and stdin, no additional files
        assert wrapper_code is not None
        assert stdin is not None
        assert additional_files is None
        
        # Code should include user code
        assert "class Solution:" in wrapper_code
        assert "def twoSum" in wrapper_code
        
        # Code should include wrapper logic
        assert "import json" in wrapper_code
        assert "sys.stdin.read()" in wrapper_code
        
        # Should NOT include ListNode or TreeNode since not needed
        assert "class ListNode" not in wrapper_code
        assert "class TreeNode" not in wrapper_code
        
        # Stdin should contain input data as JSON
        stdin_data = json.loads(stdin)
        assert stdin_data["nums"] == [2, 7, 11, 15]
        assert stdin_data["target"] == 9
    
    def test_python_linked_list(self, code_generator):
        """Test Python wrapper with ListNode"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.PYTHON,
            user_code=SAMPLE_USER_CODE["python"]["add_two_numbers"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["add_two_numbers"],
            input_data=SAMPLE_TEST_DATA["add_two_numbers"]["input_data"]
        )
        
        # Should include ListNode class definition
        assert "class ListNode:" in wrapper_code
        assert "def __init__(self, val=0, next=None):" in wrapper_code
        
        # Should include conversion functions
        assert "def array_to_listnode" in wrapper_code or "def list_to_listnode" in wrapper_code
        assert "def listnode_to_array" in wrapper_code or "def listnode_to_list" in wrapper_code
        
        # Should NOT include TreeNode
        assert "class TreeNode" not in wrapper_code
        
        # Stdin should contain list representation
        stdin_data = json.loads(stdin)
        assert stdin_data["l1"] == [2, 4, 3]
        assert stdin_data["l2"] == [5, 6, 4]
    
    def test_python_tree_node(self, code_generator):
        """Test Python wrapper with TreeNode"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.PYTHON,
            user_code="class Solution:\n    def inorderTraversal(self, root): pass",
            function_signature=SAMPLE_FUNCTION_SIGNATURES["inorder_traversal"],
            input_data=SAMPLE_TEST_DATA["inorder_traversal"]["input_data"]
        )
        
        # Should include TreeNode class definition
        assert "class TreeNode:" in wrapper_code
        assert "def __init__(self, val=0, left=None, right=None):" in wrapper_code
        
        # Should include conversion functions
        assert "def array_to_treenode" in wrapper_code or "def list_to_treenode" in wrapper_code
        assert "def treenode_to_array" in wrapper_code or "def treenode_to_list" in wrapper_code
        
        # Should NOT include ListNode
        assert "class ListNode" not in wrapper_code


class TestCodeGeneratorJavaScript:
    """Test JavaScript code generation"""
    
    def test_javascript_simple_function(self, code_generator):
        """Test JavaScript wrapper for simple function"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.JAVASCRIPT,
            user_code=SAMPLE_USER_CODE["javascript"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # Should return code and stdin, no additional files
        assert wrapper_code is not None
        assert stdin is not None
        assert additional_files is None
        
        # Code should include user code
        assert "var twoSum = function" in wrapper_code
        
        # Code should include wrapper logic
        assert "require('fs')" in wrapper_code  # Can be inline or separate
        assert "JSON.parse" in wrapper_code
        assert "JSON.stringify" in wrapper_code
        
        # Should NOT include helper classes for simple function
        assert "function ListNode" not in wrapper_code
        assert "function TreeNode" not in wrapper_code
    
    def test_javascript_wrapper_execution_logic(self, code_generator):
        """Test JavaScript wrapper includes proper execution logic"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.JAVASCRIPT,
            user_code=SAMPLE_USER_CODE["javascript"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # Should read from stdin (can be readFileSync(0) or readFileSync('/dev/stdin'))
        assert "readFileSync" in wrapper_code
        
        # Should call the function with arguments
        assert "twoSum" in wrapper_code
        
        # Should output result
        assert "console.log" in wrapper_code


class TestCodeGeneratorJava:
    """Test Java code generation"""
    
    def test_java_simple_function(self, code_generator):
        """Test Java wrapper for simple function"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.JAVA,
            user_code=SAMPLE_USER_CODE["java"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # For Java, should return stdin and additional_files (zip with libraries)
        assert wrapper_code == ""  # Empty for multi-file programs
        assert stdin is not None
        assert additional_files is not None
        
        # Additional files should be base64 encoded
        assert isinstance(additional_files, str)
        
        # Decode and verify zip contents
        zip_bytes = base64.b64decode(additional_files)
        zip_file = zipfile.ZipFile(BytesIO(zip_bytes))
        filenames = zip_file.namelist()
        
        # Should contain Main.java and GSON library
        assert "Main.java" in filenames
        assert any("gson" in f.lower() for f in filenames)
        
        # Main.java should include user code
        main_java = zip_file.read("Main.java").decode("utf-8")
        assert "class Solution" in main_java
        assert "twoSum" in main_java
    
    def test_java_includes_gson_library(self, code_generator):
        """Test Java wrapper includes GSON library for JSON handling"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.JAVA,
            user_code=SAMPLE_USER_CODE["java"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # Decode zip
        zip_bytes = base64.b64decode(additional_files)
        zip_file = zipfile.ZipFile(BytesIO(zip_bytes))
        
        # Should have GSON jar
        gson_files = [f for f in zip_file.namelist() if "gson" in f.lower() and f.endswith(".jar")]
        assert len(gson_files) > 0
        
        # Main.java should import GSON
        main_java = zip_file.read("Main.java").decode("utf-8")
        assert "import com.google.gson" in main_java


class TestCodeGeneratorCpp:
    """Test C++ code generation"""
    
    def test_cpp_simple_function(self, code_generator):
        """Test C++ wrapper for simple function"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.CPP,
            user_code=SAMPLE_USER_CODE["cpp"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # For C++, should return stdin and additional_files (zip with libraries)
        assert wrapper_code == ""  # Empty for multi-file programs
        assert stdin is not None
        assert additional_files is not None
        
        # Decode and verify zip contents
        zip_bytes = base64.b64decode(additional_files)
        zip_file = zipfile.ZipFile(BytesIO(zip_bytes))
        filenames = zip_file.namelist()
        
        # Should contain main.cpp and nlohmann/json library
        assert "main.cpp" in filenames
        assert any("json.hpp" in f for f in filenames)
        
        # main.cpp should include user code
        main_cpp = zip_file.read("main.cpp").decode("utf-8")
        assert "class Solution" in main_cpp
        assert "twoSum" in main_cpp
    
    def test_cpp_includes_json_library(self, code_generator):
        """Test C++ wrapper includes nlohmann/json library"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.CPP,
            user_code=SAMPLE_USER_CODE["cpp"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # Decode zip
        zip_bytes = base64.b64decode(additional_files)
        zip_file = zipfile.ZipFile(BytesIO(zip_bytes))
        
        # Should have json.hpp
        assert "json.hpp" in zip_file.namelist()
        
        # main.cpp should include json library
        main_cpp = zip_file.read("main.cpp").decode("utf-8")
        assert '#include "json.hpp"' in main_cpp or '#include <nlohmann/json.hpp>' in main_cpp


class TestCodeGeneratorHelperDefinitions:
    """Test helper definition generation"""
    
    def test_helper_definitions_not_in_wrapper_code(self, code_generator):
        """
        Helper definitions should NOT be in wrapper code.
        They are only for displaying to users in the editor.
        """
        # Test with ListNode problem
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.PYTHON,
            user_code=SAMPLE_USER_CODE["python"]["add_two_numbers"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["add_two_numbers"],
            input_data=SAMPLE_TEST_DATA["add_two_numbers"]["input_data"]
        )
        
        # Should have actual class definition (not commented)
        assert "class ListNode:" in wrapper_code
        
        # Should NOT have commented helper definitions in wrapper
        # (those are for code_templates, not execution)
        assert "# Definition for singly-linked list" not in wrapper_code
    
    def test_get_helper_definitions_python(self, code_generator):
        """Test get_helper_definitions returns commented definitions for Python"""
        helper_defs = code_generator.get_helper_definitions(
            language=LanguageEnum.PYTHON,
            function_signature=SAMPLE_FUNCTION_SIGNATURES["add_two_numbers"]
        )
        
        # Should return commented definition
        assert "# Definition for singly-linked list" in helper_defs
        assert "# class ListNode:" in helper_defs
        assert "#     def __init__" in helper_defs
    
    def test_get_helper_definitions_no_custom_types(self, code_generator):
        """Test get_helper_definitions returns empty string when no custom types"""
        helper_defs = code_generator.get_helper_definitions(
            language=LanguageEnum.PYTHON,
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"]
        )
        
        # Should return empty string for simple types
        assert helper_defs == ""
    
    def test_get_helper_definitions_all_languages(self, code_generator):
        """Test get_helper_definitions works for all languages"""
        for language in [LanguageEnum.PYTHON, LanguageEnum.JAVASCRIPT, 
                        LanguageEnum.JAVA, LanguageEnum.CPP]:
            helper_defs = code_generator.get_helper_definitions(
                language=language,
                function_signature=SAMPLE_FUNCTION_SIGNATURES["add_two_numbers"]
            )
            
            # Should return some commented definition
            assert len(helper_defs) > 0
            assert "ListNode" in helper_defs


class TestCodeGeneratorEdgeCases:
    """Test edge cases and error handling"""
    
    def test_unsupported_language(self, code_generator):
        """Test that unsupported language raises ValueError"""
        with pytest.raises(ValueError, match="Unsupported language"):
            code_generator.generate_wrapper(
                language="ruby",  # type: ignore
                user_code="def solution; end",
                function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
                input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
            )
    
    def test_empty_user_code(self, code_generator):
        """Test handling of empty user code"""
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.PYTHON,
            user_code="",
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=SAMPLE_TEST_DATA["two_sum"]["input_data"]
        )
        
        # Should still generate wrapper
        assert wrapper_code is not None
        assert stdin is not None
    
    def test_complex_input_data(self, code_generator):
        """Test handling of complex nested input data"""
        complex_input = {
            "matrix": [[1, 2, 3], [4, 5, 6]],
            "target": 5,
            "options": {"strict": True, "limit": 100}
        }
        
        wrapper_code, stdin, additional_files = code_generator.generate_wrapper(
            language=LanguageEnum.PYTHON,
            user_code=SAMPLE_USER_CODE["python"]["two_sum"],
            function_signature=SAMPLE_FUNCTION_SIGNATURES["two_sum"],
            input_data=complex_input
        )
        
        # Stdin should properly serialize complex data
        stdin_data = json.loads(stdin)
        assert stdin_data["matrix"] == [[1, 2, 3], [4, 5, 6]]
        assert stdin_data["options"]["strict"] is True

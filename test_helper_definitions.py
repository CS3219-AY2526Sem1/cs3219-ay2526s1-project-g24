#!/usr/bin/env python3
"""
Test script to verify that helper definitions (ListNode, TreeNode) are shown
in code templates for questions that need them.
"""

import requests

BASE_URL = "http://localhost:8000"

def test_question_helper_definitions():
    """Test that helper definitions appear for questions using custom data structures"""
    
    print("=" * 80)
    print("Testing Helper Definitions in Code Templates")
    print("=" * 80)
    
    # Get all questions to find ones with ListNode or TreeNode
    print("\n1. Fetching all questions...")
    response = requests.get(f"{BASE_URL}/api/questions")
    
    if response.status_code != 200:
        print(f"❌ Failed to fetch questions: {response.status_code}")
        return
    
    questions = response.json()["questions"]
    print(f"✅ Found {len(questions)} questions")
    
    # Find questions with custom data structures
    custom_ds_questions = []
    regular_questions = []
    
    for q in questions:
        title = q["title"]
        if "Linked List" in title or "Tree" in title or "Binary" in title:
            custom_ds_questions.append(q)
        elif "Sum" in title or "Palindrome" in title:
            regular_questions.append(q)
    
    print(f"\nFound {len(custom_ds_questions)} questions likely using custom data structures")
    print(f"Found {len(regular_questions)} regular questions")
    
    # Test a question with ListNode
    if custom_ds_questions:
        print("\n" + "=" * 80)
        print("2. Testing Question with Custom Data Structure (ListNode/TreeNode)")
        print("=" * 80)
        
        q_id = custom_ds_questions[0]["id"]
        title = custom_ds_questions[0]["title"]
        
        print(f"\nFetching question: '{title}' (ID: {q_id})")
        response = requests.get(f"{BASE_URL}/api/questions/{q_id}")
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch question: {response.status_code}")
            return
        
        question = response.json()
        
        # Check function signature
        func_sig = question["function_signature"]
        print(f"\nFunction Signature:")
        print(f"  Function: {func_sig['function_name']}")
        print(f"  Arguments: {func_sig['arguments']}")
        print(f"  Return Type: {func_sig['return_type']}")
        
        # Check code templates for helper definitions
        print(f"\n✨ Code Templates with Helper Definitions:")
        
        for lang, code in question["code_templates"].items():
            print(f"\n{'─' * 80}")
            print(f"Language: {lang.upper()}")
            print(f"{'─' * 80}")
            
            # Check if helper definition is present
            has_definition = (
                "Definition for" in code or
                "class ListNode" in code or
                "class TreeNode" in code or
                "struct ListNode" in code or
                "struct TreeNode" in code
            )
            
            if has_definition:
                print("✅ Helper definitions FOUND in code template!")
            else:
                print("⚠️  No helper definitions found (expected for this question type)")
            
            print(f"\nCode Template Preview (first 500 chars):")
            print(code[:500])
            if len(code) > 500:
                print("...")
    
    # Test a regular question without custom data structures
    if regular_questions:
        print("\n" + "=" * 80)
        print("3. Testing Regular Question (No Custom Data Structures)")
        print("=" * 80)
        
        q_id = regular_questions[0]["id"]
        title = regular_questions[0]["title"]
        
        print(f"\nFetching question: '{title}' (ID: {q_id})")
        response = requests.get(f"{BASE_URL}/api/questions/{q_id}")
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch question: {response.status_code}")
            return
        
        question = response.json()
        
        # Check function signature
        func_sig = question["function_signature"]
        print(f"\nFunction Signature:")
        print(f"  Function: {func_sig['function_name']}")
        print(f"  Arguments: {func_sig['arguments']}")
        print(f"  Return Type: {func_sig['return_type']}")
        
        # Check code templates - should NOT have helper definitions
        print(f"\n✨ Code Templates (should be clean, no helper definitions):")
        
        for lang, code in question["code_templates"].items():
            print(f"\n{'─' * 80}")
            print(f"Language: {lang.upper()}")
            print(f"{'─' * 80}")
            
            # Check if helper definition is present
            has_definition = (
                "Definition for" in code or
                "class ListNode" in code or
                "class TreeNode" in code
            )
            
            if has_definition:
                print("⚠️  Unexpected: Helper definitions found (should be none)")
            else:
                print("✅ No helper definitions (correct for this question type)")
            
            print(f"\nCode Template:")
            print(code)
    
    print("\n" + "=" * 80)
    print("Test Complete!")
    print("=" * 80)

if __name__ == "__main__":
    try:
        test_question_helper_definitions()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to question service.")
        print("   Make sure the service is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

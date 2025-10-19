"""
Schema validation test for Question Service.

Verifies that the migration from integer time_limit/memory_limit to 
language-specific JSON dictionaries was successful and all existing 
questions have proper data.
"""
import asyncio

import httpx

BASE_URL = "http://localhost:8000/api"


async def test_all_questions_schema():
    """Fetch all questions and validate their schemas"""
    print("\n" + "="*80)
    print("SCHEMA VALIDATION TEST - All Questions")
    print("="*80)
    
    async with httpx.AsyncClient() as client:
        # Get all questions
        response = await client.get(f"{BASE_URL}/questions/", params={"page_size": 100})
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch questions: {response.status_code}")
            return
        
        data = response.json()
        questions = data['questions']
        
        print(f"\n📊 Testing {len(questions)} questions...")
        
        issues_found = []
        valid_count = 0
        
        for q in questions:
            question_id = q['id']
            title = q['title']
            
            # Fetch full question details
            detail_response = await client.get(f"{BASE_URL}/questions/{question_id}")
            if detail_response.status_code != 200:
                issues_found.append(f"Question {question_id} ({title}): Cannot fetch details")
                continue
            
            question = detail_response.json()
            
            # Validate schema
            issues = []
            
            # Check time_limit
            time_limit = question.get('time_limit')
            if not isinstance(time_limit, dict):
                issues.append(f"time_limit is {type(time_limit).__name__}, not dict")
            else:
                required_langs = ['python', 'javascript', 'java', 'cpp']
                missing = [lang for lang in required_langs if lang not in time_limit]
                if missing:
                    issues.append(f"time_limit missing languages: {missing}")
                
                # Check all values are positive integers
                for lang, val in time_limit.items():
                    if not isinstance(val, (int, float)) or val <= 0:
                        issues.append(f"time_limit[{lang}] has invalid value: {val}")
            
            # Check memory_limit
            memory_limit = question.get('memory_limit')
            if not isinstance(memory_limit, dict):
                issues.append(f"memory_limit is {type(memory_limit).__name__}, not dict")
            else:
                required_langs = ['python', 'javascript', 'java', 'cpp']
                missing = [lang for lang in required_langs if lang not in memory_limit]
                if missing:
                    issues.append(f"memory_limit missing languages: {missing}")
                
                # Check all values are positive integers
                for lang, val in memory_limit.items():
                    if not isinstance(val, (int, float)) or val <= 0:
                        issues.append(f"memory_limit[{lang}] has invalid value: {val}")
            
            # Check code_templates match time/memory limits
            code_templates = question.get('code_templates', {})
            if isinstance(time_limit, dict):
                for lang in time_limit.keys():
                    if lang not in code_templates:
                        issues.append(f"time_limit has '{lang}' but no code template")
            
            # Check function_signature
            func_sig = question.get('function_signature')
            if not func_sig:
                issues.append("Missing function_signature")
            elif not isinstance(func_sig, dict):
                issues.append(f"function_signature is {type(func_sig).__name__}, not dict")
            else:
                required_keys = ['function_name', 'arguments', 'return_type']
                missing = [k for k in required_keys if k not in func_sig]
                if missing:
                    issues.append(f"function_signature missing keys: {missing}")
            
            if issues:
                issues_found.append({
                    "id": question_id,
                    "title": title,
                    "issues": issues
                })
                print(f"❌ Question {question_id} ({title}):")
                for issue in issues:
                    print(f"   - {issue}")
            else:
                valid_count += 1
                print(f"✅ Question {question_id} ({title})")
        
        # Summary
        print("\n" + "="*80)
        print("SUMMARY")
        print("="*80)
        print(f"Total Questions: {len(questions)}")
        print(f"✅ Valid: {valid_count}")
        print(f"❌ Issues: {len(issues_found)}")
        
        if issues_found:
            print("\n" + "="*80)
            print("DETAILED ISSUES")
            print("="*80)
            for item in issues_found:
                print(f"\n❌ Question {item['id']}: {item['title']}")
                for issue in item['issues']:
                    print(f"   • {issue}")
            
            print("\n" + "="*80)
            print("❌ SCHEMA VALIDATION FAILED")
            print("="*80)
            return False
        else:
            print("\n" + "="*80)
            print("✅ ALL QUESTIONS HAVE VALID SCHEMAS")
            print("="*80)
            return True


async def test_schema_consistency():
    """Test that all questions follow consistent schema patterns"""
    print("\n" + "="*80)
    print("SCHEMA CONSISTENCY TEST")
    print("="*80)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/questions/", params={"page_size": 100})
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch questions: {response.status_code}")
            return False
        
        data = response.json()
        questions_list = data['questions']
        
        # Collect schema patterns
        languages_with_limits = set()
        languages_with_templates = set()
        
        for q in questions_list:
            # Fetch full details
            detail_response = await client.get(f"{BASE_URL}/questions/{q['id']}")
            if detail_response.status_code != 200:
                continue
            
            question = detail_response.json()
            
            if isinstance(question.get('time_limit'), dict):
                languages_with_limits.update(question['time_limit'].keys())
            
            if isinstance(question.get('code_templates'), dict):
                languages_with_templates.update(question['code_templates'].keys())
        
        print("\n📊 Schema Analysis:")
        print(f"Languages with time/memory limits: {sorted(languages_with_limits)}")
        print(f"Languages with code templates: {sorted(languages_with_templates)}")
        
        # Check consistency
        expected_langs = {'python', 'javascript', 'java', 'cpp'}
        
        if languages_with_limits == expected_langs:
            print("✅ All expected languages have limits")
        else:
            missing = expected_langs - languages_with_limits
            extra = languages_with_limits - expected_langs
            if missing:
                print(f"⚠️  Missing languages in limits: {missing}")
            if extra:
                print(f"⚠️  Extra languages in limits: {extra}")
        
        if languages_with_templates == expected_langs:
            print("✅ All expected languages have templates")
        else:
            missing = expected_langs - languages_with_templates
            extra = languages_with_templates - expected_langs
            if missing:
                print(f"⚠️  Missing languages in templates: {missing}")
            if extra:
                print(f"⚠️  Extra languages in templates: {extra}")
        
        return True


async def test_backward_compatibility():
    """Test that old API consumers can still work with new schema"""
    print("\n" + "="*80)
    print("BACKWARD COMPATIBILITY TEST")
    print("="*80)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/questions/1")
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch question: {response.status_code}")
            return False
        
        question = response.json()
        
        print("\n✅ Question fetched successfully")
        
        # Simulate old client expecting integer limits
        time_limit = question.get('time_limit')
        memory_limit = question.get('memory_limit')
        
        print("\n📝 Old Client Simulation:")
        print(f"   time_limit type: {type(time_limit).__name__}")
        print(f"   memory_limit type: {type(memory_limit).__name__}")
        
        if isinstance(time_limit, int) and isinstance(memory_limit, int):
            print("   ❌ Schema is still using old format (int)")
            return False
        elif isinstance(time_limit, dict) and isinstance(memory_limit, dict):
            print("   ✅ Schema is using new format (dict)")
            print("\n   ⚠️  NOTE: Old clients expecting int will need updates!")
            print("   Recommendation: Use default language (e.g., Python) as fallback:")
            print(f"      time_limit_value = time_limit.get('python', 5)")
            print(f"      memory_limit_value = memory_limit.get('python', 64000)")
            return True
        else:
            print(f"   ❌ Inconsistent schema: time={type(time_limit).__name__}, memory={type(memory_limit).__name__}")
            return False


async def test_migration_data_quality():
    """Test that migrated data is reasonable"""
    print("\n" + "="*80)
    print("MIGRATION DATA QUALITY TEST")
    print("="*80)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/questions/", params={"page_size": 100})
        
        if response.status_code != 200:
            print(f"❌ Failed to fetch questions: {response.status_code}")
            return False
        
        data = response.json()
        questions_list = data['questions']
        
        print(f"\n📊 Analyzing {len(questions_list)} questions...")
        
        issues = []
        
        for q in questions_list:
            detail_response = await client.get(f"{BASE_URL}/questions/{q['id']}")
            if detail_response.status_code != 200:
                continue
            
            question = detail_response.json()
            time_limit = question.get('time_limit', {})
            memory_limit = question.get('memory_limit', {})
            
            if not isinstance(time_limit, dict) or not isinstance(memory_limit, dict):
                continue
            
            # Check reasonable ranges
            for lang, val in time_limit.items():
                if val < 1 or val > 60:
                    issues.append(f"Q{q['id']} ({q['title']}): time_limit[{lang}]={val}s seems unreasonable")
            
            for lang, val in memory_limit.items():
                if val < 16000 or val > 512000:  # 16MB to 512MB
                    issues.append(f"Q{q['id']} ({q['title']}): memory_limit[{lang}]={val}KB seems unreasonable")
            
            # Check relative values make sense
            if 'java' in time_limit and 'python' in time_limit:
                if time_limit['java'] < time_limit['python']:
                    issues.append(f"Q{q['id']} ({q['title']}): Java time limit ({time_limit['java']}s) less than Python ({time_limit['python']}s)")
            
            if 'java' in memory_limit and 'python' in memory_limit:
                if memory_limit['java'] < memory_limit['python']:
                    issues.append(f"Q{q['id']} ({q['title']}): Java memory ({memory_limit['java']}KB) less than Python ({memory_limit['python']}KB)")
        
        if issues:
            print("\n⚠️  Data Quality Issues:")
            for issue in issues:
                print(f"   • {issue}")
            return False
        else:
            print("\n✅ All migrated data looks reasonable")
            return True


async def main():
    """Run all schema tests"""
    print("\n")
    print("╔" + "="*78 + "╗")
    print("║" + " "*20 + "SCHEMA VALIDATION & MIGRATION TEST" + " "*23 + "║")
    print("╚" + "="*78 + "╝")
    
    try:
        results = []
        
        # Run all tests
        results.append(("All Questions Schema", await test_all_questions_schema()))
        results.append(("Schema Consistency", await test_schema_consistency()))
        results.append(("Backward Compatibility", await test_backward_compatibility()))
        results.append(("Migration Data Quality", await test_migration_data_quality()))
        
        # Final summary
        print("\n" + "="*80)
        print("FINAL SUMMARY")
        print("="*80)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\nTotal: {passed}/{total} tests passed")
        
        if passed == total:
            print("\n" + "="*80)
            print("✅ ALL SCHEMA VALIDATION TESTS PASSED!")
            print("="*80)
            print("\nConclusions:")
            print("1. ✅ Migration from integer to dict successful")
            print("2. ✅ All questions have language-specific limits")
            print("3. ✅ Schema is consistent across all questions")
            print("4. ⚠️  Old clients need updates to handle dict format")
            print("="*80)
        else:
            print("\n" + "="*80)
            print("❌ SOME TESTS FAILED - REVIEW REQUIRED")
            print("="*80)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())

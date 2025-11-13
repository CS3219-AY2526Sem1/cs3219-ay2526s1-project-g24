# AI Assistance Disclosure:
# Tool: GitHub Copilot (model: Claude Sonnet 4.5)
# Date Range: September 18 - October 10, 2025
# Scope: Generated FastAPI router for test case management:
#   - PUT /test-cases/{id}: Update test case (admin only)
#   - DELETE /test-cases/{id}: Delete test case (admin only)
#   Admin-only endpoints for managing public/private test cases
# Author review: Code reviewed, tested, and validated by team. Modified for:
#   - Added validation for test case data
#   - Enhanced error handling

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_admin_user
from app.questions import crud, schemas

router = APIRouter(prefix="/test-cases", tags=["Test Cases"])


@router.put("/{test_case_id}", response_model=schemas.TestCaseResponse)
def update_test_case(
    test_case_id: int,
    test_case: schemas.TestCaseCreate,
    admin: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update a test case (admin only)"""
    db_test_case = crud.update_test_case(db, test_case_id, test_case)
    if not db_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    return schemas.TestCaseResponse(
        id=db_test_case.id,
        question_id=db_test_case.question_id,
        input_data=db_test_case.input_data,
        expected_output=db_test_case.expected_output,
        visibility=schemas.TestCaseVisibility(db_test_case.visibility.value),
        order_index=db_test_case.order_index,
        explanation=db_test_case.explanation
    )


@router.delete("/{test_case_id}", status_code=204)
def delete_test_case(
    test_case_id: int,
    admin: dict = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Delete a test case (admin only)"""
    success = crud.delete_test_case(db, test_case_id)
    if not success:
        raise HTTPException(status_code=404, detail="Test case not found")

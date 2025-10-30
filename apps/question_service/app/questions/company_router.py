from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.questions import crud, schemas

router = APIRouter(prefix="/companies", tags=["Companies"])


@router.get("/", response_model=list[schemas.CompanyResponse])
def list_companies(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """List all companies"""
    companies = crud.get_companies(db, skip=skip, limit=limit)
    return [
        schemas.CompanyResponse(
            id=c.id,
            name=c.name,
            description=c.description,
            question_count=len(c.questions)
        )
        for c in companies
    ]


@router.get("/{company_id}", response_model=schemas.CompanyResponse)
def get_company(
    company_id: int,
    db: Session = Depends(get_db)
):
    """Get a specific company by ID"""
    company = crud.get_company(db, company_id)
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return schemas.CompanyResponse(
        id=company.id,
        name=company.name,
        description=company.description,
        question_count=len(company.questions)
    )


@router.post("/", response_model=schemas.CompanyResponse, status_code=201)
def create_company(
    company: schemas.CompanyCreate,
    db: Session = Depends(get_db)
):
    """Create a new company (admin only)"""
    try:
        db_company = crud.create_company(db, company)
        return schemas.CompanyResponse(
            id=db_company.id,
            name=db_company.name,
            description=db_company.description,
            question_count=len(db_company.questions)
        )
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail=f"Company with name '{company.name}' already exists"
        )


@router.put("/{company_id}", response_model=schemas.CompanyResponse)
def update_company(
    company_id: int,
    company: schemas.CompanyCreate,
    db: Session = Depends(get_db)
):
    """Update a company (admin only)"""
    db_company = crud.update_company(db, company_id, company)
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return schemas.CompanyResponse(
        id=db_company.id,
        name=db_company.name,
        description=db_company.description,
        question_count=len(db_company.questions)
    )


@router.delete("/{company_id}", status_code=204)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db)
):
    """Delete a company (admin only)"""
    success = crud.delete_company(db, company_id)
    if not success:
        raise HTTPException(status_code=404, detail="Company not found")

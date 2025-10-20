"""
FastAPI dependencies for authentication and authorization.

These dependencies can be used in route handlers to require authentication
and/or specific permissions.
"""

from typing import Optional, List, Annotated
from fastapi import Depends, Request

from .auth import (
    extract_token_from_request,
    get_current_user_from_token,
    require_scopes,
    AuthenticationError,
)


async def get_current_user(request: Request) -> dict:
    """
    FastAPI dependency to get the current authenticated user.
    
    Usage:
        @router.get("/protected")
        def protected_route(user: dict = Depends(get_current_user)):
            user_id = user["user_id"]
            ...
    
    Returns:
        Dict containing user_id, email, roles, scopes
        
    Raises:
        AuthenticationError: If no token provided or token is invalid
    """
    token = extract_token_from_request(request)
    
    if not token:
        raise AuthenticationError("No authentication token provided")
    
    user = get_current_user_from_token(token)
    return user


async def get_current_user_optional(request: Request) -> Optional[dict]:
    """
    FastAPI dependency to get the current user if authenticated, None otherwise.
    
    This is useful for endpoints that work differently for authenticated vs anonymous users
    but don't require authentication.
    
    Usage:
        @router.get("/questions")
        def list_questions(user: Optional[dict] = Depends(get_current_user_optional)):
            if user:
                # Personalized results
                user_id = user["user_id"]
            else:
                # Anonymous results
                ...
    """
    token = extract_token_from_request(request)
    
    if not token:
        return None
    
    try:
        user = get_current_user_from_token(token)
        return user
    except AuthenticationError:
        return None


def require_permissions(required_scopes: List[str]):
    """
    Factory function to create a dependency that requires specific permissions.
    
    Usage:
        @router.post("/admin/questions")
        def create_question(
            user: dict = Depends(get_current_user),
            _: None = Depends(require_permissions(["admin:questions:create"]))
        ):
            ...
    
    Args:
        required_scopes: List of permission scopes required
        
    Returns:
        A dependency function that validates permissions
    """
    async def _check_permissions(user: dict = Depends(get_current_user)) -> None:
        user_scopes = user.get("scopes", [])
        require_scopes(user_scopes, required_scopes)
    
    return _check_permissions


# Convenience type aliases for common use cases
CurrentUser = Annotated[dict, Depends(get_current_user)]
OptionalUser = Annotated[Optional[dict], Depends(get_current_user_optional)]

"""
JWT Authentication utilities for Question Service.

This module handles JWT verification from the User Service using RS256 asymmetric encryption.
The User Service signs tokens with a private key, and this service verifies them using the public key.
"""

import jwt
from typing import Optional, Dict, Any, List
from fastapi import HTTPException, status, Request
from functools import lru_cache
import requests

from .config import settings


class AuthenticationError(HTTPException):
    """Custom authentication error"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Custom authorization error"""
    def __init__(self, detail: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


@lru_cache(maxsize=1)
def get_jwks() -> Dict[str, Any]:
    """
    Fetch JWKS (JSON Web Key Set) from User Service.
    Cached to avoid repeated network calls.
    """
    try:
        jwks_url = f"{settings.USER_SERVICE_URL}/.well-known/jwks.json"
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise AuthenticationError(f"Failed to fetch JWKS from User Service: {str(e)}")


def get_public_key() -> str:
    """
    Extract the public key from JWKS for JWT verification.
    
    For RS256, the JWKS contains the public key components (n, e).
    We can also use the x5c (X.509 certificate chain) if available.
    """
    jwks = get_jwks()
    
    # For simplicity, we'll assume the User Service provides the key in PEM format
    # In the keys array. Adjust based on actual JWKS structure.
    if "keys" in jwks and len(jwks["keys"]) > 0:
        key = jwks["keys"][0]
        if "x5c" in key and len(key["x5c"]) > 0:
            # X.509 certificate format
            cert = key["x5c"][0]
            return f"-----BEGIN CERTIFICATE-----\n{cert}\n-----END CERTIFICATE-----"
        # If using JWK format, you'd need to convert it to PEM
        # For now, we'll handle this in the JWT verification
        return key
    
    raise AuthenticationError("No valid key found in JWKS")


def extract_token_from_request(request: Request) -> Optional[str]:
    """
    Extract JWT token from request.
    
    Checks in order:
    1. Authorization header (Bearer token)
    2. Cookie (access_token) - matches User Service cookie name
    """
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1]
    
    # Check cookies - use 'access_token' to match User Service
    token = request.cookies.get("access_token")
    if token:
        return token
    
    return None


def verify_token(token: str) -> Dict[str, Any]:
    """
    Verify JWT token and return the payload.
    
    Args:
        token: The JWT token string
        
    Returns:
        Decoded token payload containing userId, email, roles, scopes, etc.
        
    Raises:
        AuthenticationError: If token is invalid, expired, or verification fails
    """
    try:
        # For RS256, we need the public key
        # For now, we'll use the JWT secret (HS256) as a fallback
        # In production, this should use RS256 with public key verification
        
        if settings.JWT_ALGORITHM == "RS256":
            # Use public key from JWKS
            public_key = get_public_key()
            payload = jwt.decode(
                token,
                public_key,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_signature": True}
            )
        else:
            # Fallback to HS256 with shared secret (not recommended for production)
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                options={"verify_signature": True}
            )
        
        return payload
    except jwt.ExpiredSignatureError:
        raise AuthenticationError("Token has expired")
    except jwt.InvalidTokenError as e:
        raise AuthenticationError(f"Invalid token: {str(e)}")


def get_current_user_from_token(token: str) -> Dict[str, Any]:
    """
    Get current user information from JWT token.
    
    Returns:
        Dict containing:
        - user_id: The user's unique identifier
        - email: User's email
        - roles: List of role names
        - scopes: List of permission scopes
    """
    payload = verify_token(token)
    
    # Validate required fields
    if "userId" not in payload:
        raise AuthenticationError("Token missing userId claim")
    
    return {
        "user_id": payload["userId"],
        "email": payload.get("email"),
        "roles": payload.get("roles", []),
        "scopes": payload.get("scopes", []),
    }


def check_scopes(user_scopes: List[str], required_scopes: List[str]) -> bool:
    """
    Check if user has all required scopes.
    
    Args:
        user_scopes: List of scopes the user has
        required_scopes: List of scopes required for the operation
        
    Returns:
        True if user has all required scopes, False otherwise
    """
    return all(scope in user_scopes for scope in required_scopes)


def require_scopes(user_scopes: List[str], required_scopes: List[str]) -> None:
    """
    Require that user has all specified scopes.
    
    Args:
        user_scopes: List of scopes the user has
        required_scopes: List of scopes required for the operation
        
    Raises:
        AuthorizationError: If user doesn't have required scopes
    """
    if not check_scopes(user_scopes, required_scopes):
        missing_scopes = [s for s in required_scopes if s not in user_scopes]
        raise AuthorizationError(
            f"Insufficient permissions. Missing scopes: {', '.join(missing_scopes)}"
        )

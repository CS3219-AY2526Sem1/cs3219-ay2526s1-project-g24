# User Service

[![CI](https://github.com/cs3219-ay2526s1-project-g24/cs3219-ay2526s1-project-g24/actions/workflows/ci.yml/badge.svg)](https://github.com/cs3219-ay2526s1-project-g24/cs3219-ay2526s1-project-g24/actions/workflows/ci.yml)

The User Service is a central component responsible for user authentication, authorization, and profile management. It handles user sign-up and sign-in via Google OAuth2 and issues JSON Web Tokens (JWTs) that are used to secure communication across all microservices.

---

## Table of Contents

- [Key Features](#key-features)
- [Authentication Flow & JWT Structure](#authentication-flow--jwt-structure)
- [Security Model](#security-model-inter-service-communication)
- [API Endpoints](#api-endpoints)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

- **Authentication:** Google OAuth2 for secure and easy user sign-on.
- **Authorization:** A robust Role-Based Access Control (RBAC) system built on roles and permissions.
- **JWT Issuance:** Generates JWTs using RS256 asymmetric encryption.
- **JWKS Endpoint:** Exposes a public `/.well-known/jwks.json` endpoint for token verification.
- **User Management:** Provides endpoints for users to manage their own profiles.
- **Admin Capabilities:** Includes endpoints for administrators to manage roles, permissions, and user assignments.

---

## Authentication Flow & JWT Structure

1.  **Google OAuth2:** The user initiates login, is redirected to Google, and upon successful authentication, is sent back to the `/v1/auth/google/callback` endpoint.
2.  **User Provisioning:**
    - If the user is new, a new record is created in the database, and they are assigned the default `user` role.
    - If the user exists, their profile information is retrieved.
3.  **JWT Generation:** A JWT is generated and signed using an RSA private key (RS256). This token contains the following payload:
    ```json
    {
      "userId": "c1a2b3d4-e5f6-...",
      "email": "user@example.com",
      "roles": ["user", "editor"],
      "scopes": ["questions:create", "questions:read", "users:read:self"],
      "iat": 1678886400,
      "exp": 1679491200
    }
    ```
    - `userId`: The unique identifier for the user.
    - `roles`: An array of role names assigned to the user.
    - `scopes`: A consolidated list of all permissions (scopes) granted by the user's roles. This is used by downstream services for authorization checks.

### JWT Claims and Scope Generation

The claims within the JWT are generated dynamically upon user authentication:

1.  **Fetch User Roles:** When a user successfully authenticates, the service queries the database to retrieve the user's profile along with all their assigned roles.
2.  **Aggregate Permissions:** The service then retrieves all permissions associated with each of those roles.
3.  **Build Claims:**
    - The `roles` claim is populated with an array of the names of the user's assigned roles.
    - The `scopes` claim is populated by creating a flat, de-duplicated list of all permission names gathered from all roles.

This process ensures that the JWT contains a self-contained, up-to-date representation of the user's identity and authorizations at the moment they logged in.

---

## Security Model: Inter-Service Communication

To ensure secure communication between microservices, this service uses **asymmetric key cryptography (RS256)** for signing JWTs.

- **Signing:** The User Service signs JWTs with a **private key** that is kept secret and never leaves this service.
- **Verification:** Other services (e.g., Question Service) verify the JWT signature using a corresponding **public key**.

This service exposes a public JWKS (JSON Web Key Set) endpoint at `/.well-known/jwks.json`. Other services fetch the public key from this endpoint to validate tokens without needing access to the private key, providing a secure and scalable authentication mechanism.

---

## API Endpoints

### JWKS (`/.well-known`)

| Method | Endpoint      | Protection | Description                                   |
| ------ | ------------- | ---------- | --------------------------------------------- |
| `GET`  | `/jwks.json`  | None       | Retrieves the JSON Web Key Set (JWKS).        |

### Authentication (`/v1/auth`)

| Method | Endpoint             | Protection | Description                                                                 |
| ------ | -------------------- | ---------- | --------------------------------------------------------------------------- |
| `GET`  | `/google/url`        | None       | Get the URL to redirect the user to for Google authentication.              |
| `GET`  | `/google/callback`   | None       | The callback endpoint for Google to redirect to after authentication.       |
| `POST` | `/logout`            | None       | Clears the authentication cookie.                                           |
| `GET`  | `/session`           | `jwt`      | Retrieves the session information for the currently authenticated user.     |

### User Profile (`/v1/users`)

#### Self-Service Endpoints

| Method  | Endpoint | Protection | Description                                                       |
| ------- | -------- | ---------- | ----------------------------------------------------------------- |
| `GET`   | `/me`    | `jwt`      | Get the profile of the currently authenticated user.              |
| `PATCH` | `/me`    | `jwt`      | Update the profile of the currently authenticated user.           |
| `DELETE`| `/me`    | `jwt`      | Delete the currently authenticated user.                          |

#### Administrative Endpoints

| Method   | Endpoint      | Protection                         | Description                                        |
| -------- | ------------- | ---------------------------------- | -------------------------------------------------- |
| `GET`    | `/{userId}`   | `jwt`, `users:read`                | Get the profile of a specific user by their ID.    |
| `PATCH`  | `/{userId}`   | `jwt`, `admin:users:edit`          | Update the profile of a specific user.             |
| `DELETE` | `/{userId}`   | `jwt`, `admin:users:delete`        | Delete a specific user.                            |

### Administration (Recommended Implementation)

*These endpoints should be protected by a middleware that requires the `admin` role.*

- `GET /`: Get a list of all users.
- `POST /roles`: Create a new role.
- `POST /permissions`: Create a new permission.
- `POST /users/{userId}/roles`: Assign a role to a user.
- `POST /roles/{roleId}/permissions`: Grant a permission to a role.

---

## Getting Started

### Prerequisites

- Node.js
- pnpm
- PostgreSQL Database
- OpenSSL (for key generation)

### Installation & Setup

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```
2.  **Generate RSA Keys:**
    From the root of the monorepo, generate a private and public key pair.
    ```bash
    openssl genpkey -algorithm RSA -out private.pem -pkeyopt rsa_keygen_bits:2048
    openssl rsa -pubout -in private.pem -out public.pem
    ```
    These files are gitignored and should not be committed.

3.  **Set up environment variables:**
    Create a `.env` file in this directory. See the [Environment Variables](#environment-variables) section for the required values. You will need to copy the contents of the generated `.pem` files into the environment variables.

4.  **Run database migrations:**
    ```bash
    pnpm prisma migrate dev
    ```
5.  **Run the development server:**
    ```bash
    pnpm dev
    ```

---

## Environment Variables

Create a `.env` file in the root of this service with the following variables. The RSA keys must be formatted as a single line with `\n` as newline characters.

```bash
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/mydatabase"

# Google OAuth2 credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:8000/v1/auth/google/callback"

# JWT settings (RS256)
RSA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIC/A...=\n-----END PRIVATE KEY-----"
RSA_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\nMIIB...=\n-----END PUBLIC KEY-----"

# Application settings
PORT=8000
```

---

## Running Tests

To run the test suite, use the following command:

```bash
pnpm test
```

---

## Implementing JWT Verification in Other Services

Each microservice must protect its endpoints by adding middleware that validates incoming JWTs issued by this service.

**JWKS Endpoint:**
The public keys are available at the following standard URL. Services should use the internal Docker network hostname to connect.
-   `http://user_service:8001/.well-known/jwks.json`

---

#### **1. For Node.js / Express Services (e.g., `api` service)**

Use the `express-jwt` and `jwks-rsa` libraries to handle token validation automatically.

**A. Add Dependencies:**
```bash
# From the project root
pnpm --filter api add express-jwt jwks-rsa
```

**B. Implement the Middleware:**

Create a middleware function that you can add to your Express routes.

```typescript
// In a middleware file, e.g., apps/api/src/middleware/auth.ts
import { expressjwt, GetVerificationKey } from 'express-jwt';
import jwksRsa from 'jwks-rsa';

export const checkJwt = expressjwt({
  // Dynamically provide a signing key based on the kid in the header
  // and the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    // Use the internal Docker hostname for the user_service
    jwksUri: `http://user_service:8001/.well-known/jwks.json`
  }) as GetVerificationKey,

  // Validate the audience and the issuer.
  // These should be configured in the user_service when the token is generated
  // audience: 'my-api',
  // issuer: `http://user_service:8001/`,
  algorithms: ['RS256']
});

// You can then protect your routes like this:
// import { checkJwt } from './middleware/auth';
// app.get('/protected', checkJwt, (req, res) => { ... });
```

---

#### **2. For Python / FastAPI Services (e.g., `question_service`)**

Use the `python-jose` library, which has built-in support for fetching keys from a JWKS endpoint.

**A. Add Dependencies:**
```bash
# In apps/question_service
poetry add "python-jose[cryptography]"
```

**B. Implement the Validation Dependency:**

Create a dependency that can be used to protect your FastAPI endpoints.

```python
# In a new file, e.g., apps/question_service/app/core/auth.py
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import requests
from jose import jwt
from jose.exceptions import JOSEError

# This will look for the 'Authorization: Bearer <token>' header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# The internal URL for the user_service's JWKS endpoint
JWKS_URL = "http://user_service:8001/.well-known/jwks.json"

# Fetch the JWKS keys once and cache them
try:
    jwks = requests.get(JWKS_URL).json()
except requests.exceptions.RequestException as e:
    # This is a fatal error on startup if the user_service is not available
    print(f"Could not fetch JWKS: {e}")
    jwks = {"keys": []}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    unverified_header = jwt.get_unverified_header(token)
    rsa_key = {}
    for key in jwks["keys"]:
        if key["kid"] == unverified_header["kid"]:
            rsa_key = {
                "kty": key["kty"],
                "kid": key["kid"],
                "use": key["use"],
                "n": key["n"],
                "e": key["e"]
            }
    if not rsa_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to find a matching key in JWKS",
        )

    try:
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            # Add audience and issuer validation if they are set in the token
            # audience="my-api",
            # issuer="http://user_service:8001/"
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except JOSEError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Unable to decode token: {e}",
        )

```

**C. Protect Endpoints:**

Use the `get_current_user` dependency in your routers.

```python
# In a router file, e.g., apps/question_service/app/questions/router.py
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user

router = APIRouter()

@router.post("/questions")
def create_new_question(question_data: dict, user_payload: dict = Depends(get_current_user)):
    # If this point is reached, the token is valid.
    # The user's claims are in the user_payload dictionary.
    user_id = user_payload.get("sub") # Standard claim for user ID
    
    # Example authorization check:
    # if "questions:create" not in user_payload.get("scopes", []):
    #     raise HTTPException(status_code=403, detail="Insufficient permissions")
    
    # ... proceed with creating the question
    return {"status": "success", "user_id": user_id}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

## License

This project is licensed under the terms of the [LICENSE](./LICENSE) file.

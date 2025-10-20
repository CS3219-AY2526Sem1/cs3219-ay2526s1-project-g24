[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/QUdQy4ix)
# CS3219 Project (PeerPrep) - AY2526S1
## Group: Gxx
---
## Overview
PeerPrep is a technical interview preparation and peer-matching platform where users can practice coding interview questions together in real time.  
It is built using a **microservices architecture**, where each service runs independently and communicates through internal APIs.
---
## Architecture
| Service | Description |
|----------|-------------|
| User Service | Manages user accounts and authentication |
| Matching Service | Matches users based on chosen topic and difficulty |
| Question Service | Stores and retrieves coding questions |
| Collaboration Service | Enables real-time collaborative coding sessions |
| Frontend | Provides the user interface for accessing PeerPrep |
Each microservice is located in its own folder within this repository.
---
## Cross-Service Authentication (JWT)

Authentication is handled centrally by the `user_service`, which issues JSON Web Tokens (JWTs) upon successful user login. These tokens are then used to authenticate requests to other microservices within the PeerPrep ecosystem.

### Authentication Flow

1.  **Login**: A user logs in via the `user_service` (e.g., through a Google OAuth2 flow).
2.  **Token Issuance**: Upon successful authentication, the `user_service` generates a JWT and returns it to the client.
3.  **Authenticated Requests**: When the client makes a request to any microservice (e.g., `question_service`), it includes the JWT in the `Authorization` header as a bearer token.
4.  **Token Validation**: The receiving service is responsible for validating the JWT to authenticate the request.

### JWT Payload Structure

The JWT payload contains essential user information that other services can use for authorization and context:

```json
{
  "userId": "cuid298e7d6s5f4g3h2j1k0l",
  "email": "user@example.com",
  "roles": ["user", "premium_member"],
  "scopes": ["questions:read", "questions:create", "users:read:self"],
  "iat": 1678886400,
  "exp": 1679491200
}
```

-   `userId`: The unique identifier for the user.
-   `roles`: A list of roles assigned to the user (e.g., `admin`, `user`).
-   `scopes`: A list of specific permissions the user has (e.g., `questions:delete`).

### Implementing JWT Validation in Other Services

To validate a JWT, a service needs access to the public key corresponding to the private key used by the `user_service` to sign the tokens.

**1. JWKS Endpoint**

The `user_service` exposes a JSON Web Key Set (JWKS) endpoint at `/.well-known/jwks.json`. This endpoint contains the public key that other services can use to verify the signature of the JWT.

**2. Validation Logic (Example for `question_service`)**

The `question_service` (built with FastAPI) can implement a dependency to verify the token and extract the user's identity.

First, add `python-jose` to the service's dependencies:

```bash
# In apps/question_service
poetry add python-jose
```

Next, create an authentication utility:

```python
# In apps/question_service/app/core/auth.py
from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import requests

# This scheme will look for the 'Authorization' header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

USER_SERVICE_JWKS_URL = "http://user_service:8001/.well-known/jwks.json"

class User(BaseModel):
    id: str
    email: str
    roles: list[str]
    scopes: list[str]

def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        jwks = requests.get(USER_SERVICE_JWKS_URL).json()
        unverified_header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks["keys"]:
            if key["kid"] == unverified_header["kid"]:
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"],
                }
        if rsa_key:
            payload = jwt.decode(
                token, rsa_key, algorithms=["RS256"], audience="urn:example:audience", issuer="urn:example:issuer"
            )
            user_data = {"id": payload["userId"], **payload}
            return User(**user_data)

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
    )

```

Finally, protect endpoints with this dependency:

```python
# In a router file, e.g., apps/question_service/app/questions/router.py
from fastapi import APIRouter, Depends
from app.core.auth import get_current_user, User

router = APIRouter()

@router.post("/questions")
def create_new_question(question_data: dict, current_user: User = Depends(get_current_user)):
    # The request is authenticated if this point is reached.
    # You can now use current_user for authorization.
    if "questions:create" not in current_user.scopes:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )
    # ... proceed with creating the question
```

This approach allows any service to independently and securely verify a user's identity and permissions without needing to make a synchronous call back to the `user_service` for every request.

## Setup Instructions
### 1. Clone the repository
git clone https://github.com/CS3219-AY2526S1/cs3219-ay2526s1-project-Gxx.git
cd cs3219-ay2526s1-project-Gxx

### 2. Environment Variables
Create a single .env file in the project root directory containing all environment variables for all services.
For now, only the Question Service requires an environment variable:

# .env
QUESTION_DB_PASSWORD={whatever password you want}

As the other services are completed, additional environment variables will be added to this file.
Each team member should document the required variables for their service in its README or setup notes.
Important: Do not commit the .env file to the repository. It should be ignored in .gitignore.

### 3. Running the project locally
This project uses a two-file Docker Compose setup for flexibility between environments.
- `docker-compose.yml`: The base configuration, defines all services, networks, and volumes.
- `docker-compose.local.yml`: An override file for local development that tells Docker Compose to build service images from local source code.

To build and start all services for local development, run the following command:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build
```
This command merges the two configuration files, builds the images, and starts the containers in detached mode.

### 4. Port Mappings
The following ports are used by the services on `localhost`:

| Service | Port | URL |
| :--- | :--- | :--- |
| `question_service` | `8000` | http://localhost:8000 |
| `user_service` | `8001` | http://localhost:8001 |
| `question_db` | `5434` | (for direct DB access) |
| `user_db` | `5433` | (for direct DB access) |

Please ensure these ports are not in use by other applications on your machine.

### 5. Stopping the project
To stop and remove all containers, networks, and volumes created by the local setup:
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml down -v
```

### 6. Verifying services
Check that all containers are running:
```bash
docker ps
```
View logs for a specific service (for example, the Question Service):
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml logs question-service
```
If a frontend service is available, it can be accessed at:

http://localhost:<frontend-port>

## Development Notes
Each microservice can be built, tested, and run independently.
Environment variables for each service should be clearly documented by the developer responsible for that service.
When making code changes, you can rebuild a specific service by running the `up` command again with the `--build` flag.
```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build <service-name>
```

## Note
Each team member is responsible for developing their assigned microservice within its own folder.
The teaching team must have access to this repository as they may need to review commit history for grading or dispute resolution.
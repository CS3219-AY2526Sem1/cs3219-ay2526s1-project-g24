# User Service

The User Service is a central component responsible for user authentication, authorization, and profile management. It handles user sign-up and sign-in via Google OAuth2 and issues JSON Web Tokens (JWTs) that are used to secure communication across all microservices.

---

## Key Features

- **Authentication:** Google OAuth2 for secure and easy user sign-on.
- **Authorization:** A robust Role-Based Access Control (RBAC) system built on roles and permissions.
- **JWT Issuance:** Generates JWTs containing user identity, roles, and permission scopes.
- **User Management:** Provides endpoints for users to manage their own profiles.
- **Admin Capabilities:** Includes endpoints for administrators to manage roles, permissions, and user assignments.

---

## Authentication Flow & JWT Structure

1.  **Google OAuth2:** The user initiates login, is redirected to Google, and upon successful authentication, is sent back to the `/v1/auth/google/callback` endpoint.
2.  **User Provisioning:**
    - If the user is new, a new record is created in the database, and they are assigned the default `user` role.
    - If the user exists, their profile information is retrieved.
3.  **JWT Generation:** A JWT is generated and signed. This token contains the following payload:
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
    - The `scopes` claim is populated by creating a flat, de-duplicated list of all permission names gathered from all roles. This ensures that even if multiple roles grant the same permission, it only appears once in the token.

This process ensures that the JWT contains a self-contained, up-to-date representation of the user's identity and authorizations at the moment they logged in.

---

## Security Model: Inter-Service Communication

To ensure secure communication between microservices, this service should be configured to use **asymmetric key cryptography (RS256)** for signing JWTs.

- **Signing:** The User Service signs JWTs with a **private key** that is kept secret and never leaves this service.
- **Verification:** Other services (e.g., Question Service) verify the JWT signature using a corresponding **public key**.

This service must expose a public JWKS (JSON Web Key Set) endpoint (e.g., `/.well-known/jwks.json`). Other services will fetch the public key from this endpoint to validate tokens without needing access to the private key, providing a secure and scalable authentication mechanism.

---

## API Endpoints

### Authentication (`/v1/auth`)

- `GET /google/url`: Get the URL to redirect the user to for Google authentication.
- `GET /google/callback`: The callback endpoint for Google to redirect to after authentication. Handles user creation and issues a JWT.
- `POST /logout`: Clears the authentication cookie.
- `GET /session`: (`@Security('jwt')`) Retrieves the session information for the currently authenticated user.

### User Profile (`/v1/users`)

#### Self-Service Endpoints
- `GET /me`: (`@Security('jwt')`) Get the profile of the currently authenticated user.
- `PATCH /me`: (`@Security('jwt')`) Update the profile of the currently authenticated user.
- `DELETE /me`: (`@Security('jwt')`) Delete the currently authenticated user.

#### Administrative Endpoints
- `GET /{userId}`: (`@Security('jwt', ['users:read'])`) Get the profile of a specific user by their ID.
- `PATCH /{userId}`: (`@Security('jwt', ['admin:users:edit'])`) Update the profile of a specific user.
- `DELETE /{userId}`: (`@Security('jwt', ['admin:users:delete'])`) Delete a specific user.

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

### Installation & Setup

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```
2.  **Set up environment variables:**
    Create a `.env` file in this directory and populate it with the required variables (e.g., `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`).
3.  **Run database migrations:**
    ```bash
    pnpm prisma migrate dev
    ```
4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

### Running Tests

To run the test suite, use the following command:

```bash
pnpm test
```
# Milestone 1 Review: User Service Summary

This document provides a comprehensive overview of the `user_service` for the upcoming milestone review.

## 1. Core Responsibilities

The **User Service** is the centralized authority for identity and access management within the microservices architecture. Its primary responsibilities are:

-   **User Authentication:** Manages user sign-up and sign-in exclusively through **Google OAuth2**, providing a secure and streamlined user experience.
-   **User Authorization:** Implements a robust **Role-Based Access Control (RBAC)** system to manage user permissions.
-   **Profile Management:** Provides API endpoints for users to manage their own profiles and for administrators to manage all users.
-   **Token Issuance:** Generates and manages JSON Web Tokens (JWTs) used to secure all inter-service communication.

## 2. Technology Stack

-   **Language/Framework:** TypeScript with Node.js and Express.js.
-   **Database:** PostgreSQL.
-   **ORM:** Prisma for database access, migrations, and schema management.
-   **API Specification:** TSOA for generating OpenAPI (Swagger) specifications and Express routes from TypeScript controllers.
-   **Authentication:** `jose` library for JWT/JWKS operations (RS256 asymmetric encryption).
-   **Testing:** `vitest` for unit and integration testing, with `Testcontainers` for creating isolated database environments.
-   **Containerization:** Dockerized for consistent development and production environments.

## 3. Key Features & Implementation Details

### 3.1. Authentication Flow

The service implements a secure and modern authentication flow:

1.  **Google OAuth2:** The user is redirected to Google for authentication.
2.  **Callback & User Provisioning:** Upon successful login, Google redirects to a callback endpoint.
    -   If the user is new, a record is created in the database and assigned the default `user` role.
    -   If the user exists, their data is retrieved.
3.  **Token Generation:** The service generates two tokens and sends them to the client as secure, `HttpOnly` cookies:
    -   **Access Token:** A short-lived JWT (15 mins) containing the user's ID, roles, and permissions (`scopes`).
    -   **Refresh Token:** A long-lived token (7 days) used to obtain a new access token.
4.  **Refresh Token Rotation & Reuse Detection:** To enhance security, the service uses a token rotation strategy.
    -   Each refresh token belongs to a "family" and can only be used once.
    -   When a refresh token is used, it is marked as invalid, and a *new* refresh token is issued alongside a new access token.
    -   If an attempt is made to reuse an old refresh token, the system detects this as a potential token theft, revokes the entire token family, and forces the user to log in again.

### 3.2. Authorization Model (RBAC)

The authorization model is built on a flexible RBAC system defined in the Prisma schema:

-   **Users:** Can be assigned multiple roles.
-   **Roles:** (e.g., `admin`, `user`) Groupings of permissions.
-   **Permissions:** Granular actions (e.g., `admin:users:edit`, `users:read:self`).

When a user logs in, their assigned roles are fetched, and all associated permissions are aggregated and embedded into the `scopes` claim of the JWT. This makes the JWT a self-contained proof of the user's identity and authorizations.

### 3.3. Security for Inter-Service Communication

The service uses the **JWKS (JSON Web Key Set)** pattern to enable other microservices to verify JWTs securely and independently.

-   **Asymmetric Encryption (RS256):** JWTs are signed with a **private key** that *never* leaves the User Service.
-   **Public JWKS Endpoint:** The service exposes a public endpoint at `/.well-known/jwks.json` containing the corresponding **public key**.
-   **Verification:** Other services fetch the public key from the JWKS endpoint to verify the signature of incoming JWTs without needing any shared secret. This is a scalable and secure industry standard.

## 4. Database Schema

The database schema is managed by Prisma and consists of three main parts:

1.  **User Table (`users`):** Stores core user profile information like email, display name, and Google ID.
2.  **RBAC Tables (`roles`, `permissions`, `user_roles`, `role_permissions`):** Define the many-to-many relationships between users, roles, and permissions.
3.  **Refresh Token Tables (`refresh_token_families`, `refresh_tokens`):** Support the secure token rotation mechanism.

This design is normalized and uses foreign key constraints with cascading deletes to ensure data integrity.

## 5. API Endpoints

The API is structured into logical controllers:

-   `/.well-known/jwks.json`: The public JWKS endpoint.
-   `/v1/auth`: Handles Google OAuth flow, token refresh, and logout.
-   `/v1/users`: Provides self-service endpoints (`/me`) for users to manage their own profiles.
-   `/v1/admin`: Provides administrative endpoints for managing users, roles, and permissions, protected by `admin` role permissions.

## 6. Testing Strategy

The service has a robust testing suite to ensure reliability:

-   **Unit Tests:** Controller and service logic is tested in isolation using `vitest` with mocked dependencies (e.g., Prisma client, `jose` library).
-   **Integration Tests:**
    -   Use **Testcontainers** to spin up a real, ephemeral PostgreSQL database for each test run.
    -   Prisma migrations are applied to the test database to ensure the schema is accurate.
    -   API endpoints are tested end-to-end by making real HTTP requests to the server.
    -   A sophisticated JWT mocking strategy using `vi.doMock` and dynamic imports is employed to reliably test token verification logic without depending on a live JWKS endpoint.

This comprehensive approach ensures that individual components work as expected and that the service integrates correctly with the database and its own authentication middleware.
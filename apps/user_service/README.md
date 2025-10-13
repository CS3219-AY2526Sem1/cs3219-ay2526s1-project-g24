# UserService Implementation Plan

This document outlines the flow for creating the `UserService`, incorporating a detailed DBML schema with a full Role-Based Access Control (RBAC) system.

---

### Phase 1: Project Scaffolding (No Change)

This phase is identical to the previous plan. Your goal is to get the basic service running within the monorepo.

1.  **Create Service Directory:** `apps/user_service`.
2.  **Initialize Project:** `pnpm init`, add `express`, `typescript`, etc.
3.  **Configure TypeScript:** Create `tsconfig.json`.
4.  **Create Basic Server:** Set up `src/index.ts` with a running Express server and a `/-/health` endpoint.
5.  **Add Run Scripts:** Add `dev`, `build`, `start` scripts to `package.json`.

---

### Phase 2: Database Schema & Integration (Updated)

This phase is where we'll incorporate your new schema.

1.  **Generate and Save SQL Schema:**
    *   First, we need to convert your DBML into valid PostgreSQL. I will do this for you and update the `test.sql` file. This will include creating the custom `proficiency_level` type and all five tables (`users`, `roles`, `permissions`, `user_roles`, `role_permissions`) with the correct constraints and relationships.

2.  **Set up Prisma:**
    *   Add Prisma and the PostgreSQL driver: `pnpm add @prisma/client pg` and `pnpm add -D prisma`.
    *   Initialize Prisma: `pnpm prisma init --datasource-provider postgresql`.

3.  **Sync Prisma Schema with Database:**
    *   After you run the new `test.sql` script on your database to create the tables, you can use Prisma's introspection feature to automatically generate the Prisma schema models for you.
    *   Run `pnpm prisma db pull`.
    *   This will inspect your database and create the corresponding `model User`, `model Role`, etc., in your `prisma/schema.prisma` file. This is much faster and less error-prone than writing them by hand.

---

### Phase 3: API Implementation with RBAC (Updated)

The API endpoints are the same, but their internal logic will be more sophisticated.

1.  **Health & Observability Endpoints:**
    *   `GET /-/health`, `GET /-/ready`, `GET /-/metrics` (No change).

2.  **Authentication Endpoints (`/v1/auth/*`):**
    *   The flow for Google OAuth and issuing JWTs remains the same.
    *   **Crucial Update:** When a new user is created via the `/auth/google/callback` endpoint, you must now also **assign them the default 'user' role**. This involves creating an entry in the `user_roles` table linking the new `user.id` to the `role.id` for 'user'.

3.  **User Profile Endpoints (`/v1/users/me`):**
    *   The `GET` and `PATCH` endpoints must now handle the new fields: `username`, `display_name`, `description`, and `programming_proficiency`.
    *   For the `PATCH` endpoint, you must add validation logic:
        *   Ensure `username` is not already taken by another user.
        *   Ensure `programming_proficiency` is one of the allowed enum values ('beginner', 'intermediate', 'advanced').

4.  **Authorization Middleware (New & Important):**
    *   This is the core of your new RBAC system. You should create a generic middleware function.
    *   **Name:** `checkPermission(permissionName: string)`
    *   **Logic:**
        1.  It will extract the `userId` from the JWT token.
        2.  It will perform a database query to see if any of the user's assigned roles have the required `permissionName`. The query will look something like this:
            *   *Find user's roles in `user_roles` -> Find those roles' permissions in `role_permissions` -> Check if `permissionName` is in that list.*
        3.  If the user has the permission, call `next()` to proceed to the route handler.
        4.  If not, respond with a `403 Forbidden` error.
    *   You can then protect routes in other services like this: `router.post('/admin/questions', checkPermission('questions:create'), ...)`.

---

### Phase 4: Containerization & Testing (Updated)

1.  **Containerization:**
    *   The `Dockerfile` and `docker-compose.yml` setup remains the same.

2.  **Testing:**
    *   Your unit and integration tests must be expanded to cover the new logic:
        *   Test that profile updates with the new fields work correctly.
        *   **Write specific tests for RBAC:**
            *   A test to prove a user *with* a permission (e.g., 'admin') can access a protected route.
            *   A test to prove a user *without* that permission (e.g., a standard 'user') is correctly blocked with a 403 error.

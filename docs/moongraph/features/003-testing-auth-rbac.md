# Moongraph: Testing Plan for Authentication & Initial RBAC

## 1. Overview

**Date:** October 26, 2023 (Note: Use current date when generating)
**Status:** Proposed

This document outlines the testing plan for the newly implemented authentication flow (Auth0 integration, JWT verification, user provisioning) and the initial, simplified Role-Based Access Control (RBAC) setup in Morphik Core. The goal is to ensure these foundational components are working correctly before building more complex features on top.

**Prerequisites for Testing:**

1.  **Morphik Core Backend Running:** The FastAPI development server for `morphik-core` must be running.
2.  **PostgreSQL Database:** The PostgreSQL server must be running and accessible to Morphik Core. The `initialize()` method in `PostgresDatabase` should have successfully run, creating all tables (including `users`, `teams`, `permissions`, `roles`, `role_permissions`, etc.) and seeding initial RBAC data (`_seed_initial_rbac_data`).
3.  **Auth0 Application Configured:** An Auth0 SPA application must be configured with appropriate callback URLs for your frontend.
4.  **Frontend Application (Moongraph Next.js):**
    *   Configured with the correct Auth0 Client ID, Domain.
    *   Configured to request an access token with the `audience` matching `AUTH0_API_IDENTIFIER` set in `morphik-core/core/config.py`.
    *   Configured to send API requests to the local Morphik Core dev server URL (e.g., `http://localhost:8000/` or `http://localhost:8000/api/v1/...` depending on your Morphik Core API structure).
    *   Capable of making authenticated API calls by including the Auth0 access token in the `Authorization: Bearer <token>` header.
5.  **Tools:**
    *   Web browser with developer tools (for frontend interaction and network request inspection).
    *   Database GUI tool (e.g., DBeaver, pgAdmin) to inspect the PostgreSQL database directly.
    *   Access to Morphik Core backend logs (console output and `morphik-core/logs/morphik.log`).
    *   (Optional) API testing tool like Postman or Insomnia for direct backend API calls.

## 2. Testable Components & Scenarios

### 2.1. Authentication Flow & User Provisioning

**Objective:** Verify that users can authenticate via Auth0, and their identities are correctly provisioned and recognized in the Morphik Core backend.

*   **Test Scenario 1: New User Login & Provisioning**
    *   **Action:** Using the frontend, perform a login/signup with a **new Auth0 user** (one that has never logged into Moongraph before).
    *   **Expected Backend Behavior:**
        1.  `verify_token` in `auth_utils.py` is invoked.
        2.  Auth0 JWT is successfully validated (check logs for success messages).
        3.  `_get_or_create_db_user` calls `db.fetch_user_by_auth0_id()`; it should return `None` (user not found - check logs).
        4.  `_get_or_create_db_user` then calls `db.create_user_from_auth0_data()`.
        5.  **Verification:** Check the `users` table in PostgreSQL. A new row for the user should exist, populated with `auth0_user_id`, `email`, `name`, and `avatar_url` from the Auth0 token. `id`, `created_at`, `updated_at` should be auto-generated.
        6.  `AuthContext` object is created containing the new internal `user_id`, `auth0_user_id`, `email`, and the static test permissions (`{"read", "write"}`).
    *   **Expected Frontend/API Response:** The API call made by the frontend after login should succeed (e.g., 200 OK). If calling a test endpoint that returns `AuthContext` details, verify them.

*   **Test Scenario 2: Existing User Login**
    *   **Action:** Using the frontend, the same user from Scenario 1 logs out and logs back in.
    *   **Expected Backend Behavior:**
        1.  `verify_token` invoked, Auth0 JWT validated.
        2.  `_get_or_create_db_user` calls `db.fetch_user_by_auth0_id()`; it should now find the user and return their record (check logs).
        3.  `db.create_user_from_auth0_data()` should **not** be called.
        4.  `AuthContext` created with the existing user's details.
    *   **Expected Frontend/API Response:** Successful API call (200 OK). `AuthContext` details should match the existing user.

*   **Test Scenario 3: Accessing Protected Endpoint - No Token**
    *   **Action:** Attempt to call a protected Morphik Core API endpoint directly (e.g., using `curl` or Postman) *without* providing an `Authorization` header.
    *   **Expected Backend/API Response:** The API should return a `401 Unauthorized` (or potentially 403 if FastAPI handles it differently before `verify_token` is fully engaged for a missing header in some configurations, but 401 is expected from `verify_token` logic).

*   **Test Scenario 4: Accessing Protected Endpoint - Invalid/Expired Token**
    *   **Action:** Attempt to call a protected API endpoint with:
        *   An expired Auth0 token.
        *   A malformed/tampered token.
        *   A token issued for a different `audience`.
    *   **Expected Backend/API Response:** The API should return a `401 Unauthorized` error. Check backend logs for specific JWT validation error messages (e.g., "Token has expired", "Incorrect audience").

### 2.2. Initial RBAC Setup (Data Seeding)

**Objective:** Verify that the basic roles and permissions are seeded into the database.

*   **Test Scenario 5: Verify Seeded RBAC Data**
    *   **Action:** After the Morphik Core application has initialized (and `_seed_initial_rbac_data()` has run).
    *   **Verification:** Using a database GUI tool:
        1.  Inspect the `permissions` table. It should contain entries for "folder:read", "folder:write", and "folder:admin".
        2.  Inspect the `roles` table. It should contain entries for "FolderViewer", "FolderEditor", and "FolderAdmin" (with `scope='folder'` and `is_system_role=True`).
        3.  Inspect the `role_permissions` table. It should contain the correct mappings:
            *   FolderViewer -> folder:read
            *   FolderEditor -> folder:read, folder:write
            *   FolderAdmin -> folder:read, folder:write, folder:admin

### 2.3. Basic Authorization Checks (Current State)

**Objective:** Verify the placeholder authorization logic and the initial resource-specific permission checking capability.

*   **Test Scenario 6: Static Permissions in `AuthContext`**
    *   **Action:** Create a simple test API endpoint in `morphik-core/core/api.py` that depends on `verify_token` and inspects `auth.permissions` (as per the first example in `authentication.md`, section 6.3.1).
        ```python
        # @app.get("/test/simple-auth-context")
        # async def simple_auth_context_check(auth: AuthContext = Depends(verify_token)):
        #     return {
        #         "user_id": auth.user_id,
        #         "email": auth.email,
        #         "auth0_user_id": auth.auth0_user_id,
        #         "permissions_in_context": list(auth.permissions)
        #     }
        ```
    *   Call this endpoint with a valid token from an authenticated user.
    *   **Expected API Response:** A 200 OK response containing the user's details and `permissions_in_context` should include `["read", "write"]` (or similar, based on the static assignment in `_get_or_create_db_user`).

*   **Test Scenario 7: Resource-Specific Permission Check (Simulated)**
    *   **Objective:** This tests the `db.get_user_permissions_for_folder` method's logic, but requires manual setup as API endpoints for assigning folder roles don't exist yet.
    *   **Manual Setup:**
        1.  Ensure a user (UserA) and a folder (FolderX) exist in the database.
        2.  Ensure the "FolderViewer" role and "folder:read" permission exist (from seeding).
        3.  Manually insert a record into `user_folder_roles` assigning UserA the "FolderViewer" role for FolderX. (Use DB GUI or `psql`).
    *   **Action:** Create a temporary test API endpoint (like the `view_folder_details` example in `authentication.md`, section 6.3.1) that takes a `folder_id`, calls `db.get_user_permissions_for_folder()`, and checks for "folder:read".
    *   Call this endpoint as UserA for FolderX.
    *   **Expected API Response:** 200 OK. The endpoint should confirm "folder:read" permission was found.
    *   **Further Manual Test:** Remove the "folder:read" permission from the "FolderViewer" role (or assign a role without it) and re-test. The endpoint should now return a 403 Forbidden.
    *   **Note:** This scenario is more of an integration test of the DB method. Full end-to-end testing requires folder-sharing APIs.

## 3. Logging and Troubleshooting

*   Monitor Morphik Core backend console output for logs.
*   Check the log file at `morphik-core/logs/morphik.log`.
*   Set `LOG_LEVEL=DEBUG` environment variable when running Morphik Core for more verbose output if needed.
*   Use browser developer tools to inspect network requests and responses between the frontend and backend, especially the `Authorization` header and any error messages.

## 4. Next Steps After Testing

*   Address any issues found during these tests.
*   Proceed to implement API endpoints for managing RBAC assignments (e.g., assigning roles to users for folders).
*   Expand the permission checking logic (`get_user_permissions_for_folder` or a new authorization dependency) to be comprehensive (include team roles, visibility, etc.).
*   Refactor existing access control logic (that uses the old `folders.access_control` JSONB field) to use the new RBAC system. 
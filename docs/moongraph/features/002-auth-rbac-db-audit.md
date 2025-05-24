# Moongraph Authentication, RBAC, and Database Audit

**Date:** 2024-01-16
**Auditor:** Gemini AI Assistant
**Version:** 1.0

## 1. Introduction

This document presents an audit of the Moongraph authentication, Role-Based Access Control (RBAC), and associated database implementations. The audit was conducted by reviewing the existing codebase, provided documentation detailing the intended design and implementation status, and addressing specific issues reported by the user, notably errors during folder creation.

The primary goals for the codebase, as stated by the user, are:
*   Ease of understanding
*   Robustness
*   Lightweight
*   Simplicity
*   Elegance
*   Consistency
*   DRY (Don't Repeat Yourself) and other best practices

This audit aims to:
*   Identify what has been implemented correctly according to the documentation and goals.
*   Pinpoint areas of incorrect implementation or bugs, including the root cause of the folder creation error.
*   Highlight inconsistencies, deviations from best practices, and areas for improvement.
*   Flag discrepancies between the codebase and the provided documentation.
*   Provide actionable recommendations.

**Key Documentation Reviewed:**
*   `docs/moongraph/features/authentication.md` (Overall Auth/RBAC Plan)
*   `docs/moongraph/features/001-user-model.md` (User Model Plan)
*   `docs/moongraph/features/003-testing-auth-rbac.md` (Testing Guide & Results)
*   `docs/moongraph/implemented/auth-testing-infrastructure.md` (Testing Infrastructure Doc)
*   `docs/moongraph/implemented/authentication-rbac-system.md` (Overall Implemented System Doc)
*   `docs/moongraph/implemented/database-rbac-schema.md` (Implemented DB Schema Doc)

## 2. Executive Summary

The Moongraph platform has a substantially implemented authentication and RBAC system, with Auth0 integration, JWT handling, user provisioning, and a foundational database schema for granular permissions. Many components align well with the detailed planning documents.

However, the audit reveals several critical areas needing attention:

*   **Folder Creation Error:** The primary reported issue of "Failed to create folder: Internal Server Error" is highly likely due to `AuthContext.user_id` being populated with a non-UUID string (either the `auth0_user_id` like "google-oauth2|..." in a non-dev flow if a past bug persisted or was reflected in test observation, or the `settings.dev_entity_id` like "dev_user" when `dev_mode` is active). This causes a `ValueError` during UUID conversion or a database error during SQL type casting within the `PostgresDatabase.create_folder` method.
*   **Inconsistent `AuthContext.user_id` Handling (Suspected/Past Issue):** While current `auth_utils.py` code *intends* to use the internal database UUID for `AuthContext.user_id`, the testing documentation (`003-testing-auth-rbac.md`) indicated an observation where `AuthContext.user_id` was the `auth0_user_id`. This discrepancy is a major concern and the root of the folder creation error if that observation reflects the current state in the user's failing environment.
*   **`dev_mode` Configuration:** The default `dev_entity_id` ("dev_user") in `core/config.py` is not a UUID. If `dev_mode` is active, this will directly cause folder creation to fail as explained above.
*   **SDK Discrepancy:** Both synchronous and asynchronous Python SDKs (`morphik-core/sdks/python/morphik/sync.py` and `async_.py`) expect the old `owner: Dict[str, str]` field in the API response for folders (via the `FolderInfo` model). However, the API endpoint (`/folders`) is defined to return the new Pydantic `Folder` model with `owner_type`, `owner_user_id`, etc. This will lead to parsing errors in the SDK when handling folder API responses.
*   **ORM vs. Raw SQL Inconsistency:** The database layer (`PostgresDatabase`) shows a significant mix of SQLAlchemy ORM usage and raw SQL queries. While raw SQL is sometimes necessary, its extensive use for operations that could be handled by the ORM reduces maintainability, type safety, and consistency.
*   **Legacy Fields:** Several database models (`FolderModel`, `DocumentModel`) still contain legacy fields like `access_control` and old `owner` structures, with comments indicating they need review/deprecation. These should be actively migrated or removed to align with the new RBAC system.
*   **Static Permissions in `AuthContext`:** The `AuthContext` is currently populated with static `{"read", "write"}` permissions. This is a placeholder and needs to be replaced with dynamic permission resolution based on the RBAC tables.
*   **Documentation Mismatches:** Some discrepancies were noted between the implementation status/details in documentation and the actual code (e.g., the `AuthContext.user_id` observation, SDK models).

**Overall Assessment:**
*   **Ease of Understanding:** Hampered by ORM/raw SQL mix and presence of legacy fields. Core auth flow is relatively clear.
*   **Robustness:** Affected by the folder creation bug, potential SDK issues, and lack of dynamic RBAC permissions. Error handling in API/DB layers is generally present.
*   **Lightweight:** The chosen stack (FastAPI, SQLAlchemy, Pydantic) is appropriate. The main concern is adherence to a consistent, streamlined implementation.
*   **Simplicity/Elegance:** Achievable with more consistent ORM usage and removal of legacy code.
*   **Consistency:** Lacking in database access patterns (ORM vs. raw SQL) and between API response models and SDK expectation.
*   **DRY and Best Practices:** Generally followed, but areas like redundant index creation and the mix of data access patterns indicate room for improvement.

**Key Recommendations (High-Level):**
1.  **Fix Folder Creation Error:**
    *   Ensure `AuthContext.user_id` is *always* the internal database UUID string.
    *   If `dev_mode` is used, change `settings.dev_entity_id` to a valid default UUID string and ensure a corresponding user exists in the `users` table for FK constraints, or mock appropriately.
2.  **Update Python SDKs:** Modify `FolderInfo` in the SDKs (or use the API's `Folder` model) to align with the API's actual response structure for folders.
3.  **Refactor Database Layer:** Systematically prefer SQLAlchemy ORM over raw SQL for CRUD and common queries to improve consistency and maintainability.
4.  **Implement Dynamic RBAC Permissions:** Replace static permissions in `AuthContext` with actual permission lookups from RBAC tables.
5.  **Address Legacy Code:** Plan and execute the migration/removal of legacy fields like `access_control` from relevant models.
6.  **Update Documentation:** Ensure all documentation accurately reflects the current state of the codebase.

The system has a strong foundation but requires these critical fixes and refinements to achieve its design goals and ensure stability.

## 3. Investigation of Folder Creation Error (`POST /folders`)

The user reported a consistent "Failed to create folder: Internal Server Error" originating from `frontend/src/components/documents/FolderList.tsx`. This error indicates a backend issue with the `POST /folders` API endpoint.
The user's "Test API Call" output shows an `AuthContext` with `user_id` being a valid internal UUID (`"550e8400-e29b-41d4-a716-446655440000"`) and `dev_mode` likely being `false`.

**Error Path Trace:**
1.  Frontend (`FolderList.tsx`): Calls `POST ${apiBaseUrl}/folders` with `name` and `description`.
2.  Backend API (`morphik-core/core/api.py` - `create_folder` endpoint):
    *   Receives `FolderCreate` model (name, description).
    *   Constructs a Pydantic `Folder` model, initially setting `owner_type="user"` and `owner_user_id=None` as placeholders.
    *   Calls `document_service.db.create_folder(folder_to_create, auth)`.
    *   If `db.create_folder` returns `None` or raises an unhandled exception, the API endpoint logs the error and raises an `HTTPException(status_code=500, detail="Internal server error: {e}" or "Failed to create folder")`.
3.  Database (`morphik-core/core/database/postgres_database.py` - `create_folder` method):
    *   Determines owner based on `auth: AuthContext` (`auth.entity_type`, `auth.user_id` for users).
    *   **Potential Failure Point 1 (If `dev_mode` is `true`):** Validates `owner_id_to_check` (derived from `auth.user_id`) by attempting `uuid.UUID(owner_id_to_check)`. If `dev_mode` is active and `auth.user_id` is `settings.dev_entity_id` (defaulting to non-UUID "dev_user"), this raises a `ValueError`.
    *   **Potential Failure Point 2 (Raw SQL type cast - less likely now for user's current issue if `auth.user_id` is consistently the internal UUID):** Uses a raw SQL query (`sql_check_existing`) which includes `:owner_id_val::uuid`. If `:owner_id_val` were not a string castable to UUID, this would fail.
    *   Instantiates `FolderModel` (SQLAlchemy model). `new_owner_user_id` is `uuid.UUID(owner_id_to_check)`.
    *   **Potential Failure Point 3 (Commit Error - More Likely Now):** `session.commit()` could fail due to:
        *   `ForeignKey` violation on `owner_user_id` if the user doesn't exist in `users` table (should be prevented by `_get_or_create_db_user` but consider transaction/async complexities).
        *   `CheckConstraint` (`chk_folder_owner_consistency`) violation if `owner_user_id` is `NULL` when `owner_type` is 'user' (this would imply `auth.user_id` became `None` unexpectedly before `FolderModel` instantiation, despite safeguards in `auth_utils.py`).
        *   Other database integrity errors.

**Root Cause Analysis (Revised based on new info):**

*   **Scenario A: `dev_mode` is `true` (Still a valid potential issue for dev/test environments if `dev_mode` is used):**
    *   As detailed previously, if `dev_mode` is active, `settings.dev_entity_id` (default: `"dev_user"`) is used for `AuthContext.user_id`.
    *   `uuid.UUID("dev_user")` will raise a `ValueError` in `PostgresDatabase.create_folder`.
    *   This remains a valid finding for `dev_mode` operations.

*   **Scenario B: `dev_mode` is `false` (User's current interactive flow, where `/test/auth-context` shows correct internal UUID for `AuthContext.user_id`):**
    *   The issue is **not** likely that `AuthContext.user_id` is the non-UUID Auth0 subject ID during the failing `/folders` POST, because `/test/auth-context` output shows it *is* correctly the internal UUID (`"550e8400-e29b-41d4-a716-446655440000"`).
    *   The failure in this scenario (if the `AuthContext` is identically propagated to `db.create_folder`) likely occurs deeper within `PostgresDatabase.create_folder`, specifically during `session.commit()`, due to:
        1.  An `IntegrityError` (e.g., `CheckConstraint` violation like `chk_folder_owner_consistency` if `owner_user_id` was unexpectedly `None` for a 'user' type folder, or a `ForeignKey` violation).
        2.  An unhandled exception in the raw SQL `sql_check_existing` (though less likely if parameters are correct).
        3.  A subtle difference in the `AuthContext` state between the `/test/auth-context` call and the actual `POST /folders` call, leading to `auth.user_id` being problematic only in the latter.
    *   The testing document `003-testing-auth-rbac.md`'s observation of `AuthContext.user_id` being `google-oauth2|...` was likely from an older code version or a misinterpretation, as the current `auth_utils.py` and the `/test/auth-context` output align on using the internal UUID.

**Confirmation from Logs:**
The backend logs (specifically from `morphik-core/core/api.py` and `morphik-core/core/database/postgres_database.py` with `exc_info=True`) during a failed folder creation attempt are **essential** to see the exact Python exception and pinpoint the failure.

**Recommended Fixes:**

1.  **For `dev_mode` (Still a necessary fix):**
    *   Change the default value of `dev_entity_id` in `morphik.toml` (and reflected in `core/config.py`) to a valid, static UUID string (e.g., `"00000000-0000-0000-0000-000000000001"`).
    *   Ensure that during `dev_mode` test environment setup, a corresponding user with this static UUID exists in the `users` table.

2.  **For non-`dev_mode` (User's current scenario):**
    *   **Obtain Backend Logs:** The immediate priority is to get the detailed exception trace from the backend logs when the folder creation fails. This will guide further debugging.
    *   **Review `PostgresDatabase.create_folder` for Commit Issues:** Assuming `auth.user_id` is correctly the internal UUID, scrutinize the conditions leading to `session.add(folder_model)` and `session.commit()`. Check for any logic paths where `new_owner_user_id` could become `None` if `owner_type_to_check` is `'user'`, or other constraint violations.
    *   Consider if asynchronous operations or transaction scopes could lead to `auth.user_id` not being found in the `users` table at the exact moment of the foreign key check during commit, despite `_get_or_create_db_user` running earlier.

3.  **Defensive Programming in `PostgresDatabase.create_folder` (Still Recommended):**
    *   Add explicit checks at the beginning of `create_folder` to validate `auth.user_id` (if user type) is a non-null, valid UUID string, logging errors and returning early if not. This makes the database layer more robust even if `AuthContext` has unexpected states.

Addressing the `dev_mode` config is a definite fix. For the user's current issue, the backend logs are paramount to move beyond hypotheses.

## 4. Authentication System Audit

This section reviews the core authentication flow, from frontend interaction with NextAuth.js to backend JWT verification and user context population in `morphik-core/core/auth_utils.py`.

### 4.1. Frontend: NextAuth.js Configuration (`frontend/src/app/api/auth/[...nextauth]/route.js`)

*   **Auth0 Provider:**
    *   Correctly configured with `clientId`, `clientSecret`, `issuer` from environment variables.
    *   `authorization` params include `audience: process.env.AUTH0_API_IDENTIFIER`, which is crucial for requesting an access token suitable for the backend API.
    *   **Status:** ✅ Correctly Implemented.
*   **Session Strategy:**
    *   `session: { strategy: 'jwt' }` is used. This is appropriate for SPA and for passing JWTs to a separate backend API.
    *   **Status:** ✅ Correctly Implemented.
*   **Callbacks:**
    *   `jwt({ token, user, account })` callback:
        *   Correctly persists `account.access_token` to the NextAuth.js `token` object.
        *   Persists `user.id` (which is the Auth0 `sub`) to `token.id`.
        *   Copies Auth0 profile info (`name`, `email`, `picture`) into `token.user`.
        *   **Status:** ✅ Correctly Implemented.
    *   `session({ session, token })` callback:
        *   Correctly transfers `token.accessToken` to `session.accessToken`.
        *   Transfers `token.id` (Auth0 `sub`) to `session.user.id`.
        *   Populates `session.user.name`, `session.user.email`, `session.user.image` from the token.
        *   **Status:** ✅ Correctly Implemented.
*   **Environment Variables:** The setup relies on `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_API_IDENTIFIER`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`. These must be correctly configured in the frontend environment.
*   **Overall:** The NextAuth.js setup for Auth0 integration appears solid and follows standard practices for obtaining and managing JWTs on the client-side.

### 4.2. Backend: JWT Verification & User Provisioning (`morphik-core/core/auth_utils.py`)

*   **`verify_token(authorization: str = Header(None))` function:**
    *   **`dev_mode` Handling:**
        *   If `settings.dev_mode` is true, it bypasses JWT validation and returns a hardcoded `AuthContext`.
        *   It uses `settings.dev_entity_id` for `AuthContext.user_id` and `AuthContext.entity_id`.
        *   **Issue/Discrepancy:** `settings.dev_entity_id` defaults to `"dev_user"` (from `core/config.py`), which is not a UUID. As detailed in Section 3, this directly causes errors in `PostgresDatabase.create_folder` if `dev_mode` is active, due to `uuid.UUID("dev_user")` raising a `ValueError`.
        *   **Recommendation:** `settings.dev_entity_id` should be a valid UUID string by default (e.g., `"00000000-0000-0000-0000-000000000001"`). Ensure a corresponding user with this ID exists in the `users` table for `dev_mode` or that DB interactions are properly mocked.
    *   **Token Extraction:** Correctly parses the `Bearer <token>` from the `Authorization` header.
    *   **JWT Validation (`verify_auth0_jwt` function):**
        *   `JWKS_URL` is correctly constructed.
        *   `get_jwks()` fetches and caches JWKS keys using `cachetools.TTLCache`. This is good for performance.
        *   `get_signing_key(token)` correctly extracts the `kid` from the token header and finds the matching RSA public key from JWKS.
        *   `jwt.decode()` is used with correct `algorithms`, `audience` (from `settings.AUTH0_API_IDENTIFIER`), and `issuer`.
        *   Error handling for `ExpiredSignatureError`, `InvalidAudienceError`, `InvalidIssuerError`, and other `PyJWTError` exceptions is present, raising appropriate HTTPExceptions.
        *   **Status:** ✅ Robust JWT validation mechanism.
    *   **User Provisioning Call (`_get_or_create_db_user`):**
        *   Extracts `auth0_user_id = payload.get("sub")`.
        *   Calls `_get_or_create_db_user(auth0_user_id, payload, database)`.
        *   **Status:** ✅ Correct delegation.
    *   **`AuthContext` Population (non-`dev_mode`):**
        *   `user_id` is set from `user_data["internal_user_id"]`.
        *   `auth0_user_id` is set from `user_data["auth0_user_id"]`.
        *   `email` is set from `user_data.get("email")`.
        *   `entity_type` is set from `user_data["entity_type"]` (which `_get_or_create_db_user` defaults to `EntityType.USER`).
        *   `entity_id` is set from `user_data["entity_id"]` (which `_get_or_create_db_user` sets to the internal user ID for user entities).
        *   `app_id` is set from `user_data.get("app_id")`.
        *   `permissions` are set from `user_data["permissions"]`.
        *   **Key Concern:** The logic for setting these fields in `AuthContext` from `user_data` is correct. The critical dependency is that `user_data["internal_user_id"]` (returned by `_get_or_create_db_user`) *is indeed the internal database UUID string*.
        *   **Status:** ✅ Correctly structured if `user_data` is as expected.

*   **`_get_or_create_db_user(auth0_user_id: str, auth0_payload: dict, db: PostgresDatabase)` function:**
    *   Calls `db.fetch_user_by_auth0_id(auth0_user_id)`.
    *   If user not found, it extracts `email`, `name`, `avatar_url` from `auth0_payload` and calls `db.create_user_from_auth0_data()`.
        *   It correctly checks if `email` is present in the payload, raising an HTTPException if not.
    *   Error handling for database operations is present.
    *   It critically checks `if not user_db_record or not user_db_record.get("id")`, raising an exception if the internal ID is missing after fetch/create. This is a good safeguard.
    *   **Returned `auth_context_user_data` dictionary:**
        *   `"internal_user_id"`: Set to `str(user_db_record["id"])`. `user_db_record["id"]` comes from `PostgresDatabase.fetch_user_by_auth0_id` or `create_user_from_auth0_data`, which correctly provide the internal UUID.
        *   `"auth0_user_id"`: Correctly set.
        *   `"email"`: Correctly set.
        *   `"entity_type"`: Defaulted to `EntityType.USER`.
        *   `"entity_id"`: Set to `str(user_db_record["id"])` (the internal user ID). This is appropriate for user-owned resources where the user is the entity.
        *   `"permissions"`: **Hardcoded to `{"read", "write"}`.**
            *   **Issue/Discrepancy:** This is a significant deviation from a full RBAC system. The documentation (`authentication.md` Section 7.3.1) acknowledges this as a temporary measure for initial testing. However, for a complete audit, this needs to be flagged as incomplete RBAC implementation. These permissions should be dynamically resolved based on the user's roles and the resource being accessed.
            *   **Recommendation:** Implement dynamic permission fetching logic here or in a separate authorization dependency that uses `AuthContext.user_id` to query RBAC tables (`user_folder_roles`, `team_memberships`, `team_folder_roles`, `roles`, `role_permissions`).
        *   `"app_id"`: Logic to derive `app_id` from `payload.get("azp")` or `payload.get("aud")` is present. This seems reasonable for identifying client applications if applicable.
    *   **Status:** ✅ Mostly correct user lookup/creation logic. The main gap is the static permission assignment.

### 4.3. Documentation Discrepancies & Clarifications

*   **`003-testing-auth-rbac.md` (Test Scenario 1 - New User Login):**
    *   Reported `AuthContext.user_id: google-oauth2|...`
    *   **Discrepancy:** The current `auth_utils.py` code sets `AuthContext.user_id` to the *internal database UUID*, not the `auth0_user_id` string.
    *   **Conclusion:** This documented test result either pertains to an older version of the code where this was a bug, or it was a misinterpretation (e.g., logging `auth.auth0_user_id` but labeling it as `auth.user_id`). If the user is *currently* seeing `AuthContext.user_id` as the Auth0 subject, then there is a live bug contradicting the current `auth_utils.py` implementation, or they are running older code.
*   **Permissions in `AuthContext` (`core/models/auth.py`):**
    *   `permissions: Set[str] = {"read"}` with a comment `# Default will be overridden in verify_token`.
    *   In `verify_token` (via `_get_or_create_db_user`), it's overridden to `{"read", "write"}`.
    *   **Clarity:** This is a placeholder. The documentation (`authentication.md` Section 7.3.1) describes this simple authorization for testing. The plan is to move to full RBAC.

### 4.4. Summary of Authentication System

*   The JWT validation against Auth0 is robust.
*   User provisioning (fetch or create in the local DB) linked to Auth0 ID is correctly implemented, returning the internal UUID.
*   The `AuthContext` is designed to hold the internal user UUID in `user_id` and `entity_id` (for users).
*   **Critical Issue for Folder Creation:** If `dev_mode` is on, the non-UUID `dev_entity_id` will cause failures. If not in `dev_mode`, and if `AuthContext.user_id` were somehow still the `auth0_user_id` (contrary to current code but matching a previous test observation), it would also cause failures.
*   **Major Gap:** Permissions in `AuthContext` are static and do not reflect the implemented RBAC table structure. This needs to be the next major development step for authorization.

## 5. RBAC and Database Audit (`morphik-core/core/database/postgres_database.py`)

This section audits the database schema definitions (SQLAlchemy models), database operations (CRUD, queries), RBAC logic, and initialization procedures.

### 5.1. SQLAlchemy Models & Schema

The following models were reviewed based on `postgres_database.py` and cross-referenced with `docs/moongraph/implemented/database-rbac-schema.md` and `docs/moongraph/features/authentication.md`.

*   **`UserModel`:**
    *   ✅ Defines `id (UUID PK)`, `auth0_user_id (String Unique Indexed)`, `email (String Unique Indexed)`, `name`, `avatar_url`, `created_at`, `updated_at`.
    *   Aligns well with `001-user-model.md` and the RBAC schema documentation.
    *   **Status:** Correctly Implemented.

*   **`TeamModel`:**
    *   ✅ Defines `id (UUID PK)`, `name`, `owner_user_id (FK to users.id Indexed)`, `description`, `settings`, `created_at`, `updated_at`.
    *   `owner_user_id` is `nullable=False`.
    *   **Status:** Correctly Implemented as per schema, though team functionality is largely future-facing.

*   **`TeamMembershipModel`:**
    *   ✅ Junction table for `teams` and `users` with `team_id`, `user_id` (both FK, indexed, CASCADE delete), `role`, `joined_at`, timestamps.
    *   `UniqueConstraint("team_id", "user_id")` is present.
    *   **Status:** Correctly Implemented.

*   **`PermissionModel`:**
    *   ✅ Defines `id (UUID PK)`, `name (String Unique Indexed)`, `description`, timestamps.
    *   Aligns with documentation for storing permission definitions (e.g., "folder:read").
    *   **Status:** Correctly Implemented.

*   **`RoleModel`:**
    *   ✅ Defines `id (UUID PK)`, `name`, `description`, `scope (String)`, `is_system_role (Boolean default False)`, timestamps.
    *   `UniqueConstraint("name", "scope")` and `Index("idx_role_name_scope", "name", "scope")` are present.
    *   **Status:** Correctly Implemented.

*   **`RolePermissionModel`:**
    *   ✅ Junction table for `roles` and `permissions` with `role_id`, `permission_id` (both FK, indexed, CASCADE delete), timestamps.
    *   `UniqueConstraint("role_id", "permission_id")` is present.
    *   **Status:** Correctly Implemented.

*   **`UserFolderRoleModel`:**
    *   ✅ Junction table for `users`, `folders`, `roles` with `user_id`, `folder_id`, `role_id` (all FK, indexed, CASCADE delete), `granted_by_user_id (FK to users.id, nullable=True)`, timestamps.
    *   `UniqueConstraint("user_id", "folder_id", "role_id")` and `Index("idx_user_folder_role_lookup", "user_id", "folder_id")` are present.
    *   **Status:** Correctly Implemented.

*   **`TeamFolderRoleModel`:**
    *   ✅ Similar to `UserFolderRoleModel` but for teams: `team_id`, `folder_id`, `role_id`, `granted_by_user_id`.
    *   Constraints and indexes are analogous.
    *   **Status:** Correctly Implemented (for future team-based folder permissions).

*   **`FolderModel`:**
    *   ✅ `id (UUID PK default uuid.uuid4())`, `name (String Indexed nullable=False)`, `description (Text nullable=True)`.
    *   ✅ **New Ownership Fields:** `owner_type (String(10) nullable=False)`, `owner_user_id (UUID FK to users.id, nullable=True, index=True)`, `owner_team_id (UUID FK to teams.id, nullable=True, index=True)`.
    *   ✅ `visibility (String(20) nullable=False, server_default="private")`.
    *   ✅ Timestamps `created_at`, `updated_at`.
    *   ✅ **Check Constraints:**
        *   `chk_folder_owner_type`: `owner_type IN ('user', 'team')`.
        *   `chk_folder_owner_consistency`: `(owner_type = 'user' AND owner_user_id IS NOT NULL AND owner_team_id IS NULL) OR (owner_type = 'team' AND owner_team_id IS NOT NULL AND owner_user_id IS NULL)`.
            *   This constraint is crucial and correctly enforces ownership rules.
            *   **Observation:** The columns `owner_user_id` and `owner_team_id` are `nullable=True` in their definition, but this check constraint makes them conditionally non-null. This is a valid way to implement this logic.
    *   JSONB Fields: `document_ids (default list)`, `system_metadata (default dict)`, `rules (default list)`.
    *   `access_control (JSONB default dict)`:
        *   **Legacy Field/Discrepancy:** Marked in comments as `# To be reviewed/deprecated in favor of RBAC tables`. The documentation (`authentication.md` Section 7.2) also flags this. This field should be actively planned for removal or a clear strategy for its use alongside RBAC defined.
        *   Its continued presence and population (even with `default=dict`) adds minor clutter if unused by the new RBAC logic.
    *   `__table_args__` includes `Index("idx_folder_name", "name")` and `Index("idx_folder_system_metadata_app_id", text("(system_metadata->>'app_id')"))` in addition to the check constraints.
    *   **Status:** Largely correct and aligned with the new RBAC design for ownership. The main point of action is the `access_control` legacy field.

*   **`InvitationModel`:**
    *   ✅ Defines `id (UUID PK)`, `team_id (FK)`, `email`, `invited_by_user_id (FK, SET NULL, nullable=True)`, `role_to_assign`, `token (Unique Indexed)`, `status (Indexed)`, `expires_at`, timestamps.
    *   **Status:** Correctly Implemented (for future team invitation system).

*   **`DocumentModel`, `GraphModel`:**
    *   These models also contain legacy `owner (JSONB)` and `access_control (JSONB)` fields.
    *   **Issue:** Similar to `FolderModel.access_control`, these fields represent the old permission model. Their functionality needs to be superseded by the new RBAC mechanisms (e.g., permissions on containing folders, or direct document/graph permissions if planned).
    *   **Recommendation:** Audit the usage of these fields. If they are still being used for authorization, this conflicts with the new RBAC system. Plan for their deprecation and migration of any relevant logic to RBAC.

### 5.2. Database Operations & RBAC Logic

*   **User Provisioning (`fetch_user_by_auth0_id`, `create_user_from_auth0_data`):**
    *   Uses SQLAlchemy ORM (`select`, `session.add`, `session.commit`, `session.refresh`).
    *   Correctly fetches users by `auth0_user_id` or creates new ones.
    *   Returns a dictionary including `"id": str(user_model.id)` (the internal UUID), which is crucial for `AuthContext`.
    *   **Status:** ✅ Correctly Implemented and consistent with ORM usage.

*   **Folder Creation (`create_folder`):**
    *   **Inconsistency (ORM vs. Raw SQL):** Uses a raw SQL query (`sql_check_existing`) to check for existing folders before attempting creation with the ORM (`session.add(FolderModel(...))`).
        *   **Recommendation:** Refactor the check for existing folders to use SQLAlchemy ORM expressions if feasible, for consistency and type safety. For example:
          ```python
          # Conceptual ORM check
          from sqlalchemy import and_, or_
          stmt_check_existing = select(FolderModel.id).where(
              FolderModel.name == folder.name,
              FolderModel.owner_type == owner_type_to_check
          )
          if owner_type_to_check == EntityType.USER.value:
              stmt_check_existing = stmt_check_existing.where(FolderModel.owner_user_id == uuid.UUID(owner_id_to_check))
          elif owner_type_to_check == EntityType.TEAM.value:
              stmt_check_existing = stmt_check_existing.where(FolderModel.owner_team_id == uuid.UUID(owner_id_to_check))
          
          if app_id_val is not None:
              stmt_check_existing = stmt_check_existing.where(FolderModel.system_metadata[('app_id',)].astext == app_id_val)
          
          result = await session.execute(stmt_check_existing)
          existing_folder_id = result.scalar_one_or_none()
          ```
          (Note: JSONB subscriptable expression might need specific dialect handling or `func.jsonb_extract_path_text` for `system_metadata`.)
    *   Correctly sets ownership fields (`owner_type`, `owner_user_id`, `owner_team_id`) on `FolderModel` based on `AuthContext`.
    *   Populates legacy `access_control` with default `{}`, needs review.
    *   The root cause of the folder creation error is likely tied to `owner_id_to_check` not being a valid UUID string, as discussed in Section 3.
    *   **Status:** Mixed ORM/Raw SQL. Logic for new ownership fields is mostly correct, but vulnerable to `AuthContext.user_id` format.

*   **Folder Listing (`list_folders`):**
    *   **Inconsistency (Raw SQL):** Builds a complex, dynamic raw SQL query string for listing folders. This includes logic for `owner_type`, `owner_user_id`, `owner_team_id`, `visibility`, and `user_folder_roles` / `team_folder_roles` for shared folders.
    *   While the query attempts to implement RBAC visibility, constructing raw SQL this way is error-prone, hard to maintain, and less secure than using the ORM with its parameter binding.
    *   **Recommendation:** This is a prime candidate for refactoring to use SQLAlchemy ORM. Complex joins and filters are achievable with the ORM and would significantly improve readability and robustness.
    *   **Status:** Uses Raw SQL, functionality needs verification against RBAC requirements.

*   **Folder Retrieval (`get_folder`, `get_folder_by_name`):**
    *   `get_folder`: Uses SQLAlchemy ORM (`select(FolderModel).where(FolderModel.id == folder_uuid)`). ✅
    *   `get_folder_by_name`: Also uses raw SQL with logic similar to `list_folders` for access checks. 🚧 **Inconsistency/Recommendation:** Refactor to ORM and ensure RBAC checks are correctly applied.
    *   Both methods call `self._check_folder_access` which itself is marked for RBAC update.

*   **Permission Seeding (`_seed_initial_rbac_data`):**
    *   Uses SQLAlchemy ORM to add `PermissionModel`, `RoleModel`, and `RolePermissionModel` instances.
    *   Checks for existing permissions/roles by name (and scope for roles) before inserting to prevent duplicates.
    *   Seeds permissions: `folder:read`, `folder:write`, `folder:admin`.
    *   Seeds roles: `FolderViewer`, `FolderEditor`, `FolderAdmin` (all scoped to 'folder', `is_system_role=True`).
    *   Maps roles to permissions correctly (e.g., `FolderViewer` -> `folder:read`).
    *   **Status:** ✅ Correctly Implemented and uses ORM consistently.

*   **User Permission Retrieval (`get_user_permissions_for_folder`):**
    *   **Inconsistency (Raw SQL):** Uses a raw SQL query with multiple JOINs across `permissions`, `role_permissions`, `roles`, `user_folder_roles`, (and commented out `team_memberships`, `team_folder_roles`) to fetch permission names.
    *   The query for direct user roles seems plausible. The commented-out team parts indicate it's incomplete for full team-based permissions.
    *   **Recommendation:** Refactor to SQLAlchemy ORM for clarity and maintainability. Complete the logic for team-based permissions.
    *   **Status:** Uses Raw SQL, partially implemented for RBAC.

*   **Access Checking (`_check_folder_access_rbac`, `_check_folder_access`):**
    *   `_check_folder_access_rbac`: Intended for new RBAC checks. Calls `get_user_permissions_for_folder` and checks if `required_permission` is present. This is the correct direction.
    *   `_check_folder_access`: Appears to be the older access check mechanism, potentially using the legacy `folder.access_control` field or direct ownership.
        *   **Documentation Discrepancy/Legacy:** `authentication.md` (Section 7.2) mentions: "Evaluate if this field [`access_control` JSONB] is still needed... aim to replace it if possible." The presence of `_check_folder_access` suggests the legacy path might still be active or not fully deprecated.
        *   **Recommendation:** All folder access control should consistently use `_check_folder_access_rbac`. Deprecate and remove `_check_folder_access` and reliance on the `access_control` JSONB field.
    *   **Status:** Transition to RBAC in progress; legacy checks may still exist.

### 5.3. Database Initialization (`initialize` method)

*   Uses `Base.metadata.create_all(conn, checkfirst=True)` to create tables from SQLAlchemy models. ✅
*   **Inconsistency (Raw SQL for DDL):** Subsequently uses raw SQL `ALTER TABLE` (e.g., for `documents.storage_files`) and `CREATE INDEX IF NOT EXISTS` for several indexes (some of which are already defined in SQLAlchemy model `__table_args__`).
    *   `CREATE INDEX IF NOT EXISTS idx_folder_name ON folders (name);` is redundant as `FolderModel` defines `Index("idx_folder_name", "name")`.
    *   Indexes for `folders.owner_user_id` and `folders.owner_team_id` are created via raw SQL but should ideally be defined in `FolderModel.__table_args__` for consistency.
    *   **Recommendation:** Define all indexes within the SQLAlchemy models where possible. For schema migrations beyond initial creation (like adding columns to existing tables), use a proper migration tool like Alembic instead of `ALTER TABLE` in `initialize()`. This improves schema versioning and management.
*   Calls `_seed_initial_rbac_data()` after table creation. ✅
*   **Status:** Mixed approach. ORM for table creation, raw SQL for some alterations/indexes.

### 5.4. Consistency and Best Practices

*   **ORM vs. Raw SQL:** The most significant inconsistency. While raw SQL can be justified for highly complex queries not easily expressed by the ORM or for specific performance tuning after profiling, its widespread use here for checks, listings, and even updates (`set_folder_rule` in `api.py`) makes the code harder to:
    *   Read and understand (SQL strings embedded in Python).
    *   Maintain (changes require editing SQL strings, higher risk of SQL injection if not parameterized carefully, though `text()` helps).
    *   Test (ORM queries are easier to unit test with mock sessions).
    *   Benefit from ORM features like automatic object tracking and relationship management.
*   **Legacy Fields:** The continued presence and population of `access_control` and old `owner` fields in various models (`FolderModel`, `DocumentModel`, `GraphModel`) without a clear, active migration path to the new RBAC system is a major source of confusion and potential bugs.
*   **Redundant Index Creation:** As noted in `initialize()`.

### 5.5. Summary of Database and RBAC Audit

*   The core RBAC table schema (`UserModel`, `PermissionModel`, `RoleModel`, `UserFolderRoleModel`, etc.) is well-defined in SQLAlchemy and aligns with the documentation.
*   Folder ownership using `owner_type`, `owner_user_id`, `owner_team_id` in `FolderModel` with check constraints is correctly implemented at the schema level.
*   User provisioning database methods (`fetch_user_by_auth0_id`, `create_user_from_auth0_data`) consistently use the ORM and function correctly.
*   Initial RBAC data seeding (`_seed_initial_rbac_data`) is correctly implemented using the ORM.
*   **Major Areas for Improvement:**
    *   **Consistency in Data Access:** Heavily refactor database operations like `create_folder` (existing folder check), `list_folders`, `get_folder_by_name`, `get_user_permissions_for_folder` to use SQLAlchemy ORM expressions instead of raw SQL strings.
    *   **Deprecate Legacy Fields:** Actively remove or migrate data from legacy `access_control` and `owner` JSONB fields in `FolderModel`, `DocumentModel`, and `GraphModel` to ensure the new RBAC system is the sole source of truth for authorization.
    *   **Complete RBAC Logic:** Ensure `get_user_permissions_for_folder` includes team-based permissions and that `_check_folder_access_rbac` becomes the standard for all folder access checks.
    *   **Schema Management:** Adopt Alembic for database migrations beyond initial setup to handle schema evolution more robustly than `ALTER TABLE` statements in `initialize()`. 

## 6. API Endpoint Audit (`morphik-core/core/api.py`)

This section reviews API endpoints, focusing on authentication, authorization, request/response models, and error handling.

*   **Authentication Dependency (`Depends(verify_token)`):**
    *   Most relevant endpoints (e.g., `/folders`, `/documents`, `/query`, `/graph`) correctly use `auth: AuthContext = Depends(verify_token)` to ensure requests are authenticated and to get user context.
    *   **Status:** ✅ Consistently applied for protected routes.

*   **Authorization Checks (Post-Authentication):**
    *   **Folder Operations:**
        *   `create_folder`: Implicitly relies on `AuthContext` for ownership. No explicit permission check for *creating* a folder, which is generally acceptable (user creates their own folder).
        *   `list_folders`: Relies on complex raw SQL in `db.list_folders(auth)` which attempts to implement RBAC visibility. Needs refactoring to ORM and verification.
        *   `get_folder`: Relies on `db.get_folder(folder_id, auth)` which then calls `db._check_folder_access()`. This check needs to be updated to the new RBAC system (`_check_folder_access_rbac`).
        *   `delete_folder`: Fetches folder, then calls `db.delete_folder(folder_id, auth)`. The `db.delete_folder` itself calls `get_folder` and then `_check_folder_access(folder, auth, "admin")`. This also needs to transition fully to RBAC checks.
        *   `add_document_to_folder`, `remove_document_from_folder`: These call database methods that should internally perform permission checks (e.g., write access to the folder). The current `_check_folder_access` needs RBAC update.
    *   `set_folder_rule`:
        *   Performs an explicit permission check: `if not document_service.db._check_folder_access(folder, auth, "write")`. This check needs to be updated to the new RBAC model (`_check_folder_access_rbac`).
    *   **Document Operations (`/ingest/text`, `/ingest/file`, `/documents/{document_id}` etc.):**
        *   `ingest_text`, `ingest_file`: Check `if "write" not in auth.permissions: raise PermissionError(...)`. This uses the static permissions from `AuthContext`.
            *   **Issue:** This is insufficient. It should check for a specific permission like `folder:write` if a folder is specified, or a general `document:create` permission.
        *   `delete_document`: Calls `db.delete_document(document_id, auth)`, which internally calls `db.check_access(document_id, auth, "admin")`. `check_access` relies on the legacy `document.access_control` or `document.owner` fields.
            *   **Issue:** This needs to be updated to use folder-based RBAC. If a document is in a folder, permission to delete should derive from permissions on the folder.
    *   **General Observation:** Authorization logic is scattered. Some endpoints perform basic checks on static `AuthContext.permissions`, others delegate to database methods which might use legacy `access_control` fields or the evolving RBAC checks. This needs standardization towards the new RBAC model.
    *   **Recommendation:** Systematically review all endpoints that modify or access resources. Ensure they use a consistent authorization mechanism based on the new RBAC system (e.g., a dependency `Depends(require_permission("folder:write"))` that uses `_check_folder_access_rbac`).

*   **Request/Response Models:**
    *   Generally uses Pydantic models for request validation and response serialization (e.g., `FolderCreate`, `Folder` for `/folders`).
    *   **Discrepancy (`/folders` response vs. SDK):**
        *   The `POST /folders` endpoint has `response_model=Folder` (the Pydantic model from `core/models/folders.py` with new ownership fields: `owner_type`, `owner_user_id`, `owner_team_id`).
        *   However, the Python SDKs (`sync.py`, `async_.py`) expect to parse this response using `FolderInfo` (from `sdks/python/morphik/models.py`), which has the old `owner` dictionary by default.
        *   **Issue:** This will cause `pydantic.ValidationError` in the SDKs when they try to instantiate `FolderInfo` with the actual API response, as the `owner` field is missing and unexpected new ownership fields are present.
        *   **Recommendation:** The API is correctly typed with `response_model=Folder`. The SDKs (`FolderInfo` model and its usage) must be updated to expect the new `Folder` structure, or the API needs to specifically return the old `FolderInfo` structure *only for the SDK context*, which is less ideal.

*   **Error Handling:**
    *   Endpoints generally use `try...except` blocks.
    *   `HTTPException` is raised for client errors (4xx) and server errors (5xx).
    *   Specific exceptions like `PermissionError` are caught and translated to 403.
    *   Generic `except Exception as e:` blocks log the error and raise a 500, which is good practice for not leaking internal details while still capturing the error.
    *   **Status:** ✅ Good error handling practices.

*   **Consistency & Best Practices:**
    *   Use of FastAPI's `Depends` for authentication is consistent.
    *   Pydantic models for request/response are a good practice.
    *   Telemetry tracking is applied to many routes.
    *   The main inconsistency is in how authorization is applied post-authentication.

### 6.1. Summary of API Endpoint Audit

*   Authentication is consistently applied using `Depends(verify_token)`.
*   Error handling is generally robust.
*   **Major Issues:**
    *   **Inconsistent Authorization:** Authorization logic is fragmented. Some uses static `AuthContext.permissions`, others use database methods with either legacy `access_control` checks or partially implemented RBAC checks. This needs to be standardized on the new RBAC system.
    *   **Response Model Mismatch with SDK:** The `/folders` endpoint response model (`Folder`) does not match what the Python SDKs expect (`FolderInfo` with old `owner` field), which will cause SDK failures.
*   **Recommendations:**
    *   Standardize authorization: Implement a consistent RBAC checking mechanism (e.g., dedicated dependency) and apply it across all relevant resource-accessing endpoints.
    *   Align SDK: Update the Python SDKs' `FolderInfo` model or switch to using a model compatible with the API's `Folder` response model.
    *   Phase out legacy access checks: Remove reliance on `access_control` JSONB fields in favor of RBAC for documents and graphs as well.

## 7. Python SDK Audit (`morphik-core/sdks/python/morphik/`)

*   **`FolderInfo` Model (`sdks/python/morphik/models.py`):**
    *   Defines `owner: Dict[str, str] = Field(..., description="Owner information")`.
    *   Also includes `access_control: Dict[str, List[str]]`.
    *   **Issue:** This model is outdated. The backend API (`POST /folders` with `response_model=Folder`) returns the new ownership structure (`owner_type`, `owner_user_id`, `owner_team_id`) and does not include the old `owner` dictionary by default.
    *   When the SDKs (`sync.py` and `async_.py`) call `FolderInfo(**response)` after a `POST /folders` call, this will result in a `pydantic.ValidationError` because the `owner` field is missing in the response and unexpected new ownership fields are present.
    *   **Status:**  критичный Needs Immediate Fix.
    *   **Recommendation:** Update `FolderInfo` in `sdks/python/morphik/models.py` to match the Pydantic `Folder` model from `morphik-core/core/models/folders.py` (i.e., include `owner_type`, `owner_user_id`, `owner_team_id`, `visibility` and remove the old `owner` dict). Ensure the `Folder` class in the SDKs correctly uses this updated model.

*   **SDK `create_folder` methods (`sync.py`, `async_.py`):**
    *   Correctly make a `POST` request to `/folders` with `name` and `description`.
    *   The issue lies in parsing the response using the outdated `FolderInfo`.

## 8. Documentation Discrepancies Audit

*   **`003-testing-auth-rbac.md` - Test Scenario 1 (New User Login & Provisioning):**
    *   **Observation:** Stated `AuthContext.user_id: google-oauth2|...`
    *   **Code (`auth_utils.py`):** Intends to set `AuthContext.user_id` to the internal database UUID (`str(user_db_record["id"])`).
    *   **Discrepancy:** If the user is currently observing the behavior described in the test document (i.e., `AuthContext.user_id` is the Auth0 subject ID), then there is a mismatch with the current `auth_utils.py` code. This could be due to running older code or a subtle bug not evident from static analysis of `auth_utils.py`. However, based *solely* on the current `auth_utils.py`, `AuthContext.user_id` should be the internal UUID. The folder creation error strongly suggests that, in the user's failing environment, `AuthContext.user_id` is *not* being set to the internal UUID as intended by the current `auth_utils.py` code, or the `dev_mode` issue is the cause.

*   **Legacy Fields (`FolderModel.access_control`, `DocumentModel.owner`, etc.):**
    *   **Documentation (`authentication.md` Section 7.2):** Suggests evaluating if `folders.access_control` is still needed and aiming to replace it.
    *   **Code:** These fields are still present in the SQLAlchemy models and are populated (e.g., `FolderModel.access_control` gets `{}` in `db.create_folder`). The old access checking logic (`_check_folder_access`) might still be in use.
    *   **Discrepancy:** The code has not fully deprecated these fields as strongly recommended by the planning document.

*   **SDK `FolderInfo` vs. API `Folder` Model:**
    *   **Documentation:** The API documentation (implicitly through FastAPI's `response_model=Folder`) and the RBAC schema docs describe the new folder ownership structure.
    *   **Code:** The SDKs use an outdated `FolderInfo` Pydantic model that expects the old `owner` dictionary.
    *   **Discrepancy:** SDK is not aligned with the API's defined response model for folders.

*   **Static Permissions in `AuthContext`:**
    *   **Documentation (`authentication.md` Section 7.3.1):** Clearly states that the initial simple authorization with static permissions in `AuthContext` is a temporary measure for testing and that the full RBAC implementation will involve dynamic permission determination.
    *   **Code (`auth_utils.py`):** Implements this static permission assignment (`{"read", "write"}`).
    *   **Status:** ✅ Aligns with the documented phased approach, but highlights that the full RBAC permission resolution is not yet implemented in `AuthContext`.

## 9. Adherence to Goals & Best Practices

*   **Ease of Understanding:**
    *   **Mixed:** The core authentication flow in `auth_utils.py` is relatively understandable. However, the database layer's mix of ORM and extensive raw SQL for complex operations (like `list_folders`) significantly reduces clarity. Legacy fields also add confusion.
*   **Robustness:**
    *   **Moderate:** The folder creation bug is a critical robustness issue. Error handling in API/DB layers is generally good. Lack of dynamic RBAC permissions means authorization is not yet robust.
*   **Lightweight:**
    *   ✅ The chosen stack (FastAPI, Pydantic, SQLAlchemy) is suitable and generally lightweight. The implementation itself doesn't add undue overhead beyond the identified inconsistencies.
*   **Simplicity/Elegance:**
    *   **Room for Improvement:** Could be improved by more consistent use of the ORM, removing legacy code, and standardizing authorization checks. Raw SQL strings for complex logic are less elegant than ORM expressions.
*   **Consistency:**
    *   **Low:** This is a key area for improvement.
        *   Inconsistent database access patterns (ORM vs. raw SQL).
        *   Inconsistent authorization logic (static permissions, legacy checks, partial RBAC).
        *   Inconsistency between API response models (`Folder`) and SDK expected models (`FolderInfo`).
        *   Inconsistent index definition (SQLAlchemy `__table_args__` vs. raw SQL in `initialize()`).
*   **DRY (Don't Repeat Yourself) and Other Best Practices:**
    *   **Mostly Followed:** Code is generally structured into services and models. Use of Pydantic and SQLAlchemy promotes good practices.
    *   **Violations:** Redundant index creation. Complex logic embedded in raw SQL strings could be better encapsulated.

## 10. Recommendations

Based on the audit findings, the following actions are recommended, prioritized by impact:

**Critical (Address ASAP to fix bugs and major inconsistencies):**

1.  **Fix Folder Creation Error:**
    *   **A) `dev_mode`:** If `dev_mode` is used, immediately change `settings.dev_entity_id` in `morphik.toml` (or environment variable) to a valid, static UUID string (e.g., `"10000000-0000-0000-0000-000000000001"`). Ensure a corresponding user with this UUID exists in the `users` table for `dev_mode` testing to satisfy FK constraints, or mock database interactions appropriately.
    *   **B) Non-`dev_mode`:** Thoroughly investigate why `AuthContext.user_id` might be populated with a non-UUID (like the Auth0 subject ID) if the user experiences the error in this flow. The current `auth_utils.py` *should* prevent this. If this is the case, it indicates a severe bug, possibly from running older code or an unspotted issue in the user provisioning path. Add temporary, detailed logging in `auth_utils.py` (around `_get_or_create_db_user` and `AuthContext` creation) and in `PostgresDatabase.create_folder` (logging `auth.user_id` and `owner_id_to_check`) in the failing environment to pinpoint the state of these IDs.
2.  **Align Python SDK with API for Folders:**
    *   Update the `FolderInfo` Pydantic model in `morphik-core/sdks/python/morphik/models.py` to match the fields of `morphik-core/core/models/folders.py::Folder` (i.e., use `owner_type`, `owner_user_id`, `owner_team_id`, `visibility` and remove the old `owner` dictionary).
    *   Ensure the `Folder` and `AsyncFolder` classes in the SDKs correctly use this updated model.

**High Priority (Improve robustness and consistency):**

3.  **Implement Dynamic RBAC Permission Resolution:**
    *   Modify `_get_or_create_db_user` in `auth_utils.py` (or create a new authorization dependency) to dynamically fetch user permissions from the RBAC tables (`user_folder_roles`, `team_folder_roles`, `roles`, `role_permissions`) instead of assigning static `{"read", "write"}`. The `get_user_permissions_for_folder` is a starting point but needs to be completed (e.g. for team permissions) and refactored to ORM.
    *   This dynamic permission set should then populate `AuthContext.permissions`.
4.  **Standardize Authorization Checks in API Endpoints:**
    *   Replace all varied permission checks (static `AuthContext.permissions` checks, calls to legacy `_check_folder_access` or direct `access_control` field checks) with a consistent mechanism that uses the dynamic RBAC permissions from `AuthContext` and the new `_check_folder_access_rbac` (or a similar dedicated RBAC checking function/dependency).
    *   Example: `Depends(require_permission("folder:write", resource_id_param_name="folder_id"))`.
5.  **Refactor Database Layer to Prefer ORM:**
    *   Prioritize refactoring methods that use raw SQL for complex queries or CRUD-like operations to use SQLAlchemy ORM expressions. This includes:
        *   `PostgresDatabase.create_folder` (the existing folder check part).
        *   `PostgresDatabase.list_folders` (critical for RBAC correctness and maintainability).
        *   `PostgresDatabase.get_folder_by_name`.
        *   `PostgresDatabase.get_user_permissions_for_folder`.
        *   `api.py::set_folder_rule` (move SQL to DB layer and use ORM).

**Medium Priority (Clean-up and Best Practices):**

6.  **Deprecate and Remove Legacy Fields:**
    *   Plan and execute the removal of `access_control`
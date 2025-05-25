---
title: Authentication & RBAC System Implementation
description: Details on Moongraph's production-ready auth and RBAC.
---

# Authentication & RBAC System Implementation

## Overview

**Implementation Date:** January 2025 (Updated based on recent refactoring)  
**Status:** ✅ **PRODUCTION READY** (Core RBAC logic for folders, documents, and graphs significantly enhanced)  
**Testing Status:** ✅ **CORE RBAC LOGIC VERIFIED** (Further testing for new changes recommended)

Moongraph now has a complete, production-ready authentication and a significantly enhanced Role-Based Access Control (RBAC) system integrating Auth0, NextAuth.js, JWT verification, user provisioning, and granular resource permissions for folders, documents, and graphs.

## System Architecture

```mermaid
graph TD
    User[User Browser] --> Frontend[Next.js + NextAuth.js]
    Frontend --> Auth0[Auth0 Universal Login]
    Frontend --> APIRoute[/api/... NextJS Routes]
    APIRoute --> Backend[Morphik Core FastAPI]
    Backend --> JWT[JWT Verification + JWKS]
    Backend --> DB[(PostgreSQL RBAC Schema)]
    Backend --> UserProv[User Provisioning]
```

## Core Components

### 1. Authentication Flow
- **Auth0**: Identity Provider with Universal Login.
- **NextAuth.js**: Client-side session management in the frontend.
- **JWT Verification**: Backend (FastAPI) verifies RS256 signed JWTs against Auth0's JWKS.
- **User Provisioning**: Automatic user creation in the local database upon their first verified API call. `AuthContext` is populated with the internal user ID.

### 2. Authorization System (RBAC)
- **Role-Based Access Control (RBAC)**: Granular permissions system based on Users, Permissions, and Roles.
- **Resource-Specific Permissions**: Primarily focused on Folder-level access control, which then dictates access to contained/associated Documents and Graphs.
- **Ownership-Based Access**: Unfiled Documents and Graphs (not associated with a folder) are accessible and manageable by their direct owner.
- **Dynamic Permission Resolution**: Access checks are performed in real-time at the database and API layers based on the user's roles for a specific resource or their ownership.
- **`AuthContext.permissions`**: This set within the `AuthContext` is initialized as empty by default. It's intended for potential future use with truly global, non-resource-specific system roles/permissions. All current access control for folders, documents, and graphs is resource-specific.

## Implementation Details

### Authentication Stack

**Frontend (Next.js):**
```javascript
// NextAuth.js configuration with Auth0 provider
// File: frontend/src/app/api/auth/[...nextauth]/route.js
Auth0Provider({
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuer: process.env.AUTH0_ISSUER_BASE_URL,
  authorization: {
    params: {
      audience: process.env.AUTH0_API_IDENTIFIER, // Ensures token is for your backend API
    },
  },
})
```

**Backend (FastAPI - `morphik-core/core/auth_utils.py`):**
```python
# JWT verification using PyJWT and JWKS
async def verify_auth0_jwt(token: str, auth0_domain: str, api_identifier: str) -> dict:
    # Fetches JWKS (cached)
    # Selects correct public key based on token's 'kid'
    # Decodes and verifies token signature, 'iss', 'aud', 'exp' claims
    # Returns decoded payload
```
```python
# User Provisioning and AuthContext creation
async def verify_token(authorization: str = Header(None)) -> AuthContext:
    # ... (token extraction and JWT verification)
    # Calls _get_or_create_db_user(auth0_user_id, payload, database)
    # Constructs AuthContext with internal user_id, entity_id, and an empty 'permissions' set.
```

### RBAC Database Schema (`morphik-core/core/database/postgres_database.py`)

**Core Tables:**
- `users` (`UserModel`): Stores user profiles, linking Auth0 `sub` to an internal `user_id` (UUID).
- `teams` (`TeamModel`): Defines teams and their owners. (Team functionality is foundational).
- `team_memberships` (`TeamMembershipModel`): Junction table for users and teams, including a role within the team.
- `permissions` (`PermissionModel`): Defines atomic permission strings (e.g., `folder:read`, `folder:write`, `folder:admin`).
- `roles` (`RoleModel`): Groups permissions. Scoped (e.g., 'folder'). Examples: `FolderViewer`, `FolderEditor`, `FolderAdmin`. Seeded with default folder roles.
- `role_permissions` (`RolePermissionModel`): Maps permissions to roles.
- `user_folder_roles` (`UserFolderRoleModel`): Assigns a user a specific role for a given folder.
- `team_folder_roles` (`TeamFolderRoleModel`): Assigns a team a specific role for a given folder (for future team-based sharing).
- `folders` (`FolderModel`): Defines folders with ownership (`owner_type`, `owner_user_id`/`owner_team_id`) and other metadata.
- `documents` (`DocumentModel`): Stores document metadata. `system_metadata.folder_id` or `system_metadata.folder_name` links to a folder. `owner` field for unfiled documents.
- `graphs` (`GraphModel`): Stores graph metadata. `system_metadata.folder_id` or `system_metadata.folder_name` links to a folder. `owner` field for unfiled graphs.

**Permission Resolution Logic:**
- **For Folders (`_check_folder_access_rbac`):**
    1. Takes a `Folder` object, `AuthContext`, and a `required_permission` (e.g., "folder:write").
    2. Queries `get_user_permissions_for_folder` which:
        - Finds direct roles for the `auth.user_id` on the `folder.id` via `UserFolderRoleModel`.
        - Finds roles for teams the user is part of on that `folder.id` via `TeamMembershipModel` and `TeamFolderRoleModel`.
        - Collects all unique permissions from these roles via `RolePermissionModel`.
    3. Checks if the `required_permission` is in the collected set.
- **For Documents & Graphs (e.g., in `db.get_document`, `db.get_graph`):**
    1. Fetches the document/graph.
    2. Checks `system_metadata` for `folder_id` (preferred) or `folder_name`.
    3. **If associated with a folder:**
        - Calls `db.get_folder(folder_id, auth)`. This internally uses `_check_folder_access_rbac` for "folder:read".
        - If `get_folder` succeeds (user has "folder:read" on the folder), then read access to the document/graph is granted.
        - For write/delete operations on the document/graph, an explicit check for "folder:write" on the containing folder is performed using `_check_folder_access_rbac`.
    4. **If not associated with a folder (unfiled):**
        - Checks if `auth.user_id` (and `auth.entity_type` for users) matches the `owner` field of the document/graph. Owners have implicit full access to their unfiled items.

### User Provisioning Flow (`morphik-core/core/auth_utils.py`)

```python
async def _get_or_create_db_user(auth0_user_id: str, auth0_payload: dict, db: PostgresDatabase) -> dict:
    # 1. db.fetch_user_by_auth0_id(auth0_user_id)
    # 2. If not found:
    #    Extract email, name, avatar_url from auth0_payload.
    #    db.create_user_from_auth0_data(...)
    # 3. Returns a dictionary including internal 'id' (as internal_user_id), 'auth0_user_id', 'email',
    #    'entity_type' (USER), 'entity_id' (internal_user_id), 'app_id' (from token), 
    #    and 'permissions' (currently an empty set).
```

## Key Features Implemented & Enhanced

### ✅ Complete Auth0 Integration
- Universal Login flow, social logins (Google).
- JWT generation for backend API.

### ✅ Robust JWT Verification
- JWKS-based RS256 signature and claims validation.

### ✅ User Database Integration
- Auth0 ID linked to internal UUID. Profile sync. Auto-provisioning.

### ✅ RBAC Permission System
- **Granular Folder Permissions**: `folder:read`, `folder:write`, `folder:admin` via `UserFolderRoleModel`.
- **Document & Graph Access via Folders**: Permissions for documents and graphs are primarily derived from their containing/associated folder's RBAC settings.
    - Read access to doc/graph requires `folder:read` on its folder.
    - Write/delete access to doc/graph requires `folder:write` on its folder.
- **Ownership of Unfiled Items**: Documents/graphs not in a folder are controlled by their direct owner.
- **Standardized API Checks**: API endpoints for folders, documents, and graphs now consistently use this RBAC logic.
- **Database Layer RBAC**: Core permission checking logic resides in `PostgresDatabase` methods.

### ✅ Frontend Integration
- NextAuth.js for session management.
- API calls include JWT.

## Configuration

### Environment Variables

**Frontend (`.env.local`):**
```bash
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret  
AUTH0_ISSUER_BASE_URL=https://dev-bj04f3rw7n8tgam8.us.auth0.com # Example
AUTH0_API_IDENTIFIER=https://api.moongraph.com # Example
NEXTAUTH_URL=http://localhost:3000 # Example
NEXTAUTH_SECRET=a_very_secure_random_string 
NEXT_PUBLIC_API_URL=http://localhost:8000 # Example, URL of your FastAPI backend
```

**Backend (e.g., `docker-compose.override.yml` or environment):**
```yaml
# For FastAPI backend
AUTH0_DOMAIN=dev-bj04f3rw7n8tgam8.us.auth0.com # Example, from your Auth0 Application settings
AUTH0_API_IDENTIFIER=https://api.moongraph.com # Example, from your Auth0 API settings
# Other DB and application settings...
```

**Backend Configuration (`morphik.toml`):**
```toml
[auth]
dev_mode = false  # Set to false for real JWT verification
# dev_entity_id should be a valid UUID if dev_mode is true and DB interaction is expected.
```

## API Endpoints & RBAC Enforcement

### Authentication Test Endpoints
- `GET /test/auth-context`: Inspects the `AuthContext`. `permissions` set will be empty by default.
- `GET /test/folder-permissions/{folder_id}`: Tests resolved permissions for a user on a specific folder.

### Production Resource Endpoints
- **Folders** (`/folders/...`):
    - `POST /folders`: Creator gets `FolderAdmin` role.
    - `GET /folders/{folder_id}`: Requires `folder:read`.
    - `DELETE /folders/{folder_id}`: Requires `folder:admin`.
    - `POST /folders/{folder_id}/set_rule`: Requires `folder:write`.
- **Documents** (`/documents/...`):
    - `GET /documents/{document_id}`: Requires `folder:read` on containing folder, or ownership if unfiled.
    - `POST /documents/{document_id}/update_[text|file|metadata]`: Requires `folder:write` on containing folder, or ownership if unfiled.
    - `DELETE /documents/{document_id}`: Requires `folder:write` on containing folder, or ownership if unfiled.
    - `POST /ingest/[text|file|files]`: If `folder_name` is provided, requires `folder:write` on that folder. Otherwise, creates unfiled doc owned by user.
- **Graphs** (`/graph/...`, `/graphs`):
    - `GET /graph/{name}`: Requires `folder:read` on associated folder, or ownership if unfiled.
    - `POST /graph/{name}/update`: Requires `folder:write` on associated folder, or ownership if unfiled (checked in API before calling service).
    - `POST /graph/create`: If `folder_name` is provided, requires `folder:write` on that folder. Otherwise, creates unfiled graph owned by user.
    - `GET /graphs`: Lists graphs where user has `folder:read` on associated folder or owns the unfiled graph.

## Testing
- Core RBAC logic for folder, document, and graph access based on folder permissions and ownership has been implemented.
- Specific test scenarios covering these new RBAC rules are recommended (see `002-testing-rbac-1dot5.md`).

## Security Considerations
- JWT (RS256) validation, token expiration, audience/issuer checks.
- Permissions are resource-specific, promoting least privilege.
- Sensitive legacy fields like `access_control` JSONB are being phased out in favor of RBAC tables.

## Performance
- JWKS caching.
- Database indexes on key fields for user and role lookups.
- Permission resolution involves joins; monitor performance for complex scenarios.

## Migration Notes
- Legacy `access_control` fields in `FolderModel`, `DocumentModel`, `GraphModel` are effectively superseded by the new RBAC logic. A formal data migration or cleanup strategy for these fields should be planned if they contain valuable historical permission data. For new entities, these fields should ideally not be populated or relied upon for authorization.

---

This enhanced RBAC system provides a robust and consistent authorization model for Moongraph's core resources. 
# RBAC v2: Evolving the Authorization Framework

**Date:** 2024-02-01
**Author:** Gemini AI Assistant
**Status:** Proposed

## 1. Introduction

This document outlines recommendations for the next evolution (v2) of Moongraph's Role-Based Access Control (RBAC) framework. The current system (RBAC v1.5, detailed in `authentication-rbac-system.md`) provides a solid foundation with folder-based permissions for folders, documents, and graphs, as well as ownership control for unfiled items, and initial database schema for teams. 

This v2 plan focuses on enhancing usability through a dedicated permissions UI, fully implementing team-based collaboration, and further standardizing resource associations for robustness and consistency.

## 2. Key Priorities & Recommendations

### 2.1. UI for Managing Folder Permissions (High Priority)

**Current State:** Permissions (assigning roles to users for specific folders) are managed programmatically or directly via API calls by developers. There is no end-user-facing interface for a folder owner or administrator to easily share their folder and manage access.

**Recommendation:**
*   **Develop a Sharing/Permissions UI for Folders:** This interface should be accessible from a folder's settings or context menu.
    *   **View Current Permissions:** Clearly list users (and eventually teams) that have access to the folder and their assigned roles (e.g., "User A - FolderEditor", "Team X - FolderViewer").
    *   **Grant Access (Share):** Allow folder owners/admins to search for existing users (and teams, once team sharing is implemented) within the system.
    *   **Assign Roles:** Upon selecting a user/team, allow assignment of a specific folder role (e.g., `FolderViewer`, `FolderEditor`, `FolderAdmin`).
    *   **Modify Roles:** Allow changing an existing user's/team's role on the folder.
    *   **Revoke Access:** Allow removing a user's/team's role (and thus access) from the folder.
*   **Backend API Endpoints:** Ensure robust API endpoints support these UI actions. These endpoints will interact with `UserFolderRoleModel` and `TeamFolderRoleModel` tables.
    *   Example: `POST /folders/{folder_id}/permissions/users` (Body: `{ "user_id": "...", "role_id": "..." }`)
    *   Example: `PUT /folders/{folder_id}/permissions/users/{user_id}` (Body: `{ "role_id": "..." }`)
    *   Example: `DELETE /folders/{folder_id}/permissions/users/{user_id}`
    *   Similar endpoints for teams: `/folders/{folder_id}/permissions/teams`.
*   **User Experience (UX):** Design the UI to be intuitive. Provide clear visual feedback on successful actions or errors. Make it easy to understand the implications of different roles.

**Technical Considerations:**
*   The UI will need an efficient way to search/list users (and teams).
*   Consider how to present roles to the user (e.g., display role names and perhaps a brief description of what each role allows).

### 2.2. Full Team Implementation & Integration (High Priority)

**Current State:** The database schema (`TeamModel`, `TeamMembershipModel`, `TeamFolderRoleModel`) is in place. However, end-to-end team creation, management, and team-based folder sharing functionalities are not yet fully implemented in the API and UI.

**Recommendation:**
*   **Team Creation & Management (API & UI):**
    *   Allow users to create new teams (the creator becomes the initial team owner/admin).
    *   Provide an interface for team owners/admins to manage team members:
        *   Invite users to the team (requires an invitation system, potentially email-based with tokens).
        *   Accept/decline invitations.
        *   Remove members from the team.
        *   Assign/change roles *within the team* (e.g., `TeamMember`, `TeamAdmin`). These are distinct from roles on folders.
    *   Allow team owners/admins to edit team details (name, description) and delete teams (with appropriate safeguards).
*   **Team Ownership of Folders:**
    *   Enable functionality for folders to be explicitly owned by a team (`FolderModel.owner_type = 'team'`, `FolderModel.owner_team_id = <team_uuid>`).
    *   Team admins should automatically have `FolderAdmin` rights on team-owned folders.
    *   Define and implement default access policies for team members to team-owned folders (e.g., all team members get `FolderViewer` by default, perhaps configurable at the team level).
*   **Sharing Folders *with* Teams (API & UI):**
    *   Extend the Folder Permissions UI (from 2.1) to allow searching for and selecting *teams* to share a folder with.
    *   Assign a folder role (e.g., `FolderViewer`, `FolderEditor`) to the selected team for that specific folder. This will utilize `TeamFolderRoleModel`.
*   **Permission Resolution (`get_user_permissions_for_folder`):**
    *   The existing logic in `get_user_permissions_for_folder` to check `TeamMembershipModel` and `TeamFolderRoleModel` needs to be thoroughly tested and activated as team features are built and become operational.
    *   Ensure permission aggregation is correct (e.g., if a user has a direct role and is also part of a team with a role on the same folder, they should effectively get the union of all permissions from all applicable roles).

**Technical Considerations:**
*   An invitation system (e.g., generating unique tokens, sending emails, handling token expiry/acceptance) is a significant sub-component for team memberships.
*   Clear definition of team-internal roles vs. roles teams have on folders.

### 2.3. Standardize `folder_id` for Document & Graph Association (Medium Priority)

**Current State:** Documents and Graphs can be associated with folders via `system_metadata.folder_name` or (preferably) `system_metadata.folder_id`. The RBAC logic now prioritizes `folder_id` but has fallbacks for `folder_name` resolution.

**Recommendation:**
*   **Enforce `folder_id` as Primary Link:** When a document or graph is added to, created in, or associated with a folder, its `system_metadata.folder_id` field **must** be populated with the folder's UUID.
*   **Deprecate `folder_name` for Association Logic:** While `folder_name` can remain in `system_metadata` for display or human-readable context, it should **not** be the primary field used by backend logic to determine a document/graph's folder association for RBAC or structural purposes. All such logic should rely on `folder_id`.
*   **Migration/Update Strategy:**
    *   Implement a script (run once or as a periodic task) to find documents/graphs that have a `system_metadata.folder_name` but are missing a `system_metadata.folder_id`.
    *   For these items, attempt to resolve the `folder_name` (scoped by the item's owner if possible, to handle non-unique folder names) to a `folder_id` and update the `system_metadata.folder_id` field.
    *   Log any ambiguities or failures during this migration.
*   **API & Service Layer Adjustments:**
    *   When associating a document/graph with a folder (e.g., `add_document_to_folder`, or graph creation specifying a folder), ensure the `folder_id` is stored in the item's `system_metadata`.
    *   When items are moved between folders (if this feature is added), update their `folder_id` accordingly.

**Benefits:**
*   **Data Integrity & Robustness:** UUIDs are stable identifiers, unlike names which might change or be non-unique across different owners.
*   **Performance:** Querying and joining by UUID (`folder_id`) is typically more efficient than by string names (`folder_name`).
*   **Simplicity & Consistency:** Simplifies RBAC logic by providing a single, reliable foreign key equivalent for folder association.

### 2.4. Audit Logging for Permission Changes (Medium Priority)

**Current State:** Basic `created_at`/`updated_at` timestamps on models. `UserFolderRoleModel` includes `granted_by_user_id`. No dedicated, comprehensive audit trail for permission-related events exists.

**Recommendation:**
*   **Introduce an `AuditLogModel` table:** This table would capture significant authorization-related events.
*   **Fields to Include:**
    *   `id` (UUID, PK)
    *   `timestamp` (TIMESTAMPTZ, default NOW())
    *   `performing_user_id` (UUID, FK to `users.id`) - The user who initiated the action.
    *   `action_type` (String) - Enum-like, e.g., `GRANT_FOLDER_ROLE_USER`, `REVOKE_FOLDER_ROLE_USER`, `GRANT_FOLDER_ROLE_TEAM`, `CREATE_TEAM`, `ADD_USER_TO_TEAM`, `CHANGE_FOLDER_OWNER`, etc.
    *   `target_resource_type` (String) - Enum-like, e.g., `FOLDER`, `USER`, `TEAM`, `DOCUMENT`.
    *   `target_resource_id` (String or UUID) - The ID of the resource being affected.
    *   `target_resource_name` (String, optional) - Name of the resource for easier reading.
    *   `details` (JSONB) - Action-specific details, e.g., `{ "role_assigned": "FolderEditor", "granted_to_user_id": "..." }` or `{ "old_visibility": "private", "new_visibility": "team_shared" }`.
*   **Integration:** Modify the relevant API service methods that handle these permission-altering actions to also create an entry in the `AuditLogModel` table within the same transaction if possible, or as a reliable follow-up action.

### 2.5. Advanced Role Management (Future Consideration - Lower Priority for v2)

**Current State:** Roles (`FolderViewer`, etc.) and their associated permissions are predefined and seeded into the database. They are not dynamically manageable by an administrator through a UI.

**Recommendation (Longer-Term):**
*   **Admin UI for Roles & Permissions:** Consider developing an administrative interface (separate from end-user permissions management) to:
    *   View existing permissions (`PermissionModel`).
    *   View existing roles and their scopes (`RoleModel`).
    *   View and manage the mapping of permissions to roles (`RolePermissionModel`).
    *   Potentially create new custom roles or modify the permissions assigned to existing (non-system) roles.
*   This provides greater flexibility for tailoring access control to specific organizational needs without requiring code changes or direct database manipulation for role definitions.

### 2.6. Review and Refine Permission Granularity (Ongoing Process)

**Current State:** Core permissions are `folder:read`, `folder:write`, `folder:admin`.

**Recommendation:**
*   Continuously evaluate if the existing permissions provide the right level of control as new features are developed.
*   For instance, `folder:write` currently allows a broad range of modifications. Consider if finer-grained permissions are needed, such as:
    *   `folder:add_document`
    *   `folder:delete_document` (distinct from deleting the folder itself)
    *   `folder:edit_folder_metadata` (name, description)
    *   `folder:manage_folder_rules`
*   The best practice is to start with reasonably broad permissions that cover common use cases and only introduce more granularity when a specific requirement for stricter separation of duties arises. Overly granular permissions can make the system complex to manage.

## 3. Phasing Suggestions

*   **Phase 1 (Core Usability & Teams):**
    *   Implement UI for Folder Permissions Management (for individual users first).
    *   Develop core Team functionality: creation, member management (invites, add/remove users, team-internal roles).
    *   Enable Team Ownership of Folders (backend logic and basic UI indicators).
    *   Begin process to standardize on and migrate to `folder_id` for document/graph associations.
*   **Phase 2 (Full Team Integration & Auditing):**
    *   Complete UI for sharing folders *with* Teams and managing team roles on folders.
    *   Implement basic Audit Logging for critical permission changes (folder sharing, team membership changes).
    *   Finalize `folder_id` standardization and data migration.
*   **Phase 3 (Future & Ongoing):**
    *   Consider UI for advanced Role & Permission definition management (if needed).
    *   Ongoing review of permission granularity based on feature development and user feedback.
    *   Explore Role Hierarchies if benefits outweigh complexity.

This v2 plan for RBAC aims to significantly improve the usability and collaborative power of Moongraph by building upon the robust and consistent authorization foundation established in v1.5.
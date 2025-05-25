# RBAC v1.5 - Testing Plan for Recent Developments

**Date:** 2024-02-01
**Author:** Gemini AI Assistant
**Status:** Proposed

## 1. Introduction

This document outlines key testing scenarios that should be executed to verify the recent RBAC (Role-Based Access Control) development work. This work focused on standardizing authorization checks for Folders, Documents, and Graphs, primarily making their access dependent on Folder permissions or direct Ownership for unfiled items.

The goal of this testing is to ensure:
*   Correct enforcement of `folder:read`, `folder:write`, and `folder:admin` permissions.
*   Correct access control for documents and graphs based on their containing folder's permissions.
*   Correct access control for unfiled documents and graphs based on ownership.
*   API endpoints behave as expected under various permission scenarios.
*   No regressions in basic authentication or user provisioning.

## 2. Prerequisites & Setup

*   **Environment:** A development or staging environment with the latest backend code deployed.
*   **Users:** At least three distinct test users provisioned via Auth0 and in the local database:
    *   `User_Owner`: Will create and own resources.
    *   `User_Collaborator_Editor`: Will be granted edit access to some resources.
    *   `User_Collaborator_Viewer`: Will be granted read-only access to some resources.
    *   `User_No_Access`: Will have no explicit permissions on specific test resources.
*   **Tools:**
    *   API client (e.g., Postman, Insomnia, or curl scripts) for direct API calls.
    *   Access to frontend UI to trigger actions (if UI reflects these backend changes).
    *   Database inspection tool to verify role assignments and ownership.
    *   Access to backend logs for troubleshooting.
*   **Initial RBAC Data:** Ensure `permissions` (`folder:read`, `folder:write`, `folder:admin`) and `roles` (`FolderViewer`, `FolderEditor`, `FolderAdmin`) are correctly seeded in the database.

## 3. Test Scenarios

### 3.1. Folder Permissions

**Scenario 3.1.1: Folder Creation & Ownership**
1.  **Action:** `User_Owner` creates a new folder ("TestFolderOwner").
2.  **Expected:**
    *   Folder is created successfully.
    *   `User_Owner` is set as `owner_user_id` and `owner_type='user'`.
    *   `User_Owner` is automatically granted the `FolderAdmin` role on "TestFolderOwner" (verify in `UserFolderRoleModel`).
    *   `User_Owner` can perform read, write, and admin operations on "TestFolderOwner".

**Scenario 3.1.2: Granting Folder Roles**
1.  **Setup:** `User_Owner` has "TestFolderOwner".
2.  **Action (as `User_Owner` via API/DB):**
    *   Grant `User_Collaborator_Editor` the `FolderEditor` role on "TestFolderOwner".
    *   Grant `User_Collaborator_Viewer` the `FolderViewer` role on "TestFolderOwner".
3.  **Expected:**
    *   Verify entries in `UserFolderRoleModel` for these grants.

**Scenario 3.1.3: Testing `FolderViewer` Role**
1.  **Setup:** `User_Collaborator_Viewer` has `FolderViewer` role on "TestFolderOwner".
2.  **Actions (as `User_Collaborator_Viewer`):**
    *   Attempt to list/get "TestFolderOwner" details. **Expected: Success.**
    *   Attempt to update "TestFolderOwner" (e.g., rename, set rule). **Expected: Failure (403 Forbidden).**
    *   Attempt to delete "TestFolderOwner". **Expected: Failure (403 Forbidden).**
    *   Attempt to add a document to "TestFolderOwner". **Expected: Failure (403 Forbidden).**

**Scenario 3.1.4: Testing `FolderEditor` Role**
1.  **Setup:** `User_Collaborator_Editor` has `FolderEditor` role on "TestFolderOwner".
2.  **Actions (as `User_Collaborator_Editor`):**
    *   Attempt to list/get "TestFolderOwner" details. **Expected: Success.**
    *   Attempt to update "TestFolderOwner" (e.g., rename, set rule). **Expected: Success.**
    *   Attempt to add/remove documents from "TestFolderOwner". **Expected: Success.**
    *   Attempt to delete "TestFolderOwner". **Expected: Failure (403 Forbidden).** (As `FolderEditor` doesn't include `folder:admin`).

**Scenario 3.1.5: Testing `FolderAdmin` Role**
1.  **Setup:** `User_Owner` has `FolderAdmin` role on "TestFolderOwner".
2.  **Actions (as `User_Owner`):**
    *   Perform all operations from 3.1.3 and 3.1.4. **Expected: All succeed, including delete.**
    *   Attempt to grant/revoke roles to other users on "TestFolderOwner" (if API for this exists).

**Scenario 3.1.6: No Access**
1.  **Setup:** `User_No_Access` has no roles on "TestFolderOwner".
2.  **Actions (as `User_No_Access`):**
    *   Attempt to list/get "TestFolderOwner". **Expected: Folder not found or access denied (404 or 403).**
    *   Attempt any write/admin operation. **Expected: Failure.**

### 3.2. Document Permissions (within Folders)

**Setup for 3.2:**
*   `User_Owner` creates "FolderA".
*   `User_Owner` ingests "Doc1.txt" into "FolderA".
*   `User_Owner` grants `FolderViewer` role on "FolderA" to `User_Collaborator_Viewer`.
*   `User_Owner` grants `FolderEditor` role on "FolderA" to `User_Collaborator_Editor`.

**Scenario 3.2.1: Read Document (Viewer)**
1.  **Action (as `User_Collaborator_Viewer`):** Attempt to `GET /documents/{Doc1.txt_id}`.
2.  **Expected: Success.** Document content/metadata returned.

**Scenario 3.2.2: Update/Delete Document (Viewer)**
1.  **Action (as `User_Collaborator_Viewer`):**
    *   Attempt to `POST /documents/{Doc1.txt_id}/update_text`.
    *   Attempt to `DELETE /documents/{Doc1.txt_id}`.
2.  **Expected: Failure (403 Forbidden) for both.** (`folder:read` does not grant `folder:write`).

**Scenario 3.2.3: Read/Update/Delete Document (Editor)**
1.  **Action (as `User_Collaborator_Editor`):**
    *   Attempt to `GET /documents/{Doc1.txt_id}`. **Expected: Success.**
    *   Attempt to `POST /documents/{Doc1.txt_id}/update_text`. **Expected: Success.**
    *   Attempt to `DELETE /documents/{Doc1.txt_id}`. **Expected: Success.** (`folder:write` grants these).

**Scenario 3.2.4: Document Access (No Folder Access)**
1.  **Action (as `User_No_Access`):** Attempt to `GET /documents/{Doc1.txt_id}`.
2.  **Expected: Failure (404 or 403).**

### 3.3. Document Permissions (Unfiled - Ownership)

**Setup for 3.3:**
*   `User_Owner` ingests "UnfiledDoc.txt" *without* specifying a folder.

**Scenario 3.3.1: Owner Access**
1.  **Action (as `User_Owner`):**
    *   `GET /documents/{UnfiledDoc.txt_id}`. **Expected: Success.**
    *   `POST /documents/{UnfiledDoc.txt_id}/update_text`. **Expected: Success.**
    *   `DELETE /documents/{UnfiledDoc.txt_id}`. **Expected: Success.**
2.  **Expected:** All operations succeed.

**Scenario 3.3.2: Non-Owner Access**
1.  **Action (as `User_Collaborator_Editor` or `User_No_Access`):**
    *   Attempt to `GET /documents/{UnfiledDoc.txt_id}`.
    *   Attempt to `POST /documents/{UnfiledDoc.txt_id}/update_text`.
    *   Attempt to `DELETE /documents/{UnfiledDoc.txt_id}`.
2.  **Expected: Failure (404 or 403) for all.** Unfiled documents are private to the owner.

### 3.4. Graph Permissions (Associated with Folders)

**Setup for 3.4:**
*   `User_Owner` has "FolderA" (from 3.2).
*   `User_Owner` creates "Graph1" associated with `folder_name`: "FolderA".
*   (Permissions on "FolderA" for collaborators remain as in 3.2).

**Scenario 3.4.1: Read Graph (Viewer via Folder)**
1.  **Action (as `User_Collaborator_Viewer`):** Attempt to `GET /graph/Graph1` (potentially with `folder_name="FolderA"` query param if API requires for disambiguation).
2.  **Expected: Success.** Graph object returned (document_ids within might be filtered based on viewer's direct doc access, though primary graph object access is via folder).

**Scenario 3.4.2: Update Graph (Viewer via Folder)**
1.  **Action (as `User_Collaborator_Viewer`):** Attempt to `POST /graph/Graph1/update`.
2.  **Expected: Failure (403 Forbidden).** (`folder:read` on "FolderA" does not grant write access to graph).

**Scenario 3.4.3: Read/Update Graph (Editor via Folder)**
1.  **Action (as `User_Collaborator_Editor`):**
    *   Attempt to `GET /graph/Graph1`. **Expected: Success.**
    *   Attempt to `POST /graph/Graph1/update`. **Expected: Success.** (`folder:write` on "FolderA" grants these).

**Scenario 3.4.4: Graph Access (No Folder Access)**
1.  **Action (as `User_No_Access`):** Attempt to `GET /graph/Graph1`.
2.  **Expected: Failure (404 or 403).**

### 3.5. Graph Permissions (Unfiled - Ownership)

**Setup for 3.5:**
*   `User_Owner` creates "UnfiledGraph1" *without* specifying a folder.

**Scenario 3.5.1: Owner Access**
1.  **Action (as `User_Owner`):**
    *   `GET /graph/UnfiledGraph1`. **Expected: Success.**
    *   `POST /graph/UnfiledGraph1/update`. **Expected: Success.**
2.  **Expected:** All operations succeed.

**Scenario 3.5.2: Non-Owner Access**
1.  **Action (as `User_Collaborator_Editor` or `User_No_Access`):**
    *   Attempt to `GET /graph/UnfiledGraph1`.
    *   Attempt to `POST /graph/UnfiledGraph1/update`.
2.  **Expected: Failure (404 or 403) for all.** Unfiled graphs are private to owner.

### 3.6. List Endpoints

**Scenario 3.6.1: List Folders**
1.  **Action (as `User_Owner`, `User_Collaborator_Editor`, `User_Collaborator_Viewer`, `User_No_Access`):** Call `GET /folders`.
2.  **Expected:** Each user sees only the folders they have at least `folder:read` access to (either as owner or via a role). `User_No_Access` might see an empty list if they have no access to any folders created by `User_Owner`.

**Scenario 3.6.2: List Documents (`POST /documents`)**
1.  **Action (as each user type):** Call `POST /documents` (list endpoint).
    *   Without `folder_name` filter.
    *   With `folder_name="FolderA"` filter.
2.  **Expected:**
    *   Without folder filter: Users see all documents they own (unfiled) AND all documents in folders they have `folder:read` access to.
    *   With `folder_name="FolderA"`:
        *   `User_Owner`, `User_Collaborator_Editor`, `User_Collaborator_Viewer` see "Doc1.txt".
        *   `User_No_Access` sees an empty list or error if the folder itself is inaccessible.

**Scenario 3.6.3: List Graphs (`GET /graphs`)**
1.  **Action (as each user type):** Call `GET /graphs`.
    *   Without `folder_name` filter.
    *   With `folder_name="FolderA"` filter.
2.  **Expected:**
    *   Without folder filter: Users see all graphs they own (unfiled) AND all graphs in folders they have `folder:read` access to.
    *   With `folder_name="FolderA"`:
        *   `User_Owner`, `User_Collaborator_Editor`, `User_Collaborator_Viewer` see "Graph1".
        *   `User_No_Access` sees an empty list or error.

### 3.7. Negative Cases & Edge Cases

*   Attempt to access resources with malformed UUIDs. Expected: 400 Bad Request.
*   Attempt to assign a non-existent role ID or permission ID. Expected: Appropriate error (e.g., 404 or 400 if APIs for direct role/perm manipulation are tested).
*   If `folder_id` in a document's/graph's `system_metadata` points to a non-existent folder. Expected: Access denied or item treated as unfiled for ownership check (behavior should be consistent).
*   User has `FolderEditor` role. Folder owner (`FolderAdmin`) deletes the folder. What happens when `FolderEditor` tries to access documents previously in that folder? Expected: Documents should now be inaccessible or treated as orphaned/deleted.

## 4. Verification Points

*   **API Responses:** Correct HTTP status codes (200, 201, 204, 400, 401, 403, 404, 500). Correct response bodies.
*   **Database State:** Verify records in `UserFolderRoleModel`, `FolderModel` (ownership), `DocumentModel` (`system_metadata.folder_id`), `GraphModel` (`system_metadata.folder_id`, `owner`) are as expected after operations.
*   **Backend Logs:** Check for unexpected errors, correct logging of permission checks (granted/denied messages).

This testing plan provides a starting point. Additional test cases should be added based on specific implementation details and potential complexities discovered during development.
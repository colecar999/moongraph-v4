# Moongraph User Model (`users` Table)

## 1. Overview

**Date:** October 26, 2023 (Note: Use current date when generating)
**Author:** Moongraph AI Assistant
**Status:** Proposed

This document details the design and implementation plan for the `users` table (represented by the `UserModel` in SQLAlchemy) within the Morphik Core backend. This model is a cornerstone of the new authentication and authorization system detailed in the main `authentication.md` plan. Its primary purpose is to link user identities from Auth0 (our chosen Identity Provider) to internal user profiles and associated data within the Moongraph application.

## 2. Context and Purpose

As Moongraph evolves to support more sophisticated features like team collaboration, granular permissions, and enterprise knowledge management, a robust user model is essential. The `users` table serves as the central repository for user-specific information that is managed internally by Moongraph, while still leveraging Auth0 for the primary concerns of identity verification and credential management.

Key functions of this model include:

*   **Linking Auth0 Identities:** Storing the unique `auth0_user_id` (the `sub` claim from Auth0's JWT) to reliably connect an authenticated session to an internal Moongraph user.
*   **Storing Internal User Profiles:** Persisting user attributes synced from Auth0 (like email, name, avatar) and providing a schema for Moongraph-specific user data in the future.
*   **Foundation for Authorization:** Serving as the primary entity to which team memberships, roles, and permissions will be associated. Foreign keys from other tables (e.g., `teams.owner_user_id`, `team_memberships.user_id`) will reference `users.id`.

This model directly supports the implementation of user provisioning upon first login, as described in the authentication flow.

## 3. Requirements

The `users` table and its corresponding SQLAlchemy model must satisfy the following requirements:

*   **Unique Internal Identifier:** Each user must have a unique internal Moongraph User ID (UUID, Primary Key).
*   **Auth0 Linkage:** Securely store and uniquely identify users by their `auth0_user_id`. This field must be indexed for efficient lookups.
*   **Profile Information:** Store essential user profile details synced from Auth0:
    *   Email address (must be unique and indexed).
    *   Display name (nullable).
    *   Avatar URL (nullable).
*   **Auditing Timestamps:** Track when a user record is created (`created_at`) and last updated (`updated_at`).
*   **Extensibility:** Allow for future additions of Moongraph-specific user profile attributes or settings without major schema overhauls.
*   **Database Integrity:** Enforce uniqueness constraints on `auth0_user_id` and `email`.

## 4. Proposed Schema Definition

The schema for the `users` table is derived from the specifications in `authentication.md` (Section 6.2).

*   **Table Name:** `users`

| Column Name     | Data Type      | Constraints                                       | Description                                            |
|-----------------|----------------|---------------------------------------------------|--------------------------------------------------------|
| `id`            | UUID           | Primary Key, Default: `uuid.uuid4()`              | Internal Moongraph User ID.                            |
| `auth0_user_id` | VARCHAR(255)   | Unique, Indexed, Not Null                         | The `sub` claim from Auth0 JWT.                        |
| `email`         | VARCHAR(255)   | Unique, Indexed, Not Null                         | User's email address, synced from Auth0.               |
| `name`          | VARCHAR(255)   | Nullable                                          | User's display name, synced from Auth0.                |
| `avatar_url`    | TEXT           | Nullable                                          | URL for user's avatar image, synced from Auth0.        |
| `created_at`    | TIMESTAMPTZ    | Not Null, Default: `NOW()`                        | Timestamp of record creation.                          |
| `updated_at`    | TIMESTAMPTZ    | Not Null, Default: `NOW()`, On Update: `NOW()`    | Timestamp of last record update.                       |
| `settings`      | JSONB          | Nullable, Default: `{}`                           | Future: Moongraph-specific user settings/preferences.  |

*(Note: `settings` column added as an example of extensibility, not explicitly in original `authentication.md` but good practice).*

## 5. Implementation Plan: SQLAlchemy Model

The `users` table will be represented by a SQLAlchemy model class named `UserModel` within `morphik-core/core/database/postgres_database.py`.

```python
# Example structure within postgres_database.py
# from sqlalchemy import Column, String, DateTime, func
# from sqlalchemy.dialects.postgresql import UUID, JSONB, TEXT
# from sqlalchemy.ext.declarative import declarative_base
# import uuid # For UUID generation

# Base = declarative_base() # Assuming Base is already defined

class UserModel(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auth0_user_id = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=True)
    avatar_url = Column(TEXT, nullable=True) # Using TEXT for potentially longer URLs
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    # Example of an extensible settings field:
    # settings = Column(JSONB, nullable=True, server_default='{}')


    # __table_args__ can be used for more complex constraints or multi-column indexes if needed later.
    # For now, unique=True and index=True on columns suffice.
    # Example:
    # __table_args__ = (
    #     Index('idx_user_email_unique_case_insensitive', func.lower(email), unique=True),
    # )

    def __repr__(self):
        return f"<UserModel(id={self.id}, email=\'{self.email}\', auth0_id=\'{self.auth0_user_id}\')>"

```

**Key Implementation Details:**
*   **UUIDs:** `sqlalchemy.dialects.postgresql.UUID(as_uuid=True)` will be used for the `id` field, ensuring Python `uuid.UUID` objects are handled correctly.
*   **Timestamps:** `DateTime(timezone=True)` with `server_default=func.now()` and `onupdate=func.now()` for `created_at` and `updated_at` respectively, leveraging database-side timestamp management.
*   **Nullability:** `nullable=False` will be enforced for `auth0_user_id` and `email`.
*   **Indexes:** SQLAlchemy's `index=True` and `unique=True` will create the necessary database indexes.

## 6. Data Management and Synchronization

*   **User Provisioning:**
    *   New users will be added to the `users` table by the `_get_or_create_db_user` function in `morphik-core/core/auth_utils.py`.
    *   This function is called after successful Auth0 JWT validation.
    *   It will attempt to fetch a user by `auth0_user_id`. If not found, it will extract profile information (email, name, avatar\_url) from the Auth0 token payload and call a new method in `PostgresDatabase` (e.g., `create_user_from_auth0_data`) to insert the new user record.
*   **Profile Synchronization (Consideration):**
    *   Upon subsequent logins, the `_get_or_create_db_user` function (or a dedicated sync mechanism) could compare the profile information in the Auth0 token payload with the data in the `users` table.
    *   If discrepancies are found (e.g., user changed their name or avatar in Auth0), the local record in the `users` table should be updated. This ensures user profile data remains reasonably consistent.
    *   The `updated_at` timestamp will reflect these changes.
*   **Data Integrity:** The database schema (unique constraints) will prevent duplicate `auth0_user_id` or `email` entries.

## 7. Key System Interactions

*   **`morphik-core/core/auth_utils.py`:**
    *   The `verify_token` function, through its call to `_get_or_create_db_user`, is the primary point of interaction for reading from and writing to the `users` table during the authentication flow.
*   **`morphik-core/core/database/postgres_database.py`:**
    *   Will house the `UserModel` SQLAlchemy class definition.
    *   Will require new methods such as:
        *   `fetch_user_by_auth0_id(auth0_user_id: str) -> Optional[UserModel]`
        *   `create_user_from_auth0_data(user_data: dict) -> UserModel`
        *   Optionally, `update_user_profile(user_id: UUID, profile_data: dict) -> Optional[UserModel]` for profile sync.
*   **Other Models/Tables:**
    *   `teams.owner_user_id` will be a foreign key to `users.id`.
    *   `team_memberships.user_id` will be a foreign key to `users.id`.
    *   `user_folder_roles.user_id` will be a foreign key to `users.id`.
    *   `invitations.invited_by_user_id` will be a foreign key to `users.id`.

## 8. Schema Management and Evolution

*   **Initial Creation:** The `UserModel` class, once defined in `postgres_database.py`, will be included in `Base.metadata`. The `Base.metadata.create_all(conn, checkfirst=True)` call within the `PostgresDatabase.initialize()` method will create the `users` table in the database if it does not already exist.
*   **Future Migrations:**
    *   `create_all` does not handle schema alterations (e.g., adding columns, changing types, adding/removing constraints) on existing tables.
    *   For future changes to the `users` table schema, a proper database migration strategy is highly recommended. Options include:
        *   **Alembic:** A full-featured database migration tool for SQLAlchemy. This is the preferred approach for robust, version-controlled schema evolution.
        *   **Manual SQL Scripts:** Writing and applying SQL DDL scripts manually. This is less maintainable and more error-prone for complex changes.
    *   For now, any immediate minor additions (like adding a nullable `settings` JSONB column if decided upon) could potentially be handled with an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statement in `initialize()`, similar to existing patterns in that method, but this is not a scalable long-term solution.

## 9. Security and PII Considerations

*   The `users` table will store Personally Identifiable Information (PII), notably `email` and potentially `name`. All access to this data must be appropriately secured and logged.
*   The `auth0_user_id` is a sensitive identifier linking to the external IdP and should be protected.
*   Database access controls and application-level authorization checks must ensure that only authorized services or personnel can query or modify this table.
*   Consider implications of data privacy regulations (e.g., GDPR, CCPA) regarding user data storage, access, and deletion.

## 10. Future Enhancements (Post-MVP)

Beyond the core requirements, the `users` table could be extended to support:

*   User-specific settings or preferences (e.g., theme, notification settings).
*   Last login timestamp.
*   Account status (e.g., active, suspended, pending verification).
*   Internal roles or flags not directly tied to the granular RBAC system (e.g., "is_support_admin").
*   API key management if users can generate their own API keys for external integrations.

This document serves as the initial plan for the `UserModel`. It should be reviewed and updated as implementation progresses and new requirements emerge. 
# Database (`DATABASE.md`)

## Overview

The `core/database` module is responsible for all persistent metadata storage within Morphik Core, excluding vector embeddings which are handled by the `core/vector_store` module. It defines interfaces and implementations for interacting with a relational database, primarily PostgreSQL. This module manages metadata for documents, knowledge graphs, user limits, and folders.

## Core Components

### 1. `BaseDatabase` (in `base_database.py`)

This abstract base class (`ABC`) defines the standard interface for all database interactions related to documents, graphs, caches, and folders. Subclasses must implement these methods.

**Key Abstract Methods:**

*   **Document Operations**:
    *   `store_document(self, document: Document) -> bool`: Stores document metadata.
    *   `get_document(self, document_id: str, auth: AuthContext) -> Optional[Document]`: Retrieves a document by ID, checking authorization.
    *   `get_document_by_filename(self, filename: str, auth: AuthContext, system_filters: Optional[Dict[str, Any]] = None) -> Optional[Document]`: Retrieves a document by filename, scoped by auth and optional system filters.
    *   `get_documents_by_id(self, document_ids: List[str], auth: AuthContext, system_filters: Optional[Dict[str, Any]] = None) -> List[Document]`: Batch retrieves multiple documents.
    *   `get_documents(self, auth: AuthContext, skip: int = 0, limit: int = 100, filters: Optional[Dict[str, Any]] = None, system_filters: Optional[Dict[str, Any]] = None) -> List[Document]`: Lists documents with pagination and filtering.
    *   `update_document(self, document_id: str, updates: Dict[str, Any], auth: AuthContext) -> bool`: Updates document metadata.
    *   `delete_document(self, document_id: str, auth: AuthContext) -> bool`: Deletes a document.
    *   `find_authorized_and_filtered_documents(self, auth: AuthContext, filters: Optional[Dict[str, Any]] = None, system_filters: Optional[Dict[str, Any]] = None) -> List[str]`: Finds IDs of documents matching filters and auth.
    *   `check_access(self, document_id: str, auth: AuthContext, required_permission: str = "read") -> bool`: Checks user access permissions for a document.
*   **Cache Metadata Operations**:
    *   `store_cache_metadata(self, name: str, metadata: Dict[str, Any]) -> bool`: Stores metadata for a cache.
    *   `get_cache_metadata(self, name: str) -> Optional[Dict[str, Any]]`: Retrieves cache metadata.
*   **Graph Operations**:
    *   `store_graph(self, graph: Graph) -> bool`: Stores a knowledge graph.
    *   `get_graph(self, name: str, auth: AuthContext, system_filters: Optional[Dict[str, Any]] = None) -> Optional[Graph]`: Retrieves a graph by name.
    *   `list_graphs(self, auth: AuthContext, system_filters: Optional[Dict[str, Any]] = None) -> List[Graph]`: Lists accessible graphs.
    *   `update_graph(self, graph: Graph) -> bool`: Updates an existing graph.
    *   `delete_graph(self, graph_name: str, auth: AuthContext) -> bool`: Deletes a graph.
*   **Folder Operations**:
    *   `create_folder(self, folder: Folder) -> bool`: Creates a new folder.
    *   `get_folder(self, folder_id: str, auth: AuthContext) -> Optional[Folder]`: Retrieves a folder by ID.
    *   `get_folder_by_name(self, name: str, auth: AuthContext) -> Optional[Folder]`: Retrieves a folder by name.
    *   `list_folders(self, auth: AuthContext) -> List[Folder]`: Lists accessible folders.
    *   `add_document_to_folder(self, folder_id: str, document_id: str, auth: AuthContext) -> bool`: Adds a document to a folder.
    *   `remove_document_from_folder(self, folder_id: str, document_id: str, auth: AuthContext) -> bool`: Removes a document from a folder.

### 2. `PostgresDatabase` (in `postgres_database.py`)

This class implements `BaseDatabase` using PostgreSQL with SQLAlchemy for ORM and asynchronous operations (`asyncpg`).

**SQLAlchemy Models:**
The module defines SQLAlchemy models that map to database tables:
*   `DocumentModel`: For storing `Document` metadata. Fields include `external_id`, `owner`, `content_type`, `filename`, `doc_metadata` (JSONB for user metadata), `storage_info` (JSONB), `system_metadata` (JSONB), `access_control` (JSONB), `chunk_ids` (JSONB), `storage_files` (JSONB). Indexes are created on `owner`, `access_control`, and `system_metadata` (including specific fields like `folder_name` and `end_user_id` within `system_metadata`).
*   `GraphModel`: For storing `Graph` data. Fields include `id`, `name`, `entities` (JSONB), `relationships` (JSONB), `graph_metadata` (JSONB), `system_metadata` (JSONB), `document_ids` (JSONB), `filters` (JSONB), `created_at`, `updated_at`, `owner`, `access_control`. Indexes are created on `name`, `owner`, `access_control`, `system_metadata`, and a unique index on `(name, owner->>'id')`.
*   `FolderModel`: For storing `Folder` data. Fields include `id`, `name`, `description`, `owner` (JSONB), `document_ids` (JSONB), `system_metadata` (JSONB), `access_control` (JSONB), `rules` (JSONB). Indexes are on `name`, `owner`, `access_control`.

**Key Features & Implementation Details:**
*   **Initialization (`__init__`, `initialize`)**:
    *   Takes a PostgreSQL connection `uri`.
    *   Configures an asynchronous SQLAlchemy engine (`create_async_engine`) with connection pool settings (size, overflow, recycle, timeout, pre-ping) derived from `core.config`.
    *   The `initialize` method creates all defined tables (Documents, Graphs, Folders) and a `caches` table (using raw SQL for backward compatibility) if they don't exist. It also ensures necessary columns (like `storage_files` in `documents`, `rules` in `folders`, `system_metadata` in `graphs`) and indexes (e.g., on `system_metadata->>'folder_name'`, `system_metadata->>'end_user_id'`) are present, performing alterations if needed.
*   **Asynchronous Operations**: All database interactions are asynchronous using `async/await` and SQLAlchemy's async capabilities.
*   **JSONB Usage**: Leverages PostgreSQL's JSONB type for storing flexible metadata fields (e.g., `doc_metadata`, `system_metadata`, `entities`, `relationships`).
*   **Access Control**:
    *   `_build_access_filter(self, auth: AuthContext) -> str`: Constructs a SQL WHERE clause fragment to filter results based on the `AuthContext` (owner, readers, writers, admins, app_id, user_id in cloud mode).
    *   `_build_metadata_filter(self, filters: Dict[str, Any]) -> str`: Constructs SQL for filtering based on user-defined metadata in `doc_metadata`.
    *   `_build_system_metadata_filter(self, system_filters: Optional[Dict[str, Any]]) -> str`: Constructs SQL for filtering based on system metadata fields like `folder_name` or `end_user_id`.
*   **Document Storage (`store_document`, `update_document`)**:
    *   Handles the renaming of `metadata` from the `Document` model to `doc_metadata` for database storage.
    *   Serializes `datetime` objects to ISO format strings before storage.
    *   When updating, it preserves existing `system_metadata` fields not explicitly being updated and always updates the `updated_at` timestamp.
*   **Folder Management**: Implements methods for creating folders, adding/removing documents, and ensuring that document `system_metadata` is updated with `folder_name` when added to a folder.
*   **Graph Management**: Implements methods for storing, retrieving, listing, and updating graphs. It handles the `metadata` to `graph_metadata` field renaming for `GraphModel`. When retrieving or listing graphs with `system_filters`, it further filters the `document_ids` within each graph to ensure they match the provided system criteria.
*   **Error Handling**: Includes logging for errors during database operations.

### 3. `UserLimitsDatabase` (in `user_limits_db.py`)

This class manages user-specific limits and usage tracking, primarily for "cloud" mode.

**SQLAlchemy Model:**
*   `UserLimitsModel`: Defines the `user_limits` table. Fields include `user_id` (primary key), `tier` (e.g., "free", "pro"), `custom_limits` (JSONB), `usage` (JSONB for various counters like storage, queries, ingests), `app_ids` (JSONB), Stripe-related IDs (`stripe_customer_id`, `stripe_subscription_id`, `stripe_product_id`), `subscription_status`, `created_at`, `updated_at`.

**Key Features & Implementation Details:**
*   **Initialization (`__init__`, `initialize`)**:
    *   Similar to `PostgresDatabase`, it sets up an async SQLAlchemy engine.
    *   `initialize` creates the `user_limits` table and attempts to migrate it by adding new Stripe-related columns if they don't exist.
*   **User Limit Management**:
    *   `get_user_limits(self, user_id: str) -> Optional[Dict[str, Any]]`: Retrieves limits and usage for a user.
    *   `create_user_limits(self, user_id: str, tier: str = "free") -> bool`: Creates a new user record, defaulting to the "free" tier and initializing usage counters.
    *   `update_user_tier(self, user_id: str, tier: str, custom_limits: Optional[Dict[str, Any]] = None) -> bool`: Updates a user's tier and custom limits.
    *   `update_subscription_info(self, user_id: str, subscription_data: Dict[str, Any]) -> bool`: Updates Stripe subscription details.
*   **App Registration**:
    *   `register_app(self, user_id: str, app_id: str) -> bool`: Adds an `app_id` to the user's list of registered apps. Uses raw SQL with `jsonb_array_append` for reliable array updates.
*   **Usage Tracking (`update_usage`)**:
    *   Increments usage counters (e.g., `hourly_query_count`, `storage_file_count`) based on `usage_type`.
    *   Handles hourly and monthly reset logic for time-windowed counters.
    *   Forces SQLAlchemy to detect changes to JSONB `usage` field by creating a new dictionary.

## Configuration

*   **`POSTGRES_URI`**: The primary connection string for PostgreSQL, used by both `PostgresDatabase` and `UserLimitsDatabase`.
*   **`DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, etc.**: Connection pool settings from `core.config` are used by `PostgresDatabase`.

## Workflow

*   Services like `DocumentService` and `UserService` use instances of these database classes to persist and retrieve data.
*   When a document is ingested, its metadata is stored via `PostgresDatabase.store_document`.
*   When a query is made, `PostgresDatabase.find_authorized_and_filtered_documents` might be called to get a list of document IDs to search within the vector store.
*   User actions that count against limits (e.g., queries, ingests in cloud mode) trigger calls to `UserLimitsDatabase.update_usage` via `UserService`.
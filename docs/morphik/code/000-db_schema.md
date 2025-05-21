# Morphik Database Schema Documentation

_Last updated: [auto-generated]_  

## Table of Contents
- [Overview](#overview)
- [documents](#documents)
- [graphs](#graphs)
- [folders](#folders)
- [caches](#caches)
- [user_limits](#user_limits)

---

## Overview

Morphik uses a PostgreSQL database to store all application data, including documents, knowledge graphs, folders, caches, and user limits. The schema is designed for flexibility and extensibility, with heavy use of JSONB columns for metadata and access control.

---

## documents

**Purpose:** Stores all document metadata, content info, access control, and chunk references.

```sql
CREATE TABLE documents (
    external_id TEXT PRIMARY KEY,
    owner JSONB NOT NULL,
    content_type TEXT NOT NULL,
    filename TEXT,
    doc_metadata JSONB DEFAULT '{}',
    storage_info JSONB DEFAULT '{}',
    system_metadata JSONB DEFAULT '{}',
    additional_metadata JSONB DEFAULT '{}',
    access_control JSONB DEFAULT '{}',
    chunk_ids JSONB DEFAULT '[]',
    storage_files JSONB DEFAULT '[]'
);

CREATE INDEX idx_owner_id ON documents USING gin (owner);
CREATE INDEX idx_access_control ON documents USING gin (access_control);
CREATE INDEX idx_system_metadata ON documents USING gin (system_metadata);
CREATE INDEX idx_system_metadata_folder_name ON documents ((system_metadata->>'folder_name'));
CREATE INDEX idx_system_metadata_end_user_id ON documents ((system_metadata->>'end_user_id'));
```

---

## graphs

**Purpose:** Stores knowledge graphs, including entities, relationships, and associated documents.

```sql
CREATE TABLE graphs (
    id TEXT PRIMARY KEY,
    name TEXT,
    entities JSONB DEFAULT '[]',
    relationships JSONB DEFAULT '[]',
    graph_metadata JSONB DEFAULT '{}',
    system_metadata JSONB DEFAULT '{}',
    document_ids JSONB DEFAULT '[]',
    filters JSONB,
    created_at TEXT,
    updated_at TEXT,
    owner JSONB NOT NULL,
    access_control JSONB DEFAULT '{}'
);

CREATE INDEX idx_graph_name ON graphs (name);
CREATE INDEX idx_graph_owner ON graphs USING gin (owner);
CREATE INDEX idx_graph_access_control ON graphs USING gin (access_control);
CREATE INDEX idx_graph_system_metadata ON graphs USING gin (system_metadata);
CREATE INDEX idx_graph_owner_name ON graphs (name, (owner->>'id'));
CREATE INDEX idx_graph_system_metadata_folder_name ON graphs ((system_metadata->>'folder_name'));
CREATE INDEX idx_graph_system_metadata_end_user_id ON graphs ((system_metadata->>'end_user_id'));
```

---

## folders

**Purpose:** Stores folder metadata, document grouping, and access control.

```sql
CREATE TABLE folders (
    id TEXT PRIMARY KEY,
    name TEXT,
    description TEXT,
    owner JSONB NOT NULL,
    document_ids JSONB DEFAULT '[]',
    system_metadata JSONB DEFAULT '{}',
    access_control JSONB DEFAULT '{}',
    rules JSONB DEFAULT '[]'
);

CREATE INDEX idx_folder_name ON folders (name);
CREATE INDEX idx_folder_owner ON folders USING gin (owner);
CREATE INDEX idx_folder_access_control ON folders USING gin (access_control);
```

---

## caches

**Purpose:** Stores metadata for vector/embedding caches.

```sql
CREATE TABLE caches (
    name TEXT PRIMARY KEY,
    metadata JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## user_limits

**Purpose:** Tracks per-user usage, subscription, and limits.

```sql
CREATE TABLE user_limits (
    user_id TEXT PRIMARY KEY,
    tier TEXT NOT NULL, -- free, developer, startup, custom
    custom_limits JSONB,
    usage JSONB DEFAULT '{}',
    app_ids JSONB DEFAULT '[]',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    stripe_product_id TEXT,
    subscription_status TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE INDEX idx_user_tier ON user_limits (tier);
```

---

## Notes
- All JSONB columns are used for flexible, semi-structured metadata and access control.
- Indexes on JSONB columns use GIN for efficient querying.
- The schema is auto-migrated and may add columns/indexes as the application evolves.
- For the most up-to-date schema, see the ORM models and initialization logic in `core/database/postgres_database.py` and `core/database/user_limits_db.py`. 
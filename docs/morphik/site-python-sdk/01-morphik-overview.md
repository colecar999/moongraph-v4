# Morphik Client Overview

The Morphik Python SDK provides a powerful client for document operations, retrieval, and knowledge graph management. This guide covers usage, scoping, constructor options, and available methods.

---

## Usage

### Synchronous
```python
from morphik import Morphik

# Without authentication
db = Morphik()

# With authentication
db = Morphik("morphik://owner_id:token@api.morphik.ai")
```

### Asynchronous
```python
from morphik import AsyncMorphik

# Without authentication
async with AsyncMorphik() as db:
    doc = await db.ingest_text("Sample content")

# With authentication
async with AsyncMorphik("morphik://owner_id:token@api.morphik.ai") as db:
    doc = await db.ingest_text("Sample content")
```

---

## User and Folder Scoping

Morphik supports organizing and isolating data by user and folder, enabling multi-tenant applications and project-based organization.

### Quick Overview
#### Synchronous
```python
# Folder scoping
folder = db.create_folder("project_x")
doc = folder.ingest_text("This document belongs to Project X")

# User scoping
user_scope = db.signin("user123")
doc = user_scope.ingest_text("This belongs to user123 only")

# Combined scoping
user_folder_scope = folder.signin("user123")
doc = user_folder_scope.ingest_text("This belongs to user123 in project_x")
```
#### Asynchronous
```python
# Folder scoping
folder = db.create_folder("project_x")
doc = await folder.ingest_text("This document belongs to Project X")

# User scoping
user_scope = db.signin("user123")
doc = await user_scope.ingest_text("This belongs to user123 only")

# Combined scoping
user_folder_scope = folder.signin("user123")
doc = await user_folder_scope.ingest_text("This belongs to user123 in project_x")
```

---

## Constructor

Both clients share the same constructor parameters:
```python
Morphik(uri: Optional[str] = None, timeout: int = 30, is_local: bool = False)
AsyncMorphik(uri: Optional[str] = None, timeout: int = 30, is_local: bool = False)
```

### Parameters
- `uri` (str, optional): Morphik URI in format `morphik://<owner_id>:<token>@<host>`. Defaults to local server if not provided.
- `timeout` (int, optional): Request timeout in seconds. Defaults to 30.
- `is_local` (bool, optional): Connect to local dev server. Defaults to False.

---

## Methods

Morphik provides the following method categories (sync and async):
- **Document Operations**: ingest_text, ingest_file, ingest_files, retrieve_chunks, retrieve_docs, query, list_documents, get_document, get_document_by_filename, update_document_with_text, update_document_with_file, update_document_metadata, update_document_by_filename_with_text, update_document_by_filename_with_file, update_document_by_filename_metadata, delete_document, delete_document_by_filename, batch_get_documents, batch_get_chunks
- **Knowledge Graph Operations**: create_graph, get_graph, list_graphs, update_graph
- **Cache Operations**: create_cache, get_cache
- **Client Management**: close

---

## Context Manager

Using the Morphik client as a context manager ensures resources are properly closed:

### Synchronous
```python
with Morphik() as db:
    doc = db.ingest_text("Sample content")
```

### Asynchronous
```python
async with AsyncMorphik() as db:
    doc = await db.ingest_text("Sample content")
```

---

*Source: [Morphik Python SDK - Morphik](https://docs.morphik.ai/python-sdk/morphik)* 
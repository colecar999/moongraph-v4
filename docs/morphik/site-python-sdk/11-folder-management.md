# Folder Management

Folders in Morphik provide a way to organize documents into logical groups, enabling clean separation between projects or contexts. Documents within a folder are isolated from those in other folders.

---

## Creating and Accessing Folders

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Create a new folder
folder = db.create_folder("marketing_docs")

# Access an existing folder
folder = db.get_folder("marketing_docs")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Create a new folder
    folder = db.create_folder("marketing_docs")

    # Access an existing folder
    folder = db.get_folder("marketing_docs")
```

---

## Operations Within a Folder

All operations performed on a folder object are scoped to that folder. Documents created, retrieved, or manipulated will be contained within this folder's scope.

### Synchronous
```python
# Get a folder
folder = db.get_folder("marketing_docs")

# Ingest a document into this folder
doc = folder.ingest_text("New marketing strategy for Q3",
                       filename="strategy_q3.txt",
                       metadata={"department": "marketing", "quarter": "Q3"})

# Retrieve documents only from this folder
marketing_docs = folder.list_documents()

# Search documents only within this folder
results = folder.retrieve_chunks("marketing strategy")

# Query within the folder context
response = folder.query("What is our Q3 marketing strategy?")
```

### Asynchronous
```python
# Get a folder
folder = db.get_folder("marketing_docs")

# Ingest a document into this folder
doc = await folder.ingest_text("New marketing strategy for Q3",
                             filename="strategy_q3.txt",
                             metadata={"department": "marketing", "quarter": "Q3"})

# Retrieve documents only from this folder
marketing_docs = await folder.list_documents()

# Search documents only within this folder
results = await folder.retrieve_chunks("marketing strategy")

# Query within the folder context
response = await folder.query("What is our Q3 marketing strategy?")
```

---

## Folder Methods

All core document operations available on the main Morphik client are also available on folder objects, scoped to the specific folder:

- `ingest_text` – Ingest text content into this folder
- `ingest_file` – Ingest a file into this folder
- `ingest_files` – Ingest multiple files into this folder
- `ingest_directory` – Ingest all files from a directory into this folder
- `retrieve_chunks` – Retrieve chunks matching a query from this folder
- `retrieve_docs` – Retrieve documents matching a query from this folder
- `query` – Generate a completion using context from this folder
- `list_documents` – List all documents in this folder
- `batch_get_documents` – Get multiple documents by their IDs from this folder
- `batch_get_chunks` – Get specific chunks by source from this folder
- `create_graph` – Create a knowledge graph from documents in this folder
- `update_graph` – Update a knowledge graph with new documents from this folder
- `delete_document_by_filename` – Delete a document by filename from this folder

---

## Example: Project Document Management

### Synchronous
```python
from morphik import Morphik
from pathlib import Path

db = Morphik()

# Create folders for different projects
project_a = db.create_folder("project_a")
project_b = db.create_folder("project_b")

# Ingest project documentation into respective folders
project_a.ingest_directory(Path("/path/to/project_a_docs"),
                          recursive=True,
                          metadata={"project": "Project A"})

project_b.ingest_directory(Path("/path/to/project_b_docs"),
                          recursive=True,
                          metadata={"project": "Project B"})

# Query is scoped to just Project A documents
project_a_response = project_a.query("What are the key milestones for this project?")

# Query is scoped to just Project B documents
project_b_response = project_b.query("What are the technical requirements?")

# Create project-specific knowledge graphs
project_a.create_graph("project_a_graph")
project_b.create_graph("project_b_graph")
```

### Asynchronous
```python
from morphik import AsyncMorphik
from pathlib import Path

async with AsyncMorphik() as db:
    # Create folders for different projects
    project_a = db.create_folder("project_a")
    project_b = db.create_folder("project_b")

    # Ingest project documentation into respective folders
    await project_a.ingest_directory(Path("/path/to/project_a_docs"),
                                  recursive=True,
                                  metadata={"project": "Project A"})

    await project_b.ingest_directory(Path("/path/to/project_b_docs"),
                                  recursive=True,
                                  metadata={"project": "Project B"})

    # Query is scoped to just Project A documents
    project_a_response = await project_a.query("What are the key milestones for this project?")

    # Query is scoped to just Project B documents
    project_b_response = await project_b.query("What are the technical requirements?")

    # Create project-specific knowledge graphs
    await project_a.create_graph("project_a_graph")
    await project_b.create_graph("project_b_graph")
```

---

## Accessing a Folder's User Scope

You can further scope operations within a folder to a specific user by using the `signin` method on the folder object:

### Synchronous
```python
# Get a folder
project_folder = db.get_folder("project_x")

# Create a user scope within this folder
user_in_project = project_folder.signin("user_123")

# This document is accessible only to user_123 within project_x
doc = user_in_project.ingest_text("User-specific project notes")
```

### Asynchronous
```python
# Get a folder
project_folder = db.get_folder("project_x")

# Create a user scope within this folder
user_in_project = project_folder.signin("user_123")

# This document is accessible only to user_123 within project_x
doc = await user_in_project.ingest_text("User-specific project notes")
```

See [User Management](https://docs.morphik.ai/python-sdk/users) for more details on working with user scopes.

---

*Source: [Morphik Python SDK - Folder Management](https://docs.morphik.ai/python-sdk/folders)* 
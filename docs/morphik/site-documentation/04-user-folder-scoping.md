# User and Folder Scoping in Morphik

Organize and isolate your data in Morphik using **user scoping** and **folder scoping**. These features allow you to create logical boundaries for projects, departments, or user groups while maintaining a unified database.

---

## Folder Scoping

Folders in Morphik let you group documents logically, similar to directories in a file system. Operations performed within a folder scope only affect documents in that folder.

### When to Use Folder Scoping
- **Project Organization**: Separate documents by project, department, or purpose
- **Data Categorization**: Group similar documents together
- **Access Control**: Create logical boundaries for different document sets

### Creating and Using Folders
```python
from morphik import Morphik

with Morphik() as db:
    # Create or get a folder
    folder = db.create_folder("project_x")
    # or
    folder = db.get_folder("project_x")

    # Operations are scoped to this folder
    doc = folder.ingest_text("This document belongs to Project X")
    chunks = folder.retrieve_chunks("project")
    docs = folder.list_documents()  # Only lists documents in this folder
```

---

## User Scoping

User scoping allows multi-tenant applications to isolate data per end user, ensuring each user only sees their own documents. This is essential for privacy and personal data spaces.

### When to Use User Scoping
- **Multi-tenant Applications**: Keep each user's data separate
- **Privacy Requirements**: Ensure users can only access their own documents
- **Personal Data Spaces**: Create user-specific knowledge bases

### Creating and Using User Scopes
```python
from morphik import Morphik

with Morphik() as db:
    # Create a user scope
    user_scope = db.signin("user123")

    # Operations are scoped to this user
    doc = user_scope.ingest_text("This belongs to user123 only")
    docs = user_scope.list_documents()  # Only lists documents for this user
    completion = user_scope.query("What documents do I have?")  # Only searches user123's documents
```

---

## Combined User and Folder Scoping

For maximum organization, combine both scopes to organize documents by both user and folder.

```python
from morphik import Morphik

with Morphik() as db:
    # First get a folder
    folder = db.get_folder("project_x")

    # Then scope to a specific user within that folder
    user_folder_scope = folder.signin("user123")

    # Operations are scoped to both the folder and user
    doc = user_folder_scope.ingest_text("This belongs to user123 in project_x")
    chunks = user_folder_scope.retrieve_chunks("project")
    docs = user_folder_scope.list_documents()  # Only lists user123's documents in project_x
```

---

## Asynchronous Usage

All scoping features are available with the asynchronous client:

```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Create folder and user scopes
    folder = db.get_folder("project_x")
    user_scope = db.signin("user123")
    combined_scope = folder.signin("user123")

    # Use scoped operations asynchronously
    doc = await combined_scope.ingest_text("Document for user123 in project_x")
    results = await combined_scope.retrieve_docs("project")
```

---

## Important Considerations
- All methods available on the main Morphik client are also available on folder and user scopes
- Operations performed within a scope are isolated to that scope
- Documents created within a scope are only accessible within that scope, unless explicitly queried with appropriate filters
- Scopes can be used for both reading and writing operations
- User and folder information is stored as metadata with the documents, so you can still filter across scopes with explicit filter parameters if needed

---

## Use Cases

### Multi-Project Research Team
A research team working on multiple projects can use folder scoping to keep document sets separate:
```python
# Project A research
project_a = db.get_folder("project_a")
doc = project_a.ingest_file("project_a_results.pdf")

# Project B research (completely separate)
project_b = db.get_folder("project_b")
doc = project_b.ingest_file("project_b_results.pdf")
```

### Multi-tenant Application
An application serving multiple end users can use user scoping to keep each user's data private:
```python
# User 1's personal data
user1 = db.signin("user1")
doc = user1.ingest_text("My private notes")

# User 2's personal data (completely separate)
user2 = db.signin("user2")
doc = user2.ingest_text("My confidential information")
```

### Enterprise Knowledge Management
For complex enterprise setups, combine both scopes to organize by both department and individual:
```python
# Marketing department
marketing = db.get_folder("marketing")

# Individual marketers' workspaces
alice_marketing = marketing.signin("alice")
bob_marketing = marketing.signin("bob")

# Engineering department
engineering = db.get_folder("engineering")

# Individual engineers' workspaces
charlie_engineering = engineering.signin("charlie")
dave_engineering = engineering.signin("dave")
```

---

*Source: [Morphik Docs - User and Folder Scoping](https://docs.morphik.ai/concepts/user-folder-scoping)* 
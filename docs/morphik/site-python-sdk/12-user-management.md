# User Management

User scoping in Morphik allows multi-tenant applications to isolate data on a per-user basis. This ensures that each user can only access their own documents and data, which is essential for privacy and separation in customer-facing applications.

---

## Creating User Scopes

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Create a user scope for a specific end user
user_scope = db.signin("customer_12345")
# All operations from this scope are now isolated to this user
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Create a user scope for a specific end user
    user_scope = db.signin("customer_12345")
    # All operations from this scope are now isolated to this user
```

---

## Operations Within a User Scope

All operations performed on a user scope are automatically scoped to that specific user. Documents created or retrieved are only accessible to that user.

### Synchronous
```python
# Get a user scope
user_scope = db.signin("customer_12345")

# Ingest a document for this user
doc = user_scope.ingest_text("My private notes",
                           filename="notes.txt",
                           metadata={"type": "personal"})

# List only this user's documents
user_docs = user_scope.list_documents()

# Search only within this user's documents
results = user_scope.retrieve_chunks("notes")

# Query using only this user's documents as context
response = user_scope.query("What are my notes about?")
```

### Asynchronous
```python
# Get a user scope
user_scope = db.signin("customer_12345")

# Ingest a document for this user
doc = await user_scope.ingest_text("My private notes",
                                 filename="notes.txt",
                                 metadata={"type": "personal"})

# List only this user's documents
user_docs = await user_scope.list_documents()

# Search only within this user's documents
results = await user_scope.retrieve_chunks("notes")

# Query using only this user's documents as context
response = await user_scope.query("What are my notes about?")
```

---

## User Scope Methods

The UserScope class provides the same document operations as the main Morphik client, but automatically scoped to the specific user:

- `ingest_text` – Ingest text content for this user
- `ingest_file` – Ingest a file for this user
- `ingest_files` – Ingest multiple files for this user
- `ingest_directory` – Ingest all files from a directory for this user
- `retrieve_chunks` – Retrieve chunks matching a query from this user's documents
- `retrieve_docs` – Retrieve documents matching a query from this user's documents
- `query` – Generate a completion using context from this user's documents
- `list_documents` – List all documents owned by this user
- `batch_get_documents` – Get multiple documents by their IDs for this user
- `batch_get_chunks` – Get specific chunks by source for this user
- `create_graph` – Create a knowledge graph from this user's documents
- `update_graph` – Update a knowledge graph with new documents from this user
- `delete_document_by_filename` – Delete a document by filename for this user

---

## Example: Customer Support Application

### Synchronous
```python
from morphik import Morphik

db = Morphik("morphik://owner_id:token@api.morphik.ai")

def process_customer_request(customer_id, query):
    # Sign in as the specific customer
    customer_scope = db.signin(customer_id)

    # List the customer's documents
    documents = customer_scope.list_documents()
    print(f"Customer {customer_id} has {len(documents)} documents")

    # Get personalized answer based only on this customer's documents
    response = customer_scope.query(
        query,
        filters={"type": "support_case"},
        temperature=0.3
    )

    return response.completion

# Handle customer requests
answer = process_customer_request(
    "customer_12345",
    "What's the status of my recent support ticket?"
)

print(answer)  # Only includes information from this customer's documents
```

### Asynchronous
```python
from morphik import AsyncMorphik

async def process_customer_request(customer_id, query):
    async with AsyncMorphik("morphik://owner_id:token@api.morphik.ai") as db:
        # Sign in as the specific customer
        customer_scope = db.signin(customer_id)

        # List the customer's documents
        documents = await customer_scope.list_documents()
        print(f"Customer {customer_id} has {len(documents)} documents")

        # Get personalized answer based only on this customer's documents
        response = await customer_scope.query(
            query,
            filters={"type": "support_case"},
            temperature=0.3
        )

        return response.completion

# Handle customer requests
import asyncio

async def main():
    answer = await process_customer_request(
        "customer_12345",
        "What's the status of my recent support ticket?"
    )
    print(answer)  # Only includes information from this customer's documents

# Run the async function
asyncio.run(main())
```

---

## Combining User Scope with Folder Scope

For advanced data organization, you can combine user scoping with folder scoping. This allows you to organize by both user and functional area:

### Synchronous
```python
# First, create a folder
support_folder = db.create_folder("support_cases")

# Then, scope to a specific user within that folder
user_support = support_folder.signin("customer_12345")

# This document is accessible only to customer_12345
# and only within the support_cases folder
doc = user_support.ingest_file("path/to/case_details.pdf")

# Query is scoped to just this user's documents
# within the support_cases folder
response = user_support.query("What's the status of my case?")
```

### Asynchronous
```python
# First, create a folder
support_folder = db.create_folder("support_cases")

# Then, scope to a specific user within that folder
user_support = support_folder.signin("customer_12345")

# This document is accessible only to customer_12345
# and only within the support_cases folder
doc = await user_support.ingest_file("path/to/case_details.pdf")

# Query is scoped to just this user's documents
# within the support_cases folder
response = await user_support.query("What's the status of my case?")
```

---

## Example: SaaS Application with Multi-Project Support

### Synchronous
```python
from morphik import Morphik

db = Morphik()

def handle_customer_request(customer_id, project_name, query):
    # First, get the project folder
    project_folder = db.get_folder(project_name)

    # Then, scope to the specific customer within that project
    customer_project = project_folder.signin(customer_id)

    # Generate a response using only this customer's documents
    # within this specific project
    response = customer_project.query(
        query,
        filters={"status": "active"},
        max_tokens=500
    )

    return {
        "customer_id": customer_id,
        "project": project_name,
        "query": query,
        "response": response.completion
    }

# Handle request for a specific customer and project
result = handle_customer_request(
    "acme_corp",
    "website_redesign",
    "What's our current timeline for the homepage redesign?"
)

print(f"Response for {result['customer_id']} on {result['project']}:")
print(result['response'])
```

### Asynchronous
```python
from morphik import AsyncMorphik

async def handle_customer_request(customer_id, project_name, query):
    async with AsyncMorphik() as db:
        # First, get the project folder
        project_folder = db.get_folder(project_name)

        # Then, scope to the specific customer within that project
        customer_project = project_folder.signin(customer_id)

        # Generate a response using only this customer's documents
        # within this specific project
        response = await customer_project.query(
            query,
            filters={"status": "active"},
            max_tokens=500
        )

        return {
            "customer_id": customer_id,
            "project": project_name,
            "query": query,
            "response": response.completion
        }

# Handle request for a specific customer and project
import asyncio

async def main():
    result = await handle_customer_request(
        "acme_corp",
        "website_redesign",
        "What's our current timeline for the homepage redesign?"
    )

    print(f"Response for {result['customer_id']} on {result['project']}:")
    print(result['response'])

# Run the async function
asyncio.run(main())
```

---

## Bulk Document Processing for Multiple Users

When developing applications that serve multiple users, you might need to process documents in bulk. Here's an example showing how to ingest documents for multiple users:

### Synchronous
```python
from morphik import Morphik
from pathlib import Path

db = Morphik()

def ingest_customer_documents(customer_data):
    """
    customer_data is a list of dictionaries with:
    - customer_id: string identifier
    - document_path: path to document
    - metadata: optional metadata dictionary
    """
    results = []

    for item in customer_data:
        # Get user scope for this customer
        customer = db.signin(item['customer_id'])

        # Ingest the document for this customer
        try:
            doc = customer.ingest_file(
                item['document_path'],
                metadata=item.get('metadata', {})
            )
            results.append({
                "customer_id": item['customer_id'],
                "document_id": doc.external_id,
                "status": "success"
            })
        except Exception as e:
            results.append({
                "customer_id": item['customer_id'],
                "document_path": str(item['document_path']),
                "status": "error",
                "error": str(e)
            })

    return results

# Example usage
customer_docs = [
    {
        "customer_id": "customer_1",
        "document_path": Path("/path/to/customer1_doc.pdf"),
        "metadata": {"type": "invoice", "amount": 1250}
    },
    {
        "customer_id": "customer_2",
        "document_path": Path("/path/to/customer2_doc.pdf"),
        "metadata": {"type": "contract", "expires": "2024-05-15"}
    }
]

results = ingest_customer_documents(customer_docs)
print(f"Processed {len(results)} documents")
```

### Asynchronous
```python
from morphik import AsyncMorphik
from pathlib import Path
import asyncio

async def ingest_customer_documents(customer_data):
    """
    customer_data is a list of dictionaries with:
    - customer_id: string identifier
    - document_path: path to document
    - metadata: optional metadata dictionary
    """
    async with AsyncMorphik() as db:
        results = []

        for item in customer_data:
            # Get user scope for this customer
            customer = db.signin(item['customer_id'])

            # Ingest the document for this customer
            try:
                doc = await customer.ingest_file(
                    item['document_path'],
                    metadata=item.get('metadata', {})
                )
                results.append({
                    "customer_id": item['customer_id'],
                    "document_id": doc.external_id,
                    "status": "success"
                })
            except Exception as e:
                results.append({
                    "customer_id": item['customer_id'],
                    "document_path": str(item['document_path']),
                    "status": "error",
                    "error": str(e)
                })

        return results

# Example usage
async def main():
    customer_docs = [
        {
            "customer_id": "customer_1",
            "document_path": Path("/path/to/customer1_doc.pdf"),
            "metadata": {"type": "invoice", "amount": 1250}
        },
        {
            "customer_id": "customer_2",
            "document_path": Path("/path/to/customer2_doc.pdf"),
            "metadata": {"type": "contract", "expires": "2024-05-15"}
        }
    ]

    results = await ingest_customer_documents(customer_docs)
    print(f"Processed {len(results)} documents")

# Run the async function
asyncio.run(main())
```

See [Folder Management](https://docs.morphik.ai/python-sdk/folders) for more details on working with folder scopes.

---

*Source: [Morphik Python SDK - User Management](https://docs.morphik.ai/python-sdk/users)* 
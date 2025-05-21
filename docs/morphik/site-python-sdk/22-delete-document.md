# delete_document

The `delete_document` method permanently deletes a document and all its associated data, including metadata, content, chunks, and embeddings.

---

## Function Signature

### Synchronous
```python
def delete_document(document_id: str) -> dict
```

### Asynchronous
```python
async def delete_document(document_id: str) -> dict
```

---

## Parameters
- `document_id` (str): ID of the document to delete

---

## Returns
A dictionary containing information about the deletion operation:
- `message` (str): A success message indicating the document was deleted
- `document_id` (str): The ID of the deleted document
- Additional fields may be present with more details about the operation

---

## Description
This method deletes a document and all its associated data, including:
- Document metadata in the database
- Document content in storage
- Document chunks and embeddings in the vector store

**This operation is permanent and cannot be undone.**

---

## Finding Document IDs
If you don't know the document ID, you can use other methods to find it:

### Synchronous
```python
# List documents to find IDs
docs = db.list_documents(limit=10)
for doc in docs:
    print(f"ID: {doc.external_id}, Filename: {doc.filename}")

# Or get document by filename
doc = db.get_document_by_filename("report.pdf")
document_id = doc.external_id

# Then delete it
result = db.delete_document(document_id)
```

### Asynchronous
```python
# List documents to find IDs
docs = await db.list_documents(limit=10)
for doc in docs:
    print(f"ID: {doc.external_id}, Filename: {doc.filename}")

# Or get document by filename
doc = await db.get_document_by_filename("report.pdf")
document_id = doc.external_id

# Then delete it
result = await db.delete_document(document_id)
```

---

## Notes
- For convenience, you can also use the `delete_document_by_filename` method if you know the filename but not the ID.
- This operation requires appropriate permissions for the document.
- Deleting a document that is part of an existing knowledge graph will not automatically update the graph. You may need to recreate or update the graph separately.

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Delete a document by its ID
result = db.delete_document("doc_123456")
print(result["message"])  # "Document doc_123456 deleted successfully"
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Delete a document by its ID
    result = await db.delete_document("doc_123456")
    print(result["message"])  # "Document doc_123456 deleted successfully"
```

---

*Source: [Morphik Python SDK - delete_document](https://docs.morphik.ai/python-sdk/delete_document)* 
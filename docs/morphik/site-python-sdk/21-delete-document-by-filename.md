# delete_document_by_filename

The `delete_document_by_filename` method deletes a document by its filename. This is a convenience wrapper that retrieves the document ID by filename and deletes the document.

---

## Function Signature

### Synchronous
```python
def delete_document_by_filename(filename: str) -> dict
```

### Asynchronous
```python
async def delete_document_by_filename(filename: str) -> dict
```

---

## Parameters
- `filename` (str): Filename of the document to delete

---

## Returns
A dictionary containing information about the deletion operation:
- `message` (str): A success message indicating the document was deleted
- `document_id` (str): The ID of the deleted document
- Additional fields may be present with more details about the operation

---

## Description
This method is a convenience wrapper that:
1. Retrieves the document ID by filename using `get_document_by_filename`
2. Deletes the document using `delete_document`

**This operation is permanent and cannot be undone.**

---

## Multiple Documents with Same Filename
If multiple documents have the same filename, this method will delete the most recently updated one. To delete a specific document when duplicates exist, use `delete_document` with the exact document ID instead.

### Synchronous
```python
# To handle multiple documents with the same filename
docs = db.list_documents()

# Find all documents with a specific filename
matching_docs = [doc for doc in docs if doc.filename == "report.pdf"]

# Review them
for doc in matching_docs:
    print(f"ID: {doc.external_id}, Created: {doc.system_metadata.get('created_at')}")

# Delete a specific one by ID
result = db.delete_document(matching_docs[0].external_id)
```

### Asynchronous
```python
# To handle multiple documents with the same filename
docs = await db.list_documents()

# Find all documents with a specific filename
matching_docs = [doc for doc in docs if doc.filename == "report.pdf"]

# Review them
for doc in matching_docs:
    print(f"ID: {doc.external_id}, Created: {doc.system_metadata.get('created_at')}")

# Delete a specific one by ID
result = await db.delete_document(matching_docs[0].external_id)
```

---

## Notes
- This operation requires appropriate permissions for the document.
- If no document exists with the specified filename, a `ValueError` will be raised.
- Deleting a document that is part of an existing knowledge graph will not automatically update the graph. You may need to recreate or update the graph separately.

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Delete a document by its filename
result = db.delete_document_by_filename("report.pdf")
print(result["message"])  # "Document doc_123456 deleted successfully"
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Delete a document by its filename
    result = await db.delete_document_by_filename("report.pdf")
    print(result["message"])  # "Document doc_123456 deleted successfully"
```

---

*Source: [Morphik Python SDK - delete_document_by_filename](https://docs.morphik.ai/python-sdk/delete_document_by_filename)* 
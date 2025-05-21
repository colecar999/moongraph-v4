# get_document

The `get_document` method retrieves a document and its metadata by document ID.

---

## Function Signature

### Synchronous
```python
def get_document(document_id: str) -> Document
```

### Asynchronous
```python
async def get_document(document_id: str) -> Document
```

---

## Parameters
- `document_id` (str): ID of the document

---

## Returns
- `Document`: Document metadata

---

## Document Properties
- `external_id` (str): Unique document identifier
- `content_type` (str): Content type of the document
- `filename` (Optional[str]): Original filename if available
- `metadata` (Dict[str, Any]): User-defined metadata
- `storage_info` (Dict[str, str]): Storage-related information
- `system_metadata` (Dict[str, Any]): System-managed metadata
- `access_control` (Dict[str, Any]): Access control information
- `chunk_ids` (List[str]): IDs of document chunks

---

## Document Methods
- `update_with_text()`: Update the document with new text content
- `update_with_file()`: Update the document with content from a file
- `update_metadata()`: Update the document's metadata only

*(Use `await` for async usage)*

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

doc = db.get_document("doc_123")
print(f"Title: {doc.metadata.get('title')}")
print(f"Content Type: {doc.content_type}")
print(f"Filename: {doc.filename}")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    doc = await db.get_document("doc_123")
    print(f"Title: {doc.metadata.get('title')}")
    print(f"Content Type: {doc.content_type}")
    print(f"Filename: {doc.filename}")
```

---

*Source: [Morphik Python SDK - get_document](https://docs.morphik.ai/python-sdk/get_document)* 
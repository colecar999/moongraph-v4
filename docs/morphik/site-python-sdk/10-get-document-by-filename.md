# get_document_by_filename

The `get_document_by_filename` method retrieves a document and its metadata by filename.

---

## Function Signature

### Synchronous
```python
def get_document_by_filename(filename: str) -> Document
```

### Asynchronous
```python
async def get_document_by_filename(filename: str) -> Document
```

---

## Parameters
- `filename` (str): Filename of the document to retrieve

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

doc = db.get_document_by_filename("report.pdf")
print(f"Document ID: {doc.external_id}")
print(f"Content Type: {doc.content_type}")
print(f"Metadata: {doc.metadata}")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    doc = await db.get_document_by_filename("report.pdf")
    print(f"Document ID: {doc.external_id}")
    print(f"Content Type: {doc.content_type}")
    print(f"Metadata: {doc.metadata}")
```

---

*Source: [Morphik Python SDK - get_document_by_filename](https://docs.morphik.ai/python-sdk/get_document_by_filename)* 
# batch_get_documents

The `batch_get_documents` method retrieves multiple documents by their IDs in a single call.

---

## Function Signature

### Synchronous
```python
def batch_get_documents(document_ids: List[str]) -> List[Document]
```

### Asynchronous
```python
async def batch_get_documents(document_ids: List[str]) -> List[Document]
```

---

## Parameters
- `document_ids` (List[str]): List of document IDs to retrieve

---

## Returns
- `List[Document]`: List of document metadata for found documents

---

## Document Properties
Each `Document` object in the returned list has the following properties:
- `external_id` (str): Unique document identifier
- `content_type` (str): Content type of the document
- `filename` (Optional[str]): Original filename if available
- `metadata` (Dict[str, Any]): User-defined metadata
- `storage_info` (Dict[str, str]): Storage-related information
- `system_metadata` (Dict[str, Any]): System-managed metadata
- `access_control` (Dict[str, Any]): Access control information
- `chunk_ids` (List[str]): IDs of document chunks

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

docs = db.batch_get_documents(["doc_123", "doc_456", "doc_789"])
for doc in docs:
    print(f"Document {doc.external_id}: {doc.metadata.get('title')}")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    docs = await db.batch_get_documents(["doc_123", "doc_456", "doc_789"])
    for doc in docs:
        print(f"Document {doc.external_id}: {doc.metadata.get('title')}")
```

---

*Source: [Morphik Python SDK - batch_get_documents](https://docs.morphik.ai/python-sdk/batch_get_documents)* 
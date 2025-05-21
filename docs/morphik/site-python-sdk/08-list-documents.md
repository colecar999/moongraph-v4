# list_documents

The `list_documents` method retrieves a list of accessible documents, supporting pagination and optional filtering.

---

## Function Signature

### Synchronous
```python
def list_documents(
    skip: int = 0,
    limit: int = 100,
    filters: Optional[Dict[str, Any]] = None
) -> List[Document]
```

### Asynchronous
```python
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    filters: Optional[Dict[str, Any]] = None
) -> List[Document]
```

---

## Parameters
- `skip` (int, optional): Number of documents to skip. Defaults to 0.
- `limit` (int, optional): Maximum number of documents to return. Defaults to 100.
- `filters` (Dict[str, Any], optional): Optional filters

---

## Returns
- `List[Document]`: List of accessible documents

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

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Get first page
docs = db.list_documents(limit=10)
for doc in docs:
    print(f"Document ID: {doc.external_id}")
    print(f"Filename: {doc.filename}")
    print(f"Metadata: {doc.metadata}")
    print("---")

# Get next page
next_page = db.list_documents(skip=10, limit=10, filters={"department": "research"})
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Get first page
    docs = await db.list_documents(limit=10)
    for doc in docs:
        print(f"Document ID: {doc.external_id}")
        print(f"Filename: {doc.filename}")
        print(f"Metadata: {doc.metadata}")
        print("---")

    # Get next page
    next_page = await db.list_documents(skip=10, limit=10, filters={"department": "research"})
```

---

*Source: [Morphik Python SDK - list_documents](https://docs.morphik.ai/python-sdk/list_documents)* 
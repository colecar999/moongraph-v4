# update_document_metadata

The `update_document_metadata` method updates only the metadata of an existing document.

---

## Function Signature

### Synchronous
```python
def update_document_metadata(
    document_id: str,
    metadata: Dict[str, Any],
) -> Document
```

### Asynchronous
```python
async def update_document_metadata(
    document_id: str,
    metadata: Dict[str, Any],
) -> Document
```

---

## Parameters
- `document_id` (str): ID of the document to update
- `metadata` (Dict[str, Any]): Metadata to update

---

## Returns
- `Document`: Updated document metadata

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Update just the metadata of a document
updated_doc = db.update_document_metadata(
    document_id="doc_123",
    metadata={"status": "reviewed", "reviewer": "Jane Smith"}
)
print(f"Updated metadata: {updated_doc.metadata}")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Update just the metadata of a document
    updated_doc = await db.update_document_metadata(
        document_id="doc_123",
        metadata={"status": "reviewed", "reviewer": "Jane Smith"}
    )
    print(f"Updated metadata: {updated_doc.metadata}")
```

---

*Source: [Morphik Python SDK - update_document_metadata](https://docs.morphik.ai/python-sdk/update_document_metadata)* 
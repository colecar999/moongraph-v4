# update_document_with_file

The `update_document_with_file` method adds content from a file to an existing document, optionally updating metadata, filename, and rules.

---

## Function Signature

### Synchronous
```python
def update_document_with_file(
    document_id: str,
    file: Union[str, bytes, BinaryIO, Path],
    filename: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    rules: Optional[List] = None,
    update_strategy: str = "add",
    use_colpali: Optional[bool] = None,
) -> Document
```

### Asynchronous
```python
async def update_document_with_file(
    document_id: str,
    file: Union[str, bytes, BinaryIO, Path],
    filename: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    rules: Optional[List] = None,
    update_strategy: str = "add",
    use_colpali: Optional[bool] = None,
) -> Document
```

---

## Parameters
- `document_id` (str): ID of the document to update
- `file` (Union[str, bytes, BinaryIO, Path]): File to add (path string, bytes, file object, or Path)
- `filename` (str, optional): Name of the file
- `metadata` (Dict[str, Any], optional): Additional metadata to update
- `rules` (List, optional): Optional list of rules to apply to the content
- `update_strategy` (str, optional): Strategy for updating the document (currently only 'add' is supported). Defaults to 'add'.
- `use_colpali` (bool, optional): Whether to use multi-vector embedding. If not specified, defaults to True.

---

## Returns
- `Document`: Updated document metadata

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Add content from a file to an existing document
updated_doc = db.update_document_with_file(
    document_id="doc_123",
    file="path/to/update.pdf",
    metadata={"status": "updated"},
    update_strategy="add"
)
print(f"Document version: {updated_doc.system_metadata.get('version')}")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Add content from a file to an existing document
    updated_doc = await db.update_document_with_file(
        document_id="doc_123",
        file="path/to/update.pdf",
        metadata={"status": "updated"},
        update_strategy="add"
    )
    print(f"Document version: {updated_doc.system_metadata.get('version')}")
```

---

*Source: [Morphik Python SDK - update_document_with_file](https://docs.morphik.ai/python-sdk/update_document_with_file)* 
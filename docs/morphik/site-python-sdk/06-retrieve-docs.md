# retrieve_docs

The `retrieve_docs` method retrieves the most relevant documents for a given query. Supports filtering, scoring, and ColPali-based retrieval.

---

## Function Signature

### Synchronous
```python
def retrieve_docs(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    k: int = 4,
    min_score: float = 0.0,
    use_colpali: bool = True,
) -> List[DocumentResult]
```

### Asynchronous
```python
async def retrieve_docs(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    k: int = 4,
    min_score: float = 0.0,
    use_colpali: bool = True,
) -> List[DocumentResult]
```

---

## Parameters
- `query` (str): Search query text
- `filters` (Dict[str, Any], optional): Optional metadata filters
- `k` (int, optional): Number of results. Defaults to 4.
- `min_score` (float, optional): Minimum similarity threshold. Defaults to 0.0.
- `use_colpali` (bool, optional): Whether to use ColPali-style embedding model (only works for documents ingested with `use_colpali=True`). Defaults to True.

---

## Returns
- `List[DocumentResult]`: List of document results

---

## DocumentResult Properties
- `score` (float): Relevance score
- `document_id` (str): Document ID
- `metadata` (Dict[str, Any]): Document metadata
- `content` (DocumentContent): Document content or URL

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

docs = db.retrieve_docs(
    "machine learning",
    k=5,
    min_score=0.5
)

for doc in docs:
    print(f"Score: {doc.score}")
    print(f"Document ID: {doc.document_id}")
    print(f"Metadata: {doc.metadata}")
    print(f"Content: {doc.content}")
    print("---")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    docs = await db.retrieve_docs(
        "machine learning",
        k=5,
        min_score=0.5
    )

    for doc in docs:
        print(f"Score: {doc.score}")
        print(f"Document ID: {doc.document_id}")
        print(f"Metadata: {doc.metadata}")
        print(f"Content: {doc.content}")
        print("---")
```

---

*Source: [Morphik Python SDK - retrieve_docs](https://docs.morphik.ai/python-sdk/retrieve_docs)* 
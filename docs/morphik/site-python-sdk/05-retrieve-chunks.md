# retrieve_chunks

The `retrieve_chunks` method retrieves the most relevant document chunks for a given query. Supports filtering, scoring, and ColPali-based retrieval.

---

## Function Signature

### Synchronous
```python
def retrieve_chunks(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    k: int = 4,
    min_score: float = 0.0,
    use_colpali: bool = True,
) -> List[FinalChunkResult]
```

### Asynchronous
```python
async def retrieve_chunks(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    k: int = 4,
    min_score: float = 0.0,
    use_colpali: bool = True,
) -> List[FinalChunkResult]
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
- `List[FinalChunkResult]`: List of chunk results

---

## FinalChunkResult Properties
- `content` (str | PILImage): Chunk content (text or image)
- `score` (float): Relevance score
- `document_id` (str): Parent document ID
- `chunk_number` (int): Chunk sequence number
- `metadata` (Dict[str, Any]): Document metadata
- `content_type` (str): Content type
- `filename` (Optional[str]): Original filename
- `download_url` (Optional[str]): URL to download full document

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

chunks = db.retrieve_chunks(
    "What are the key findings?",
    filters={"department": "research"},
    k=5,
    min_score=0.5
)

for chunk in chunks:
    print(f"Score: {chunk.score}")
    print(f"Content: {chunk.content}")
    print(f"Document ID: {chunk.document_id}")
    print(f"Chunk Number: {chunk.chunk_number}")
    print(f"Metadata: {chunk.metadata}")
    print("---")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    chunks = await db.retrieve_chunks(
        "What are the key findings?",
        filters={"department": "research"},
        k=5,
        min_score=0.5
    )

    for chunk in chunks:
        print(f"Score: {chunk.score}")
        print(f"Content: {chunk.content}")
        print(f"Document ID: {chunk.document_id}")
        print(f"Chunk Number: {chunk.chunk_number}")
        print(f"Metadata: {chunk.metadata}")
        print("---")
```

---

*Source: [Morphik Python SDK - retrieve_chunks](https://docs.morphik.ai/python-sdk/retrieve_chunks)* 
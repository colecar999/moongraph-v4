# batch_get_chunks

The `batch_get_chunks` method retrieves multiple document chunks by their sources in a single call.

---

## Function Signature

### Synchronous
```python
def batch_get_chunks(sources: List[Union[ChunkSource, Dict[str, Any]]]) -> List[FinalChunkResult]
```

### Asynchronous
```python
async def batch_get_chunks(sources: List[Union[ChunkSource, Dict[str, Any]]]) -> List[FinalChunkResult]
```

---

## Parameters
- `sources` (List[Union[ChunkSource, Dict[str, Any]]]): List of ChunkSource objects or dictionaries with `document_id` and `chunk_number`

---

## Returns
- `List[FinalChunkResult]`: List of chunk results

---

## FinalChunkResult Properties
Each `FinalChunkResult` object in the returned list has the following properties:
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
from morphik.models import ChunkSource

db = Morphik()

# Using dictionaries
sources = [
    {"document_id": "doc_123", "chunk_number": 0},
    {"document_id": "doc_456", "chunk_number": 2}
]

# Or using ChunkSource objects
sources = [
    ChunkSource(document_id="doc_123", chunk_number=0),
    ChunkSource(document_id="doc_456", chunk_number=2)
]

chunks = db.batch_get_chunks(sources)
for chunk in chunks:
    print(f"Chunk from {chunk.document_id}, number {chunk.chunk_number}: {chunk.content[:50]}...")
```

### Asynchronous
```python
from morphik import AsyncMorphik
from morphik.models import ChunkSource

async with AsyncMorphik() as db:
    # Using dictionaries
    sources = [
        {"document_id": "doc_123", "chunk_number": 0},
        {"document_id": "doc_456", "chunk_number": 2}
    ]

    # Or using ChunkSource objects
    sources = [
        ChunkSource(document_id="doc_123", chunk_number=0),
        ChunkSource(document_id="doc_456", chunk_number=2)
    ]

    chunks = await db.batch_get_chunks(sources)
    for chunk in chunks:
        print(f"Chunk from {chunk.document_id}, number {chunk.chunk_number}: {chunk.content[:50]}...")
```

---

*Source: [Morphik Python SDK - batch_get_chunks](https://docs.morphik.ai/python-sdk/batch_get_chunks)* 
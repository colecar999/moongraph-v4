# create_cache

The `create_cache` method creates a cache for a specific model and set of documents, supporting filters and explicit document selection.

---

## Function Signature

### Synchronous
```python
def create_cache(
    name: str,
    model: str,
    gguf_file: str,
    filters: Optional[Dict[str, Any]] = None,
    docs: Optional[List[str]] = None,
) -> Dict[str, Any]
```

### Asynchronous
```python
async def create_cache(
    name: str,
    model: str,
    gguf_file: str,
    filters: Optional[Dict[str, Any]] = None,
    docs: Optional[List[str]] = None,
) -> Dict[str, Any]
```

---

## Parameters
- `name` (str): Name of the cache to create
- `model` (str): Name of the model to use (e.g. "llama2")
- `gguf_file` (str): Name of the GGUF file to use for the model
- `filters` (Dict[str, Any], optional): Optional metadata filters to determine which documents to include. These filters will be applied in addition to any specific docs provided.
- `docs` (List[str], optional): Optional list of specific document IDs to include. These docs will be included in addition to any documents matching the filters.

---

## Returns
- `Dict[str, Any]`: Created cache configuration

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# This will include both:
# 1. Any documents with category="programming"
# 2. The specific documents "doc1" and "doc2" (regardless of their category)
cache = db.create_cache(
    name="programming_cache",
    model="llama2",
    gguf_file="llama-2-7b-chat.Q4_K_M.gguf",
    filters={"category": "programming"},
    docs=["doc1", "doc2"]
)
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # This will include both:
    # 1. Any documents with category="programming"
    # 2. The specific documents "doc1" and "doc2" (regardless of their category)
    cache = await db.create_cache(
        name="programming_cache",
        model="llama2",
        gguf_file="llama-2-7b-chat.Q4_K_M.gguf",
        filters={"category": "programming"},
        docs=["doc1", "doc2"]
    )
```

---

## Cache Usage
After creating a cache, you can interact with it using the `get_cache` method, which returns a Cache object that provides methods for querying and updating the cache.

### Synchronous
```python
cache = db.get_cache("programming_cache")
response = cache.query("Explain recursion in programming")
```

### Asynchronous
```python
cache = await db.get_cache("programming_cache")
response = await cache.query("Explain recursion in programming")
```

---

*Source: [Morphik Python SDK - create_cache](https://docs.morphik.ai/python-sdk/create_cache)* 
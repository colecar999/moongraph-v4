# get_cache

The `get_cache` method retrieves a cache object by name, allowing you to update, add documents, and query the cache.

---

## Function Signature

### Synchronous
```python
def get_cache(name: str) -> Cache
```

### Asynchronous
```python
async def get_cache(name: str) -> AsyncCache
```

---

## Parameters
- `name` (str): Name of the cache to retrieve

---

## Returns
- `Cache` (sync): A cache object for interacting with the cache
- `AsyncCache` (async): An async cache object for interacting with the cache

---

## Cache Methods

The `Cache` object (sync) and `AsyncCache` object (async) provide the following methods:

- `update() -> bool`: Update the cache with any new documents matching the original filters
- `add_docs(docs: List[str]) -> bool`: Add specific documents to the cache
- `query(query: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> CompletionResponse`: Query the cache

*(Async methods must be called with `await`.)*

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

cache = db.get_cache("programming_cache")

# Update the cache with new documents
cache.update()

# Add specific documents to the cache
cache.add_docs(["doc3", "doc4"])

# Query the cache
response = cache.query(
    "What are the key concepts in functional programming?",
    max_tokens=500,
    temperature=0.7
)
print(response.completion)
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    cache = await db.get_cache("programming_cache")

    # Update the cache with new documents
    await cache.update()

    # Add specific documents to the cache
    await cache.add_docs(["doc3", "doc4"])

    # Query the cache
    response = await cache.query(
        "What are the key concepts in functional programming?",
        max_tokens=500,
        temperature=0.7
    )
    print(response.completion)
```

---

*Source: [Morphik Python SDK - get_cache](https://docs.morphik.ai/python-sdk/get_cache)* 
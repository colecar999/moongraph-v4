# Close Session

The Morphik Python SDK provides a `close()` method to properly close the HTTP session or client. This is important for releasing resources, especially in long-running applications or scripts.

---

## Usage

### Synchronous
```python
def close() -> None
```

### Asynchronous
```python
async def close() -> None
```

---

## Parameters
- None

## Returns
- None

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()
# Perform operations
doc = db.ingest_text("Sample content")
# Close the session when done
db.close()
```

### Asynchronous
```python
import asyncio
from morphik import AsyncMorphik

async def main():
    db = AsyncMorphik()
    # Perform operations
    doc = await db.ingest_text("Sample content")
    # Close the client when done
    await db.close()

asyncio.run(main())
```

---

## Context Manager Alternative

Instead of manually calling `close()`, you can use the Morphik client as a context manager. This ensures the session is automatically closed when exiting the block.

### Synchronous
```python
from morphik import Morphik

with Morphik() as db:
    doc = db.ingest_text("Sample content")
    # Session is automatically closed when exiting the with block
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    doc = await db.ingest_text("Sample content")
    # Client is automatically closed when exiting the with block
```

---

*Source: [Morphik Python SDK - close](https://docs.morphik.ai/python-sdk/close)* 
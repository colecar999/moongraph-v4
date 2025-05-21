# Cache Management

## Overview

Morphik Core uses a cache system to speed up and enhance document-based completions. Caches store precomputed model context for specific sets of documents, making repeated queries much faster. This feature is mostly transparent to end users, but there are some important things to know if you are managing documents or caches.

---

## How Caching Works

- When you create a cache, it stores a snapshot of the selected documents as model context.
- This cache is used to answer queries quickly, without reprocessing the documents each time.
- Caches are persistent: they remain available until you delete them or clear storage.

---

## What Happens When You Delete a Document?

- **Deleting a document does NOT automatically delete or update any caches that include that document.**
- Caches built with the deleted document will still exist and may return information from that document until the cache is manually updated or deleted.

---

## Why?

- Caches are designed for performance and assume the set of documents is static unless you explicitly update the cache.
- There is no automatic link between document deletion and cache invalidation.

---

## Best Practices for Cache Consistency

If you want to ensure that caches always reflect the current set of documents:

1. **Manual Cache Management**
   - When you delete a document, also check if it is included in any caches.
   - Delete or update those caches as needed.
   - Cache metadata includes a list of document IDs, which can help you identify affected caches.

2. **Automated Cache Invalidation (Advanced)**
   - For advanced users or admins, you can build automation to:
     - Search for all caches containing a deleted document.
     - Delete or rebuild those caches automatically.
   - This requires custom development or admin tooling.

---

## Recommendations

- **Document Deletion:** If you delete documents, review your caches and update or remove any that reference the deleted content.
- **Cache Updates:** Use the provided API endpoints to update caches when documents change.
- **Storage Management:** Periodically review and clean up old or unused caches to save space.

---

## Summary Table

| Action                | Automatic? | Manual/Custom Needed? |
|-----------------------|------------|-----------------------|
| Delete document       | Yes        | -                     |
| Invalidate cache      | No         | Yes                   |
| Rebuild cache         | No         | Yes                   |

---

## Need More Automation?

If you need automatic cache invalidation or want to build admin tools for cache management, contact your development team or open a feature request.

--- 
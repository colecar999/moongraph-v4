# Folder Management Flow

```mermaid
flowchart TD
    A[User/API Request: /folders, /folders/id, etc.]
    B[FastAPI Endpoint]
    C[DocumentService]
    D[Folder Operations]
    E[Folders Table]
    F[Documents Table]
    G[TelemetryService]
    H[Cache - optional]

    %% Flow
    A --> B
    B --> C
    C --> D
    D --> E
    D --> F
    B --> G
    C --> H

    %% Notes
    classDef dbTable fill:#ffe0b2,stroke:#333,stroke-width:2px,color:#222;
    class E,F dbTable;
```

**Description:**
- The user or client sends a folder management request (create, list, update, delete, add/remove document) to the API.
- The FastAPI endpoint passes the request to the `DocumentService`.
- The `DocumentService` performs the appropriate folder operation (create, update, add/remove document, etc.).
- Folder operations update the `folders` table and may also update the `documents` table (e.g., when adding/removing documents from folders).
- Optionally, cache and telemetry services are updated.

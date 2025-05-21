# System Architecture Overview (Simplified)

```mermaid
flowchart TD
    A[FastAPI App core/api.py]
    B[Core Services]
    C[Database Tables]
    D[Storage]
    E[External Services]

    %% Main flows
    A --> B
    B --> C
    B --> D
    B --> E

    %% Database tables
    subgraph DB[Database]
        J[Documents Table]
        K[Folders Table]
        L[Graphs Table]
        M[Caches Table]
        N[Vector Embeddings Table]
        O[User Limits Table]
    end
    C --> J
    C --> K
    C --> L
    C --> M
    C --> N
    C --> O

    %% Storage
    subgraph ST[Storage]
        S1[S3 or Local Filesystem]
    end
    D --> S1

    %% External
    subgraph EXT[External]
        X1[PostgreSQL/Supabase]
        X2[Redis]
    end
    E --> X1
    E --> X2

    %% Styling
    classDef dbTable fill:#ffe0b2,stroke:#333,stroke-width:2px,color:#222;
    class J,K,L,M,N,O dbTable;
    classDef storage fill:#b3e5fc,stroke:#333,stroke-width:2px,color:#222;
    class S1 storage;
```

**Description:**
- This simplified diagram shows the main Morphik API, core services, database tables, storage, and external dependencies.
- Internal flows and detailed service interactions are omitted for clarity.
- Use this as a high-level orientation for new developers or stakeholders. 
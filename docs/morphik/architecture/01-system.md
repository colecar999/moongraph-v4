# System Architecture Overview

```mermaid
flowchart TD
    subgraph API
        A[FastAPI App core/api.py]
    end

    subgraph Services
        B[DocumentService]
        C[TelemetryService]
        D[MorphikAgent]
        E[Vector Store]
        F[Embedding Models]
        G[Storage Local/S3]
        H[Parser]
        I[Reranker]
    end

    subgraph Database
        J[(documents)]
        K[(folders)]
        L[(graphs)]
        M[(caches)]
        N[(vector_embeddings)]
        O[(user_limits)]
    end

    subgraph External
        P[(PostgreSQL/Supabase)]
        Q[(Redis)]
        R[(S3/Local Filesystem)]
    end

    %% API to Services
    A -->|Ingest/Query/Manage| B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> Q

    %% Document Ingestion Flow
    B -- Ingest Text/File --> H
    H -- Chunks/Metadata --> F
    F -- Embeddings --> E
    E -- Store Vectors --> N
    B -- Store Metadata --> J
    G -- Store Files --> R

    %% Query Flow
    A -- Query --> B
    B -- Retrieve Embeddings --> E
    E -- Similarity Search --> N
    E -- Results --> I
    I -- Rerank Results --> B
    B -- Fetch Docs --> J
    D -- Agent Query --> B

    %% Folder/Graph Management
    B -- Manage Folders --> K
    B -- Manage Graphs --> L

    %% Telemetry and Caches
    C -- Usage/Stats --> O
    B -- Cache Ops --> M

    %% Database to External
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P

    %% Storage to External
    G --> R

    %% Redis
    C --> Q

    %% Agent to Completion
    D -- Completion/LLM --> F

    %% Notes
    classDef dbTable fill:#ffe0b2,stroke:#333,stroke-width:2px,color:#222;
    class J,K,L,M,N,O dbTable;
    classDef storage fill:#b3e5fc,stroke:#333,stroke-width:2px,color:#222;
    class G,R storage;
```

**Description:**
- This diagram shows the high-level architecture of the Morphik system, including the API, core services, database tables, and external dependencies.
- Database tables are shown in orange, storage in blue, and all text is dark for readability.
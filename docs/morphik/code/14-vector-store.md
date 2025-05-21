# Vector Store (VECTOR_STORE.md)

The `core.vector_store` package is responsible for storing and querying vector embeddings of document chunks. This enables semantic search capabilities within the Morphik system.

## Files

-   `__init__.py`: Standard package initializer.
-   `base_vector_store.py`: Defines the abstract base class for all vector store implementations.
-   `multi_vector_store.py`: Implements a vector store that handles multi-vector embeddings, typically used with models like ColPali, storing binary representations of embeddings in PostgreSQL.
-   `pgvector_store.py`: Implements a vector store using PostgreSQL with the `pgvector` extension for efficient similarity searches on dense vector embeddings.

## `base_vector_store.py`

### `BaseVectorStore(ABC)`

This abstract base class defines the common interface that all vector store implementations must adhere to.

-   **`async def store_embeddings(self, chunks: List[DocumentChunk]) -> Tuple[bool, List[str]]` (Abstract)**:
    -   Stores a list of `DocumentChunk` objects, which include content, metadata, and their vector embeddings.
    -   Returns a tuple containing a boolean success status and a list of stored chunk identifiers (e.g., `document_id-chunk_number`).
-   **`async def query_similar(self, query_embedding: List[float], k: int, doc_ids: Optional[List[str]] = None) -> List[DocumentChunk]` (Abstract)**:
    -   Queries the vector store to find `k` chunks most similar to the given `query_embedding`.
    -   Optionally filters results by a list of `doc_ids`.
    -   Returns a list of `DocumentChunk` objects, typically ordered by similarity score.
-   **`async def get_chunks_by_id(self, chunk_identifiers: List[Tuple[str, int]]) -> List[DocumentChunk]` (Abstract)**:
    -   Retrieves specific chunks based on a list of `(document_id, chunk_number)` tuples.
    -   Returns a list of the requested `DocumentChunk` objects.
-   **`async def delete_chunks_by_document_id(self, document_id: str) -> bool` (Abstract)**:
    -   Deletes all chunks associated with a given `document_id`.
    -   Returns `True` if the operation was successful, `False` otherwise.

## `pgvector_store.py`

This module implements `BaseVectorStore` using PostgreSQL and the `pgvector` extension.

### `Vector(UserDefinedType)`

A custom SQLAlchemy type to represent `pgvector` vectors in the database. It handles the conversion between Python lists of floats and the `vector` string representation used by `pgvector`.

### `VectorEmbedding(Base)`

An SQLAlchemy model defining the schema for the `vector_embeddings` table.

-   `id`: Primary key (Integer).
-   `document_id`: ID of the parent document (String).
-   `chunk_number`: Sequence number of the chunk within the document (Integer).
-   `content`: Text content of the chunk (String).
-   `chunk_metadata`: JSON string storing chunk-specific metadata (String).
-   `embedding`: The vector embedding, using the custom `Vector` type (Vector).
-   `created_at`: Timestamp of creation (TIMESTAMPTZ).
-   **Indexes**:
    -   `idx_document_id`: Index on `document_id`.
    -   `idx_vector_embedding`: An IVFFlat index on the `embedding` column for efficient similarity search, using `vector_cosine_ops`.

### `PGVectorStore(BaseVectorStore)`

The main class for interacting with the `pgvector` store.

-   **`__init__(self, uri: str, max_retries: int = 3, retry_delay: float = 1.0)`**:
    -   Initializes the store with a PostgreSQL connection URI.
    -   Configures connection pool settings (size, overflow, recycle, timeout, pre-ping) based on global settings.
    -   Sets up retry parameters for database operations.
-   **`async def get_session_with_retry(self) -> AsyncContextManager[AsyncSession]`**:
    -   An asynchronous context manager that provides an SQLAlchemy `AsyncSession` with built-in retry logic for `OperationalError`.
-   **`async def initialize(self)`**:
    -   Ensures the `pgvector` extension is enabled in the database (`CREATE EXTENSION IF NOT EXISTS vector`).
    -   Creates the `vector_embeddings` table if it doesn't exist, with the `embedding` column dimensioned according to `settings.VECTOR_DIMENSIONS` (capped at `PGVECTOR_MAX_DIMENSIONS`).
    -   If the table exists but the vector dimension has changed, it warns the user and prompts for confirmation before dropping and recreating the table and its indexes, which deletes all existing vector data.
    -   Creates indexes on `document_id` and an IVFFlat index on `embedding`.
-   **`async def store_embeddings(self, chunks: List[DocumentChunk]) -> Tuple[bool, List[str]]`**:
    -   Stores a list of `DocumentChunk` objects.
    -   For each chunk, it creates a `VectorEmbedding` record and adds it to the session.
    -   Commits the session to save the embeddings.
    -   Returns `True` and a list of chunk identifiers upon success.
-   **`async def query_similar(self, query_embedding: List[float], k: int, doc_ids: Optional[List[str]] = None) -> List[DocumentChunk]`**:
    -   Performs a similarity search using the cosine distance operator (`<->`) provided by `pgvector`.
    -   Orders results by similarity to the `query_embedding`.
    -   Optionally filters by `doc_ids`.
    -   Limits results to `k`.
    -   Converts the SQLAlchemy `VectorEmbedding` results back to `DocumentChunk` objects. Embeddings themselves are not returned in the `DocumentChunk` to save bandwidth.
-   **`async def get_chunks_by_id(self, chunk_identifiers: List[Tuple[str, int]]) -> List[DocumentChunk]`**:
    -   Retrieves chunks by a list of `(document_id, chunk_number)` tuples.
    -   Constructs a SQL query with `OR` conditions to fetch all matching chunks in a single database call.
    -   Converts results to `DocumentChunk` objects.
-   **`async def delete_chunks_by_document_id(self, document_id: str) -> bool`**:
    -   Deletes all `VectorEmbedding` records where `document_id` matches the provided ID.
    -   Returns `True` on successful deletion.

## `multi_vector_store.py`

This module implements `BaseVectorStore` for handling multi-vector embeddings, often used in multimodal scenarios (e.g., ColPali). It stores binary representations of embeddings.

### `MultiVectorStore(BaseVectorStore)`

-   **`__init__(self, uri: str, max_retries: int = 3, retry_delay: float = 1.0)`**:
    -   Initializes with a PostgreSQL connection URI (converting from `asyncpg` to standard `psycopg` format if necessary).
    -   Sets up retry parameters.
-   **`@contextmanager def get_connection(self)`**:
    -   A context manager that provides a raw `psycopg` connection with retry logic for `psycopg.OperationalError`.
    -   Ensures `pgvector.psycopg.register_vector(conn)` is called for each new connection.
-   **`def initialize(self)`**:
    -   Ensures the `vector` extension is enabled.
    -   Creates the `multi_vector_embeddings` table if it doesn't exist. The table schema includes:
        -   `id`: BIGSERIAL PRIMARY KEY
        -   `document_id`: TEXT NOT NULL
        -   `chunk_number`: INTEGER NOT NULL
        -   `content`: TEXT NOT NULL
        -   `chunk_metadata`: TEXT
        -   `embeddings`: `BIT(128)[]` (an array of 128-bit binary vectors)
    -   If the table exists but lacks necessary columns (like `document_id`), it attempts to alter the table to add them.
    -   Creates an index on `document_id`.
    -   Defines or replaces a PL/pgSQL function `max_sim(document bit[], query bit[]) RETURNS double precision`. This function calculates a custom similarity score between a document's array of binary embeddings and a query's array of binary embeddings. It computes the Jaccard similarity (1 - Hamming distance / vector length) for each query vector against all document vectors, takes the maximum similarity for each query vector, and sums these maximums.
-   **`def _binary_quantize(self, embeddings: Union[np.ndarray, torch.Tensor, List]) -> List[Bit]`**:
    -   Converts dense embeddings (NumPy arrays, PyTorch tensors, or lists of them) into a list of binary `Bit` objects.
    -   Each element of the input embedding is converted to 1 if positive, 0 otherwise.
-   **`async def store_embeddings(self, chunks: List[DocumentChunk]) -> Tuple[bool, List[str]]`**:
    -   Stores `DocumentChunk` objects. Each chunk's `embedding` attribute is expected to be a list or array of dense vectors.
    -   These dense vectors are converted to an array of binary vectors using `_binary_quantize`.
    -   Inserts records into the `multi_vector_embeddings` table using raw SQL with `psycopg`.
-   **`async def query_similar(self, query_embedding: Union[np.ndarray, torch.Tensor, List[np.ndarray], List[torch.Tensor]], k: int, doc_ids: Optional[List[str]] = None) -> List[DocumentChunk]`**:
    -   The `query_embedding` is also expected to be a list/array of dense vectors.
    -   Converts the query embeddings to binary format.
    -   Uses the custom `max_sim` SQL function to calculate similarity scores.
    -   Orders results by this similarity score in descending order.
    -   Optionally filters by `doc_ids`.
    -   Returns a list of `DocumentChunk` objects with their scores.
-   **`async def get_chunks_by_id(self, chunk_identifiers: List[Tuple[str, int]]) -> List[DocumentChunk]`**:
    -   Retrieves specific chunks by `(document_id, chunk_number)` tuples.
    -   Constructs a SQL `WHERE` clause with `OR` conditions.
    -   Returns matching `DocumentChunk` objects.
-   **`async def delete_chunks_by_document_id(self, document_id: str) -> bool`**:
    -   Deletes all records from `multi_vector_embeddings` for the given `document_id`.
-   **`def close(self)`**:
    -   Closes the `psycopg` connection if it's open.
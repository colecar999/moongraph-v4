# Workers (WORKERS.md)

The `core.workers` package contains modules related to background job processing, primarily for handling asynchronous tasks like document ingestion.

## Files

-   `__init__.py`: Standard package initializer.
-   `ingestion_worker.py`: Defines the ARQ worker for processing document ingestion jobs.

## `ingestion_worker.py`

This module sets up and defines an ARQ (Asynchronous Rask Queue) worker to handle the `process_ingestion_job` task. This allows for decoupling the initial file upload/text submission from the more time-consuming parsing, embedding, and storage processes.

### Key Components

-   **Logging**:
    -   A specific logger for `ingestion_worker` is configured, writing to `logs/worker_ingestion.log`.
-   **`async def get_document_with_retry(...)`**:
    -   A helper function to retrieve a document from the database with retry logic. This is useful to handle potential race conditions where the ingestion job starts before the initial document metadata record (created by the API endpoint) is fully committed or visible.
    -   It takes `document_service`, `document_id`, `auth`, `max_retries`, and `initial_delay` as arguments.
    -   Uses an exponential backoff strategy for retries.
-   **`async def process_ingestion_job(...)` (ARQ Task)**:
    -   This is the main background task executed by the ARQ worker.
    -   **Arguments**:
        -   `ctx`: The ARQ context dictionary, which holds shared resources like service instances.
        -   `document_id`: The ID of the document being processed.
        -   `file_key`, `bucket`: Information about the file's location in storage.
        -   `original_filename`, `content_type`: Original file details.
        -   `metadata_json`: JSON string of metadata for the document.
        -   `auth_dict`: A dictionary representation of the `AuthContext`.
        -   `rules_list`: A list of rule dictionaries to be applied.
        -   `use_colpali`: Boolean indicating whether to use ColPali embeddings.
        -   `folder_name`, `end_user_id`: Optional scoping parameters.
    -   **Processing Steps**:
        1.  Logs the start of the job and deserializes `metadata_json` and `auth_dict`.
        2.  Retrieves the `DocumentService` instance from the `ctx`.
        3.  Downloads the file content from storage using `document_service.storage.download_file`.
        4.  Parses the file content to text using `document_service.parser.parse_file_to_text`.
        5.  Applies any "post_parsing" rules to the full text using `document_service.rules_processor.process_document_rules`.
        6.  Retrieves the existing document record from the database using `get_document_with_retry`.
        7.  Updates the document record with the parsed text, additional metadata from parsing, and any metadata from rules.
        8.  Splits the processed text into chunks using `document_service.parser.split_text`.
        9.  If `use_colpali` is true, creates multimodal chunks (e.g., image chunks from PDFs) using `document_service._create_chunks_multivector`.
        10. Applies any "post_chunking" rules to the text chunks and, if applicable, image chunks separately using `document_service.rules_processor.process_chunk_rules`. Aggregates metadata extracted by these rules.
        11. Generates standard embeddings for the processed text chunks using `document_service.embedding_model.embed_for_ingestion`.
        12. If `use_colpali` is true, generates ColPali embeddings for the (potentially different) multimodal chunks using `document_service.colpali_embedding_model.embed_for_ingestion`.
        13. Merges any aggregated metadata from chunk rules into the document's main metadata.
        14. Updates the document's status to "completed".
        15. Stores the standard and (if applicable) ColPali chunk objects and their embeddings into their respective vector stores, and updates the final document metadata using `document_service._store_chunks_and_doc`.
        16. Logs performance metrics for various phases of the ingestion.
        17. Returns a dictionary with the `document_id`, `status`, and other details.
    -   **Error Handling**:
        -   If any exception occurs, it logs the error.
        -   Attempts to update the document's status to "failed" in the database, along with the error message.
        -   Returns a status dictionary indicating failure.
-   **`async def startup(ctx)` (ARQ Worker Lifecycle)**:
    -   Called when the ARQ worker starts.
    -   Initializes and stores instances of `PostgresDatabase`, `PGVectorStore`, `LocalStorage`/`S3Storage`, `MorphikParser`, `LiteLLMEmbeddingModel`, `ColpaliEmbeddingModel` (if enabled), `MultiVectorStore` (if enabled), `RulesProcessor`, `TelemetryService`, and `DocumentService` in the `ctx` dictionary. This makes these services available to all jobs processed by this worker.
    -   The `DocumentService` is initialized with only the components needed for ingestion (e.g., `completion_model` and `reranker` might be omitted).
-   **`async def shutdown(ctx)` (ARQ Worker Lifecycle)**:
    -   Called when the ARQ worker shuts down.
    -   Cleans up resources, primarily by disposing of database engine connections.
-   **`def redis_settings_from_env() -> RedisSettings`**:
    -   Utility function to create `RedisSettings` for ARQ based on environment variables (e.g., `REDIS_URL`) or defaults from `core.config.get_settings()`.
    -   Includes optimized settings for connection timeouts, retries, and retry delays to enhance stability for high-volume ingestion.
-   **`class WorkerSettings`**:
    -   Defines the configuration for the ARQ worker.
    -   `functions`: Lists the tasks the worker can execute (i.e., `[process_ingestion_job]`).
    -   `on_startup`: Specifies the `startup` function.
    -   `on_shutdown`: Specifies the `shutdown` function.
    -   `redis_settings`: Uses `redis_settings_from_env()` for Redis connection.
    -   `keep_result_ms`: How long to keep job results (e.g., 24 hours).
    -   `max_jobs`: Maximum number of concurrent jobs.
    -   `health_check_interval`: How often to run the health check.
    -   `job_timeout`: Maximum time a job can run.
    -   `max_tries`: Number of times a failed job will be retried.
    -   `poll_delay`: Delay between polling Redis for new jobs.
    -   `allow_abort_jobs`: If `False`, jobs are not aborted on worker shutdown.
    -   `retry_jobs`: If `True`, failed jobs are retried.
    -   `skip_queue_when_queues_read_fails`: If `True`, worker continues processing other queues if one queue read fails.
    -   `health_check(ctx)` (static method): A periodic health check function that logs Redis status, job statistics, and database/vector store connectivity.

This worker architecture allows Morphik to handle potentially long-running ingestion tasks efficiently in the background without blocking API responses.
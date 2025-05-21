# API (`API.md`)

## Overview

The `api.py` module is the heart of Morphik Core's external interface. It uses the FastAPI framework to define and serve HTTP endpoints that allow clients (like the Morphik SDK or other services) to interact with the core functionalities. This includes operations related to document ingestion, retrieval, querying, knowledge graph management, folder operations, caching, and agent interactions.

The API handles request validation (via Pydantic models), authentication, routing requests to the appropriate services, and formatting responses.

## Key Components and Initialization

### FastAPI Application
```python
app = FastAPI(title="Morphik API")

A FastAPI application instance is created.

# Middleware
-CORS (Cross-Origin Resource Sharing): Configured to allow requests from any origin, which is common for APIs intended to be used by various clients.
-OpenTelemetry Instrumentation: FastAPIInstrumentor is used to automatically instrument the FastAPI application for tracing and metrics, excluding health check endpoints and detailed HTTP send/receive spans to manage telemetry volume.

# Services Initialization
On startup (@app.on_event("startup")), several core services and components are initialized:

--Configuration (settings): Loaded via get_settings() from core.config.
Database (database): An instance of PostgresDatabase is created and initialized.
-Vector Store (vector_store): An instance of PGVectorStore is created and initialized.
--Storage (storage): An instance of either LocalStorage or S3Storage is created based on configuration.
Parser (parser): An instance of MorphikParser.
-Embedding Model (embedding_model): An instance of LiteLLMEmbeddingModel.
-Completion Model (completion_model): An instance of LiteLLMCompletionModel.
-Reranker (reranker): An instance of FlagReranker if enabled.
-Cache Factory (cache_factory): An instance of LlamaCacheFactory.
-ColPali Components: ColpaliEmbeddingModel and MultiVectorStore are initialized if ENABLE_COLPALI is true.
-Document Service (document_service): Orchestrates many of the core operations.
-Morphik Agent (morphik_agent): The intelligent agent for complex queries.
-Redis Pool (redis_pool): For arq background task queueing.
-User Limits Database: Initialized if in "cloud" mode.
-Telemetry Service (telemetry): Initialized for observability.

These services are made available globally within the core.api module or passed as dependencies to endpoint functions.

## Authentication
async def verify_token(authorization: str = Header(None)) -> AuthContext:
    ...


The `verify_token` function is a FastAPI dependency used to authenticate requests.

- In development mode (`settings.dev_mode == True`), it returns a predefined AuthContext allowing unauthenticated access for easier development.
- In production mode, it expects a JWT Bearer token in the Authorization header. It decodes and validates the token, checking for expiration and extracting user/entity information into an AuthContext object. This context includes `entity_type`, `entity_id`, `app_id` (if applicable), `permissions`, and `user_id`.

## Endpoints

The API exposes a variety of endpoints, categorized below. Most endpoints are decorated with `@telemetry.track()` for observability.

### Health Checks

- `GET /health`: Basic health check, returns `{"status": "healthy"}`.
- `GET /health/ready`: Readiness check, returns status and component information.

### Document Ingestion

#### `POST /ingest/text`
- Ingests a raw text document.
- Request body: IngestTextRequest (content, filename, metadata, rules, use_colpali, folder_name, end_user_id).
- Response: Document model.
- Orchestrated by `DocumentService.ingest_text()`.

#### `POST /ingest/file`
- Ingests a file document asynchronously using a background worker.
- Request: UploadFile, metadata (JSON string), rules (JSON string), use_colpali, folder_name, end_user_id.
- Enqueues a job (process_ingestion_job) via ARQ and Redis.
- Response: Document model with status: "processing".

#### `POST /ingest/files`
- Batch ingests multiple files asynchronously.
- Request: List of UploadFile, metadata (shared or list), rules (shared or list), use_colpali, parallel, folder_name, end_user_id.
- Enqueues multiple process_ingestion_job tasks.
- Response: BatchIngestResponse (list of Document objects with processing status, and errors).

### Document Retrieval & Management

#### `POST /retrieve/chunks`
- Retrieves relevant chunks based on a query.
- Request body: RetrieveRequest.
- Response: List of ChunkResult.
- Orchestrated by `DocumentService.retrieve_chunks()`.

#### `POST /retrieve/docs`
- Retrieves relevant full documents based on a query.
- Request body: RetrieveRequest.
- Response: List of DocumentResult.
- Orchestrated by `DocumentService.retrieve_docs()`.

#### `POST /batch/documents`
- Retrieves multiple documents by their IDs.
- Request body: Dict with document_ids (list), folder_name (optional), end_user_id (optional).
- Response: List of Document.
- Orchestrated by `DocumentService.batch_retrieve_documents()`.

#### `POST /batch/chunks`
- Retrieves specific chunks by document ID and chunk number.
- Request body: Dict with sources (list of ChunkSource), folder_name (optional), end_user_id (optional), use_colpali (optional).
- Response: List of ChunkResult.
- Orchestrated by `DocumentService.batch_retrieve_chunks()`.

#### `POST /documents`
- Lists accessible documents with pagination and filtering.
- Request body: Optional metadata filters. Query params: skip, limit, folder_name, end_user_id.
- Response: List of Document.
- Delegates to `Database.get_documents()`.

#### `GET /documents/{document_id}`
- Gets a specific document by its ID.
- Response: Document.

#### `GET /documents/{document_id}/status`
- Gets the processing status of a document.
- Response: Dict with status information.

#### `DELETE /documents/{document_id}`
- Deletes a document and its associated data (chunks, stored file).
- Response: Success status.
- Orchestrated by `DocumentService.delete_document()`.

#### `GET /documents/filename/{filename}`
- Gets a document by its filename. Supports folder_name and end_user_id query params for scoping.
- Response: Document.

#### `POST /documents/{document_id}/update_text`
- Updates a document with new text content.
- Request body: IngestTextRequest, query param: update_strategy.
- Response: Updated Document.
- Orchestrated by `DocumentService.update_document()`.

#### `POST /documents/{document_id}/update_file`
- Updates a document with new file content.
- Request: UploadFile, metadata (JSON string), rules (JSON string), update_strategy, use_colpali.
- Response: Updated Document.
- Orchestrated by `DocumentService.update_document()`.

#### `POST /documents/{document_id}/update_metadata`
- Updates only the metadata of a document.
- Request body: Dict of metadata.
- Response: Updated Document.
- Orchestrated by `DocumentService.update_document()`.

### Query & Agent

#### `POST /query`
- Generates a completion (answer) based on a query and retrieved context. Supports knowledge graph enhancement.
- Request body: CompletionQueryRequest.
- Response: CompletionResponse.
- Orchestrated by `DocumentService.query()`.
- Handles user limits for "query" operations in cloud mode.

#### `POST /agent`
- Processes a natural language query using the MorphikAgent.
- Request body: AgentQueryRequest.
- Response: Dict with response (final answer) and tool_history.
- Handles user limits for "agent" operations in cloud mode.

### Folder Management

#### `POST /folders`
- Creates a new folder.
- Request body: FolderCreate (name, description).
- Response: Folder.

#### `GET /folders`
- Lists all folders accessible to the user.
- Response: List of Folder.

#### `GET /folders/{folder_id}`
- Gets a specific folder by its ID.
- Response: Folder.

#### `POST /folders/{folder_id}/documents/{document_id}`
- Adds a document to a folder.
- Response: Success status.

#### `DELETE /folders/{folder_id}/documents/{document_id}`
- Removes a document from a folder.
- Response: Success status.

#### `POST /folders/{folder_id}/set_rule`
- Sets metadata extraction rules for a folder.
- Request body: SetFolderRuleRequest. Query param: apply_to_existing.
- Applies rules to existing documents if specified.
- Response: Success status with processing results.

### Knowledge Graph

#### `POST /graph/create`
- Creates a knowledge graph from specified documents or filters.
- Request body: CreateGraphRequest.
- Response: Graph.
- Orchestrated by `DocumentService.create_graph()`.
- Handles user limits for "graph" operations in cloud mode.

#### `GET /graph/{name}`
- Retrieves a graph by its name. Supports folder_name and end_user_id query params.
- Response: Graph.

#### `GET /graphs`
- Lists all graphs accessible to the user. Supports folder_name and end_user_id query params.
- Response: List of Graph.

#### `POST /graph/{name}/update`
- Updates an existing graph with new documents or filters.
- Request body: UpdateGraphRequest.
- Response: Updated Graph.
- Orchestrated by `DocumentService.update_graph()`.

#### `DELETE /graph/{graph_name}`
- Deletes a specified graph.
- Response: Success message.

### Cache (Experimental/Internal)

- `POST /cache/create`: Creates a new cache.
- `GET /cache/{name}`: Gets cache configuration.
- `POST /cache/{name}/update`: Updates cache with new documents.
- `POST /cache/{name}/add_docs`: Adds specific documents to the cache.
- `POST /cache/{name}/query`: Queries the cache.
  - Handles user limits for "cache_query" operations in cloud mode.

### URI Generation (for SDK client setup)

#### `POST /local/generate_uri`
- Generates a local development URI with an embedded JWT. Unprotected.
- Request: name (Form), expiry_days (Form).
- Response: Dict with uri.

#### `POST /cloud/generate_uri`
- Generates a cloud URI for applications, typically used by an auth service or admin interface. Requires existing valid JWT for authorization.
- Request body: GenerateUriRequest (app_id, name, user_id, expiry_days).
- Response: Dict with uri and app_id.
- Interacts with UserService to check app limits.

### Logging Endpoints (for debugging/monitoring)

- `GET /logs/list`: Lists available log files.
- `GET /logs/{log_path:path}`: Returns the last N lines of a specified log file.
- `POST /logs/clear`: Clears (truncates) a specified log file.

### Usage Tracking (Internal/Admin)

- `GET /usage/stats`: Gets usage statistics for the authenticated user (or all if admin).
- `GET /usage/recent`: Gets recent usage records with optional filtering.

## Error Handling

The API uses standard HTTP status codes for errors:

- `400 Bad Request`: For invalid request bodies or parameters (e.g., malformed JSON).
- `401 Unauthorized`: For missing, invalid, or expired authentication tokens.
- `403 Forbidden`: When the authenticated user does not have permission for the requested operation.
- `404 Not Found`: When a requested resource (e.g., document, graph, folder) does not exist.
- `422 Unprocessable Entity`: For validation errors in the request payload (Pydantic validation).
- `429 Too Many Requests`: When a user exceeds their rate limits or usage quotas (primarily for free tier in cloud mode).
- `500 Internal Server Error`: For unexpected server-side errors.

Error responses typically include a `detail` field with a description of the error.

## Relationship with SDK

The endpoints defined in `api.py` are the backend counterparts to the methods available in the Morphik Python SDK (e.g., `morphik.sync.Morphik` class). The SDK simplifies interaction with these HTTP endpoints by providing a Pythonic interface.
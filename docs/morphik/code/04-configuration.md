# Configuration (`CONFIGURATION.md`)

## Overview

Morphik Core's configuration is managed through a combination of a `morphik.toml` file and environment variables. The `core/config.py` module is responsible for loading, validating, and providing access to these settings throughout the application. Logging is configured separately in `core/logging_config.py`.

## `core/config.py`

This module defines the `Settings` Pydantic model, which specifies all possible configuration parameters, their types, and default values. The `get_settings()` function, cached using `lru_cache`, loads settings from `morphik.toml` and then overrides them with any corresponding environment variables.

### `Settings` Model

The `Settings` class (a subclass of `pydantic_settings.BaseSettings`) defines the schema for all application settings. Key categories include:

*   **Environment Variables**: Secrets like API keys (`JWT_SECRET_KEY`, `POSTGRES_URI`, `OPENAI_API_KEY`, etc.) are primarily expected to be set as environment variables.
*   **API Configuration**: `HOST`, `PORT`, `RELOAD` for the FastAPI server.
*   **Auth Configuration**:
    *   `JWT_ALGORITHM`, `JWT_SECRET_KEY`.
    *   `dev_mode`: A boolean to enable development mode, which bypasses JWT token verification and uses predefined developer credentials (`dev_entity_type`, `dev_entity_id`, `dev_permissions`).
*   **Registered Models (`REGISTERED_MODELS`)**: A dictionary defining configurations for various language and embedding models accessible via LiteLLM. Each entry specifies model details like `model_name`, `api_key`, `api_base`, etc.
    ```toml
    # Example in morphik.toml
    [registered_models.gpt-4-turbo]
    model_name = "openai/gpt-4-turbo"
    # api_key = "env:OPENAI_API_KEY" # Or directly set

    [registered_models.text-embedding-ada-002]
    model_name = "openai/text-embedding-ada-002"
    ```
*   **Completion Configuration**:
    *   `COMPLETION_PROVIDER`: Currently fixed to "litellm".
    *   `COMPLETION_MODEL`: Key (from `REGISTERED_MODELS`) for the default completion model.
*   **Agent Configuration**:
    *   `AGENT_MODEL`: Key for the agent's language model.
*   **Document Analysis Configuration**:
    *   `DOCUMENT_ANALYSIS_MODEL`: Key for the model used in `document_analyzer` tool.
*   **Database Configuration**:
    *   `DATABASE_PROVIDER`: Currently fixed to "postgres".
    *   `POSTGRES_URI`: Connection string for PostgreSQL.
    *   `DB_POOL_SIZE`, `DB_MAX_OVERFLOW`, `DB_POOL_RECYCLE`, `DB_POOL_TIMEOUT`, `DB_POOL_PRE_PING`: Parameters for SQLAlchemy connection pooling.
    *   `DB_MAX_RETRIES`, `DB_RETRY_DELAY`: Parameters for database connection retry logic.
*   **Embedding Configuration**:
    *   `EMBEDDING_PROVIDER`: Currently fixed to "litellm".
    *   `EMBEDDING_MODEL`: Key for the default embedding model.
    *   `VECTOR_DIMENSIONS`: The dimensionality of the vectors produced by the embedding model.
    *   `EMBEDDING_SIMILARITY_METRIC`: Metric used for vector similarity (e.g., "cosine").
*   **Parser Configuration**:
    *   `CHUNK_SIZE`, `CHUNK_OVERLAP`: Parameters for text splitting.
    *   `USE_UNSTRUCTURED_API`: Boolean to use Unstructured.io's hosted API for parsing. Requires `UNSTRUCTURED_API_KEY`.
    *   `FRAME_SAMPLE_RATE`: For video parsing, how often to sample frames.
    *   `USE_CONTEXTUAL_CHUNKING`: Boolean to enable LLM-based contextual chunking.
*   **Rules Configuration**:
    *   `RULES_PROVIDER`: Currently fixed to "litellm".
    *   `RULES_MODEL`: Key for the model used by the `RulesProcessor`.
    *   `RULES_BATCH_SIZE`: Batch size for processing rules.
*   **Graph Configuration**:
    *   `GRAPH_PROVIDER`: Currently fixed to "litellm".
    *   `GRAPH_MODEL`: Key for the model used in graph creation and entity/relationship extraction.
    *   `ENABLE_ENTITY_RESOLUTION`: Boolean to enable/disable LLM-based entity resolution.
*   **Reranker Configuration**:
    *   `USE_RERANKING`: Boolean to enable/disable search result reranking.
    *   `RERANKER_PROVIDER`, `RERANKER_MODEL`, etc.: Parameters for the chosen reranker (e.g., FlagEmbedding).
*   **Storage Configuration**:
    *   `STORAGE_PROVIDER`: "local" or "aws-s3".
    *   `STORAGE_PATH`: Base path for local storage.
    *   `AWS_REGION`, `S3_BUCKET`: For S3 storage (requires `AWS_ACCESS_KEY`, `AWS_SECRET_ACCESS_KEY` from env).
*   **Vector Store Configuration**:
    *   `VECTOR_STORE_PROVIDER`: Currently fixed to "pgvector".
*   **ColPali Configuration**:
    *   `ENABLE_COLPALI`: Boolean to enable multimodal features using ColPali.
*   **Mode Configuration**:
    *   `MODE`: "cloud" or "self_hosted". Affects features like user limits.
*   **API Domain**:
    *   `API_DOMAIN`: Used for generating URIs (e.g., in SDK client setup).
*   **Redis Configuration**:
    *   `REDIS_HOST`, `REDIS_PORT`: For connecting to the ARQ task queue.
*   **Telemetry Configuration**:
    *   `TELEMETRY_ENABLED`, `HONEYCOMB_ENABLED`.
    *   `HONEYCOMB_PROXY_ENDPOINT`: Endpoint for the OTLP proxy (defaults to a Render service).
    *   `SERVICE_NAME`, `OTLP_TIMEOUT`, `OTLP_MAX_RETRIES`, etc.: Parameters for OpenTelemetry.

### Loading Mechanism (`get_settings`)

1.  Loads environment variables from a `.env` file (if present) using `python-dotenv`.
2.  Reads the `morphik.toml` file.
3.  Constructs a dictionary by chaining the configurations from `morphik.toml` and environment variables (environment variables take precedence).
4.  Validates and instantiates the `Settings` model with this dictionary.
5.  The result is cached using `@lru_cache` so settings are loaded only once.

This approach allows for a base configuration in `morphik.toml` which can be easily overridden by environment-specific settings or secrets.

## `core/logging_config.py`

This module provides the `setup_logging` function to configure Python's standard `logging` module.

### `setup_logging(log_level: str = "INFO")`

*   **`log_level`**: A string representing the desired logging level (e.g., "DEBUG", "INFO", "WARNING", "ERROR"). Defaults to "INFO".
*   Creates a `logs/` directory if it doesn't exist.
*   Configures the root logger with the specified level.
*   Sets up two handlers:
    *   **Console Handler**: Outputs logs to `sys.stdout`.
    *   **File Handler**: Outputs logs to `logs/morphik.log`.
*   Both handlers use a consistent formatter: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`.
*   Sets specific logging levels for potentially noisy libraries:
    *   `uvicorn`, `fastapi`: INFO
    *   `LiteLLM`: WARNING (to reduce verbosity)
    *   OpenTelemetry exporters: CRITICAL (to significantly reduce noise)
*   Sets the logging level for `core.*` modules to match the `log_level` argument, allowing for detailed debugging of Morphik's own components when needed.

This function is typically called at the application startup (e.g., in `api.py` or worker entry points) to ensure consistent logging behavior.
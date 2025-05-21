# Data Models (`DATA_MODELS.md`)

## Overview

The `core/models` directory contains Pydantic models that define the structure and validation rules for various data objects used throughout Morphik Core. These models ensure data consistency and provide clear schemas for API requests and responses, database interactions, and internal data flow.

## Key Model Files and Their Purpose

### 1. `auth.py`
   Defines models related to authentication and authorization.
   *   **`EntityType(str, Enum)`**: Enumerates entity types involved in authentication (e.g., `USER`, `DEVELOPER`).
   *   **`AuthContext(BaseModel)`**: Represents the decoded JWT payload. It holds information about the authenticated entity, including:
        *   `entity_type: EntityType`
        *   `entity_id: str` (UUID of the user or developer)
        *   `app_id: Optional[str]` (UUID, typically for developer entities)
        *   `permissions: Set[str]` (e.g., "read", "write", "admin")
        *   `user_id: Optional[str]` (ID of the end-user, especially relevant in multi-tenant cloud scenarios)

### 2. `chunk.py`
   Defines models for document chunks.
   *   **`Embedding` (TypeAlias)**: Represents an embedding, which can be a list of floats, a list of lists of floats (for multi-vector), or a NumPy array.
   *   **`DocumentChunk(BaseModel)`**: Represents a chunk stored in a vector store.
        *   `document_id: str` (External ID of the parent document)
        *   `content: str`
        *   `embedding: Embedding`
        *   `chunk_number: int`
        *   `metadata: Dict[str, Any]` (Chunk-specific metadata)
        *   `score: float` (Relevance score, typically populated during retrieval)
   *   **`Chunk(BaseModel)`**: A simpler representation of a chunk, often used during parsing before embedding.
        *   `content: str`
        *   `metadata: Dict[str, Any]`
        *   `to_document_chunk()`: Method to convert to a `DocumentChunk`.

### 3. `completion.py`
   Models for language model completion requests and responses.
   *   **`ChunkSource(BaseModel)`**: Information about a specific chunk used as a source for a completion.
        *   `document_id: str`
        *   `chunk_number: int`
        *   `score: Optional[float]`
   *   **`CompletionResponse(BaseModel)`**: The output from a completion generation.
        *   `completion: Union[str, PydanticT]` (The generated text, or a Pydantic model instance if structured output was requested)
        *   `usage: Dict[str, int]` (Token usage statistics)
        *   `finish_reason: Optional[str]`
        *   `sources: List[ChunkSource]` (List of chunks that contributed to the completion)
        *   `metadata: Optional[Dict]`
   *   **`CompletionRequest(BaseModel)`**: Input for requesting a completion.
        *   `query: str`
        *   `context_chunks: List[str]`
        *   `max_tokens: Optional[int]`
        *   `temperature: Optional[float]`
        *   `prompt_template: Optional[str]`
        *   `folder_name: Optional[str]`
        *   `end_user_id: Optional[str]`
        *   `schema: Optional[Union[Type[BaseModel], Dict[str, Any]]]` (For structured output)

### 4. `documents.py`
   Core models for documents and their retrieval results.
   *   **`QueryReturnType(str, Enum)`**: `CHUNKS` or `DOCUMENTS`.
   *   **`StorageFileInfo(BaseModel)`**: Information about a file stored in object storage (e.g., S3 bucket and key, version, filename, timestamp).
   *   **`Document(BaseModel)`**: Represents a document's metadata as stored in the database.
        *   `external_id: str` (Primary identifier, UUID)
        *   `owner: Dict[str, str]` (e.g., `{"type": "developer", "id": "user_uuid"}`)
        *   `content_type: str` (MIME type)
        *   `filename: Optional[str]`
        *   `metadata: Dict[str, Any]` (User-defined metadata)
        *   `storage_info: Dict[str, str]` (Legacy field for single file storage info)
        *   `storage_files: List[StorageFileInfo]` (List of actual files associated with the document in storage)
        *   `system_metadata: Dict[str, Any]` (System-managed metadata like `created_at`, `updated_at`, `version`, `status` ("processing", "completed", "failed"), `folder_name`, `end_user_id`, and the full `content` of the document after parsing and initial rule processing).
        *   `additional_metadata: Dict[str, Any]` (e.g., for video frame descriptions, transcripts)
        *   `access_control: Dict[str, List[str]]` (Lists of entity IDs for "readers", "writers", "admins")
        *   `chunk_ids: List[str]` (IDs of chunks belonging to this document)
   *   **`DocumentContent(BaseModel)`**: Represents how document content is delivered in results (either a URL or the content string itself).
        *   `type: Literal["url", "string"]`
        *   `value: str`
        *   `filename: Optional[str]` (Required if type is "url")
   *   **`DocumentResult(BaseModel)`**: Represents a document-level search result.
        *   `score: float` (Highest chunk score for this document)
        *   `document_id: str`
        *   `metadata: Dict[str, Any]`
        *   `content: DocumentContent`
        *   `additional_metadata: Dict[str, Any]`
   *   **`ChunkResult(BaseModel)`**: Represents a chunk-level search result.
        *   `content: str`
        *   `score: float`
        *   `document_id: str`
        *   `chunk_number: int`
        *   `metadata: Dict[str, Any]` (Includes `is_image` flag)
        *   `content_type: str`
        *   `filename: Optional[str]`
        *   `download_url: Optional[str]`
        *   `augmented_content()`: Method to potentially enhance chunk content, e.g., by adding context for video frames.

### 5. `folders.py`
   Models for organizing documents into folders.
   *   **`Folder(BaseModel)`**: Represents a folder.
        *   `id: str` (UUID)
        *   `name: str`
        *   `description: Optional[str]`
        *   `owner: Dict[str, str]`
        *   `document_ids: List[str]`
        *   `system_metadata: Dict[str, Any]` (`created_at`, `updated_at`)
        *   `access_control: Dict[str, List[str]]`
        *   `rules: List[Dict[str, Any]]` (List of rule configurations applied to documents in this folder)
   *   **`FolderCreate(BaseModel)`**: Request model for creating a new folder.
        *   `name: str`
        *   `description: Optional[str]`

### 6. `graph.py`
   Models for knowledge graph components.
   *   **`Entity(BaseModel)`**: Represents an entity in the graph.
        *   `id: str` (UUID)
        *   `label: str` (e.g., "Apple Inc.")
        *   `type: str` (e.g., "ORGANIZATION")
        *   `properties: Dict[str, Any]`
        *   `document_ids: List[str]` (Documents where this entity was found)
        *   `chunk_sources: Dict[str, List[int]]` (Mapping of document_id to list of chunk numbers where entity appears)
   *   **`Relationship(BaseModel)`**: Represents a relationship between two entities.
        *   `id: str` (UUID)
        *   `source_id: str` (ID of the source entity)
        *   `target_id: str` (ID of the target entity)
        *   `type: str` (e.g., "CEO_OF")
        *   `document_ids: List[str]`
        *   `chunk_sources: Dict[str, List[int]]`
   *   **`Graph(BaseModel)`**: Represents the entire knowledge graph.
        *   `id: str` (UUID)
        *   `name: str`
        *   `entities: List[Entity]`
        *   `relationships: List[Relationship]`
        *   `metadata: Dict[str, Any]` (User-defined graph metadata)
        *   `system_metadata: Dict[str, Any]` (`created_at`, `updated_at`, `folder_name`, `end_user_id`)
        *   `document_ids: List[str]` (All documents included in this graph)
        *   `filters: Optional[Dict[str, Any]]` (Filters used to create/update the graph)
        *   `created_at: datetime`
        *   `updated_at: datetime`
        *   `owner: Dict[str, str]`
        *   `access_control: Dict[str, List[str]]`

### 7. `prompts.py`
   Models for configuring and overriding prompts used in LLM interactions, especially for graph creation and querying.
   *   **`EntityExtractionExample(BaseModel)`**: Example for guiding entity extraction (label, type, properties).
   *   **`EntityResolutionExample(BaseModel)`**: Example for entity resolution (canonical form, variants).
   *   **`EntityExtractionPromptOverride(BaseModel)`**: Configuration for custom entity extraction prompts (template, examples). Requires `{content}` and `{examples}` placeholders in the template.
   *   **`EntityResolutionPromptOverride(BaseModel)`**: Configuration for custom entity resolution prompts (template, examples). Requires `{entities_str}` and `{examples_json}` placeholders.
   *   **`QueryPromptOverride(BaseModel)`**: Configuration for custom query/completion prompts (template). Requires `{question}` and `{context}` placeholders.
   *   **`GraphPromptOverrides(BaseModel)`**: Container for `entity_extraction` and `entity_resolution` overrides specific to graph operations. Forbids extra fields.
   *   **`QueryPromptOverrides(BaseModel)`**: Container for `entity_extraction`, `entity_resolution`, and `query` overrides specific to query operations. Forbids extra fields.
   *   Helper functions `validate_prompt_template_placeholders` and `validate_prompt_overrides_with_http_exception` ensure that custom prompt templates contain the necessary placeholders and that override structures are valid for the given context (graph vs. query).

### 8. `request.py`
   Defines Pydantic models for API request bodies.
   *   **`RetrieveRequest(BaseModel)`**: Base for retrieval, includes `query`, `filters`, `k`, `min_score`, `use_reranking`, `use_colpali`, `graph_name`, `hop_depth`, `include_paths`, `folder_name`, `end_user_id`.
   *   **`CompletionQueryRequest(RetrieveRequest)`**: Extends `RetrieveRequest` with `max_tokens`, `temperature`, `prompt_overrides` (of type `QueryPromptOverrides`), and `schema` (for structured output).
   *   **`IngestTextRequest(BaseModel)`**: For `/ingest/text` endpoint.
   *   **`CreateGraphRequest(BaseModel)`**: For `/graph/create` endpoint, includes `prompt_overrides` (of type `GraphPromptOverrides`).
   *   **`UpdateGraphRequest(BaseModel)`**: For `/graph/{name}/update`, includes `prompt_overrides` (of type `GraphPromptOverrides`).
   *   **`BatchIngestResponse(BaseModel)`**: Response for batch ingestion.
   *   **`GenerateUriRequest(BaseModel)`**: For `/cloud/generate_uri`.
   *   **`MetadataExtractionRuleRequest(BaseModel)`**: Defines a metadata extraction rule for folder rule setting.
   *   **`SetFolderRuleRequest(BaseModel)`**: For `/folders/{folder_id}/set_rule`.
   *   **`AgentQueryRequest(BaseModel)`**: For `/agent` endpoint.

### 9. `rules.py`
   Models for defining rules applied during document ingestion.
   *   **`BaseRule(BaseModel, ABC)`**: Abstract base for rules, with `type` and `stage` (`post_parsing`, `post_chunking`).
        *   `apply()`: Abstract method to apply the rule.
   *   **`MetadataExtractionRule(BaseRule)`**: Rule for extracting metadata based on a provided JSON schema.
        *   `type: Literal["metadata_extraction"]`
        *   `schema: Dict[str, Any]`
        *   `use_images: bool` (Indicates if the rule should process image content)
        *   `apply()`: Uses an LLM (via `instructor` and `litellm`) to extract data matching the schema from text or image content.
   *   **`NaturalLanguageRule(BaseRule)`**: Rule for transforming content using an LLM with a natural language prompt.
        *   `type: Literal["natural_language"]`
        *   `prompt: str`
        *   `apply()`: Uses an LLM to transform the text based on the prompt.

### 10. `tiers.py`
    Defines account tiers and their associated limits.
    *   **`AccountTier(str, Enum)`**: Enumerates account tiers (`FREE`, `PRO`, `CUSTOM`, `SELF_HOSTED`).
    *   **`TIER_LIMITS (Dict)`**: A dictionary mapping each `AccountTier` to a sub-dictionary of its specific limits (e.g., `app_limit`, `storage_file_limit`, `hourly_query_limit`). `SELF_HOSTED` generally has `float("inf")` limits.
    *   **`get_tier_limits(tier: AccountTier, custom_limits: Dict[str, Any] = None) -> Dict[str, Any]`**: Function to retrieve the limits for a given tier, applying `custom_limits` if the tier is `CUSTOM`.

### 11. `user_limits.py`
    Models for tracking user usage against their tier limits.
    *   **`UserUsage(BaseModel)`**: Tracks various usage counters like `storage_file_count`, `storage_size_bytes`, `hourly_query_count`, `monthly_ingest_count`, etc., along with their reset timestamps.
    *   **`UserLimits(BaseModel)`**: Represents a user's overall limits and current usage.
        *   `user_id: str`
        *   `tier: AccountTier`
        *   `created_at: datetime`
        *   `updated_at: datetime`
        *   `usage: UserUsage`
        *   `custom_limits: Optional[Dict[str, Any]]` (For `CUSTOM` tier)
        *   `app_ids: list[str]`

### 12. `video.py`
    Models specific to video processing.
    *   **`TimeSeriesData(BaseModel)`**: A structure for storing time-stamped data (like frame descriptions or transcript segments).
        *   `time_to_content: Dict[float, str]`
        *   Computed properties: `_sorted_items`, `timestamps`, `contents`, `content_to_times` for efficient access.
        *   `at_time()`: Retrieves content at or around a specific time, with optional padding.
        *   `to_chunks()`: Converts time-series data into a list of `Chunk` objects.
    *   **`ParseVideoResult(BaseModel)`**: The result of parsing a video.
        *   `metadata: Dict[str, Union[float, int]]` (e.g., duration, fps)
        *   `frame_descriptions: TimeSeriesData`
        *   `transcript: TimeSeriesData`

These Pydantic models are fundamental to the type safety and data validation within Morphik Core, ensuring that data conforms to expected structures as it moves between different components and across API boundaries.
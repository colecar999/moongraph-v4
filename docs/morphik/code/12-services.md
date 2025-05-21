# Services (SERVICES.md)

The services module contains higher-level business logic that orchestrates operations across different components like databases, parsers, embedding models, and vector stores.

## Table of Contents

- [DocumentService](#documentservice)
- [EntityResolver](#entityresolver)
- [GraphService](#graphservice)
- [RulesProcessor](#rulesprocessor)
- [TelemetryService](#telemetryservice)
- [UserService](#userservice)

## DocumentService (`core/services/document_service.py`)

`DocumentService` is a central class for managing and interacting with documents. It handles operations like ingestion, retrieval (of chunks and documents), querying for completions, caching, and graph creation/updates.

```python
# Key imports and class structure
import asyncio
import base64
import logging
# ... other necessary imports
from core.models.auth import AuthContext
from core.models.documents import Document, ChunkResult, DocumentResult, StorageFileInfo
from core.models.completion import CompletionRequest, CompletionResponse, ChunkSource
from core.models.graph import Graph
from core.models.prompts import GraphPromptOverrides, QueryPromptOverrides
# ... imports for database, vector_store, storage, parser, embedding_model, etc.

class DocumentService:
    def __init__(
        self,
        database: BaseDatabase,
        vector_store: BaseVectorStore,
        storage: BaseStorage,
        parser: BaseParser,
        embedding_model: BaseEmbeddingModel,
        completion_model: Optional[BaseCompletionModel] = None,
        cache_factory: Optional[BaseCacheFactory] = None,
        reranker: Optional[BaseReranker] = None,
        enable_colpali: bool = False,
        colpali_embedding_model: Optional[ColpaliEmbeddingModel] = None,
        colpali_vector_store: Optional[MultiVectorStore] = None,
    ):
        # ... initialization of self.db, self.vector_store, etc.
        # ... self.graph_service is initialized if completion_model is provided
        ...

    async def _ensure_folder_exists(self, folder_name: str, document_id: str, auth: AuthContext) -> Optional[Folder]:
        # ... implementation to create or find a folder and add a document to it
        ...

    async def retrieve_chunks(
        self,
        query: str,
        auth: AuthContext,
        filters: Optional[Dict[str, Any]] = None,
        k: int = 5,
        min_score: float = 0.0,
        use_reranking: Optional[bool] = None,
        use_colpali: Optional[bool] = None,
        folder_name: Optional[str] = None,
        end_user_id: Optional[str] = None,
    ) -> List[ChunkResult]:
        # ... implementation for retrieving and optionally reranking chunks
        # ... handles colpali and standard embeddings, and reranking logic
        ...

    async def _combine_multi_and_regular_chunks(
        self,
        query: str,
        chunks: List[DocumentChunk],
        chunks_multivector: List[DocumentChunk],
        should_rerank: bool = None,
    ):
        # ... logic to merge chunks from regular and colpali (multivector) stores
        # ... if reranking with colpali, uses a smaller ColIdefics3 model for consistent scoring
        ...

    async def retrieve_docs(
        self,
        # ... params similar to retrieve_chunks
    ) -> List[DocumentResult]:
        # ... retrieves chunks and then groups them into document results
        ...

    async def batch_retrieve_documents(
        self,
        document_ids: List[str],
        auth: AuthContext,
        folder_name: Optional[str] = None,
        end_user_id: Optional[str] = None,
    ) -> List[Document]:
        # ... batch retrieves full document objects by their IDs
        ...

    async def batch_retrieve_chunks(
        self,
        chunk_ids: List[ChunkSource],
        auth: AuthContext,
        folder_name: Optional[str] = None,
        end_user_id: Optional[str] = None,
        use_colpali: Optional[bool] = None,
    ) -> List[ChunkResult]:
        # ... batch retrieves specific chunks by document ID and chunk number
        # ... handles merging from regular and colpali stores if use_colpali is true
        ...

    async def query(
        self,
        query: str,
        auth: AuthContext,
        # ... other params: filters, k, min_score, max_tokens, temperature, reranking, colpali, graph options
        prompt_overrides: Optional["QueryPromptOverrides"] = None,
        folder_name: Optional[str] = None,
        end_user_id: Optional[str] = None,
        schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
    ) -> CompletionResponse:
        # ... if graph_name provided, delegates to self.graph_service.query_with_graph
        # ... otherwise, retrieves chunks, augments content, and calls self.completion_model
        ...

    async def ingest_text(
        self,
        content: str,
        filename: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        auth: AuthContext = None,
        rules: Optional[List[str]] = None, # Should be List[Dict[str, Any]] based on RulesProcessor
        use_colpali: Optional[bool] = None,
        folder_name: Optional[str] = None,
        end_user_id: Optional[str] = None,
    ) -> Document:
        # ... handles ingestion of raw text
        # ... applies rules, splits text, generates embeddings (regular and colpali if enabled)
        # ... stores document metadata and chunk embeddings
        # ... ensures folder exists if folder_name is provided
        ...

    def _create_chunks_multivector(self, file_type, file_content_base64: str, file_content: bytes, chunks: List[Chunk]):
        # ... helper to prepare chunks for Colpali (multivector) embedding, especially for images/PDFs
        ...

    async def _store_chunks_and_doc(
        self,
        chunk_objects: List[DocumentChunk],
        doc: Document,
        use_colpali: bool = False,
        chunk_objects_multivector: Optional[List[DocumentChunk]] = None,
        is_update: bool = False,
        auth: Optional[AuthContext] = None,
    ) -> List[str]:
        # ... helper to store chunk embeddings in vector stores (regular and colpali)
        # ... and store/update document metadata in the database, with retry logic
        ...

    async def _create_chunk_results(self, auth: AuthContext, chunks: List[DocumentChunk]) -> List[ChunkResult]:
        # ... helper to convert DocumentChunk objects to ChunkResult objects, enriching with document metadata
        ...

    async def _create_document_results(self, auth: AuthContext, chunks: List[ChunkResult]) -> Dict[str, DocumentResult]:
        # ... helper to group ChunkResult objects by document and create DocumentResult objects
        ...

    async def create_cache(
        self,
        name: str,
        model: str,
        gguf_file: str,
        docs: List[Document | None],
        filters: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        # ... creates a new cache, stores its metadata and state
        ...

    async def load_cache(self, name: str) -> bool: # Should return Dict[str, Any] based on usage
        # ... loads a cache from storage into memory
        ...

    async def update_document(
        self,
        document_id: str,
        auth: AuthContext,
        content: Optional[str] = None,
        file: Optional[UploadFile] = None,
        filename: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        rules: Optional[List] = None, # Should be List[Dict[str, Any]]
        update_strategy: str = "add",
        use_colpali: Optional[bool] = None,
    ) -> Optional[Document]:
        # ... handles updating document content (text or file) and/or metadata
        # ... supports different update strategies, applies rules, re-chunks, re-embeds
        # ... manages file versioning via storage_files
        ...
    
    # ... other private helper methods for update_document:
    # _validate_update_access, _process_text_update, _process_file_update,
    # _update_storage_info, _apply_update_strategy, _update_metadata_and_version,
    # _update_document_metadata_only, _process_chunks_and_embeddings, _process_colpali_embeddings

    async def create_graph(
        self,
        name: str,
        auth: AuthContext,
        filters: Optional[Dict[str, Any]] = None,
        documents: Optional[List[str]] = None,
        prompt_overrides: Optional[GraphPromptOverrides] = None,
        system_filters: Optional[Dict[str, Any]] = None,
    ) -> Graph:
        # ... delegates graph creation to self.graph_service
        ...

    async def update_graph(
        self,
        name: str,
        auth: AuthContext,
        additional_filters: Optional[Dict[str, Any]] = None,
        additional_documents: Optional[List[str]] = None,
        prompt_overrides: Optional[GraphPromptOverrides] = None,
        system_filters: Optional[Dict[str, Any]] = None,
    ) -> Graph:
        # ... delegates graph update to self.graph_service
        ...

    async def delete_document(self, document_id: str, auth: AuthContext) -> bool:
        # ... deletes a document from the database, its chunks from vector stores, and its file(s) from storage
        ...

    def close(self):
        # ... clears active caches
        ...

Key Responsibilities & Methods:

Initialization: Takes instances of database, vector store, storage, parser, embedding model, completion model, reranker, cache factory, and Colpali components.
Ingestion:
ingest_text(): Ingests text content, applies rules, chunks, embeds, and stores.
Manages folder creation and document association with folders (_ensure_folder_exists).
Retrieval:
retrieve_chunks(): Fetches relevant chunks based on a query, supporting filters, reranking, Colpali, and folder/user scoping.
retrieve_docs(): Retrieves chunks and groups them into document-level results.
batch_retrieve_documents(): Efficiently fetches multiple full documents by ID.
batch_retrieve_chunks(): Efficiently fetches specific chunks by document ID and chunk number.
_combine_multi_and_regular_chunks(): Merges results from standard and Colpali (multivector) stores, potentially reranking with a smaller Colpali model.
Querying & Completion:
query(): Generates a completion response. If a graph_name is provided, it uses GraphService for knowledge graph-enhanced retrieval. Otherwise, it performs standard chunk retrieval and uses the completion model. Supports prompt overrides and schema for structured output.
Document Management:
update_document(): Updates existing documents with new text or file content, or metadata. Supports different update strategies (e.g., "add"), rule application, and manages file versioning through storage_files.
delete_document(): Removes a document, its chunks, and associated storage files.
Caching:
create_cache(): Creates a new cache instance (e.g., LlamaCache) based on specified documents or filters.
load_cache(): Loads a previously created cache state into memory.
Graph Operations:
create_graph(): Delegates to GraphService to build a knowledge graph from specified documents or filters.
update_graph(): Delegates to GraphService to update an existing graph with new documents or filters.
Helper Methods: Includes various private methods for creating chunk/document results, storing data, and processing updates.
EntityResolver (core/services/entity_resolution.py)
EntityResolver is responsible for identifying and normalizing different textual mentions that refer to the same real-world entity. For example, it can group "JFK", "John F. Kennedy", and "Kennedy" as referring to the same person.

python

Run

Copy
import logging
from typing import Any, Dict, List, Optional, Tuple

from pydantic import BaseModel, ConfigDict

from core.config import get_settings
from core.models.graph import Entity
from core.models.prompts import EntityResolutionPromptOverride

logger = logging.getLogger(__name__)

class EntityGroup(BaseModel):
    model_config = ConfigDict(extra="forbid")
    canonical: str
    variants: List[str]

class EntityResolutionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    entity_groups: List[EntityGroup]

class EntityResolver:
    def __init__(self):
        self.settings = get_settings()

    async def resolve_entities(
        self,
        entities: List[Entity],
        prompt_overrides: Optional[EntityResolutionPromptOverride] = None,
    ) -> Tuple[List[Entity], Dict[str, str]]:
        # ... (handles empty or single entity lists)
        # ... (uses _resolve_with_llm to get entity groupings)
        # ... (creates a mapping from original entity labels to canonical labels)
        # ... (deduplicates entities based on this mapping, merging document_ids and chunk_sources)
        # ... (adds 'aliases' property to the canonical entity)
        ...

    async def _resolve_with_llm(
        self, entity_labels: List[str], prompt_template=None, examples=None, **options
    ) -> List[Dict[str, Any]]:
        # ... (imports instructor and litellm)
        # ... (creates a prompt for the LLM using _create_entity_resolution_prompt)
        # ... (gets graph model configuration from settings)
        # ... (uses instructor.from_litellm for structured output based on EntityResolutionResult)
        # ... (returns a list of entity group dictionaries or a fallback if LLM call fails)
        ...

    def _create_entity_resolution_prompt(self, entity_labels: List[str], prompt_template=None, examples=None) -> str:
        # ... (constructs a detailed prompt for the LLM)
        # ... (includes examples of entity groups, either custom or default)
        # ... (if prompt_template is provided, formats it with entities_str and examples_json)
        # ... (provides critical rules for the LLM, e.g., synonymy ONLY, DO NOT group related concepts)
        ...
Key Responsibilities & Methods:

resolve_entities(entities: List[Entity], prompt_overrides: Optional[EntityResolutionPromptOverride]):
Takes a list of Entity objects and optional prompt overrides.
Uses an LLM (via _resolve_with_llm) to group synonymous entity labels.
Normalizes the input list of entities by:
Updating entity labels to their canonical form.
Merging document_ids and chunk_sources for entities that resolve to the same canonical form.
Adding an aliases property to the canonical entity containing its variant forms.
Returns a tuple containing the list of normalized (unique) entities and a mapping dictionary from original labels to canonical labels.
_resolve_with_llm(...):
Constructs a prompt for entity resolution using _create_entity_resolution_prompt.
Uses instructor with litellm to call the configured graph LLM, expecting a structured JSON output matching EntityResolutionResult.
Handles potential errors by falling back to treating each entity as unique.
_create_entity_resolution_prompt(...):
Generates a detailed prompt for the LLM, providing the list of extracted entity labels and examples of how to group them.
Supports custom prompt templates and examples. If not provided, default examples (e.g., "JFK" -> "John F. Kennedy") are used.
Includes specific instructions to the LLM, such as focusing only on synonyms and not grouping merely related concepts.
GraphService (core/services/graph_service.py)
GraphService manages the creation, updating, and querying of knowledge graphs.

python

Run

Copy
# Key imports and class structure
import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

import numpy as np
from pydantic import BaseModel

from core.completion.base_completion import BaseCompletionModel
from core.config import get_settings
from core.database.base_database import BaseDatabase
from core.embedding.base_embedding_model import BaseEmbeddingModel
from core.models.auth import AuthContext
from core.models.completion import ChunkSource, CompletionRequest, CompletionResponse
from core.models.documents import ChunkResult, Document
from core.models.graph import Entity, Graph, Relationship
from core.models.prompts import EntityExtractionPromptOverride, GraphPromptOverrides, QueryPromptOverrides
from core.services.entity_resolution import EntityResolver

logger = logging.getLogger(__name__)

# ... (EntityExtraction, RelationshipExtraction, ExtractionResult Pydantic models)

class GraphService:
    def __init__(
        self,
        db: BaseDatabase,
        embedding_model: BaseEmbeddingModel,
        completion_model: BaseCompletionModel,
    ):
        self.db = db
        self.embedding_model = embedding_model
        self.completion_model = completion_model
        self.entity_resolver = EntityResolver()

    async def create_graph(
        self,
        name: str,
        auth: AuthContext,
        document_service, # Passed in to avoid circular import
        filters: Optional[Dict[str, Any]] = None,
        documents: Optional[List[str]] = None,
        prompt_overrides: Optional[GraphPromptOverrides] = None,
        system_filters: Optional[Dict[str, Any]] = None,
    ) -> Graph:
        # ... (checks write permissions)
        # ... (determines document_ids to include based on 'documents', 'filters', and 'system_filters')
        # ... (retrieves authorized document objects using document_service.batch_retrieve_documents)
        # ... (creates a new Graph object with owner and access_control info)
        # ... (calls _process_documents_for_entities to extract entities/relationships)
        # ... (stores the graph in the database)
        ...

    async def update_graph(
        self,
        name: str,
        auth: AuthContext,
        document_service, # Passed in to avoid circular import
        additional_filters: Optional[Dict[str, Any]] = None,
        additional_documents: Optional[List[str]] = None,
        prompt_overrides: Optional[GraphPromptOverrides] = None,
        system_filters: Optional[Dict[str, Any]] = None,
    ) -> Graph:
        # ... (checks write permissions)
        # ... (retrieves the existing graph)
        # ... (calls _get_new_document_ids to find documents to add based on original and additional filters/docs)
        # ... (retrieves new document objects)
        # ... (calls _process_documents_for_entities for new documents)
        # ... (calls _merge_graph_data to combine new data with existing graph)
        # ... (stores the updated graph)
        ...
    
    async def _get_new_document_ids(
        self,
        auth: AuthContext,
        existing_graph: Graph,
        additional_filters: Optional[Dict[str, Any]] = None,
        additional_documents: Optional[List[str]] = None,
        system_filters: Optional[Dict[str, Any]] = None,
    ) -> Set[str]:
        # ... (helper to determine which new documents should be added to the graph)
        ...

    def _merge_graph_data(
        self,
        existing_graph: Graph,
        new_entities_dict: Dict[str, Entity],
        new_relationships: List[Relationship],
        document_ids: Set[str], # All document IDs that should be in the graph
        additional_filters: Optional[Dict[str, Any]] = None,
        additional_doc_ids: Optional[Set[str]] = None, # Docs that had entities/rels extracted
    ) -> Graph:
        # ... (merges new entities and relationships into the existing_graph object)
        # ... (updates document_ids and filters on the graph)
        ...

    # ... other private helper methods for merging: _smart_merge_filters, _merge_entities, _merge_relationships, _merge_relationship_sources

    async def _process_documents_for_entities(
        self,
        documents: List[Document],
        auth: AuthContext,
        document_service,
        prompt_overrides: Optional[GraphPromptOverrides] = None,
    ) -> Tuple[Dict[str, Entity], List[Relationship]]:
        # ... (retrieves chunks for all documents)
        # ... (iterates through chunks, calling extract_entities_from_text for each)
        # ... (collects all extracted entities and relationships)
        # ... (if entity resolution is enabled, calls self.entity_resolver.resolve_entities)
        # ... (updates relationship source/target IDs to use canonical entity IDs)
        # ... (deduplicates relationships)
        ...

    async def extract_entities_from_text(
        self,
        content: str,
        doc_id: str,
        chunk_number: int,
        prompt_overrides: Optional[EntityExtractionPromptOverride] = None,
    ) -> Tuple[List[Entity], List[Relationship]]:
        # ... (constructs a prompt for entity and relationship extraction, supporting custom templates/examples)
        # ... (uses instructor with litellm to call the configured graph LLM, expecting ExtractionResult)
        # ... (calls _process_extraction_results to convert LLM output to Entity and Relationship objects)
        ...

    def _process_extraction_results(
        self, extraction_result: ExtractionResult, doc_id: str, chunk_number: int
    ) -> Tuple[List[Entity], List[Relationship]]:
        # ... (converts raw LLM extraction results (EntityExtraction, RelationshipExtraction) into formal Entity and Relationship Pydantic models)
        # ... (populates chunk_sources and document_ids for each new entity/relationship)
        ...

    async def query_with_graph(
        self,
        query: str,
        graph_name: str,
        auth: AuthContext,
        document_service, # Passed to avoid circular import
        # ... other params: filters, k, min_score, max_tokens, temperature, reranking, colpali, hop_depth, etc.
        prompt_overrides: Optional[QueryPromptOverrides] = None,
        folder_name: Optional[str] = None,
        end_user_id: Optional[str] = None,
    ) -> CompletionResponse:
        # ... (retrieves the specified graph)
        # ... (performs standard vector search for initial chunks: vector_chunks)
        # ... (extracts entities from the query: query_entities using _extract_entities_from_query)
        # ... (if no query_entities, finds similar entities in the graph using _find_similar_entities)
        # ... (otherwise, resolves query_entities against graph entities and matches them)
        # ... (expands matched/similar entities using _expand_entities up to hop_depth)
        # ... (retrieves chunks containing these expanded entities: graph_chunks using _retrieve_entity_chunks)
        # ... (if include_paths, finds relationship paths using _find_relationship_paths)
        # ... (combines vector_chunks and graph_chunks using _combine_chunk_results)
        # ... (generates a final completion using _generate_completion, passing combined chunks and path info)
        ...

    # ... other private helper methods for graph querying:
    # _extract_entities_from_query, _find_similar_entities, _batch_get_embeddings,
    # _expand_entities, _get_connected_entity_ids, _retrieve_entity_chunks,
    # _combine_chunk_results, _find_relationship_paths, _calculate_cosine_similarity,
    # _generate_completion
Key Responsibilities & Methods:

Graph Creation & Update:
create_graph(): Builds a new knowledge graph from a set of documents (specified by IDs or filters). It extracts entities and relationships using LLMs and stores the graph.
update_graph(): Adds new information to an existing graph from additional documents or filters.
_process_documents_for_entities(): A core helper that iterates through document chunks, extracts entities/relationships using extract_entities_from_text, and then resolves/merges them.
extract_entities_from_text(): Calls an LLM (via instructor and litellm) with a specific prompt to extract structured entity and relationship data from a text chunk. Supports prompt overrides.
Graph-Enhanced Querying:
query_with_graph(): The main entry point for querying with graph context. It combines traditional vector search with graph traversal:
Extracts entities from the user's query.
Matches these query entities to entities in the knowledge graph (using exact matching after resolution or embedding similarity as a fallback).
Expands from these seed entities in the graph up to hop_depth to find related entities.
Retrieves document chunks associated with all these relevant graph entities.
Combines these graph-derived chunks with chunks from a standard vector search.
Optionally includes relationship paths in the context provided to the LLM for final answer generation.
Entity & Relationship Processing:
Uses EntityResolver for normalizing extracted entities.
Includes logic for merging entities and relationships, and deduplicating them.
Helper Methods: Contains numerous private methods for tasks like finding similar entities via embeddings (_find_similar_entities), expanding entity sets through graph traversal (_expand_entities), retrieving chunks for specific entities (_retrieve_entity_chunks), and combining results.
RulesProcessor (core/services/rules_processor.py)
The RulesProcessor is responsible for applying a series of predefined rules to document content or individual chunks during the ingestion pipeline. These rules can modify content or extract metadata.

python

Run

Copy
import logging
from typing import Any, Dict, List, Tuple

from pydantic import BaseModel

from core.config import get_settings
from core.models.chunk import Chunk
from core.models.rules import BaseRule, MetadataExtractionRule, NaturalLanguageRule

logger = logging.getLogger(__name__)
settings = get_settings()

class RuleResponse(BaseModel): # Not directly used by RulesProcessor, but related to rule output
    metadata: Dict[str, Any] = {}
    modified_text: str

class RulesProcessor:
    def __init__(self):
        logger.debug(
            f"Initializing RulesProcessor with {settings.RULES_PROVIDER} provider using model {settings.RULES_MODEL}"
        )

    def _parse_rule(self, rule_dict: Dict[str, Any]) -> BaseRule:
        # ... (parses a dictionary into a specific rule object like MetadataExtractionRule or NaturalLanguageRule)
        # ... (validates 'stage' and 'type' fields)
        ...

    async def process_document_rules(self, content: str, rules: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], str]:
        # ... (filters rules for 'post_parsing' stage)
        # ... (iteratively applies each rule to the full document content)
        # ... (aggregates metadata extracted by rules)
        # ... (returns aggregated metadata and the potentially modified content)
        ...

    async def process_chunk_rules(self, chunk: Chunk, rules: List[Dict[str, Any]]) -> Tuple[Dict[str, Any], Chunk]:
        # ... (filters rules for 'post_chunking' stage and chunk type (text/image))
        # ... (iteratively applies each rule to the chunk's content)
        # ... (if MetadataExtractionRule, aggregates extracted metadata)
        # ... (if NaturalLanguageRule, updates the chunk's content for subsequent rules)
        # ... (returns aggregated metadata (for this chunk) and the potentially modified chunk object)
        ...
Key Responsibilities & Methods:

Initialization: Configured with a rules provider and model from global settings.
_parse_rule(rule_dict): A helper method to convert a rule definition (dictionary) into an instance of a BaseRule subclass (e.g., MetadataExtractionRule, NaturalLanguageRule). It validates the rule's type and stage.
process_document_rules(content, rules):
Filters the provided list of rules to select only those intended for the "post-parsing" stage (i.e., to be applied to the entire document content before chunking).
Applies these rules sequentially to the document content.
Each rule can modify the content (which is then passed to the next rule) and/or return metadata.
Aggregates all metadata returned by the rules.
Returns a tuple: (aggregated_metadata, final_modified_content).
process_chunk_rules(chunk, rules):
Filters rules for the "post-chunking" stage.
For MetadataExtractionRule, it also checks if the rule's use_images flag matches the chunk's type (image or text).
Applies these rules sequentially to the content of the input Chunk.
MetadataExtractionRules return metadata which is aggregated.
NaturalLanguageRules can modify the chunk's content, which is then used by subsequent rules for that same chunk.
Returns a tuple: (aggregated_metadata_from_this_chunk, modified_chunk_object). The aggregated metadata is intended to be further aggregated at the document level by the caller (e.g., DocumentService).
TelemetryService (core/services/telemetry.py)
TelemetryService provides a centralized way to track operations, metrics, and traces, primarily for sending data to Honeycomb via a proxy. It uses OpenTelemetry for instrumentation.

python

Run

Copy
# Key imports and class structure
import functools
import hashlib
import json
import logging
# ... other necessary imports for OpenTelemetry, requests, etc.
from opentelemetry import metrics, trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.metrics import MeterProvider
# ... imports for exporters (OTLPMetricExporter, OTLPSpanExporter, FileExporter)

# ... (Configuration constants like TELEMETRY_ENABLED, HONEYCOMB_PROXY_ENDPOINT, etc.)
# ... (Helper classes: FileSpanExporter, FileMetricExporter, RetryingOTLPMetricExporter, RetryingOTLPSpanExporter)
# ... (Dataclass: UsageRecord)
# ... (MetadataField and MetadataExtractor helper classes for structured metadata in traces)

class TelemetryService:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        # ... (Singleton pattern implementation)
        ...

    def _initialize(self):
        # ... (Sets up OpenTelemetry TracerProvider and MeterProvider if TELEMETRY_ENABLED)
        # ... (Configures OTLP exporters to point to HONEYCOMB_PROXY_ENDPOINT)
        # ... (Configures File exporters for local logging of traces/metrics)
        # ... (Creates counters and histograms: operation_counter, token_counter, operation_duration)
        # ... (Initializes various MetadataExtractor instances for different API operations)
        ...

    def _setup_metadata_extractors(self):
        # ... (Defines specific MetadataExtractor instances for each tracked API endpoint)
        # Example:
        # self.ingest_text_metadata = MetadataExtractor([...])
        # self.query_metadata = MetadataExtractor([...])
        ...

    def track(self, operation_type: Optional[str] = None, metadata_resolver: Optional[Callable] = None):
        # ... (Decorator for easily instrumenting functions/methods)
        # ... (Extracts 'auth' from kwargs to get user_id for the span)
        # ... (Uses metadata_resolver to get specific metadata for the operation)
        # ... (Calls self.track_operation context manager)
        ...

    @asynccontextmanager
    async def track_operation(
        self,
        operation_type: str,
        user_id: str, # Hashed before sending
        tokens_used: int = 0,
        metadata: Optional[Dict[str, Any]] = None,
    ):
        # ... (Main context manager for tracking an operation)
        # ... (If not TELEMETRY_ENABLED, yields None and returns)
        # ... (Hashes user_id for anonymity)
        # ... (Sets attributes on the current OpenTelemetry span: operation.type, user.id (hashed), metadata.*)
        # ... (Records metrics: operation_counter, token_counter, operation_duration)
        # ... (Appends a UsageRecord to self._usage_records)
        ...

    def get_user_usage(self, user_id: str) -> Dict[str, int]:
        # ... (Returns aggregated token usage for a (hashed) user_id)
        ...

    def get_recent_usage(
        self,
        user_id: Optional[str] = None,
        operation_type: Optional[str] = None,
        since: Optional[datetime] = None,
        status: Optional[str] = None,
    ) -> List[UsageRecord]:
        # ... (Returns a list of recent UsageRecord objects, with optional filtering)
        ...
Key Responsibilities & Methods:

Singleton: Ensures only one instance of the service exists.
Initialization (_initialize):
Sets up OpenTelemetry's TracerProvider and MeterProvider if TELEMETRY_ENABLED is true.
Configures exporters:
FileSpanExporter and FileMetricExporter for local logging of traces and metrics to logs/telemetry/.
RetryingOTLPSpanExporter and RetryingOTLPMetricExporter (custom wrappers for OTLP exporters) to send data to the HONEYCOMB_PROXY_ENDPOINT if HONEYCOMB_ENABLED is true. These wrappers add retry logic.
Defines OpenTelemetry metrics: operation_counter, token_counter, operation_duration.
Initializes various MetadataExtractor instances (_setup_metadata_extractors) tailored for different API operations to capture relevant request parameters as span attributes.
track(operation_type, metadata_resolver) Decorator:
A convenience decorator to wrap functions/methods that need to be instrumented.
Automatically extracts auth context to get user_id.
Uses the provided metadata_resolver (an instance of MetadataExtractor) to pull specific arguments from the decorated function's call into the telemetry metadata.
Invokes track_operation to manage the span and metrics.
track_operation(...) Context Manager:
The core method for instrumenting a block of code.
If telemetry is disabled, it does nothing.
Hashes the user_id for anonymity before sending.
Sets attributes on the current OpenTelemetry span (e.g., operation.type, user.id, and custom metadata).
Records metrics (operation count, tokens used, duration) upon exiting the context.
Stores a UsageRecord locally (in memory) for simple usage tracking.
Usage Tracking:
get_user_usage(): Retrieves aggregated token counts per operation type for a given user.
get_recent_usage(): Retrieves a list of recent UsageRecord objects, filterable by user, operation type, time, and status.
Anonymization: Hashes user_id using SHA256 before including it in telemetry data to protect user privacy.
Installation ID: Generates or retrieves a unique anonymous installation_id (stored in ~/.databridge/installation_id) to distinguish different deployments.
UserService (core/services/user_service.py)
UserService is responsible for managing user-specific data related to account tiers, usage limits, and application registration, primarily interacting with UserLimitsDatabase.

python

Run

Copy
import logging
from datetime import UTC, datetime, timedelta
from typing import Any, Dict, Optional

import jwt # For generating cloud URI tokens

from ..config import get_settings
from ..database.user_limits_db import UserLimitsDatabase
from ..models.tiers import AccountTier, get_tier_limits

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.settings = get_settings()
        self.db = UserLimitsDatabase(uri=self.settings.POSTGRES_URI)

    async def initialize(self) -> bool:
        return await self.db.initialize()

    async def get_user_limits(self, user_id: str) -> Optional[Dict[str, Any]]:
        return await self.db.get_user_limits(user_id)

    async def create_user(self, user_id: str) -> bool:
        # Creates a user with the FREE tier by default
        return await self.db.create_user_limits(user_id, tier=AccountTier.FREE)

    async def update_user_tier(self, user_id: str, tier: str, custom_limits: Optional[Dict[str, Any]] = None) -> bool:
        return await self.db.update_user_tier(user_id, tier, custom_limits)

    async def register_app(self, user_id: str, app_id: str) -> bool:
        # ... (ensures user limits record exists, then registers the app_id to the user)
        ...

    async def check_limit(self, user_id: str, limit_type: str, value: int = 1) -> bool:
        # ... (checks if an operation for a user is within their tier's limits)
        # ... (only applies limits to FREE tier users in cloud mode)
        # ... (fetches user_data, gets tier_limits, compares with current usage)
        ...

    async def record_usage(self, user_id: str, usage_type: str, increment: int = 1, document_id: str = None) -> bool:
        # ... (records usage in the database)
        # ... (if not FREE tier and in CLOUD mode, sends metering data to Stripe for 'ingest' operations)
        ...

    async def generate_cloud_uri(self, user_id: str, app_id: str, name: str, expiry_days: int = 30) -> Optional[str]:
        # ... (generates a 'morphik://' URI with an embedded JWT for cloud applications)
        # ... (checks app limit for FREE tier users before generating)
        # ... (registers the app if not already registered)
        # ... (token includes user_id, app_id, name, permissions, expiry, type='developer', entity_id=user_id)
        ...
Key Responsibilities & Methods:

Initialization: Sets up a UserLimitsDatabase instance.
initialize(): Initializes the underlying database tables for user limits.
User & Tier Management:
get_user_limits(user_id): Retrieves limit and usage information for a user.
create_user(user_id): Creates a new user record, defaulting to the FREE tier.
update_user_tier(user_id, tier, custom_limits): Updates a user's account tier and optionally sets custom limits if the tier is CUSTOM.
Application Registration:
register_app(user_id, app_id): Associates an application ID with a user. Creates a user limits record if one doesn't exist.
Limit Checking & Usage Recording:
check_limit(user_id, limit_type, value): Determines if a user's proposed operation (e.g., an ingest or query) is within the limits defined for their account tier. This is primarily enforced for FREE tier users in cloud mode.
record_usage(user_id, usage_type, increment, document_id): Updates the user's usage counters in the database. For non-FREE tier users in cloud mode, it also sends metering data to Stripe for billable operations like ingestion.
Cloud URI Generation:
generate_cloud_uri(user_id, app_id, name, expiry_days): Creates a special morphik:// URI containing a JWT. This URI is intended for client applications to authenticate with the Morphik API.
It checks if the user has exceeded their application limit (for FREE tier).
Registers the app_id to the user_id.
The JWT payload includes user_id, app_id, app name, permissions (read, write), an expiration time, type: "developer", and entity_id (set to user_id).


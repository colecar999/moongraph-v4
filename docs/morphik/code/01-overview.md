# Morphik Core - High-Level Overview

## Introduction

Morphik Core is the backend engine powering the Morphik platform. It's designed to provide a comprehensive suite of tools and services for building advanced Retrieval Augmented Generation (RAG) applications, knowledge graph construction, and intelligent agent systems. The core is built with Python, utilizing FastAPI for its API layer, and integrates various cutting-edge technologies for data processing, embedding, storage, and AI model interaction.

The system is modular, allowing for flexible deployment and integration. It supports various data types, including text, PDFs, and videos, and provides mechanisms for parsing, chunking, embedding, and indexing this data for efficient retrieval.

## Key Features

*   **Data Ingestion**: Robust pipeline for ingesting various file types (text, PDF, video) and raw text content. Includes parsing, chunking, and metadata extraction.
*   **Embedding**: Supports multiple embedding models (including multimodal models like ColPali via `ColpaliEmbeddingModel` and various others via `LiteLLMEmbeddingModel`) for representing data in vector space.
*   **Vector Storage**: Utilizes vector databases (e.g., `PGVectorStore`, `MultiVectorStore` for ColPali) for efficient similarity search over embeddings.
*   **Retrieval**: Advanced retrieval mechanisms, including semantic search, metadata filtering, and reranking (`FlagReranker`) to fetch the most relevant information.
*   **Completion**: Integrates with language models (via `LiteLLMCompletionModel`) to generate responses, summaries, and other text-based outputs based on retrieved context. Supports structured output generation.
*   **Knowledge Graphs**: Capabilities for building and querying knowledge graphs (`GraphService`, `EntityResolver`) from ingested documents to uncover relationships and structured insights.
*   **Caching**: Implements caching strategies (`LlamaCache`, `HuggingFaceCache`) to optimize performance for repetitive queries or frequently accessed data.
*   **Agent System**: An intelligent agent (`MorphikAgent`) that can leverage a suite of tools (`core/tools`) to perform complex tasks, answer questions, and interact with the knowledge base.
*   **Rules Engine**: Allows defining custom rules (`RulesProcessor`) for metadata extraction and content transformation during ingestion.
*   **User and Access Management**: Includes mechanisms for handling user authentication (`AuthContext`), authorization, and resource limits (`UserService`, `UserLimitsDatabase`).
*   **Asynchronous Processing**: Utilizes background workers (`IngestionWorker`) for handling time-consuming tasks like document ingestion asynchronously.
*   **Telemetry**: Integrated telemetry (`TelemetryService`) for monitoring and observability, with support for Honeycomb.
*   **Modularity**: Designed with abstract base classes for key components (cache, database, embedding, parser, reranker, vector store), allowing for easier extension and customization.

## Core Architecture

The `morphik-core` is structured into several key directories:

*   **`api.py`**: Defines the main FastAPI application, exposing endpoints for interacting with the system. This is the primary entry point for external services and the Morphik SDK.
*   **`agent.py`**: Contains the `MorphikAgent` which orchestrates tool usage for complex queries.
*   **`config.py`**: Manages loading and accessing configuration settings from `morphik.toml` and environment variables.
*   **`cache/`**: Implements caching mechanisms to improve query performance and reduce redundant computations.
*   **`completion/`**: Handles interactions with large language models for text generation tasks.
*   **`database/`**: Manages metadata storage for documents, graphs, user limits, and folders using PostgreSQL.
*   **`embedding/`**: Provides interfaces and implementations for generating text and multimodal embeddings.
*   **`models/`**: Contains Pydantic models defining the data structures used throughout the system (e.g., `Document`, `Chunk`, `Graph`, `CompletionRequest`).
*   **`parser/`**: Responsible for parsing various file formats, extracting text, and splitting content into manageable chunks. Includes specialized video parsing.
*   **`reranker/`**: Implements algorithms to rerank search results for improved relevance.
*   **`services/`**: Contains the core business logic.
    *   `DocumentService`: Orchestrates document ingestion, retrieval, and querying.
    *   `GraphService`: Manages knowledge graph creation, updates, and querying.
    *   `EntityResolver`: Handles the resolution of different entity mentions to a canonical form.
    *   `RulesProcessor`: Applies custom rules during the ingestion pipeline.
    *   `TelemetryService`: Manages the collection and export of telemetry data.
    *   `UserService`: Handles user-related operations, particularly tier limits.
*   **`storage/`**: Provides an abstraction layer for file storage (local or cloud-based like AWS S3).
*   **`tools/`**: Defines the tools available to the `MorphikAgent`, enabling it to perform various actions like retrieving data, analyzing documents, or executing code.
*   **`vector_store/`**: Manages the storage and retrieval of vector embeddings for similarity search.
*   **`workers/`**: Implements background task processing, primarily for asynchronous document ingestion.
*   **`limits_utils.py`**: Utilities for checking and enforcing user-based operational limits.
*   **`logging_config.py`**: Sets up the logging configuration for the application.

## Interaction with Morphik SDK

The `morphik-core` serves as the backend for the Morphik Python SDK. The SDK's `Morphik` client interacts with the endpoints defined in `api.py`. For example:

*   SDK methods like `ingest_text()`, `ingest_file()`, `retrieve_chunks()`, `query()`, `create_folder()`, `create_graph()` correspond to specific API endpoints that delegate their logic to services like `DocumentService` and `GraphService`.
*   Data models defined in `core/models/` (e.g., `Document`, `CompletionResponse`, `Graph`, `Folder`) are often mirrored or directly used by the SDK's response types (e.g., `morphik.models.Document`, `morphik.models.CompletionResponse`).

This separation allows for a clean interface for developers using the SDK, while the core handles the complex underlying operations.
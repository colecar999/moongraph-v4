# Embedding (`EMBEDDING.md`)

## Overview

The `core/embedding` module is responsible for converting text and potentially other data types (like images) into numerical vector representations, known as embeddings. These embeddings are crucial for semantic search, similarity comparisons, and many other AI-driven features within Morphik Core. The module provides an abstraction layer to support various embedding models and providers.

## Core Components

### 1. `BaseEmbeddingModel` (in `base_embedding_model.py`)

This is an abstract base class (`ABC`) that defines the interface for all embedding model implementations.

**Key Abstract Methods:**

*   `embed_for_ingestion(self, chunks: Union[Chunk, List[Chunk]]) -> List[List[float]]` (abstract):
    *   Generates embeddings specifically for chunks of data that are being ingested into the system (e.g., for storage in a vector database).
    *   Input: A single `Chunk` object or a list of `Chunk` objects (defined in `core/models/chunk.py`). Each `Chunk` contains `content` (text or image data) and `metadata`.
    *   Output: A list of embedding vectors (each vector being a `List[float]`). There should be one embedding vector for each input chunk.
*   `embed_for_query(self, text: str) -> List[float]` (abstract):
    *   Generates an embedding for a query string. This embedding is then used to search for similar items in the vector store.
    *   Input: A single `text` string representing the user's query.
    *   Output: A single embedding vector (`List[float]`).

## Implementations

### 1. `LiteLLMEmbeddingModel` (in `litellm_embedding.py`)

This class implements `BaseEmbeddingModel` using the `litellm` library, which provides a unified interface to call various embedding model providers (OpenAI, Cohere, Hugging Face, etc.).

**Key Features:**

*   **Initialization (`__init__`)**:
    *   Takes a `model_key` string. This key refers to an entry in the `REGISTERED_MODELS` dictionary in `morphik.toml`.
    *   The `REGISTERED_MODELS` entry specifies the actual `model_name` (e.g., "openai/text-embedding-ada-002") and any provider-specific parameters.
    *   Sets the `dimensions` for the embeddings, ensuring it doesn't exceed `PGVECTOR_MAX_DIMENSIONS` (2000) if pgvector is the backend.
*   **Embedding Documents (`embed_documents`)**:
    *   This is an internal helper method that takes a list of texts and calls `litellm.aembedding` to get their embeddings.
    *   It handles model-specific parameters, such as setting `dimensions` for OpenAI's `text-embedding-3-large` model to ensure compatibility with pgvector.
    *   It logs a warning if the returned embedding dimension doesn't match the configured `VECTOR_DIMENSIONS`.
*   **Embedding Queries (`embed_query`)**:
    *   A convenience method that wraps `embed_documents` for a single query text.
*   **`embed_for_ingestion`**:
    *   Takes one or more `Chunk` objects.
    *   Extracts the `content` from each chunk.
    *   Processes the texts in batches (batch size configured by `EMBEDDING_BATCH_SIZE` in settings) to avoid overwhelming the embedding model or API rate limits.
    *   Calls `embed_documents` for each batch and aggregates the results.
*   **`embed_for_query`**:
    *   Simply calls the internal `embed_query` method.

**Configuration**:
*   Relies on `REGISTERED_MODELS` in `morphik.toml` for model details.
*   `EMBEDDING_MODEL` in `morphik.toml` specifies the default model key.
*   `VECTOR_DIMENSIONS` and `EMBEDDING_BATCH_SIZE` from settings.

**Dependencies**: `litellm`.

### 2. `ColpaliEmbeddingModel` (in `colpali_embedding_model.py`)

This class implements `BaseEmbeddingModel` using the `colpali-engine`, specifically designed for the T-Systems ColPali (ColQwen2.5) multimodal embedding model. This model can embed both text and images into a shared vector space.

**Key Features:**

*   **Initialization (`__init__`)**:
    *   Automatically detects the available device (MPS, CUDA, or CPU).
    *   Loads the pretrained `ColQwen2_5` model and `ColQwen2_5_Processor` from Hugging Face (`tsystems/colqwen2.5-3b-multilingual-v1.0`).
    *   Uses `bfloat16` for model dtype and enables Flash Attention 2 if CUDA is available.
    *   Sets an internal `batch_size` (8 for "cloud" mode, 1 otherwise) for processing multiple items.
*   **`embed_for_ingestion`**:
    *   Takes one or more `Chunk` objects.
    *   Separates chunks into `image_items` and `text_items` based on `chunk.metadata.get("is_image")`.
        *   For image chunks, it decodes the base64 content (handles `data:` URI prefix) into a PIL `Image` object.
        *   If image processing fails, it falls back to treating the content as text.
    *   Processes images and texts in separate batches using `generate_embeddings_batch_images` and `generate_embeddings_batch_texts` respectively. These methods use the `ColQwen2_5_Processor` to prepare inputs and then pass them to the `ColQwen2_5` model.
    *   The results (numpy arrays) are placed back into a list in their original order.
*   **`embed_for_query`**:
    *   Takes a text query string.
    *   Calls `generate_embeddings` to get the embedding.
*   **`generate_embeddings(self, content: Union[str, Image]) -> np.ndarray`**:
    *   A core internal method that handles embedding a single piece of content (either a string or a PIL Image).
    *   Uses the `processor` to prepare the input (`process_queries` for text, `process_images` for images).
    *   Passes the processed input to the `model` to get the raw embedding tensor.
    *   Converts the tensor to a `float32` numpy array.
*   **Batch Processing (`generate_embeddings_batch_images`, `generate_embeddings_batch_texts`)**:
    *   These methods are optimized for batch processing of images or texts, respectively, when the `mode` is "cloud". They follow a similar pattern to `generate_embeddings` but operate on lists.

**Configuration**:
*   `ENABLE_COLPALI` in `morphik.toml` must be true for this model to be actively used by `DocumentService`.
*   The batch size is internally determined by `settings.MODE`.

**Dependencies**: `torch`, `colpali-engine`, `Pillow (PIL)`.

## Workflow

1.  When a document is ingested, `DocumentService` calls `embedding_model.embed_for_ingestion(chunks)`.
    *   If ColPali is enabled and `use_colpali` is true for the ingestion request, `ColpaliEmbeddingModel` will be used for the chunks intended for the `MultiVectorStore`.
    *   Otherwise, or for the standard vector store, `LiteLLMEmbeddingModel` (or another configured `BaseEmbeddingModel`) is used.
2.  The chosen model processes the chunks (handling text/images as appropriate) and returns a list of embedding vectors.
3.  These embeddings are then stored in a `BaseVectorStore` implementation (e.g., `PGVectorStore` or `MultiVectorStore`).
4.  When a query is made, `DocumentService` calls `embedding_model.embed_for_query(query_text)` (and potentially `colpali_embedding_model.embed_for_query`) to get the query embedding(s).
5.  These query embeddings are used to search the vector store(s).

This modular design allows Morphik Core to adapt to different embedding technologies and requirements.
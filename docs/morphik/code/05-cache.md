# Cache (`CACHE.md`)

## Overview

The `core/cache` module in Morphik Core provides a framework and implementations for caching mechanisms, primarily aimed at improving performance and reducing redundant computations, especially in the context of language model interactions. It supports caching Key-Value (KV) states of models, which can significantly speed up subsequent queries that share a common context.

The module is designed with a base class (`BaseCache`) and a factory pattern (`BaseCacheFactory`) to allow for different cache implementations.

## Core Components

### 1. `BaseCache` (in `base_cache.py`)

This is an abstract base class (`ABC`) that defines the interface for all cache implementations.

**Key Abstract Methods & Properties:**

*   `__init__(self, name: str, model: str, gguf_file: str, filters: Dict[str, Any], docs: List[Document])`:
    *   Initializes common cache attributes like `name`, `filters`, and an empty list for `docs` (document IDs).
    *   Calls the `_initialize` method which subclasses must implement.
*   `_initialize(self, model: str, gguf_file: str, docs: List[Document]) -> None` (abstract):
    *   Subclasses must implement this method to perform their specific initialization, such as loading models or setting up internal cache structures based on the initial documents.
*   `add_docs(self, docs: List[Document]) -> bool` (abstract):
    *   Adds new documents to the cache, updating the cached state.
*   `query(self, query: str) -> CompletionResponse` (abstract):
    *   Queries the cache. This typically involves using the cached context (e.g., KV cache) to generate a response to the query, potentially augmented by the documents already processed by the cache.
*   `saveable_state(self) -> bytes` (abstract property):
    *   Returns the serializable state of the cache as bytes. This is used for persisting the cache (e.g., to disk or a database).

### 2. `BaseCacheFactory` (in `base_cache_factory.py`)

An abstract base class for factories that create and load cache instances.

**Key Methods:**

*   `__init__(self, storage_path: Path)`:
    *   Initializes the factory with a `storage_path` where cache files can be stored.
*   `create_new_cache(self, name: str, model: str, model_file: str, **kwargs: Dict[str, Any]) -> BaseCache` (abstract):
    *   Creates a new cache instance.
*   `load_cache_from_bytes(self, name: str, cache_bytes: bytes, metadata: Dict[str, Any], **kwargs: Dict[str, Any]) -> BaseCache` (abstract):
    *   Loads a cache instance from its serialized byte representation and associated metadata.
*   `get_cache_path(self, name:str) -> Path`:
    *   Provides a standardized path for storing a cache named `name` under the factory's `storage_path`.

## Implementations

### 1. `LlamaCache` (in `llama_cache.py`)

This class implements `BaseCache` using the `llama-cpp-python` library, designed for running GGUF-formatted Llama models locally.

**Key Features:**

*   **Initialization**:
    *   Loads a Llama model from a GGUF file specified by `repo_id` (model name on Hugging Face Hub) and `filename` (the GGUF file pattern).
    *   Allows specifying `n_gpu_layers` to offload computation to a GPU.
    *   During `_initialize`, it processes the initial set of `docs` by creating a system prompt that includes their content. This system prompt is tokenized and evaluated by the Llama model, and the resulting KV cache state is saved.
*   **Prompting**:
    *   Uses specific prompt templates (`INITIAL_SYSTEM_PROMPT`, `ADD_DOC_SYSTEM_PROMPT`, `QUERY_PROMPT`) formatted for chat models (e.g., using `<|im_start|>`, `<|im_end|>` tokens).
*   **Adding Documents (`add_docs`)**:
    *   Formats new documents into the `ADD_DOC_SYSTEM_PROMPT`.
    *   Tokenizes and evaluates this new prompt, appending to the existing KV cache state.
*   **Querying (`query`)**:
    *   Resets the Llama model's state and loads the previously saved KV cache state.
    *   Formats the user query using `QUERY_PROMPT`.
    *   Tokenizes and evaluates the query.
    *   Generates tokens until an End-Of-Sequence (EOS) token is encountered.
    *   Returns a `CompletionResponse` with the generated text and token usage.
*   **State Management**:
    *   `saveable_state`: Pickles the Llama model's KV cache state (`self.llama.save_state()`) for persistence.
    *   `from_bytes` (classmethod): Loads a `LlamaCache` instance by unpickling the state bytes and re-initializing the Llama model with this state.

**Dependencies**: `llama-cpp-python`

### 2. `LlamaCacheFactory` (in `llama_cache_factory.py`)

Implements `BaseCacheFactory` specifically for `LlamaCache`.

*   `create_new_cache`: Instantiates a new `LlamaCache`.
*   `load_cache_from_bytes`: Calls `LlamaCache.from_bytes` to reconstruct a cache.

### 3. `HuggingFaceCache` (in `hf_cache.py`)

This class implements `BaseCache` using models from the Hugging Face Transformers library. It focuses on building and utilizing a KV cache for faster generation with autoregressive models.

**Key Features:**

*   **Initialization**:
    *   Takes `cache_path`, `model_name` (Hugging Face model identifier), `device` ("cpu", "cuda", "mps"), `default_max_new_tokens`, and `use_fp16` as parameters.
    *   Loads the specified tokenizer and model using `AutoTokenizer.from_pretrained` and `AutoModelForCausalLM.from_pretrained`.
    *   Handles device mapping and precision (FP16) automatically.
*   **KV Cache Management**:
    *   `get_kv_cache(self, prompt: str) -> DynamicCache`: Builds an initial KV cache from a given prompt.
    *   `clean_up_cache(self, cache: DynamicCache, origin_len: int)`: Trims the KV cache to remove tokens generated after the initial prompt, allowing for reuse with new input.
    *   `generate(self, input_ids: torch.Tensor, past_key_values, max_new_tokens: Optional[int] = None) -> torch.Tensor`: The core generation loop that uses the `past_key_values` (KV cache).
*   **Document Ingestion (`ingest`)**:
    *   Creates a system prompt by concatenating the input `docs`.
    *   Builds the KV cache (`self.kv_cache`) by processing this system prompt with the model. It carefully handles different model architectures (Llama-style GQA, GPT-style, OPT-style) to correctly initialize and populate the cache tensors.
    *   Stores `self.origin_len` which is the length of the initial context in the cache.
*   **Cache Update (`update`)**:
    *   If the cache isn't initialized, it calls `ingest`.
    *   Otherwise, it cleans the existing cache and then processes the `new_doc` to update the KV cache.
*   **Completion (`complete`)**:
    *   Takes a `CompletionRequest`.
    *   Ensures the cache is initialized.
    *   Cleans the cache to its original context length.
    *   Tokenizes the `request.query`, appends it to the cached context, and generates a completion using the `generate` method.
    *   Returns a `CompletionResponse`.
*   **Saving/Loading**:
    *   `save_cache() -> Path`: Saves the `kv_cache` (key and value tensors) and `origin_len` to a `.pt` file using `torch.save`.
    *   `load_cache(self, cache_path: Union[str, Path])`: Loads the cache from a saved `.pt` file.

**Dependencies**: `torch`, `transformers`

## Usage Flow

1.  A `CacheFactory` (e.g., `LlamaCacheFactory`) is used.
2.  To create a new cache:
    *   `factory.create_new_cache(...)` is called, providing documents and model details.
    *   The specific cache implementation (e.g., `LlamaCache`) initializes itself, processes the initial documents, and builds its internal cached state (e.g., Llama KV state).
    *   The cache's `saveable_state` can be retrieved and stored (e.g., by `DocumentService.create_cache` which uploads it to S3 or local storage via `BaseStorage`).
3.  To load an existing cache:
    *   Metadata is retrieved from the database (e.g., by `DocumentService.load_cache`).
    *   The serialized cache bytes are downloaded from storage.
    *   `factory.load_cache_from_bytes(...)` is called to reconstruct the cache instance.
4.  Once a cache instance is active (either newly created or loaded):
    *   `cache.query(query_text)` can be called to get completions using the cached context.
    *   `cache.add_docs(new_documents)` can be called to update the cache with new information.

## Integration with `DocumentService`

The `DocumentService` manages the lifecycle of caches:
*   `create_cache` endpoint in `api.py` calls `DocumentService.create_cache`.
    *   This method uses the `cache_factory` to create a new cache instance.
    *   It then gets the `saveable_state` from the cache and uses the `storage` service to save these bytes.
    *   Metadata about the cache (model, filters, storage location) is stored in the `database`.
*   `load_cache` endpoint calls `DocumentService.load_cache`.
    *   This retrieves metadata from the `database`.
    *   Downloads the cache state bytes from `storage`.
    *   Uses the `cache_factory` to load the cache from bytes.
    *   The loaded cache is stored in `DocumentService.active_caches`.
*   Querying endpoints can then use these active caches.
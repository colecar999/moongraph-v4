# Completion (`COMPLETION.md`)

## Overview

The `core/completion` module is responsible for generating text completions using large language models (LLMs). It provides an abstraction layer that allows Morphik Core to interact with various LLM providers through a unified interface. This is crucial for features like answering questions based on retrieved documents (RAG), summarizing text, or powering the agent's decision-making process.

## Core Components

### 1. `BaseCompletionModel` (in `base_completion.py`)

This is an abstract base class (`ABC`) that defines the contract for all completion model implementations.

**Key Abstract Methods:**

*   `complete(self, request: CompletionRequest) -> CompletionResponse` (abstract):
    *   This is the primary method for generating a completion.
    *   **Input**:
        *   `request`: A `CompletionRequest` Pydantic model. This model (defined in `core/models/completion.py`) encapsulates:
            *   `query`: The main input prompt or question.
            *   `context_chunks`: A list of strings representing the contextual information (e.g., retrieved document chunks) to be used by the LLM.
            *   `max_tokens` (optional): Maximum number of tokens to generate.
            *   `temperature` (optional): Sampling temperature for generation.
            *   `prompt_template` (optional): A custom string template to format the `query` and `context_chunks` before sending to the LLM. If provided, it should contain placeholders like `{context}` and `{question}` or `{query}`.
            *   `folder_name` (optional): For context, if the query is scoped to a folder.
            *   `end_user_id` (optional): For context, if the query is scoped to an end-user.
            *   `schema` (optional): A Pydantic model class or a JSON schema dictionary. If provided, the LLM is instructed to generate output that conforms to this schema (structured output).
    *   **Output**:
        *   `CompletionResponse`: A Pydantic model (defined in `core/models/completion.py`) containing:
            *   `completion`: The generated text or, if a `schema` was provided in the request, a Pydantic model instance or dictionary matching the schema.
            *   `usage`: A dictionary detailing token usage (e.g., `prompt_tokens`, `completion_tokens`, `total_tokens`).
            *   `finish_reason` (optional): The reason the model stopped generating (e.g., "stop", "length").
            *   `sources` (optional): A list of `ChunkSource` objects indicating which context chunks were most relevant or used for the completion (this is often populated by higher-level services like `DocumentService`).
            *   `metadata` (optional): Additional metadata about the completion.

### 2. `LiteLLMCompletionModel` (in `litellm_completion.py`)

This class implements `BaseCompletionModel` using the `litellm` library. `litellm` provides a standardized way to call various LLM APIs (OpenAI, Anthropic, Cohere, Hugging Face, Ollama, etc.).

**Key Features:**

*   **Initialization (`__init__`)**:
    *   Takes a `model_key` string as input. This key corresponds to an entry in the `REGISTERED_MODELS` dictionary in the `morphik.toml` configuration file.
    *   The `REGISTERED_MODELS` entry provides the actual `model_name` (e.g., "openai/gpt-4-turbo") and any other provider-specific parameters (like `api_key`, `api_base`).
    *   It detects if the specified model is an "Ollama" model and if the `ollama` Python library is installed. If both are true and an `api_base` is configured, it can optionally use a direct Ollama client for potentially better performance or specific feature support (like Ollama's native image handling or structured output format parameter).
*   **System Message (`get_system_message`)**:
    *   Defines a standard system message for Morphik's query agent, instructing the LLM on its role and how to use context.
*   **Context Processing (`process_context_chunks`)**:
    *   Separates text chunks from image data URIs.
    *   For Ollama, it extracts raw base64 image data. For other models, it keeps the full data URI.
*   **Prompt Formatting (`format_user_content`)**:
    *   Constructs the user message to the LLM.
    *   If a `prompt_template` is provided in the `CompletionRequest`, it uses that.
    *   Otherwise, it formats a default prompt like "Context: {context} Question: {query}".
*   **Structured Output (`create_dynamic_model_from_schema`, `_handle_structured_ollama`, `_handle_structured_litellm`)**:
    *   If a `schema` is provided in `CompletionRequest`, it attempts to generate structured output.
    *   `create_dynamic_model_from_schema`: Converts a JSON schema dictionary into a dynamic Pydantic model if a Pydantic model class isn't directly provided.
    *   If using direct Ollama and the model supports it, it uses Ollama's `format="json"` parameter with the schema.
    *   For other models (or Ollama fallback), it uses the `instructor` library with `litellm` to guide the LLM towards generating JSON output that matches the Pydantic model derived from the schema. It sets `response_format={"type": "json_object"}` for compatible models.
*   **Standard (Non-Structured) Output (`_handle_standard_ollama`, `_handle_standard_litellm`)**:
    *   **Direct Ollama (`_handle_standard_ollama`)**: If configured, it makes a direct call to the Ollama API using the `ollama` library. It constructs messages, including image data if present (Ollama typically supports one image per message).
    *   **LiteLLM (`_handle_standard_litellm`)**: For all other models or as a fallback, it uses `litellm.acompletion`. It constructs a list of content items for the user message, including text and image URLs (up to 3 images).
*   **Main Completion Logic (`complete`)**:
    1.  Processes context chunks to separate text and images.
    2.  Formats the user content.
    3.  Checks if structured output is requested via `request.schema`.
    4.  **If structured output is requested**:
        *   Creates a dynamic Pydantic model from the schema.
        *   Enhances the system and user prompts to explicitly instruct the LLM to follow the schema.
        *   Calls `_handle_structured_ollama` or `_handle_structured_litellm`.
        *   If structured output fails, it falls back to standard completion.
    5.  **If standard output is requested (or structured output failed)**:
        *   Calls `_handle_standard_ollama` or `_handle_standard_litellm`.
    6.  Constructs and returns a `CompletionResponse`.

**Configuration**:
*   Relies on `REGISTERED_MODELS` in `morphik.toml` for model-specific details (e.g., API keys, API base URLs).
*   The `COMPLETION_MODEL` setting in `morphik.toml` specifies the default model key to be used.

**Dependencies**: `litellm`, `pydantic`, optionally `ollama`, `instructor`.

## Workflow

1.  A service (e.g., `DocumentService` or `GraphService`) needs to generate text.
2.  It prepares a `CompletionRequest` with the query, context, and any parameters.
3.  It calls the `complete()` method of a `BaseCompletionModel` instance (typically `LiteLLMCompletionModel`).
4.  The `LiteLLMCompletionModel` formats the input, interacts with the configured LLM via `litellm` (or direct Ollama client), and potentially uses `instructor` for structured output.
5.  The LLM's response is parsed, and a `CompletionResponse` is returned to the calling service.

This module ensures that Morphik Core can flexibly use a wide range of LLMs for its completion needs while maintaining a consistent internal API.
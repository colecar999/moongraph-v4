# Recommendations for Improving Contextual Chunking

## Overview

The current contextual chunking process in `morphik-core/core/parser/morphik_parser.py` (specifically within the `ContextualChunker` class) aims to enhance search retrieval by prepending LLM-generated context to each base chunk. It achieves this by:

1.  Using a `StandardChunker` to create initial base chunks from a document.
2.  For each base chunk, making a separate LLM call (e.g., to `gpt-4o-mini` or `claude_sonnet` via `litellm`) with a prompt that includes the *full document text* and the individual chunk. The LLM is asked to provide a "short succinct context to situate this chunk within the overall document."
3.  Prepending this generated context to the original chunk content.

The primary issue observed with this approach, especially evident in logs during the processing of large documents, is **API rate-limiting**. This stems from making a large number of individual LLM calls (one per chunk) where each call redundantly includes the full document text. This is inefficient in terms of token usage, cost, and processing time, and increases the likelihood of hitting API limits.

## Suggested Improvements

To address these issues and enhance the robustness and efficiency of the contextual chunking process, the following improvements are recommended:

### 1. Asynchronous LLM Calls with Concurrency Management

*   **Problem:** The current loop in `ContextualChunker.split_text` processes chunks serially for context generation.
*   **Recommendation:** Modify `_situate_context` to be an `async` method. In `split_text`, use `asyncio.gather` to make LLM calls for a batch of chunks concurrently.
*   Implement a semaphore or a similar concurrency primitive within `ContextualChunker` to limit the number of simultaneous LLM requests (e.g., `llm_batch_call_size`). This provides more granular control than relying solely on external API rate limits and can prevent a single worker from overwhelming the LLM provider.
*   **Benefit:** Significantly speeds up context generation for documents with many chunks by parallelizing the waiting time for LLM responses. Internal concurrency control helps manage a local worker's outbound requests gracefully.

### 2. Reduce Redundant Document Context in Prompts (Sliding Window or Summary)

*   **Problem:** Sending the full document text in the prompt for *every* chunk is highly redundant and token-inefficient.
*   **Recommendation:**
    *   **Sliding Window:** For each chunk, instead of the full document, provide the LLM with only a "window" of text surrounding the chunk (e.g., `N` characters or sentences before and after). The `_get_document_window` method sketched previously is a good starting point.
    *   **Document/Section Summary:** Alternatively, generate a summary of the entire document (or relevant large sections) once. Use this summary as the broader context when the LLM is situating individual chunks.
*   **Benefit:** Drastically reduces prompt token count for each LLM call, leading to lower costs, faster LLM processing times, and reduced likelihood of hitting token-based rate limits.
*   **Trade-off:** The LLM will have less global context for each specific chunk, which might slightly affect context quality in some cases. This needs to be balanced against efficiency gains.

### 3. Optimize LLM Call Batching (Advanced)

*   **Problem:** Even with concurrent calls, one LLM interaction per chunk can be numerous.
*   **Recommendation (More Complex):** Explore designing prompts that allow a single LLM call to generate contexts for *multiple* chunks simultaneously. The LLM would need to return a structured response (e.g., a JSON list of contexts).
*   **Challenges:**
    *   Prompt engineering for such batch processing is non-trivial to ensure distinct and accurate contexts per chunk.
    *   Managing the overall prompt size (full document + multiple chunks + instructions) to stay within the LLM's context window.
    *   Reliably parsing the structured output.
*   **Benefit:** Could offer the highest efficiency if successfully implemented, reducing the number of LLM API interactions significantly.

### 4. Selective Contextual Chunking

*   **Problem:** Not all chunks may need or benefit from expensive LLM-generated contextualization.
*   **Recommendation:** Implement logic to identify chunks that are most likely to benefit from LLM contextualization (e.g., very short chunks, chunks with high ambiguity, chunks with many acronyms or specialized terms not defined locally). Apply LLM contextualization only to these selected chunks. Simpler, heuristic-based context (e.g., prepending section titles, or the previous N words) could be used for other chunks.
*   **Benefit:** Reduces the number of LLM calls, saving cost and time, by focusing LLM use where it adds most value.

### 5. Use More Cost-Effective LLM Models for Context Generation

*   **Problem:** Using a flagship model like `gpt-4o-mini` for every chunk's context can be expensive and may be overkill for the task.
*   **Recommendation:** The `CONTEXTUAL_CHUNKING_MODEL` is configurable in `morphik.toml`. Experiment with smaller, faster, and cheaper models (e.g., `gpt-3.5-turbo`, Anthropic's Haiku, or suitable open-source models if locally hosted).
*   **Benefit:** Significant cost reduction and potentially faster response times.
*   **Consideration:** The quality of the generated context must be evaluated to ensure it still meets retrieval improvement goals.

### 6. Refine Prompting for Succinctness and Relevance

*   **Problem:** The LLM might generate overly verbose or not perfectly targeted context.
*   **Recommendation:**
    *   Refine the `CHUNK_CONTEXT_PROMPT` in `ContextualChunker` to be more prescriptive about the desired output.
    *   Explicitly request brevity and relevance for search.
    *   Consider setting a much lower `max_tokens` (e.g., 50-150) for the context generation step in `_situate_context` to enforce succinctness. The current 1024 is too high for this task.
*   **Benefit:** Improves the quality and utility of the generated context, reduces token consumption per call.

### 7. Caching Generated Contexts

*   **Problem:** If documents are re-ingested or slightly modified, context generation is repeated.
*   **Recommendation:** Implement a caching layer for the generated contexts. The cache key could be a hash of (document content identifier + chunk content/identifier).
*   **Benefit:** Avoids repeated LLM calls for unchanged document parts, saving time and cost during re-ingestion or updates.

### Code Implementation Notes:

*   **Async All The Way:** Ensure that `BaseChunker.split_text`, `ContextualChunker.split_text`, and `MorphikParser.split_text` are all `async` if LLM calls (which are I/O bound) are involved. The calling services (`DocumentService`, `ingestion_worker`) will need to `await` these.
*   **Configuration:** New parameters (e.g., `contextual_chunking_llm_batch_size`, `contextual_chunking_window_size`) should be added to `core/config.py` and `morphik.toml`.
*   **API Key Management:** Ensure `ContextualChunker` relies on `litellm`'s standard API key management (via `REGISTERED_MODELS` and environment variables) rather than specific key parameters in its `__init__`.
*   **Robust Chunk Referencing:** For sliding window approaches, `StandardChunker` should ideally provide start/end character offsets for each base chunk to make window creation robust.

By implementing these recommendations, particularly focusing on asynchronous/concurrent processing, reducing redundant data in prompts, and potentially using more economical models, the contextual chunking process can become significantly more efficient, scalable, and cost-effective. 
# Colpali Modal Integration & Optimization Notes

**Date:** 2025-05-20

---

## Quick Start / TL;DR
- **Test the Modal embedding service:**
  - Deploy: `modal deploy morphik-external/scripts/colpali_modal_app.py`
  - Test endpoint (replace `<API_KEY>` and `<BASE64_IMAGE>`):
    ```bash
    curl -X POST \
      -H "Authorization: Bearer <API_KEY>" \
      -H "Content-Type: application/json" \
      -d '{"input_type": "image", "inputs": ["<BASE64_IMAGE>"]}' \
      https://<modal-app-url>/embeddings
    ```
- **Update the client:** Edit `core/embedding/colpali_api_embedding_model.py` in `morphik-core`.
- **Required environment variables/secrets:**
  - `SERVICE_API_KEY` (for Modal app authentication)
  - `HUGGINGFACE_TOKEN` (for model download)

---

## 1. Integration Context
- The Colpali embedding service is deployed as a Modal app, exposing a FastAPI endpoint at `/embeddings` for image/text embedding.
- **Authentication:** All requests require a Bearer token in the `Authorization` header (`SERVICE_API_KEY`).
- `morphik-core` interacts with this service via HTTP, sending base64-encoded images or text for embedding.
- The integration required aligning API payloads, authentication, and error handling between `morphik-core` and the Modal app.

---

## 2. Key Changes & Debugging Steps
- **Fixed 422 Unprocessable Entity errors** by ensuring the FastAPI endpoint signature matched the expected Pydantic model and removed all manual request parsing.
    - *Example error:*
      ```json
      {"detail": [{"loc": ["body", "inputs"], "msg": "field required", "type": "value_error.missing"}]}
      ```
- **Added detailed logging** to both the Modal app and `morphik-core` to debug payloads and error responses.
- **Resolved model initialization issues** by moving model/processor loading from `__enter__` to `__init__` in the Modal class (required for FastAPI endpoints).
- **Handled FlashAttention2 ImportError** by falling back to `attn_implementation="eager"` for compatibility. (See optimization doc for how to enable FlashAttention2 in the future.)
- **Tested end-to-end** with real base64 images using `curl` to confirm the pipeline works.
- **Documented all troubleshooting steps and solutions** in feature and update docs for future reference.

---

## 3. Recommendations for Future Updates
- **Monitor Modal and HuggingFace deprecations:**
    - Modal will deprecate custom `__init__` constructors; migrate to `modal.parameter()` for class fields.
      - *Example:*
        ```python
        class ColpaliService:
            model_name: str = modal.parameter()
        ```
    - Use `HF_HOME` instead of `TRANSFORMERS_CACHE` to avoid warnings.
    - Set `use_fast=True` for processors to avoid slow processor warnings.
- **Consider enabling FlashAttention2** for speed if/when Modal supports the required CUDA and dependencies.
- **Batch requests** in `morphik-core` where possible to maximize throughput.
- **Pin dependency versions** in both Modal and `morphik-core` for reproducibility (see `requirements.txt` or environment files).
- **Keep integration tests** (e.g., `curl` with real images) as part of your update checklist. See `sdks/python/morphik/tests/test_docs/` for examples.

---

## 4. Integration Points in morphik-core
- The embedding API client is in `core/embedding/colpali_api_embedding_model.py`.
- Logging and error handling improvements were made in this file to aid debugging.
- Ensure any future API changes in the Modal app are reflected in this client.
- **Integration tests/scripts:** See `sdks/python/morphik/tests/test_docs/` and any scripts in `examples/` for usage.
- **Payload structure:** Both image and text are supported. Example payload:
    ```json
    {"input_type": "text", "inputs": ["hello world", "foo bar"]}
    {"input_type": "image", "inputs": ["<BASE64_IMAGE>"]}
    ```

---

## 5. References
- [Feature: Optimizing Colpali Modal Embedding Service for Speed and Best Practices](../features/002-optimizing-colpali-modal-embedding.md)
- [Modal Parameterized Functions](https://modal.com/docs/guide/parametrized-functions)
- [HuggingFace FlashAttention2 Documentation](https://huggingface.co/docs/transformers/perf_infer_gpu_one#flashattention-2)

---

*Last updated: 2025-05-20* 
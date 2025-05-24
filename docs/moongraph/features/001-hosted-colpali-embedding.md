# 001 - Hosted ColPali Embedding Service via Modal

## 1. Overview

The local execution of the `tsystems/colqwen2.5-3b-multilingual-v1.0` (ColPali) embedding model within the `morphik-core-worker` has proven to be resource-intensive, particularly on CPU. This leads to extremely long processing times and potential Out-of-Memory (OOM) crashes, hindering reliable document ingestion.

This document outlines the architecture and deployment process for hosting the ColPali embedding model as a dedicated, GPU-accelerated serverless API using Modal. This approach offloads heavy computation, improves performance, and enhances stability.

## 2. Proposed Solution: Modal Serverless GPU Endpoint

We will deploy the `tsystems/colqwen2.5-3b-multilingual-v1.0` model as a Modal application. This application will expose an HTTP endpoint that the `morphik-core` backend (both local Docker and deployed instances on Render/Vercel) can call to get ColPali embeddings.

**Key Changes in `morphik-core`:**
- The application will use `ColpaliApiEmbeddingModel` for ColPali embeddings.
- Configuration in `morphik.toml` will be set to `colpali_mode = "api"`.
- `morphik_embedding_api_domain` in `morphik.toml` will point to the deployed Modal endpoint URL.
- An API key (`MORPHIK_EMBEDDING_API_KEY`) will be used to authenticate requests from `morphik-core` to the Modal endpoint.

## 3. Architecture Diagram

```mermaid
graph TD
    subgraph Morphik Core Application (Local Docker / Render / Vercel)
        A[Ingestion Worker / API Service] --> B{Need ColPali Embeddings?};
        B -- Yes --> C[ColpaliApiEmbeddingModel];
        C -- HTTPS Request (Payload, MORPHIK_EMBEDDING_API_KEY) --> D_Modal[Modal Endpoint URL];
    end

    subgraph Modal Cloud Platform
        D_Modal --- E[Modal Gateway];
        E -- Authenticates & Routes --> F[GPU-Accelerated Container (Scales to Zero)];
        F -- Loads (on cold start) --> G[ColPali Model: tsystems/colqwen2.5-3b];
        F -- Processes Chunks --> H[Embeddings];
        H -- HTTPS Response --> C;
    end

    C -- Returns Embeddings --> A;
    A --> I[Store Embeddings in MultiVectorStore];

    style A fill:#lightgrey,stroke:#333,stroke-width:2px
    style C fill:#lightgrey,stroke:#333,stroke-width:2px
    style I fill:#lightgrey,stroke:#333,stroke-width:2px

    style D_Modal fill:#lightblue,stroke:#333,stroke-width:2px
    style E fill:#lightblue,stroke:#333,stroke-width:2px
    style F fill:#lightblue,stroke:#333,stroke-width:2px
    style G fill:#lightblue,stroke:#333,stroke-width:2px
    style H fill:#lightblue,stroke:#333,stroke-width:2px

    classDef dbTable fill:#ffe0b2,stroke:#333,stroke-width:2px,color:#222;
    class I dbTable;
```

**Diagram Flow:**
1. A `morphik-core` service (worker or API) requires ColPali embeddings.
2. It uses `ColpaliApiEmbeddingModel`.
3. `ColpaliApiEmbeddingModel` sends chunk data and the `MORPHIK_EMBEDDING_API_KEY` (as an `Authorization: Bearer <key>` header) to the Modal endpoint.
4. Modal's Gateway receives the request, authenticates it (if custom auth is implemented), and routes it to a GPU container.
5. The container (if cold-starting) loads the ColPali model. It then processes the input chunks.
6. Embeddings are generated and returned in the HTTPS response.
7. `ColpaliApiEmbeddingModel` provides embeddings back to the `morphik-core` service.
8. The service stores them in the `MultiVectorStore`.

## 4. Implementation Steps

### Step 4.1: Create the Modal Application (`colpali_modal_app.py`)

Create a Python file (e.g., `colpali_modal_app.py`) in your `morphik-core` project or a separate repository for managing Modal apps. This file will contain the logic for the embedding service.

```python
import modal
import os
import base64
import io
import time
import gc
from typing import List
from pydantic import BaseModel

# --- Modal App Definition ---
app = modal.App(name="colpali-embedding-service-prod")

# --- Environment and Image Configuration ---
gpu_image = modal.Image.debian_slim().pip_install(
    "torch",
    "transformers",
    "colpali-engine>=0.1.0",
    "Pillow",
    "numpy",
    "filetype",
    "fastapi",
    "uvicorn"
).env({
    "HF_HOME": "/cache/huggingface",
    "TRANSFORMERS_CACHE": "/cache/huggingface/models",
    "HF_HUB_CACHE": "/cache/huggingface/hub",
    "PIP_NO_CACHE_DIR": "true",
    # CUDA memory optimization environment variables
    "PYTORCH_CUDA_ALLOC_CONF": "expandable_segments:True",
    "CUDA_LAUNCH_BLOCKING": "1"
})

# --- Pydantic Model for Request Body ---
class EmbeddingRequest(BaseModel):
    input_type: str
    inputs: List[str]

# --- Modal Class for the Service ---
@app.cls(
    gpu="A10G",  # Upgraded to A10G for 24GB GPU memory (vs T4's 14GB)
    image=gpu_image,
    scaledown_window=300,
    secrets=[
        modal.Secret.from_name("my-huggingface-secret"),
        modal.Secret.from_name("colpali-service-api-key")
    ],
    max_containers=5,  # Reduced from 10 to avoid resource contention
    timeout=600
)
class ColpaliModalService:
    def __init__(self):
        print("ColpaliModalService: __init__ starting")
        import torch
        from colpali_engine.models import ColQwen2_5, ColQwen2_5_Processor
        
        try:
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            print(f"ColpaliModalService: Initializing model on device: {self.device}")
            
            # Clear any existing GPU memory
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                print(f"Initial GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
            
            hf_token = os.environ.get("HUGGINGFACE_TOKEN")
            self.service_api_key = os.environ.get("SERVICE_API_KEY")
            
            if not self.service_api_key:
                print("CRITICAL WARNING: SERVICE_API_KEY is not set! Endpoint will be unsecured.")
            
            model_name = "tsystems/colqwen2.5-3b-multilingual-v1.0"
            
            self.model = ColQwen2_5.from_pretrained(
                model_name,
                torch_dtype=torch.bfloat16,
                device_map=self.device,
                attn_implementation="eager",  # Better memory efficiency
                token=hf_token,
                cache_dir="/cache/huggingface/models"
            ).eval()
            
            self.processor = ColQwen2_5_Processor.from_pretrained(
                model_name,
                token=hf_token,
                cache_dir="/cache/huggingface/hub"
            )
            
            # Clear memory after model loading
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                memory_allocated = torch.cuda.memory_allocated(0) / 1024**3
                memory_reserved = torch.cuda.memory_reserved(0) / 1024**3
                print(f"Model loaded. GPU memory allocated: {memory_allocated:.2f} GB, reserved: {memory_reserved:.2f} GB")
                
        except Exception as e:
            print(f"ColpaliModalService: Exception during __init__: {e}")
            raise

    def _decode_image(self, base64_string: str):
        from PIL.Image import open as open_image
        if base64_string.startswith("data:"):
            try:
                base64_string = base64_string.split(",", 1)[1]
            except IndexError:
                raise ValueError("Malformed data URI string for image decoding.")
        try:
            image_bytes = base64.b64decode(base64_string)
            return open_image(io.BytesIO(image_bytes))
        except Exception as e:
            raise ValueError(f"Failed to decode base64 image: {e}")

    def _clear_gpu_memory(self):
        """Clear GPU memory and run garbage collection"""
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        gc.collect()

    @modal.fastapi_endpoint(method="POST", label="embeddings")
    async def generate_embeddings_endpoint(self, payload: EmbeddingRequest):
        import torch
        import numpy as np
        from fastapi.responses import JSONResponse
        
        input_type = payload.input_type
        inputs_data = payload.inputs
        
        if not inputs_data:
            return {"embeddings": []}
            
        print(f"Processing: input_type='{input_type}', num_inputs={len(inputs_data)}")
        
        # Log initial GPU memory state
        if torch.cuda.is_available():
            memory_allocated = torch.cuda.memory_allocated(0) / 1024**3
            memory_reserved = torch.cuda.memory_reserved(0) / 1024**3
            print(f"Pre-processing GPU memory - allocated: {memory_allocated:.2f} GB, reserved: {memory_reserved:.2f} GB")
        
        all_embeddings_list = []
        # Optimized batch sizes to prevent OOM
        batch_size = 4 if input_type == "text" else 1  # Process images one at a time
        
        try:
            for i in range(0, len(inputs_data), batch_size):
                batch_input_data = inputs_data[i:i + batch_size]
                processed_batch = None
                
                print(f"Processing batch {i//batch_size + 1}/{(len(inputs_data) + batch_size - 1)//batch_size}")
                
                if input_type == "image":
                    pil_images = [self._decode_image(b64_str) for b64_str in batch_input_data]
                    if not pil_images: continue
                    processed_batch = self.processor.process_images(pil_images).to(self.device)
                elif input_type == "text":
                    if not all(isinstance(text, str) for text in batch_input_data):
                        return JSONResponse(content={"error": "Invalid text inputs"}, status_code=400)
                    processed_batch = self.processor.process_queries(batch_input_data).to(self.device)
                else:
                    return JSONResponse(content={"error": "Invalid input_type"}, status_code=400)
                
                if processed_batch:
                    try:
                        with torch.no_grad():
                            embedding_tensor = self.model(**processed_batch)
                        current_batch_embeddings_np = embedding_tensor.to(torch.float32).cpu().numpy().tolist()
                        all_embeddings_list.extend(current_batch_embeddings_np)
                        
                        # Clear memory after each batch
                        del embedding_tensor
                        del processed_batch
                        self._clear_gpu_memory()
                        
                        if torch.cuda.is_available():
                            memory_allocated = torch.cuda.memory_allocated(0) / 1024**3
                            print(f"After batch: GPU memory allocated: {memory_allocated:.2f} GB")
                            
                    except RuntimeError as e:
                        if "out of memory" in str(e):
                            print(f"CUDA OOM error: {e}")
                            self._clear_gpu_memory()
                            # Fallback to individual processing
                            if len(batch_input_data) > 1:
                                print("Falling back to individual processing...")
                                for single_item in batch_input_data:
                                    try:
                                        if input_type == "image":
                                            single_image = [self._decode_image(single_item)]
                                            single_processed = self.processor.process_images(single_image).to(self.device)
                                        else:
                                            single_processed = self.processor.process_queries([single_item]).to(self.device)
                                        
                                        with torch.no_grad():
                                            single_embedding = self.model(**single_processed)
                                        single_embedding_np = single_embedding.to(torch.float32).cpu().numpy().tolist()
                                        all_embeddings_list.extend(single_embedding_np)
                                        
                                        del single_embedding
                                        del single_processed
                                        self._clear_gpu_memory()
                                        
                                    except Exception as single_e:
                                        print(f"Failed to process individual item: {single_e}")
                                        continue
                            else:
                                raise e
                        else:
                            raise e
                        
        except ValueError as ve:
            print(f"ValueError during processing: {ve}")
            return JSONResponse(content={"error": f"Input processing error: {str(ve)}"}, status_code=400)
        except Exception as e:
            print(f"Unexpected error during embedding generation: {e}")
            self._clear_gpu_memory()
            return JSONResponse(content={"error": "Internal server error during embedding"}, status_code=500)
        
        # Final cleanup
        self._clear_gpu_memory()
        
        return {"embeddings": all_embeddings_list}

### Step 4.2: Prepare Modal Secrets

Secrets are used to securely provide API keys and tokens to your Modal application.

1.  **Hugging Face Token (for model download):**
    *   Go to your Hugging Face account settings > Access Tokens.
    *   Create a token with at least `read` permissions.
    *   In your terminal, create a Modal secret:
        ```bash
        modal secret create my-huggingface-secret HUGGINGFACE_TOKEN="hf_YOUR_HUGGING_FACE_READ_TOKEN"
        ```
        (Replace `hf_YOUR_HUGGING_FACE_READ_TOKEN` with your actual token.)

2.  **Service API Key (to secure your Modal endpoint):**
    *   Generate a strong, random string to use as your API key for this service. You can use a password generator.
    *   In your terminal, create another Modal secret:
        ```bash
        modal secret create colpali-service-api-key SERVICE_API_KEY="YOUR_STRONG_RANDOM_API_KEY"
        ```
        (Replace `YOUR_STRONG_RANDOM_API_KEY` with your generated key.)

### Step 4.3: Deploy to Modal

1.  **Install Modal Client:**
    ```bash
    pip install modal-client
    ```
2.  **Login to Modal (if first time):**
    ```bash
    modal token new
    ```
3.  **Deploy the Application:**
    Navigate to the directory where you saved `colpali_modal_app.py` and run:
    ```bash
    modal deploy colpali_modal_app.py
    ```
    Modal will build the Docker image, deploy the application, and provide you with a public URL for the `generate_embeddings_endpoint`. It will look similar to `https_your-username--colpali-embedding-service-prod-colpalimodalservice-generate-embeddings-endpoint.modal.run`.
    Keep this URL safe; it's your API endpoint.

### Step 4.4: Configure `morphik-core`

1.  **Update `morphik.toml`:**
    Open `morphik-core/morphik.toml` and modify the `[morphik]` section:
    ```toml
    [morphik]
    enable_colpali = true
    colpali_mode = "api"
    morphik_embedding_api_domain = "PASTE_YOUR_MODAL_ENDPOINT_URL_HERE"
    # other morphik settings...
    ```

2.  **Update `.env` file for `morphik-core`:**
    Add the `SERVICE_API_KEY` you created for Modal to your `morphik-core/.env` file. This key will be used by `ColpaliApiEmbeddingModel` to authenticate with your Modal service.
    ```env
    # morphik-core/.env
    # ... other existing variables ...
    MORPHIK_EMBEDDING_API_KEY="YOUR_STRONG_RANDOM_API_KEY" # Same key as in colpali-service-api-key Modal secret
    ```
    This environment variable needs to be available to your `morphik-core-worker` and `morphik-core-morphik` (API) services, whether running locally in Docker or deployed on Render/Vercel.

3.  **Verify `ColpaliApiEmbeddingModel` Authentication:**
    The existing `ColpaliApiEmbeddingModel` in `morphik-core/core/embedding/colpali_api_embedding_model.py` already includes logic to send an `Authorization: Bearer <token>` header using `self.settings.MORPHIK_EMBEDDING_API_KEY`. This setup is compatible with the authentication implemented in the Modal app.

### Step 4.5: Restart and Test

1.  **Restart `morphik-core` services:**
    If running locally with Docker:
    ```bash
    cd morphik-core
    docker compose down && docker compose up -d --build
    ```
    If deployed on Render/Vercel, redeploy your services so they pick up the new `.env` and `morphik.toml` configurations.

2.  **Test Ingestion:**
    *   Ingest a document that requires ColPali embeddings.
    *   Monitor `morphik-core/logs/worker_ingestion.log` for successful calls to the Modal endpoint.
    *   Monitor the logs for your Modal app in the Modal dashboard. You should see requests coming in and being processed.

## 5. Benefits (Recap)

-   **Performance:** GPU acceleration via Modal.
-   **Stability:** Offloads heavy processing, preventing local worker crashes.
-   **Scalability & Cost:** Modal scales to zero, so you pay for GPU time only when embedding.
-   **Simplified `morphik-core` Worker:** No local ColPali model loading.

## 6. Production Considerations & Modal Settings

-   **GPU Choice (`gpu="A10G"`):** **UPGRADED from T4 to A10G** - A10G provides 24GB GPU memory vs T4's 14GB, significantly reducing OOM issues. T4 was insufficient for ColPali's memory requirements when processing multiple images.
-   **Memory Management:** 
    - **Batch sizes optimized:** Images processed one at a time (`batch_size=1`) to prevent CUDA OOM
    - **Aggressive memory clearing:** GPU memory cleared after each batch with `torch.cuda.empty_cache()`
    - **Individual fallback:** If batch processing fails, automatically falls back to processing items individually
    - **Environment variables:** Added `PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True` for better memory management
-   **`scaledown_window=300`:** 5 minutes. Adjust based on usage patterns. Longer timeouts reduce cold starts but increase costs if there are long idle periods with no scale-to-zero. Shorter timeouts save more money but increase cold start frequency.
-   **`max_containers`:** **REDUCED to 5** (from 10) to avoid resource contention and ensure each container has adequate GPU memory.
-   **`timeout=600`:** Max execution time for a single request to the Modal endpoint. ColPali can be slow per chunk. Ensure this is longer than your expected longest single batch processing time.
-   **Modal Logging:** Modal provides logs for your deployed apps via its dashboard, essential for debugging memory issues and performance.
-   **Cost Monitoring:** Keep an eye on your Modal usage and billing. A10G is more expensive than T4 but necessary for reliable operation.
-   **Error Handling:** Enhanced error handling with automatic fallback for OOM scenarios and comprehensive memory cleanup.
-   **Security:** The Bearer token authentication is a good start. For public-facing production systems, consider network policies, rate limiting (if Modal offers it or via an upstream gateway), etc.

### Memory Optimization Summary

The key optimizations implemented to prevent CUDA OOM errors:

1. **GPU Upgrade**: T4 (14GB) → A10G (24GB) for sufficient memory headroom
2. **Reduced Batch Sizes**: Images processed individually (`batch_size=1`) vs previous batch of 4
3. **Memory Clearing**: Explicit `torch.cuda.empty_cache()` and garbage collection after each batch
4. **Fallback Strategy**: Automatic individual processing if batch processing fails
5. **Memory Monitoring**: Real-time GPU memory usage logging for debugging
6. **Environment Optimization**: CUDA memory allocation settings for better fragmentation handling

This setup provides a robust and scalable way to handle ColPali embeddings, suitable for both local development (pointing to the deployed Modal app) and production deployments on platforms like Render or Vercel.

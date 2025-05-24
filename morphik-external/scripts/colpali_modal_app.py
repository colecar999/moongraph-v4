import modal
import os
import base64
import io
import time
import gc
from typing import List
from pydantic import BaseModel

# --- Modal App Definition ---
app = modal.App(name="colpali-embedding-service-prod") # Renamed stubb to app

# --- Environment and Image Configuration ---
# Define the Docker image for the Modal function.
# Ensure PyTorch is installed with CUDA support. Modal's newer base images with GPU selection often handle this well.
# Specify exact versions if compatibility issues arise.
gpu_image = modal.Image.debian_slim().pip_install(
    "torch", # Let Modal manage CUDA versioning if possible, or specify e.g., "torch==2.5.1+cu121"
    "transformers",
    "colpali-engine>=0.1.0",
    "Pillow",
    "numpy",
    "filetype", # If used in your image decoding logic
    "fastapi",  # Added FastAPI for @modal.fastapi_endpoint
    "uvicorn"   # Added Uvicorn, standard server for FastAPI
).env({
    "HF_HOME": "/cache/huggingface",
    "TRANSFORMERS_CACHE": "/cache/huggingface/models",
    "HF_HUB_CACHE": "/cache/huggingface/hub",
    "PIP_NO_CACHE_DIR": "true", # Avoid caching pip downloads in the image layer if not needed
    # CUDA memory optimization environment variables
    "PYTORCH_CUDA_ALLOC_CONF": "expandable_segments:True",
    "CUDA_LAUNCH_BLOCKING": "1"  # For better error reporting
})

# --- Pydantic Model for Request Body ---
class EmbeddingRequest(BaseModel):
    input_type: str
    inputs: List[str] # Keep as List[str] as this is what we believe is correct

# --- Modal Class for the Service ---
@app.cls(
    gpu="A10G",  # Upgraded from T4 to A10G for more GPU memory (24GB vs 14GB)
    image=gpu_image,
    scaledown_window=300,  # Spins down after 5 minutes of inactivity. (renamed from container_idle_timeout)
    secrets=[
        modal.Secret.from_name("my-huggingface-secret"), # For HF model download authentication
        modal.Secret.from_name("colpali-service-api-key")  # For securing our endpoint
    ],
    max_containers=5, # Reduced from 10 to 5 to avoid resource contention (renamed from concurrency_limit)
    timeout=600 # Max execution time for a request in seconds
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
                attn_implementation="eager",  # Changed from flash_attention_2 to eager for better memory efficiency
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
                print(f"ColpaliModalService: Model loaded. GPU memory allocated: {memory_allocated:.2f} GB, reserved: {memory_reserved:.2f} GB")
            else:
            print(f"ColpaliModalService: Model and processor loaded on {self.device}.")
        except Exception as e:
            print(f"ColpaliModalService: Exception during __init__: {e}")
            raise

    def _decode_image(self, base64_string: str):
        from PIL.Image import open as open_image
        # Basic check if it might be a data URI
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
        print(f"Authenticated request. Processing: input_type='{input_type}', num_inputs={len(inputs_data)}")
        
        # Log initial GPU memory state
        if torch.cuda.is_available():
            memory_allocated = torch.cuda.memory_allocated(0) / 1024**3
            memory_reserved = torch.cuda.memory_reserved(0) / 1024**3
            print(f"Pre-processing GPU memory - allocated: {memory_allocated:.2f} GB, reserved: {memory_reserved:.2f} GB")
        
        all_embeddings_list = []
        # Significantly reduced batch sizes to prevent OOM
        batch_size = 4 if input_type == "text" else 1  # Process images one at a time to avoid OOM
        
        try:
            for i in range(0, len(inputs_data), batch_size):
                batch_input_data = inputs_data[i:i + batch_size]
                processed_batch = None
                
                print(f"Processing batch {i//batch_size + 1}/{(len(inputs_data) + batch_size - 1)//batch_size} with {len(batch_input_data)} items")
                
                if input_type == "image":
                    pil_images = [self._decode_image(b64_str) for b64_str in batch_input_data]
                    if not pil_images: continue
                    processed_batch = self.processor.process_images(pil_images).to(self.device)
                elif input_type == "text":
                    if not all(isinstance(text, str) for text in batch_input_data):
                        return JSONResponse(content={"error": "Invalid text inputs, not all are strings"}, status_code=400)
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
                            print(f"After batch {i//batch_size + 1}: GPU memory allocated: {memory_allocated:.2f} GB")
                            
                    except RuntimeError as e:
                        if "out of memory" in str(e):
                            print(f"CUDA OOM error in batch {i//batch_size + 1}: {e}")
                            self._clear_gpu_memory()
                            # Try processing items one by one if batch fails
                            if len(batch_input_data) > 1:
                                print("Falling back to processing items individually...")
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
            self._clear_gpu_memory()  # Clean up on error
            return JSONResponse(content={"error": "Internal server error during embedding"}, status_code=500)
        
        # Final cleanup
        self._clear_gpu_memory()
        
        return {"embeddings": all_embeddings_list} 
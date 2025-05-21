# Configure Morphik

This guide explains how to configure Morphik using the `morphik.toml` file. For the latest details, see the [official documentation](https://docs.morphik.ai/configuration).

---

## Configuration Basics

Morphik is configured via the `morphik.toml` file, which uses the [TOML](https://toml.io/en/) format. Each section controls a specific component of the system:

```toml
[section_name]
setting1 = "value1"
setting2 = 123
```

You can:
- Run `python quick_setup.py` for interactive setup
- Copy and modify the example `morphik.toml`
- Create your own configuration file manually

---

## Registered Models Approach

Morphik uses a registered models approach, letting you define and reference models throughout your configuration. This enables:
- Using different models for different tasks
- Mixing and matching models (e.g., smaller models for simple tasks)
- Centralized model settings
- Easy switching between providers

### Defining Registered Models

Register models in the `[registered_models]` section:

```toml
[registered_models]
# OpenAI models
openai_gpt4o = { model_name = "gpt-4o" }
openai_gpt4 = { model_name = "gpt-4" }

# Azure OpenAI models
azure_gpt4 = { model_name = "gpt-4", api_base = "YOUR_AZURE_URL_HERE", api_version = "2023-05-15", deployment_id = "gpt-4-deployment" }
azure_gpt35 = { model_name = "gpt-3.5-turbo", api_base = "YOUR_AZURE_URL_HERE", api_version = "2023-05-15", deployment_id = "gpt-35-turbo-deployment" }

# Anthropic models
claude_opus = { model_name = "claude-3-opus-20240229" }
claude_sonnet = { model_name = "claude-3-sonnet-20240229" }

# Ollama models
ollama_llama = { model_name = "ollama_chat/llama3.2", api_base = "http://localhost:11434" }
ollama_llama_docker = { model_name = "ollama_chat/llama3.2", api_base = "http://ollama:11434" }
ollama_llama_vision = { model_name = "ollama_chat/llama3.2-vision", api_base = "http://localhost:11434", vision = true }

# Embedding models
openai_embedding = { model_name = "text-embedding-3-small" }
openai_embedding_large = { model_name = "text-embedding-3-large" }
azure_embedding = { model_name = "text-embedding-ada-002", api_base = "YOUR_AZURE_URL_HERE", api_version = "2023-05-15", deployment_id = "embedding-ada-002" }
ollama_embedding = { model_name = "ollama/nomic-embed-text", api_base = "http://localhost:11434" }
```

### Using Registered Models

Reference models by key in other sections:

```toml
[completion]
model = "ollama_llama"
default_max_tokens = "1000"
default_temperature = 0.5

[embedding]
model = "ollama_embedding"
dimensions = 768
similarity_metric = "cosine"

[parser.vision]
model = "ollama_llama_vision"

[rules]
model = "ollama_llama"

[graph]
model = "ollama_llama"
```

---

## Core Configuration Sections

### API Server Settings
```toml
[api]
host = "localhost"  # Use "0.0.0.0" for Docker
port = 8000
reload = true
```

### Authentication
```toml
[auth]
jwt_algorithm = "HS256"
dev_mode = true
# Dev mode options for local development
dev_entity_id = "dev_user"
dev_entity_type = "developer"
dev_permissions = ["read", "write", "admin"]
```

### LLM Completion Settings
```toml
[completion]
model = "claude_sonnet"
default_max_tokens = "1000"
default_temperature = 0.5
```

### Database Connection
```toml
[database]
provider = "postgres"
# Or for MongoDB
# provider = "mongodb"
# database_name = "morphik"
# collection_name = "documents"
```

### Embedding Configuration
```toml
[embedding]
model = "openai_embedding"
dimensions = 1536
similarity_metric = "cosine"
```

### Document Parsing
```toml
[parser]
chunk_size = 1000
chunk_overlap = 200
use_unstructured_api = false
use_contextual_chunking = false
contextual_chunking_model = "ollama_llama"
```

### Vision Processing
```toml
[parser.vision]
model = "ollama_llama_vision"
frame_sample_rate = -1
```

### Reranking
```toml
[reranker]
use_reranker = true
provider = "flag"
model_name = "BAAI/bge-reranker-large"
query_max_length = 256
passage_max_length = 512
use_fp16 = true
device = "mps"  # "cpu", "cuda", or "mps"
```

### Document Storage
```toml
[storage]
provider = "local"
storage_path = "./storage"
# Or for AWS S3
# provider = "aws-s3"
# region = "us-east-2"
# bucket_name = "morphik-storage"
```

### Vector Database
```toml
[vector_store]
provider = "pgvector"
# Or for MongoDB
# provider = "mongodb"
# database_name = "morphik"
# collection_name = "document_chunks"
```

### Rules Engine
```toml
[rules]
model = "openai_gpt4"
batch_size = 4096
```

### Knowledge Graph
```toml
[graph]
model = "claude_sonnet"
enable_entity_resolution = true
```

### General Morphik Settings
```toml
[morphik]
enable_colpali = true
mode = "self_hosted"  # "cloud" or "self_hosted"
```

### Telemetry
```toml
[telemetry]
enabled = true
honeycomb_enabled = true
honeycomb_endpoint = "https://api.honeycomb.io"
honeycomb_proxy_endpoint = "https://otel-proxy.onrender.com"
service_name = "morphik-core"
otlp_timeout = 10
otlp_max_retries = 3
otlp_retry_delay = 1
otlp_max_export_batch_size = 512
otlp_schedule_delay_millis = 5000
otlp_max_queue_size = 2048
```

---

## Environment Variables

Sensitive credentials and configuration should be set as environment variables:
- `OPENAI_API_KEY`: Your OpenAI API key
- `ANTHROPIC_API_KEY`: Your Anthropic API key
- `JWT_SECRET_KEY`: Secret for authentication tokens
- `POSTGRES_URI`: PostgreSQL connection string
- `MONGODB_URI`: MongoDB connection string
- `AWS_ACCESS_KEY` and `AWS_SECRET_ACCESS_KEY`: For S3 storage
- `ASSEMBLYAI_API_KEY`: For video transcription
- `UNSTRUCTURED_API_KEY`: For enhanced document parsing (optional)
- `HONEYCOMB_API_KEY`: For telemetry (optional)

---

## Complete Configuration Example

```toml
[api]
host = "localhost"
port = 8000
reload = true

[auth]
jwt_algorithm = "HS256"
dev_mode = true
dev_entity_id = "dev_user"
dev_entity_type = "developer"
dev_permissions = ["read", "write", "admin"]

[registered_models]
openai_gpt4o = { model_name = "gpt-4o" }
openai_gpt4 = { model_name = "gpt-4" }
azure_gpt4 = { model_name = "gpt-4", api_base = "YOUR_AZURE_URL_HERE", api_version = "2023-05-15", deployment_id = "gpt-4-deployment" }
azure_gpt35 = { model_name = "gpt-3.5-turbo", api_base = "YOUR_AZURE_URL_HERE", api_version = "2023-05-15", deployment_id = "gpt-35-turbo-deployment" }
claude_opus = { model_name = "claude-3-opus-20240229" }
claude_sonnet = { model_name = "claude-3-sonnet-20240229" }
ollama_llama = { model_name = "ollama_chat/llama3.2", api_base = "http://localhost:11434" }
ollama_llama_vision = { model_name = "ollama_chat/llama3.2-vision", api_base = "http://localhost:11434", vision = true }
openai_embedding = { model_name = "text-embedding-3-small" }
ollama_embedding = { model_name = "ollama/nomic-embed-text", api_base = "http://localhost:11434" }

[completion]
model = "ollama_llama"
default_max_tokens = "1000"
default_temperature = 0.5

[database]
provider = "postgres"

[embedding]
model = "ollama_embedding"
dimensions = 768
similarity_metric = "cosine"

[parser]
chunk_size = 1000
chunk_overlap = 200
use_unstructured_api = false
use_contextual_chunking = false
contextual_chunking_model = "ollama_llama"

[parser.vision]
model = "ollama_llama_vision"
frame_sample_rate = -1

[reranker]
use_reranker = true
provider = "flag"
model_name = "BAAI/bge-reranker-large"
query_max_length = 256
passage_max_length = 512
use_fp16 = true
device = "mps"

[storage]
provider = "local"
storage_path = "./storage"

[vector_store]
provider = "pgvector"

[rules]
model = "ollama_llama"
batch_size = 4096

[morphik]
enable_colpali = true
mode = "self_hosted"

[graph]
model = "ollama_llama"
enable_entity_resolution = true

[telemetry]
enabled = true
honeycomb_enabled = true
honeycomb_endpoint = "https://api.honeycomb.io"
honeycomb_proxy_endpoint = "https://otel-proxy.onrender.com"
service_name = "morphik-core"
```

---

## Mixing and Matching Models

You can optimize your configuration by using different models for different tasks:

```toml
[parser.vision]
model = "openai_gpt4o"

[rules]
model = "claude_sonnet"

[completion]
model = "ollama_llama"
```

---

## Docker Configuration Adjustments

- Set `host = "0.0.0.0"` in `[api]` for Docker
- For Ollama, use models with `api_base = "http://ollama:11434"`
- Use container names in database connection strings

---

## Need Help?

- Check logs for error messages
- Run `python quick_setup.py` for guided setup
- Join the [Discord community](https://discord.gg/BwMtv3Zaju)
- Open an issue on [GitHub](https://github.com/morphik-org/morphik-core)

---

*Source: [Morphik Docs - Configuration](https://docs.morphik.ai/configuration)* 
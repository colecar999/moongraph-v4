# End User Process Visibility (v2 - Extension-Based Implementation)

This document outlines an enhanced plan for implementing end-user process visibility, focusing on an extension-based approach that avoids direct modification of the `morphik-core` submodule, aligning with project best practices. This plan aims to be flexible, robust, and extensible.

## Core Requirements Recap
- **Non-invasive**: Implementation must occur in the main project, not by altering submodule code.
- **Dedicated Logging**: Progress data should be saved to a dedicated `logs/document_pipeline.log` file.
- **Frontend Surfacing**: Data must be accessible to a frontend dashboard.
- **Design Principles**: The solution should be flexible, robust, and easily extendable.

## Recommended Architecture & Implementation Steps

### 1. Custom Logger Setup (`extensions/custom_logging.py`)
A dedicated Python module will be created to manage the setup and retrieval of a logger specifically for document pipeline progress.

**Responsibilities:**
- Creates the `logs/document_pipeline.log` file if it doesn't exist.
- Configures a `logging.Logger` instance named `document_pipeline`.
- Uses a simple text-based formatter for the log file entries, but the core message will be a JSON string for structured data.
- Provides a helper function `get_pipeline_logger()` for easy access.

**Example Snippet:**
```python
# extensions/custom_logging.py
import logging
from pathlib import Path

DOCUMENT_PIPELINE_LOGGER_NAME = "document_pipeline"

def setup_document_pipeline_logging(log_dir_base_path: Path = Path("logs")):
    log_dir = log_dir_base_path
    log_dir.mkdir(exist_ok=True)
    logger = logging.getLogger(DOCUMENT_PIPELINE_LOGGER_NAME)
    logger.setLevel(logging.INFO)
    if not logger.handlers:
        file_handler = logging.FileHandler(log_dir / "document_pipeline.log")
        formatter = logging.Formatter(
            "%(asctime)s - %(levelname)s - %(name)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    return logger

def get_pipeline_logger():
    return logging.getLogger(DOCUMENT_PIPELINE_LOGGER_NAME)
```

### 2. Main Entrypoint Modification (`run_morphik.py`)
The main application entrypoint (`run_morphik.py`) will be updated to initialize this custom logger immediately after the core logging setup.

**Change:**
- Import `setup_document_pipeline_logging` from `extensions.custom_logging`.
- Call `setup_document_pipeline_logging()` after `core_setup_logging()`.

### 3. Progress Utility Class (`extensions/progress_utils.py`)
A utility class, `ProgressEventLogger`, will be implemented to standardize the creation and logging of structured progress events.

**Features:**
- Accepts `document_id` and an optional `operation_id`.
- Provides a `log_event` method that takes `step`, `status`, an optional `message`, and optional `details` (dictionary).
- Formats the event data as a JSON string and logs it using the `document_pipeline` logger.

**Example Snippet:**
```python
# extensions/progress_utils.py
import json
from typing import Optional, Dict, Any
from extensions.custom_logging import get_pipeline_logger

class ProgressEventLogger:
    def __init__(self, document_id: str, operation_id: Optional[str] = None):
        self.document_id = document_id
        self.operation_id = operation_id or document_id
        self._logger = get_pipeline_logger()

    def log_event(self, step: str, status: str, message: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        event_data = {
            "document_id": self.document_id,
            "operation_id": self.operation_id,
            "step": step,
            "status": status,
            "message": message or f"Step '{step}' status: {status}",
            "details": details or {}
        }
        self._logger.info(json.dumps(event_data))
```

### 4. Extending Core Services (e.g., `extensions/document_service_extended.py`)
Core services from the `morphik-core` submodule (like `DocumentService`, `GraphService`, `MorphikAgent`) will be subclassed within the `extensions/` directory. These extended classes will override relevant methods to incorporate progress logging using `ProgressEventLogger`.

**Methodology:**
- Create a new class (e.g., `DocumentServiceExtended`) that inherits from the base service class (e.g., `BaseDocumentService`).
- Override methods involved in long-running processes (e.g., `run_ingestion_pipeline`).
- Inside the overridden method, instantiate `ProgressEventLogger`.
- Call `progress_logger.log_event()` at the beginning, end, and ideally, at critical junctures within the process. (Note: Granular logging *within* a base method requires the base method to be designed for it, e.g., by calling overridable protected sub-methods or accepting callbacks. Otherwise, logging is limited to "before" and "after" the `super()` call.)
- Ensure `super().<method_name>()` is called to retain original functionality.
- Handle exceptions and log failure statuses appropriately.

**Example Snippet (Conceptual):**
```python
# extensions/document_service_extended.py
from core.services.document_service import DocumentService as BaseDocumentService
from extensions.progress_utils import ProgressEventLogger

class DocumentServiceExtended(BaseDocumentService):
    async def run_ingestion_pipeline(self, document, job_data):
        progress_logger = ProgressEventLogger(document.id, job_data.get("job_id"))
        progress_logger.log_event("pipeline", "started")
        try:
            # ... potentially log sub-steps if base method allows ...
            result = await super().run_ingestion_pipeline(document, job_data)
            progress_logger.log_event("pipeline", "completed")
            return result
        except Exception as e:
            progress_logger.log_event("pipeline", "failed", str(e))
            raise
```

### 5. Application Integration (Service Replacement)
The application must be configured to use these new extended services instead of the default ones from `morphik-core`. Monkeypatching is a viable strategy for this, applied in `run_morphik.py`.

**Method:**
- In `run_morphik.py`, before the main FastAPI `app` is fully imported or used:
  - Import the original service module (e.g., `core.services.document_service`).
  - Import the extended service class (e.g., `DocumentServiceExtended` from `extensions.document_service_extended`).
  - Reassign the original service class in its module to point to the extended class (e.g., `core.services.document_service.DocumentService = DocumentServiceExtended`).
- This ensures that any part of the application that imports and instantiates `DocumentService` will now get `DocumentServiceExtended`.

### 6. API Endpoint for Frontend Access (`extensions/progress_api.py`)
A new FastAPI router will be created to expose the contents of `document_pipeline.log` to the frontend.

**Features:**
- An endpoint like `GET /api/v1/progress/logs/{document_id}`.
- Reads `logs/document_pipeline.log`.
- Parses each line, expecting the JSON payload logged by `ProgressEventLogger`.
- Filters entries relevant to the given `document_id` (or `operation_id`).
- Optionally supports returning only the `last_n` entries.
- Returns a list of structured log event dictionaries.

**Integration:**
- The router will be included in the main FastAPI `app` instance in `run_morphik.py`.

### 7. Dockerfile Configuration
The main project `Dockerfile` must ensure the `extensions/` directory is copied into the Docker image. This was addressed in previous steps.

```dockerfile
# ... other COPY commands ...
COPY extensions ./extensions # Ensure this line is present
COPY run_morphik.py ./run_morphik.py
# ...
```

## Design Considerations

- **Granularity of Logging**: The ability to log fine-grained steps *within* a single method of a `morphik-core` service (without modifying the service itself) depends on that method's internal structure. If it calls smaller, overridable (e.g., protected `_do_something`) methods, those can be targeted. Otherwise, logging is limited to the entry and exit points of the overridden method.
- **Log File Management**: For production, parsing a growing log file can become inefficient. Consider:
    - Log rotation for `document_pipeline.log`.
    - A more robust solution where progress events also update a status in a database table (as originally suggested in `end-user-process-visibility.md`), which the API then queries. This is more scalable than file parsing.
- **Error Handling**: The progress logging should not interfere with the application's own error handling. Exceptions should be re-raised after logging.
- **Asynchronous Operations**: Ensure logging calls within `async` methods are non-blocking or handled appropriately. `ProgressEventLogger`'s `log_event` is synchronous; for high-throughput async paths, consider making it async or offloading to a background task if logging becomes a bottleneck.

## Conclusion
This extension-based approach provides a robust and maintainable way to implement detailed end-user process visibility. It leverages custom logging, service subclassing, and a dedicated API, keeping the core `morphik-core` submodule untouched and upgradable. Future enhancements could involve moving from log file parsing to a database-backed status system for improved query performance and scalability for the frontend. 
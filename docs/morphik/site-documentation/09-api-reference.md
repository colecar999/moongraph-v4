# Morphik AI API Reference

This document provides a comprehensive reference for the Morphik AI API endpoints.

**Base URL:** (Please assume a base URL, e.g., `https://api.morphik.ai/v1`)

**Authentication:** Most endpoints require an `Authorization` header containing your API key or token.

**Common Responses:**
*   **200 OK:** Request was successful. The response body contains the requested data or confirmation.
*   **422 Unprocessable Entity:** The request was well-formed but contained semantic errors (e.g., invalid parameter values, missing required fields). The response body may contain details about the error.

---

## Table of Contents

*   [Health/System](#healthsystem)
    *   [Health Check](#health-check)
    *   [Readiness Check](#readiness-check)
*   [Documents](#documents)
    *   [Ingest Text](#ingest-text)
    *   [Ingest File](#ingest-file)
    *   [Batch Ingest Files](#batch-ingest-files)
    *   [List Documents](#list-documents)
    *   [Get Document](#get-document)
    *   [Get Document By Filename](#get-document-by-filename)
    *   [Get Document Status](#get-document-status)
    *   [Update Document Text](#update-document-text)
    *   [Update Document File](#update-document-file)
    *   [Update Document Metadata](#update-document-metadata)
    *   [Delete Document](#delete-document)
    *   [Batch Get Documents](#batch-get-documents)
*   [Chunks](#chunks)
    *   [Batch Get Chunks](#batch-get-chunks)
*   [Folders](#folders)
    *   [Create Folder](#create-folder)
    *   [List Folders](#list-folders)
    *   [Get Folder](#get-folder)
    *   [Add Document To Folder](#add-document-to-folder)
    *   [Remove Document From Folder](#remove-document-from-folder)
    *   [Set Folder Rule](#set-folder-rule)
*   [Graphs](#graphs)
    *   [Create Graph](#create-graph)
    *   [List Graphs](#list-graphs)
    *   [Get Graph](#get-graph)
    *   [Update Graph](#update-graph)
*   [Cache](#cache)
    *   [Create Cache](#create-cache)
    *   [Get Cache](#get-cache)
    *   [Update Cache](#update-cache)
    *   [Add Docs To Cache](#add-docs-to-cache)
    *   [Query Cache](#query-cache)
*   [Retrieval](#retrieval)
    *   [Retrieve Documents](#retrieve-documents)
    *   [Retrieve Chunks](#retrieve-chunks)
*   [Query](#query)
    *   [Query Completion](#query-completion)
*   [Usage](#usage)
    *   [Get Usage Stats](#get-usage-stats)
    *   [Get Recent Usage](#get-recent-usage)
*   [URI Generation](#uri-generation)
    *   [Generate Local Uri](#generate-local-uri)
    *   [Generate Cloud Uri](#generate-cloud-uri)

---

## Health/System

Endpoints for checking the status and readiness of the API.

### Health Check

`GET /health`

Checks the basic health of the API service.

**Headers:**
*   None

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Type `any`. Indicates the service is running.
    ```json
    "<any>"
    ```

---

### Readiness Check

`GET /health/ready`

Checks if the API service is ready to accept requests.

**Headers:**
*   None

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Type `any`. Indicates the service is ready.
    ```json
    "<any>"
    ```

---

## Documents

Endpoints for managing documents within Morphik AI.

### Ingest Text

`POST /ingest/text`

Ingests raw text content into Morphik AI as a new document.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   `content`: string (required) - The text content to ingest.
*   `filename`: string | null - Optional filename to associate with the text content.
*   `metadata`: object - Optional metadata key-value pairs to associate with the document.
*   `rules`: object[] - Optional rules to apply during ingestion.
*   `use_colpali`: boolean | null - Optional flag for specific processing.
*   `folder_name`: string | null - Optional folder scope for the operation.
*   `end_user_id`: string | null - Optional end-user scope for the operation.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Represents the created document.
    ```json
    {
      "external_id": "<string>",
      "owner": {},
      "content_type": "<string>",
      "filename": "<string>",
      "metadata": {},
      "storage_info": {},
      "storage_files": [
        {
          "bucket": "<string>",
          "key": "<string>",
          "version": 1,
          "filename": "<string>",
          "content_type": "<string>",
          "timestamp": "2023-11-07T05:31:56Z"
        }
      ],
      "system_metadata": {},
      "additional_metadata": {},
      "access_control": {},
      "chunk_ids": [
        "<string>"
      ]
    }
    ```
    *   `owner`: object (required) - Information about the document owner.
    *   `content_type`: string (required) - The detected or specified content type.
    *   `external_id`: string - Optional external identifier.
    *   `filename`: string | null - The filename associated with the document.
    *   `metadata`: object - User-provided metadata.
    *   `storage_info`: object - Information about the document's storage.
    *   `storage_files`: object[] - Details about the stored file(s).
        *   `bucket`: string (required)
        *   `key`: string (required)
        *   `version`: integer (default: 1)
        *   `filename`: string | null
        *   `content_type`: string | null
        *   `timestamp`: string (ISO 8601 format)
    *   `system_metadata`: object - Metadata generated by the system.
    *   `additional_metadata`: object - Additional metadata, potentially extracted.
    *   `access_control`: object - Access control settings.
    *   `chunk_ids`: string[] - IDs of the chunks created from the document.

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body parameters.

---

### Ingest File

`POST /ingest/file`

Ingests a file into Morphik AI as a new document.

**Headers:**
*   `Authorization`: string

**Query Parameters:**
*   `use_colpali`: boolean | null - Optional flag for specific processing.

**Request Body (`multipart/form-data`):**
*   `file`: file (required) - The file to ingest.
*   `metadata`: string (default: `{}`) - JSON string representing metadata key-value pairs.
*   `rules`: string (default: `[]`) - JSON string representing an array of rules.
*   `folder_name`: string | null - Optional folder scope for the operation.
*   `end_user_id`: string | null - Optional end-user scope for the operation.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Represents the created document (same structure as Ingest Text response).
    ```json
    {
      "external_id": "<string>",
      "owner": {},
      "content_type": "<string>",
      "filename": "<string>",
      "metadata": {},
      "storage_info": {},
      "storage_files": [
        {
          "bucket": "<string>",
          "key": "<string>",
          "version": 1,
          "filename": "<string>",
          "content_type": "<string>",
          "timestamp": "2023-11-07T05:31:56Z"
        }
      ],
      "system_metadata": {},
      "additional_metadata": {},
      "access_control": {},
      "chunk_ids": [
        "<string>"
      ]
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request parameters or file upload.

---

### Batch Ingest Files

`POST /ingest/files`

Ingests multiple files simultaneously into Morphik AI.

**Headers:**
*   `Authorization`: string

**Request Body (`multipart/form-data`):**
*   `files`: file[] (required) - An array of files to ingest.
*   `metadata`: string (default: `{}`) - JSON string representing common metadata for all files.
*   `rules`: string (default: `[]`) - JSON string representing common rules for all files.
*   `use_colpali`: boolean | null - Optional flag for specific processing.
*   `parallel`: boolean | null (default: `true`) - Whether to process files in parallel.
*   `folder_name`: string | null - Optional folder scope for the operation.
*   `end_user_id`: string | null - Optional end-user scope for the operation.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Contains lists of successfully ingested documents and any errors encountered.
    ```json
    {
      "documents": [
        {
          "external_id": "<string>",
          "owner": {},
          "content_type": "<string>",
          "filename": "<string>",
          // ... other document fields as in Ingest File response
          "chunk_ids": ["<string>"]
        }
      ],
      "errors": [
        {
          // Error details for files that failed ingestion
          "<filename>": "<error_message>"
        }
      ]
    }
    ```
    *   `documents`: object[] (required) - List of successfully created document objects (structure matches Ingest File response).
    *   `errors`: object[] (required) - List of objects detailing errors for files that failed.

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request parameters or file uploads.

---

### List Documents

`POST /documents`

Retrieves a list of documents, optionally filtered.

**Headers:**
*   `Authorization`: string

**Query Parameters:**
*   `skip`: integer (default: 0) - Number of documents to skip for pagination.
*   `limit`: integer (default: 10000) - Maximum number of documents to return.
*   `folder_name`: string | null - Filter documents by folder name.
*   `end_user_id`: string | null - Filter documents by end-user ID.

**Request Body (`application/json`):**
*   object | null - Optional filter criteria (specific structure not detailed in source, likely key-value pairs matching metadata).

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of document objects.
    ```json
    [
      {
        "external_id": "<string>",
        "owner": {},
        "content_type": "<string>",
        "filename": "<string>",
        // ... other document fields as in Ingest File response
        "chunk_ids": ["<string>"]
      }
    ]
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with query parameters or request body filters.

---

### Get Document

`GET /documents/{document_id}`

Retrieves a specific document by its ID.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `document_id`: string (required) - The unique ID of the document to retrieve.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The requested document object.
    ```json
    {
      "external_id": "<string>",
      "owner": {},
      "content_type": "<string>",
      "filename": "<string>",
      // ... other document fields as in Ingest File response
      "chunk_ids": ["<string>"]
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates the `document_id` is invalid or not found.

---

### Get Document By Filename

`GET /documents/filename/{filename}`

Retrieves a specific document by its filename. Note: Filenames might not be unique; this likely returns the first match or requires additional scoping (like `folder_name`).

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `filename`: string (required) - The filename of the document to retrieve.

**Query Parameters:**
*   `folder_name`: string | null - Optional folder scope to narrow down the search.
*   `end_user_id`: string | null - Optional end-user scope.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The requested document object.
    ```json
    {
      "external_id": "<string>",
      "owner": {},
      "content_type": "<string>",
      "filename": "<string>",
      // ... other document fields as in Ingest File response
      "chunk_ids": ["<string>"]
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates the `filename` (potentially within the scope) is invalid or not found.

---

### Get Document Status

`GET /documents/{document_id}/status`

Retrieves the processing status of a specific document.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `document_id`: string (required) - The unique ID of the document.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object describing the document's status (specific structure not detailed in source).
    ```json
    {}
    ```

**Response (422 Unprocessable Entity):**
*   Indicates the `document_id` is invalid or not found.

---

### Update Document Text

`POST /documents/{document_id}/update_text`

Updates the text content of an existing document.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `document_id`: string (required) - The ID of the document to update.

**Query Parameters:**
*   `update_strategy`: string (default: `add`) - Strategy for updating (e.g., `add`, `replace` - specific options not fully detailed).

**Request Body (`application/json`):**
*   `content`: string (required) - The new text content.
*   `filename`: string | null - Optional new filename.
*   `metadata`: object - Optional metadata to add or update.
*   `rules`: object[] - Optional rules to apply during the update.
*   `use_colpali`: boolean | null - Optional flag for specific processing.
*   `folder_name`: string | null - Optional folder scope.
*   `end_user_id`: string | null - Optional end-user scope.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The updated document object.
    ```json
    {
      "external_id": "<string>",
      "owner": {},
      "content_type": "<string>",
      "filename": "<string>",
      // ... other document fields as in Ingest File response
      "chunk_ids": ["<string>"]
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request parameters or the `document_id`.

---

### Update Document File

`POST /documents/{document_id}/update_file`

Updates the file content of an existing document.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `document_id`: string (required) - The ID of the document to update.

**Query Parameters:**
*   `use_colpali`: boolean | null - Optional flag for specific processing.

**Request Body (`multipart/form-data`):**
*   `file`: file (required) - The new file content.
*   `metadata`: string (default: `{}`) - JSON string of metadata to add/update.
*   `rules`: string (default: `[]`) - JSON string of rules to apply.
*   `update_strategy`: string (default: `add`) - Strategy for updating.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The updated document object.
    ```json
    {
      "external_id": "<string>",
      "owner": {},
      "content_type": "<string>",
      "filename": "<string>",
      // ... other document fields as in Ingest File response
      "chunk_ids": ["<string>"]
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request parameters, file upload, or `document_id`.

---

### Update Document Metadata

`POST /documents/{document_id}/update_metadata`

Updates only the metadata of an existing document.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `document_id`: string (required) - The ID of the document to update.

**Request Body (`application/json`):**
*   object - An object containing the metadata fields and values to add or update.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The updated document object.
    ```json
    {
      "external_id": "<string>",
      "owner": {},
      "content_type": "<string>",
      "filename": "<string>",
      // ... other document fields including updated metadata
      "chunk_ids": ["<string>"]
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body or `document_id`.

---

### Delete Document

`DELETE /documents/{document_id}`

Deletes a specific document by its ID.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `document_id`: string (required) - The ID of the document to delete.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Type `any`. Confirmation of deletion.
    ```json
    "<any>"
    ```

**Response (422 Unprocessable Entity):**
*   Indicates the `document_id` is invalid or not found.

---

### Batch Get Documents

`POST /batch/documents`

Retrieves multiple documents by their IDs in a single request.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   object - An object containing a list of document IDs to retrieve (specific structure not detailed, likely `{"document_ids": ["id1", "id2", ...]}`).

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of the requested document objects.
    ```json
    [
      {
        "external_id": "<string>",
        "owner": {},
        "content_type": "<string>",
        "filename": "<string>",
        // ... other document fields as in Ingest File response
        "chunk_ids": ["<string>"]
      }
      // ... more documents
    ]
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body (e.g., invalid IDs).

---

## Chunks

Endpoints related to document chunks.

### Batch Get Chunks

`POST /batch/chunks`

Retrieves multiple document chunks by their IDs or other criteria in a single request.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   object - An object containing criteria to identify the chunks (e.g., list of chunk IDs, document IDs - specific structure not detailed).

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of chunk objects.
    ```json
    [
      {
        "content": "<string>",
        "score": 123, // Score might be relevant if retrieved via search context
        "document_id": "<string>",
        "chunk_number": 123,
        "metadata": {},
        "content_type": "<string>",
        "filename": "<string>",
        "download_url": "<string>"
      }
      // ... more chunks
    ]
    ```
    *   `content`: string (required) - The text content of the chunk.
    *   `score`: number (required) - Relevance score (context-dependent).
    *   `document_id`: string (required) - ID of the parent document.
    *   `chunk_number`: integer (required) - Sequence number of the chunk within the document.
    *   `metadata`: object (required) - Metadata associated with the chunk/document.
    *   `content_type`: string (required) - Content type of the parent document.
    *   `filename`: string | null - Filename of the parent document.
    *   `download_url`: string | null - A URL to download the original document/chunk source if applicable.

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body criteria.

---

## Folders

Endpoints for organizing documents into folders.

### Create Folder

`POST /folders`

Creates a new folder.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   `name`: string (required) - The name for the new folder.
*   `description`: string | null - An optional description for the folder.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The created folder object.
    ```json
    {
      "id": "<string>",
      "name": "<string>",
      "description": "<string>",
      "owner": {},
      "document_ids": [], // Initially empty
      "system_metadata": {},
      "access_control": {},
      "rules": [] // Initially empty
    }
    ```
    *   `id`: string - The unique ID assigned to the folder.
    *   `name`: string (required) - The folder's name.
    *   `description`: string | null - The folder's description.
    *   `owner`: object (required) - Information about the folder owner.
    *   `document_ids`: string[] - List of document IDs currently in the folder.
    *   `system_metadata`: object - System-generated metadata.
    *   `access_control`: object - Access control settings.
    *   `rules`: object[] - Rules associated with the folder.

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body (e.g., missing name, name conflict).

---

### List Folders

`GET /folders`

Retrieves a list of all accessible folders.

**Headers:**
*   `Authorization`: string

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of folder objects.
    ```json
    [
      {
        "id": "<string>",
        "name": "<string>",
        "description": "<string>",
        "owner": {},
        "document_ids": [ "<string>" ],
        "system_metadata": {},
        "access_control": {},
        "rules": [ {} ]
      }
      // ... more folders
    ]
    ```

**Response (422 Unprocessable Entity):**
*   Indicates potential server-side issues retrieving the list.

---

### Get Folder

`GET /folders/{folder_id}`

Retrieves a specific folder by its ID.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `folder_id`: string (required) - The unique ID of the folder to retrieve.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The requested folder object.
    ```json
    {
      "id": "<string>",
      "name": "<string>",
      "description": "<string>",
      "owner": {},
      "document_ids": [ "<string>" ],
      "system_metadata": {},
      "access_control": {},
      "rules": [ {} ]
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates the `folder_id` is invalid or not found.

---

### Add Document To Folder

`POST /folders/{folder_id}/documents/{document_id}`

Adds an existing document to a specific folder.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `folder_id`: string (required) - The ID of the target folder.
*   `document_id`: string (required) - The ID of the document to add.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Type `any`. Confirmation that the document was added.
    ```json
    "<any>"
    ```

**Response (422 Unprocessable Entity):**
*   Indicates invalid `folder_id` or `document_id`, or the document is already in the folder.

---

### Remove Document From Folder

`DELETE /folders/{folder_id}/documents/{document_id}`

Removes a document from a specific folder (does not delete the document itself).

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `folder_id`: string (required) - The ID of the folder.
*   `document_id`: string (required) - The ID of the document to remove.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Type `any`. Confirmation that the document was removed.
    ```json
    "<any>"
    ```

**Response (422 Unprocessable Entity):**
*   Indicates invalid `folder_id` or `document_id`, or the document is not in the folder.

---

### Set Folder Rule

`POST /folders/{folder_id}/set_rule`

Defines or updates rules associated with a folder (e.g., for automatic metadata extraction).

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `folder_id`: string (required) - The ID of the folder to set rules for.

**Query Parameters:**
*   `apply_to_existing`: boolean (default: `true`) - Whether to apply the new rules to documents already in the folder.

**Request Body (`application/json`):**
*   `rules`: object[] (required) - An array of rule objects.
    *   `type`: string (default: `metadata_extraction`) - The type of rule.
    *   `schema`: object - The schema or configuration for the rule (structure depends on `type`).

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** Type `any`. Confirmation that the rules were set.
    ```json
    "<any>"
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the `folder_id` or the format/content of the `rules`.

---

## Graphs

Endpoints for creating and managing knowledge graphs derived from documents.

### Create Graph

`POST /graph/create`

Creates a new knowledge graph based on specified documents or filters.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   `name`: string (required) - Name for the new graph.
*   `filters`: object | null - Optional metadata filters to select documents for the graph.
*   `documents`: string[] | null - Optional list of specific document IDs to include.
*   `prompt_overrides`: object | null - Optional customizations for entity extraction and resolution.
    *   `entity_extraction`: object | null - Overrides for entity extraction.
        *   `prompt_template`: string | null - Custom template (must include `{content}` and `{examples}`).
        *   `examples`: object[] | null - Examples to guide extraction.
            *   `label`: string (required) - Example entity label (e.g., 'Apple Inc.').
            *   `type`: string (required) - Example entity type (e.g., 'ORGANIZATION').
            *   `properties`: object | null - Optional example properties.
    *   `entity_resolution`: object | null - Overrides for entity resolution.
        *   `prompt_template`: string | null - Custom template (must include `{entities_str}` and `{examples_json}`).
        *   `examples`: object[] | null - Examples of resolution groups.
            *   `canonical`: string (required) - The preferred form of the entity.
            *   `variants`: string[] (required) - List of alternative forms.
*   `folder_name`: string | null - Optional folder scope for selecting documents.
*   `end_user_id`: string | null - Optional end-user scope.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The created knowledge graph object.
    ```json
    {
      "id": "<string>",
      "name": "<string>",
      "entities": [
        {
          "id": "<string>",
          "label": "<string>",
          "type": "<string>",
          "properties": {},
          "document_ids": ["<string>"],
          "chunk_sources": {}
        }
      ],
      "relationships": [
        {
          "id": "<string>",
          "source_id": "<string>",
          "target_id": "<string>",
          "type": "<string>",
          "document_ids": ["<string>"],
          "chunk_sources": {}
        }
      ],
      "metadata": {},
      "system_metadata": {},
      "document_ids": ["<string>"],
      "filters": {},
      "created_at": "2023-11-07T05:31:56Z",
      "updated_at": "2023-11-07T05:31:56Z",
      "owner": {},
      "access_control": {}
    }
    ```
    *   Includes graph details, entities, relationships, source documents, metadata, timestamps, etc.

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body parameters (e.g., missing name, invalid filters/IDs).

---

### List Graphs

`GET /graphs`

Retrieves a list of all accessible knowledge graphs.

**Headers:**
*   `Authorization`: string

**Query Parameters:**
*   `folder_name`: string | null - Filter graphs associated with a folder.
*   `end_user_id`: string | null - Filter graphs by end-user ID.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of knowledge graph objects (structure matches Create Graph response).
    ```json
    [
      {
        "id": "<string>",
        "name": "<string>",
        // ... other graph fields
      }
      // ... more graphs
    ]
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with query parameters or retrieving the list.

---

### Get Graph

`GET /graph/{name}`

Retrieves a specific knowledge graph by its name.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `name`: string (required) - The name of the graph to retrieve.

**Query Parameters:**
*   `folder_name`: string | null - Optional folder scope.
*   `end_user_id`: string | null - Optional end-user scope.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The requested knowledge graph object (structure matches Create Graph response).
    ```json
    {
      "id": "<string>",
      "name": "<string>",
      // ... other graph fields
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates the graph `name` (within scope) is invalid or not found.

---

### Update Graph

`POST /graph/{name}/update`

Updates an existing knowledge graph, potentially adding information from new documents.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `name`: string (required) - The name of the graph to update.

**Request Body (`application/json`):**
*   `additional_filters`: object | null - Optional filters to find new documents to include.
*   `additional_documents`: string[] | null - Optional list of specific document IDs to add.
*   `prompt_overrides`: object | null - Optional prompt overrides (same structure as Create Graph).
*   `folder_name`: string | null - Optional folder scope.
*   `end_user_id`: string | null - Optional end-user scope.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The updated knowledge graph object (structure matches Create Graph response).
    ```json
    {
      "id": "<string>",
      "name": "<string>",
      // ... other graph fields reflecting updates
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the graph `name` or request body parameters.

---

## Cache

Endpoints for managing and querying specialized caches (likely for faster LLM responses based on pre-processed data).

### Create Cache

`POST /cache/create`

Creates a new cache based on specified documents or filters, using a specific model.

**Headers:**
*   `Authorization`: string

**Query Parameters:**
*   `name`: string (required) - Name for the new cache.
*   `model`: string (required) - The model identifier to use for the cache.
*   `gguf_file`: string (required) - Path or identifier for the GGUF model file.

**Request Body (`application/json`):**
*   `filters`: object | null - Optional metadata filters to select documents for the cache.
*   `docs`: string[] | null - Optional list of specific document IDs to include.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object confirming cache creation (specific structure not detailed).
    ```json
    {}
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with query parameters or request body.

---

### Get Cache

`GET /cache/{name}`

Retrieves information about a specific cache by name.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `name`: string (required) - The name of the cache to retrieve.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object containing details about the cache (specific structure not detailed).
    ```json
    {}
    ```

**Response (422 Unprocessable Entity):**
*   Indicates the cache `name` is invalid or not found.

---

### Update Cache

`POST /cache/{name}/update`

Updates an existing cache, potentially reprocessing or adding data.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `name`: string (required) - The name of the cache to update.

**Request Body:** (Not specified, likely empty or contains update parameters)

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object confirming the update status (e.g., `{"update_initiated": true}`).
    ```json
    {
      "<key>": true // Example, actual key/value might differ
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the cache `name` or update process.

---

### Add Docs To Cache

`POST /cache/{name}/add_docs`

Adds specific documents to an existing cache.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `name`: string (required) - The name of the cache to add documents to.

**Request Body (`application/json`):**
*   string[] - An array of document IDs to add to the cache.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object confirming the addition status (e.g., `{"documents_added": true}`).
    ```json
    {
      "<key>": true // Example, actual key/value might differ
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the cache `name` or the provided document IDs.

---

### Query Cache

`POST /cache/{name}/query`

Performs a query against a specific cache for a fast completion.

**Headers:**
*   `Authorization`: string

**Path Parameters:**
*   `name`: string (required) - The name of the cache to query.

**Query Parameters:**
*   `query`: string (required) - The query string.
*   `max_tokens`: integer | null - Optional limit on the number of tokens in the response.
*   `temperature`: number | null - Optional parameter controlling response randomness.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The completion response from the cache.
    ```json
    {
      "completion": "<string>" | object, // Can be string or structured object
      "usage": { "<key>": integer }, // Token usage info
      "finish_reason": "<string>" | null, // Reason generation stopped
      "sources": [ // Information about source chunks used
        {
          "document_id": "<string>",
          "chunk_number": integer,
          "score": number | null
        }
      ],
      "metadata": {} | null // Additional metadata about the response
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the cache `name` or query parameters.

---

## Retrieval

Endpoints for searching and retrieving relevant documents or chunks based on a query.

### Retrieve Documents

`POST /retrieve/docs`

Retrieves documents relevant to a given query, optionally enhanced by a knowledge graph.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   `query`: string (required, min length: 1) - The search query.
*   `filters`: object | null - Optional metadata filters to apply to the search.
*   `k`: integer (default: 4, range: > 0) - The number of documents to retrieve.
*   `min_score`: number (default: 0) - Minimum relevance score threshold.
*   `use_reranking`: boolean | null - Whether to apply a reranking step.
*   `use_colpali`: boolean | null - Optional flag for specific processing.
*   `graph_name`: string | null - Name of a graph to use for knowledge graph-enhanced retrieval.
*   `hop_depth`: integer | null (default: 1, range: 1-3) - Number of relationship hops to traverse in the graph if `graph_name` is provided.
*   `include_paths`: boolean | null (default: false) - Whether to include relationship paths in the response if using graph retrieval.
*   `folder_name`: string | null - Optional folder scope for the retrieval.
*   `end_user_id`: string | null - Optional end-user scope.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of retrieved document objects with scores.
    ```json
    [
      {
        "score": 123.45,
        "document_id": "<string>",
        "metadata": {},
        "content": { // Represents how to access the content
          "type": "url" | "string", // 'url' or 'string'
          "value": "<string>", // URL or actual content snippet
          "filename": "<string>" | null // Filename if type is 'url'
        },
        "additional_metadata": {} // May include graph path info if requested
      }
      // ... more documents
    ]
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body parameters.

---

### Retrieve Chunks

`POST /retrieve/chunks`

Retrieves document chunks relevant to a given query, optionally enhanced by a knowledge graph.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   (Same parameters as Retrieve Documents: `query`, `filters`, `k`, `min_score`, `use_reranking`, `use_colpali`, `graph_name`, `hop_depth`, `include_paths`, `folder_name`, `end_user_id`)

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of retrieved chunk objects with scores.
    ```json
    [
      {
        "content": "<string>", // The actual chunk content
        "score": 123.45,
        "document_id": "<string>",
        "chunk_number": 123,
        "metadata": {},
        "content_type": "<string>",
        "filename": "<string>",
        "download_url": "<string>" // URL to download original source if available
        // May include additional graph path info if requested
      }
      // ... more chunks
    ]
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body parameters.

---

## Query

Endpoints for generating completions (answers) based on queries and retrieved context.

### Query Completion

`POST /query`

Generates a completion (answer) based on a query, using retrieved context from documents/chunks, potentially enhanced by a knowledge graph.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   **Retrieval Parameters:** (Same as Retrieve Documents/Chunks: `query`, `filters`, `k`, `min_score`, `use_reranking`, `use_colpali`, `graph_name`, `hop_depth`, `include_paths`, `folder_name`, `end_user_id`)
*   **Completion Parameters:**
    *   `max_tokens`: integer | null - Max tokens for the generated completion.
    *   `temperature`: number | null - Controls randomness of the completion.
    *   `prompt_overrides`: object | null - Optional overrides for prompts (includes `entity_extraction`, `entity_resolution` like Create Graph, plus `query`).
        *   `query`: object | null - Overrides for the final query/answer generation prompt.
            *   `prompt_template`: string | null - Custom template (must include `{question}` and `{context}`).
    *   `schema`: any | null | object | null - Optional schema (Pydantic model or JSON schema dict) for structured output. If provided, `completion` in the response will be an object matching the schema.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** The generated completion and source information.
    ```json
    {
      "completion": "<string>" | object, // String or structured object if schema provided
      "usage": { // Token usage details
        "<key>": integer
      },
      "finish_reason": "<string>" | null, // e.g., 'stop', 'length'
      "sources": [ // Chunks used as context
        {
          "document_id": "<string>",
          "chunk_number": integer,
          "score": number | null // Retrieval score
        }
      ],
      "metadata": {} | null // Additional response metadata
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body parameters.

---

## Usage

Endpoints for retrieving API usage statistics.

### Get Usage Stats

`GET /usage/stats`

Retrieves overall usage statistics (e.g., token counts).

**Headers:**
*   `Authorization`: string

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object containing usage statistics (key-value pairs, e.g., `{"total_tokens": 150000}`).
    ```json
    {
      "<stat_name>": integer
      // ... more stats
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates potential issues retrieving stats.

---

### Get Recent Usage

`GET /usage/recent`

Retrieves a list of recent API operations, potentially filtered.

**Headers:**
*   `Authorization`: string

**Query Parameters:**
*   `operation_type`: string | null - Filter by operation type (e.g., 'ingest', 'query').
*   `since`: string | null - Filter operations since a specific timestamp (ISO 8601 format).
*   `status`: string | null - Filter by operation status (e.g., 'success', 'failure').

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An array of objects, each representing a recent operation (specific structure not detailed).
    ```json
    [
      {
        // Details of a recent operation
      }
      // ... more operations
    ]
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with query parameters or retrieving the usage list.

---

## URI Generation

Endpoints for generating temporary access URIs or tokens.

### Generate Local Uri

`POST /local/generate_uri`

Generates a URI or token for local development or specific local access scenarios. (Authorization likely handled differently, perhaps via local setup).

**Request Body (`application/x-www-form-urlencoded`):**
*   `name`: string (default: `admin`) - Identifier for the token holder.
*   `expiry_days`: integer (default: 30) - Number of days until the token expires.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object containing the generated token or URI.
    ```json
    {
      "<key>": "<generated_uri_or_token>" // Actual key name might vary
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body parameters.

---

### Generate Cloud Uri

`POST /cloud/generate_uri`

Generates a URI or token specifically for cloud application access.

**Headers:**
*   `Authorization`: string

**Request Body (`application/json`):**
*   `app_id`: string (required) - ID of the application requesting the token.
*   `name`: string (required) - Name associated with the token request (e.g., application name).
*   `user_id`: string (required) - ID of the user associated with the request.
*   `expiry_days`: integer (default: 30) - Number of days until the token expires.

**Response (200 OK):**
*   **Content-Type:** `application/json`
*   **Body:** An object containing the generated token or URI.
    ```json
    {
      "<key>": "<generated_uri_or_token>" // Actual key name might vary
    }
    ```

**Response (422 Unprocessable Entity):**
*   Indicates issues with the request body parameters.

---
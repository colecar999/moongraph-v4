# Tools (TOOLS.md)

The `core.tools` package provides a collection of utilities and functions that the Morphik agent can use to interact with various parts of the system, perform analysis, and manage data. These tools are designed to be called by the agent in response to user queries or tasks.

## Files

-   `agent_roadmap.json`: A JSON file likely outlining future development or capabilities planned for the agent's tools.
-   `analysis_tools.py`: Contains tools for document analysis and code execution.
-   `descriptions.json`: A JSON file providing descriptions and input schemas for the available tools, used by the agent for function calling.
-   `document_tools.py`: Contains tools for retrieving and managing documents and their chunks.
-   `graph_tools.py`: Contains tools for querying and managing knowledge graphs.
-   `tools.py`: Serves as the main exporter for the tools, making them available for the agent.

## Key Components

### `tools.py`

This file acts as an aggregator and exporter for all tool functions defined in other modules within the `core.tools` package. It makes functions like `retrieve_chunks`, `document_analyzer`, `execute_code`, `knowledge_graph_query`, etc., available for the agent to use.

### `analysis_tools.py`

This module provides tools for in-depth analysis of documents and for executing Python code in a sandboxed environment.

-   **`ToolError(Exception)`**: Custom exception class for errors that occur during the execution of analysis tools.
-   **Pydantic Models for Structured Output**:
    -   `Entity(BaseModel)`: Defines the structure for an extracted entity (name, description, type, metadata).
    -   `Entities(BaseModel)`: A list of `Entity` objects.
    -   `Fact(BaseModel)`: Defines the structure for an extracted fact (proof, fact).
    -   `Facts(BaseModel)`: A list of `Fact` objects.
    -   `Sentiment(BaseModel)`: Defines the structure for sentiment analysis results (highlights, reasoning, sentiment, score).
    -   `DocumentAnalysisResult(BaseModel)`: A comprehensive model to hold results from various analyses (entities, summary, facts, sentiment).
-   **Analysis Functions**:
    -   `async def extract_entities(text: str, model: str) -> Entities`: Extracts entities from the given text using a specified model via `instructor` and `litellm`.
    -   `async def summarize_document(text: str, model: str) -> str`: Summarizes the provided text using a specified model via `litellm`.
    -   `async def extract_facts(text: str, model: str) -> Facts`: Extracts facts from the text using a specified model via `instructor` and `litellm`.
    -   `async def analyze_sentiment(text: str, model: str) -> Sentiment`: Analyzes the sentiment of the text using a specified model via `instructor` and `litellm`.
-   **`async def document_analyzer(...) -> str`**:
    -   Retrieves a document's content using `retrieve_document`.
    -   Performs various types of analysis (`entity_extraction`, `summarization`, `fact_extraction`, `sentiment`, or `full`) on the document content.
    -   Uses the helper analysis functions (`extract_entities`, `summarize_document`, etc.).
    -   Returns the analysis results as a JSON string.
    -   Requires a `DocumentService` instance and `AuthContext`.
-   **`async def execute_code(code: str, timeout: int = 30) -> Dict[str, Any]`**:
    -   Executes Python code snippets in a sandboxed environment.
    -   Restricts imports and dangerous operations for security.
    -   Supports common data science libraries (numpy, pandas, matplotlib, etc.).
    -   Returns a dictionary containing the execution status, output (stdout/stderr), execution time, and any generated visualizations (as base64 images).
    -   Uses `asyncio.create_subprocess_exec` for running the code.

### `document_tools.py`

This module provides tools for interacting with documents and their chunks.

-   **`ToolError(Exception)`**: Custom exception class for errors specific to document tools.
-   **`async def retrieve_chunks(...) -> List[Dict[str, Any]]`**:
    -   Retrieves relevant text and image chunks from the knowledge base based on a query.
    -   Uses the `DocumentService` to perform the retrieval.
    -   Supports filtering, setting the number of chunks (`k`), minimum relevance score, and scoping by `folder_name` or `end_user_id`.
    -   Can leverage `use_colpali` for multimodal features.
    -   Formats results for LiteLLM tool response, including a header and text/image_url content items.
    -   Requires `DocumentService` and `AuthContext`.
-   **`async def retrieve_document(...) -> str`**:
    -   Retrieves the full content or metadata of a specific document by its ID.
    -   Uses the `DocumentService` for retrieval.
    -   The `format` parameter can be "text" (default) or "metadata".
    -   If "metadata" is requested, it returns a JSON string of user-defined and system metadata (excluding raw content).
    -   Requires `DocumentService` and `AuthContext`.
-   **`async def save_to_memory(...) -> str`**:
    -   Saves content to persistent memory by ingesting it as a new document.
    -   Uses the `DocumentService.ingest_text` method.
    -   `memory_type` can be "session", "long_term", or "research_thread".
    -   Supports `tags` and scoping by `end_user_id`.
    -   Returns a JSON string indicating success and the `memory_id` (which is the `external_id` of the ingested document).
    -   Requires `DocumentService` and `AuthContext`.
-   **`async def list_documents(...) -> str`**:
    -   Lists accessible documents, returning their IDs and filenames.
    -   Uses `DocumentService.db.get_documents`.
    -   Supports `filters`, pagination (`skip`, `limit`), and scoping by `folder_name` or `end_user_id`.
    -   Returns a JSON string containing the count and list of documents.
    -   Requires `DocumentService` and `AuthContext`.
-   **`async def get_timestamp() -> str`**:
    -   A utility function that returns the current UTC timestamp in an ISO format suitable for filenames (replaces colons and periods with hyphens).

### `graph_tools.py`

This module provides tools for interacting with knowledge graphs.

-   **`ToolError(Exception)`**: Custom exception class for errors specific to graph tools.
-   **`async def knowledge_graph_query(...) -> str`**:
    -   Queries a knowledge graph for entities, relationships, or paths.
    -   Requires `DocumentService` (to access `GraphService`) and `AuthContext`.
    -   `query_type` can be:
        -   `list_entities`: Finds entities semantically similar to a search term in `start_nodes`.
        -   `entity`: Retrieves details for a specific entity ID or label in `start_nodes`.
        -   `path`: Discovers paths between two entity IDs/labels in `start_nodes`.
        -   `subgraph`: Extracts a network around a central entity ID/label in `start_nodes`.
    -   Uses `GraphService._find_similar_entities` for `list_entities`.
    -   Uses `GraphService._find_relationship_paths` for `path`.
    -   Uses `GraphService._expand_entities` for `subgraph`.
    -   If `graph_name` is not provided, it attempts to use a default graph ("graph_main") or the user's only available graph.
    -   Supports scoping by `end_user_id`.
    -   Returns query results as a JSON string.
-   **`async def list_graphs(...) -> str`**:
    -   Lists all knowledge graphs accessible to the user.
    -   Requires `DocumentService` (to access `GraphService`) and `AuthContext`.
    -   Supports scoping by `end_user_id`.
    -   Returns a JSON string containing a message and a list of graphs with their metadata (name, counts, timestamps).

### Configuration Files

-   **`descriptions.json`**:
    -   This file contains a list of JSON objects, each describing a tool available to the agent.
    -   Each object includes:
        -   `name`: The function name of the tool.
        -   `description`: A natural language description of what the tool does, its capabilities, and when to use it.
        -   `input_schema`: A JSON schema defining the expected input parameters for the tool, including their types, descriptions, and default values. This schema is crucial for LiteLLM's function calling mechanism.
    -   Tools described include: `retrieve_chunks`, `retrieve_document`, `document_analyzer`, `execute_code`, `knowledge_graph_query`, `save_to_memory`, `list_graphs`, and `list_documents`.
-   **`agent_roadmap.json`**:
    -   This file outlines tools that are planned for future development. The structure is similar to `descriptions.json`.
    -   Planned tools include:
        -   `query_database`: For executing queries against structured data sources (SQL, SPARQL, Cypher, etc.).
        -   `table_analyzer`: For extracting, processing, and analyzing tabular data.
        -   `multi_document_synthesizer`: For synthesizing information across multiple documents.
        -   `research_planner`: For breaking complex questions into sub-questions and planning research.
        -   `image_analyzer`: For extracting information from images, charts, and diagrams (OCR, chart extraction, object detection, diagram parsing).
        -   `generate_visualization`: For creating visual representations of data.
        -   `search_refinement`: For iteratively improving search queries based on results and feedback.
        -   `version_compare`: For comparing different versions of documents or data.
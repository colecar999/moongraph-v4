# query

The `query` method generates a completion using relevant document chunks as context. Supports advanced options like ColPali, knowledge graph traversal, custom prompt overrides, and structured output.

---

## Function Signature

### Synchronous
```python
def query(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    k: int = 4,
    min_score: float = 0.0,
    max_tokens: Optional[int] = None,
    temperature: Optional[float] = None,
    use_colpali: bool = True,
    graph_name: Optional[str] = None,
    hop_depth: int = 1,
    include_paths: bool = False,
    prompt_overrides: Optional[Union[QueryPromptOverrides, Dict[str, Any]]] = None,
    schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
) -> CompletionResponse
```

### Asynchronous
```python
async def query(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    k: int = 4,
    min_score: float = 0.0,
    max_tokens: Optional[int] = None,
    temperature: Optional[float] = None,
    use_colpali: bool = True,
    graph_name: Optional[str] = None,
    hop_depth: int = 1,
    include_paths: bool = False,
    prompt_overrides: Optional[Union[QueryPromptOverrides, Dict[str, Any]]] = None,
    schema: Optional[Union[Type[BaseModel], Dict[str, Any]]] = None,
) -> CompletionResponse
```

---

## Parameters
- `query` (str): Query text
- `filters` (Dict[str, Any], optional): Optional metadata filters
- `k` (int, optional): Number of chunks to use as context. Defaults to 4.
- `min_score` (float, optional): Minimum similarity threshold. Defaults to 0.0.
- `max_tokens` (int, optional): Maximum tokens in completion
- `temperature` (float, optional): Model temperature
- `use_colpali` (bool, optional): Whether to use ColPali-style embedding model (only works for documents ingested with `use_colpali=True`). Defaults to True.
- `graph_name` (str, optional): Name of the knowledge graph to use for enhanced retrieval
- `hop_depth` (int, optional): Number of relationship hops to traverse in the graph (1-3). Defaults to 1.
- `include_paths` (bool, optional): Whether to include relationship paths in the response. Defaults to False.
- `prompt_overrides` (QueryPromptOverrides | Dict[str, Any], optional): Customizations for entity extraction, resolution, and query prompts
- `schema` (Type[BaseModel] | Dict[str, Any], optional): Schema for structured output (Pydantic model or JSON schema dict)

---

## Returns
- `CompletionResponse`: Response containing the completion, source information, and potentially structured output.

---

## CompletionResponse Properties
- `completion` (str | Dict[str, Any] | None): The generated completion text or the structured output dictionary.
- `usage` (Dict[str, int]): Token usage information
- `sources` (List[ChunkSource]): Sources of chunks used in the completion
- `metadata` (Dict[str, Any], optional): Additional metadata (e.g., graph traversal info)
- `finish_reason` (Optional[str]): Reason the generation finished (e.g., 'stop', 'length')

### ChunkSource Properties
- `document_id` (str): ID of the source document
- `chunk_number` (int): Chunk number within the document
- `score` (Optional[float]): Relevance score (if available)

---

## Examples

### Standard Query
#### Synchronous
```python
from morphik import Morphik

db = Morphik()

response = db.query(
    "What are the key findings about customer satisfaction?",
    filters={"department": "research"},
    temperature=0.7
)

print(response.completion)
for source in response.sources:
    print(f"Document ID: {source.document_id}, Chunk: {source.chunk_number}, Score: {source.score}")
```

#### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    response = await db.query(
        "What are the key findings about customer satisfaction?",
        filters={"department": "research"},
        temperature=0.7
    )
    print(response.completion)
    for source in response.sources:
        print(f"Document ID: {source.document_id}, Chunk: {source.chunk_number}, Score: {source.score}")
```

### Knowledge Graph Enhanced Query
#### Synchronous
```python
from morphik import Morphik

db = Morphik()

response = db.query(
    "How does product X relate to customer segment Y?",
    graph_name="market_graph",
    hop_depth=2,
    include_paths=True
)

print(response.completion)
if response.metadata and "graph" in response.metadata:
    for path in response.metadata["graph"]["paths"]:
        print(" -> ".join(path))
```

#### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    kg_response = await db.query(
        "How does product X relate to customer segment Y?",
        graph_name="market_graph",
        hop_depth=2,
        include_paths=True
    )
    print(kg_response.completion)
    if kg_response.metadata and "graph" in kg_response.metadata:
        for path in kg_response.metadata["graph"]["paths"]:
            print(" -> ".join(path))
```

### With Custom Prompt Overrides
#### Synchronous
```python
from morphik import Morphik
from morphik.models import QueryPromptOverride, QueryPromptOverrides

db = Morphik()

response = db.query(
    "What are the key findings?",
    filters={"category": "research"},
    prompt_overrides=QueryPromptOverrides(
        query=QueryPromptOverride(
            prompt_template="Answer the question in a formal, academic tone: {question}\n\nContext:\n{context}\n\nAnswer:"
        )
    )
)

# Alternatively, using a dictionary
response = db.query(
    "What are the key findings?",
    filters={"category": "research"},
    prompt_overrides={
        "query": {
            "prompt_template": "Answer the question in a formal, academic tone: {question}\n\nContext:\n{context}\n\nAnswer:"
        }
    }
)

print(response.completion)
```

#### Asynchronous
```python
from morphik import AsyncMorphik
from morphik.models import QueryPromptOverride, EntityExtractionPromptOverride, QueryPromptOverrides

async with AsyncMorphik() as db:
    response = await db.query(
        "How does the medication affect diabetes?",
        graph_name="medical_graph",
        prompt_overrides=QueryPromptOverrides(
            query=QueryPromptOverride(
                prompt_template="Provide a concise, medically accurate answer: {question}\n\nContext:\n{context}\n\nAnswer:"
            ),
            entity_extraction=EntityExtractionPromptOverride(
                examples=[
                    {"label": "Insulin", "type": "MEDICATION"},
                    {"label": "Diabetes", "type": "CONDITION"}
                ]
            )
        )
    )
    print(response.completion)
```

### Using Structured Output
#### Synchronous
```python
from morphik import Morphik
from pydantic import BaseModel
from typing import List

class ResearchFindings(BaseModel):
    main_finding: str
    supporting_evidence: List[str]
    limitations: List[str]

db = Morphik()

response = db.query(
    "Summarize the key research findings from these documents",
    filters={"department": "research"},
    schema=ResearchFindings
)

if isinstance(response.completion, dict):
    try:
        findings = ResearchFindings(**response.completion)
        print(f"Main finding: {findings.main_finding}")
        print("Supporting evidence:")
        for evidence in findings.supporting_evidence:
            print(f"- {evidence}")
        print("Limitations:")
        for limitation in findings.limitations:
            print(f"- {limitation}")
    except Exception as e:
        print(f"Error parsing structured output: {e}")
        print(response.completion)
elif isinstance(response.completion, str):
    print(response.completion)
```

#### Asynchronous
```python
from morphik import AsyncMorphik
from pydantic import BaseModel
from typing import List

class ResearchFindings(BaseModel):
    main_finding: str
    supporting_evidence: List[str]
    limitations: List[str]

async with AsyncMorphik() as db:
    response = await db.query(
        "Summarize the key research findings from these documents",
        filters={"department": "research"},
        schema=ResearchFindings
    )
    if isinstance(response.completion, dict):
        try:
            findings = ResearchFindings(**response.completion)
            print(f"Main finding: {findings.main_finding}")
            print("Supporting evidence:")
            for evidence in findings.supporting_evidence:
                print(f"- {evidence}")
            print("Limitations:")
            for limitation in findings.limitations:
                print(f"- {limitation}")
        except Exception as e:
            print(f"Error parsing structured output: {e}")
            print(response.completion)
    elif isinstance(response.completion, str):
        print(response.completion)
```

---

*Source: [Morphik Python SDK - query](https://docs.morphik.ai/python-sdk/query)* 
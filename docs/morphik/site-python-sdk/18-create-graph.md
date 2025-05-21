# create_graph

The `create_graph` method creates a knowledge graph from documents, supporting filters, specific document selection, and prompt overrides for entity extraction and resolution.

---

## Function Signature

### Synchronous
```python
def create_graph(
    name: str,
    filters: Optional[Dict[str, Any]] = None,
    documents: Optional[List[str]] = None,
    prompt_overrides: Optional[Union[GraphPromptOverrides, Dict[str, Any]]] = None,
) -> Graph
```

### Asynchronous
```python
async def create_graph(
    name: str,
    filters: Optional[Dict[str, Any]] = None,
    documents: Optional[List[str]] = None,
    prompt_overrides: Optional[Union[GraphPromptOverrides, Dict[str, Any]]] = None,
) -> Graph
```

---

## Parameters
- `name` (str): Name of the graph to create
- `filters` (Dict[str, Any], optional): Optional metadata filters to determine which documents to include
- `documents` (List[str], optional): Optional list of specific document IDs to include
- `prompt_overrides` (GraphPromptOverrides | Dict[str, Any], optional): Optional customizations for entity extraction and resolution prompts

---

## Returns
- `graph` (Graph): The created graph object containing entities and relationships

---

## Graph Properties
The returned `Graph` object has the following properties:
- `id` (str): Unique graph identifier
- `name` (str): Graph name
- `entities` (List[Entity]): List of entities in the graph
- `relationships` (List[Relationship]): List of relationships in the graph
- `metadata` (Dict[str, Any]): Graph metadata
- `document_ids` (List[str]): Source document IDs
- `filters` (Dict[str, Any], optional): Document filters used to create the graph
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp
- `owner` (Dict[str, str]): Graph owner information
- `access_control` (Dict[str, List[str]]): Access control information

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Create a graph from documents with category="research"
graph = db.create_graph(
    name="research_graph",
    filters={"category": "research"}
)

# Create a graph from specific documents
graph = db.create_graph(
    name="custom_graph",
    documents=["doc1", "doc2", "doc3"]
)

# With custom entity extraction examples
from morphik.models import EntityExtractionPromptOverride, EntityExtractionExample, GraphPromptOverrides

graph = db.create_graph(
    name="medical_graph",
    filters={"category": "medical"},
    prompt_overrides=GraphPromptOverrides(
        entity_extraction=EntityExtractionPromptOverride(
            examples=[
                EntityExtractionExample(label="Insulin", type="MEDICATION"),
                EntityExtractionExample(label="Diabetes", type="CONDITION")
            ]
        )
    )
)

# Example with custom entity extraction prompt template and examples
graph = db.create_graph(
    name="financial_graph",
    documents=["doc1", "doc2"],
    prompt_overrides=GraphPromptOverrides(
        entity_extraction=EntityExtractionPromptOverride(
            prompt_template="Extract financial entities from the following text:\n\n{content}\n\nFocus on these types of entities:\n{examples}\n\nReturn in JSON format.",
            examples=[
                EntityExtractionExample(label="Apple Inc.", type="COMPANY", properties={"sector": "Technology"}),
                EntityExtractionExample(label="Q3 2024", type="TIME_PERIOD"),
                EntityExtractionExample(label="Revenue Growth", type="METRIC")
            ]
        ),
        entity_resolution=EntityResolutionPromptOverride(
            examples=[
                EntityResolutionExample(
                    canonical="Apple Inc.",
                    variants=["Apple", "AAPL", "Apple Computer"]
                )
            ]
        )
    )
)

print(f"Created graph with {len(graph.entities)} entities and {len(graph.relationships)} relationships")
```

### Asynchronous
```python
from morphik import AsyncMorphik
from morphik.models import EntityExtractionPromptOverride, EntityExtractionExample, GraphPromptOverrides, EntityResolutionPromptOverride, EntityResolutionExample

async with AsyncMorphik() as db:
    # Create a graph from documents with category="research"
    graph = await db.create_graph(
        name="research_graph",
        filters={"category": "research"}
    )

    # Create a graph from specific documents
    graph = await db.create_graph(
        name="custom_graph",
        documents=["doc1", "doc2", "doc3"]
    )

    # With custom entity extraction examples
    graph = await db.create_graph(
        name="medical_graph",
        filters={"category": "medical"},
        prompt_overrides=GraphPromptOverrides(
            entity_extraction=EntityExtractionPromptOverride(
                examples=[
                    EntityExtractionExample(label="Insulin", type="MEDICATION"),
                    EntityExtractionExample(label="Diabetes", type="CONDITION")
                ]
            )
        )
    )

    # Example with custom entity extraction prompt template and examples
    graph = await db.create_graph(
        name="financial_graph",
        documents=["doc1", "doc2"],
        prompt_overrides=GraphPromptOverrides(
            entity_extraction=EntityExtractionPromptOverride(
                prompt_template="Extract financial entities from the following text:\n\n{content}\n\nFocus on these types of entities:\n{examples}\n\nReturn in JSON format.",
                examples=[
                    EntityExtractionExample(label="Apple Inc.", type="COMPANY", properties={"sector": "Technology"}),
                    EntityExtractionExample(label="Q3 2024", type="TIME_PERIOD"),
                    EntityExtractionExample(label="Revenue Growth", type="METRIC")
                ]
            ),
            entity_resolution=EntityResolutionPromptOverride(
                examples=[
                    EntityResolutionExample(
                        canonical="Apple Inc.",
                        variants=["Apple", "AAPL", "Apple Computer"]
                    )
                ]
            )
        )
    )

    print(f"Created graph with {len(graph.entities)} entities and {len(graph.relationships)} relationships")
```

---

*Source: [Morphik Python SDK - create_graph](https://docs.morphik.ai/python-sdk/create_graph)* 
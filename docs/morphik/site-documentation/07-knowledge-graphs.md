# Knowledge Graphs and Graph RAG in Morphik

Leverage graph-based relationships for improved context and retrieval in RAG systems. This guide covers the motivation, core concepts, technical implementation, and usage of knowledge graphs in Morphik.

---

## Introduction

Traditional Retrieval-Augmented Generation (RAG) systems use vector-based similarity search, which works well for simple queries but struggles with nuanced information needs involving connections across multiple documents. Knowledge graphs explicitly capture entities and their relationships, enabling richer, more context-aware retrieval.

---

## Core Concepts

### What is a Knowledge Graph?
A knowledge graph is a structured representation of information consisting of:
- **Entities**: Distinct objects, concepts, or things (e.g., people, organizations, products)
- **Relationships**: Connections between entities
- **Properties**: (Optional) Additional attributes describing entities or relationships

---

## Implementation in Morphik

### Entity and Relationship Extraction
Morphik processes documents to extract entities and relationships using LLMs. For each chunk of a document, entities and relationships are identified:

```python
async def extract_entities_from_text(self, content: str, doc_id: str, chunk_number: int) -> Tuple[List[Entity], List[Relationship]]:
    """Extract entities and relationships from text content using the LLM."""
    # Returns structured data with entities and relationships
```

Entities can include people, organizations, locations, technologies, concepts, products, events, and more.

### Entity Resolution
Morphik uses LLMs to resolve different references to the same entity, ensuring the graph accurately represents unique entities:

```python
async def resolve_entities(self, entities: List[Entity]) -> Tuple[List[Entity], Dict[str, str]]:
    """Resolves entities by identifying and grouping similar entities."""
    # Merge properties of duplicate entities
```

### Custom Prompts and Examples
You can provide custom prompts and examples to guide entity extraction and resolution, making the process domain-specific:

```python
from morphik import Morphik
from morphik.models import (
    EntityExtractionExample, 
    EntityResolutionExample,
    EntityExtractionPromptOverride, 
    EntityResolutionPromptOverride,
    GraphPromptOverrides
)

db = Morphik()

graph = db.create_graph(
    name="medical_knowledge_graph",
    filters={"domain": "medical"},
    prompt_overrides=GraphPromptOverrides(
        entity_extraction=EntityExtractionPromptOverride(
            examples=[
                EntityExtractionExample(label="Type 2 Diabetes", type="CONDITION"),
                EntityExtractionExample(label="Metformin", type="MEDICATION", properties={"class": "biguanide"}),
                EntityExtractionExample(label="Cardiovascular Disease", type="CONDITION")
            ],
            prompt_template=(
                "Extract medical entities and relationships from the following text.\n"
                "Focus on conditions, medications, treatments, and healthcare providers.\n"
                "{examples}\n\n"
                "Text to analyze:\n{content}\n\n"
                "Return your analysis as JSON with 'entities' and 'relationships' arrays."
            )
        ),
        entity_resolution=EntityResolutionPromptOverride(
            examples=[
                EntityResolutionExample(canonical="Type 2 Diabetes", variants=["T2DM", "type 2 diabetes", "Type II Diabetes"]),
                EntityResolutionExample(canonical="Metformin", variants=["Glucophage", "metformin hydrochloride"])
            ]
        )
    )
)
```

---

## Graph Construction and Storage

Entities and relationships are stored in a graph structure:

```python
class Entity(BaseModel):
    id: str
    label: str
    type: str
    properties: Dict[str, Any]
    document_ids: List[str]
    chunk_sources: Dict[str, List[int]]

class Relationship(BaseModel):
    id: str
    source_id: str
    target_id: str
    type: str
    document_ids: List[str]
    chunk_sources: Dict[str, List[int]]

class Graph(BaseModel):
    id: str
    name: str
    entities: List[Entity]
    relationships: List[Relationship]
    metadata: Dict[str, Any]
    document_ids: List[str]
    filters: Optional[Dict[str, Any]]
```

---

## Graph-Enhanced Retrieval

When querying with a knowledge graph, Morphik enhances retrieval by traversing entity relationships, providing richer, more contextually relevant answers.

---

## Using Knowledge Graphs in Morphik

### Creating a Knowledge Graph

```python
# Create from filters
graph = db.create_graph(
    name="tech_knowledge_graph",
    filters={"category": "tech"}
)

# Or from specific documents
graph = db.create_graph(
    name="project_knowledge_graph",
    documents=["doc_id_1", "doc_id_2", "doc_id_3"]
)
```

### Querying with a Knowledge Graph

```python
# Basic query
response = db.query(
    "How is AI technology being used in healthcare?",
    graph_name="tech_knowledge_graph"
)

# Advanced query with hop depth and path info
response_with_paths = db.query(
    "What technologies are used for analyzing electronic health records?",
    graph_name="tech_knowledge_graph",
    hop_depth=2,
    include_paths=True
)

# Display relationship paths
if response_with_paths.metadata and "graph" in response_with_paths.metadata:
    print("\nGraph paths found:")
    for path in response_with_paths.metadata["graph"]["paths"]:
        print(" -> ".join(path))
```

The `hop_depth` parameter controls how far to traverse the graph. `include_paths=True` provides explainability by showing the relationship paths used.

---

## Example: Building a Healthcare Knowledge Graph

```python
import os
from morphik import Morphik

db = Morphik()

doc1 = db.ingest_file("medical_research.pdf", metadata={"domain": "healthcare", "type": "research"})
doc2 = db.ingest_file("patient_data.pdf", metadata={"domain": "healthcare", "type": "clinical"})
doc3 = db.ingest_file("treatment_protocols.pdf", metadata={"domain": "healthcare", "type": "protocol"})

graph = db.create_graph(
    name="healthcare_knowledge_graph",
    filters={"domain": "healthcare"}
)

print(f"Created graph with {len(graph.entities)} entities and {len(graph.relationships)} relationships")

response = db.query(
    "What treatments are effective for patients with diabetes and hypertension?",
    graph_name="healthcare_knowledge_graph",
    hop_depth=2,
    include_paths=True
)

print("\nResponse:")
print(response.completion)

if response.metadata and "graph" in response.metadata:
    print("\nEvidence paths:")
    for path in response.metadata["graph"]["paths"]:
        print(" -> ".join(path))
```

---

## Graph Visualization and Updates

You can update existing graphs as your document collection grows:

```python
# Add new documents
db.update_graph(
    name="tech_knowledge_graph",
    additional_documents=["new_doc_id_1", "new_doc_id_2"]
)

# Or add documents matching new filters
db.update_graph(
    name="tech_knowledge_graph",
    additional_filters={"source": "research_papers"}
)
```

---

## Implementation Details

### Graph Traversal Algorithm

```python
def _expand_entities(self, graph: Graph, seed_entities: List[Entity], hop_depth: int) -> List[Entity]:
    if hop_depth <= 1:
        return seed_entities
    seen_entity_ids = {entity.id for entity in seed_entities}
    all_entities = list(seed_entities)
    entity_map = {entity.id: entity for entity in graph.entities}
    relationship_index = self._build_relationship_index(graph.relationships)
    for _ in range(hop_depth - 1):
        new_entities = []
        for entity in all_entities:
            connected_ids = self._get_connected_entity_ids(
                relationship_index.get(entity.id, []), entity.id, seen_entity_ids
            )
            for entity_id in connected_ids:
                if target_entity := entity_map.get(entity_id):
                    new_entities.append(target_entity)
                    seen_entity_ids.add(entity_id)
        all_entities.extend(new_entities)
        if not new_entities:
            break
    return all_entities
```

### Entity Resolution

```python
async def _resolve_with_llm(self, entity_labels: List[str]) -> List[Dict[str, Any]]:
    # Group similar entity labels using a language model
    # Example output:
    # [
    #   {"canonical": "OpenAI", "variants": ["OpenAI Inc.", "OpenAI Corporation"]},
    #   {"canonical": "GPT-4", "variants": ["GPT4", "GPT 4", "OpenAI GPT-4"]}
    # ]
```

---

## Performance Considerations

- **Graph Creation Time**: Processing all documents with LLMs can be time-consuming for large collections.
- **Query Processing Overhead**: Graph-enhanced retrieval is more comprehensive but requires extra processing.
- **Graph Size**: More entities and relationships increase memory and traversal costs.

**Tips:**
- Use metadata filters to create focused graphs
- Start with smaller hop depths (1 or 2)
- Balance processing time and retrieval quality

---

## Conclusion

Knowledge graphs in Morphik enhance retrieval by capturing and leveraging relationships between entities. By combining vector search with graph-based retrieval, Morphik delivers more comprehensive and contextually relevant information for complex queries.

---

*Source: [Morphik Docs - Knowledge Graphs and Graph RAG](https://docs.morphik.ai/concepts/knowledge-graphs)* 
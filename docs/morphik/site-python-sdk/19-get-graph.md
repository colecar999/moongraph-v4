# get_graph

The `get_graph` method retrieves a knowledge graph by its name, including all entities and relationships.

---

## Function Signature

### Synchronous
```python
def get_graph(name: str) -> Graph
```

### Asynchronous
```python
async def get_graph(name: str) -> Graph
```

---

## Parameters
- `name` (str): Name of the graph to retrieve

---

## Returns
- `Graph`: The requested graph object

---

## Graph Properties
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

### Entity Properties
- `id` (str): Unique entity identifier
- `label` (str): Display label for the entity
- `type` (str): Entity type
- `properties` (Dict[str, Any]): Entity properties
- `document_ids` (List[str]): Source document IDs
- `chunk_sources` (Dict[str, List[int]]): Source chunk numbers by document ID

### Relationship Properties
- `id` (str): Unique relationship identifier
- `source_id` (str): Source entity ID
- `target_id` (str): Target entity ID
- `type` (str): Relationship type
- `document_ids` (List[str]): Source document IDs
- `chunk_sources` (Dict[str, List[int]]): Source chunk numbers by document ID

---

## Examples

### Synchronous
```python
from morphik import Morphik

db = Morphik()

# Get a graph by name
graph = db.get_graph("finance_graph")

print(f"Graph has {len(graph.entities)} entities and {len(graph.relationships)} relationships")

# Access entities and relationships
for entity in graph.entities:
    print(f"Entity: {entity.label} ({entity.type})")

for relationship in graph.relationships:
    source_entity = next((e for e in graph.entities if e.id == relationship.source_id), None)
    target_entity = next((e for e in graph.entities if e.id == relationship.target_id), None)
    if source_entity and target_entity:
        print(f"Relationship: {source_entity.label} --{relationship.type}--> {target_entity.label}")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # Get a graph by name
    graph = await db.get_graph("finance_graph")

    print(f"Graph has {len(graph.entities)} entities and {len(graph.relationships)} relationships")

    # Access entities and relationships
    for entity in graph.entities:
        print(f"Entity: {entity.label} ({entity.type})")

    for relationship in graph.relationships:
        source_entity = next((e for e in graph.entities if e.id == relationship.source_id), None)
        target_entity = next((e for e in graph.entities if e.id == relationship.target_id), None)
        if source_entity and target_entity:
            print(f"Relationship: {source_entity.label} --{relationship.type}--> {target_entity.label}")
```

---

*Source: [Morphik Python SDK - get_graph](https://docs.morphik.ai/python-sdk/get_graph)* 
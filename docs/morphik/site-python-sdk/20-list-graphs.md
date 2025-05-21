# list_graphs

The `list_graphs` method lists all accessible knowledge graphs, including their entities and relationships.

---

## Function Signature

### Synchronous
```python
def list_graphs() -> List[Graph]
```

### Asynchronous
```python
async def list_graphs() -> List[Graph]
```

---

## Parameters
None

---

## Returns
- `List[Graph]`: List of graph objects

---

## Graph Properties
Each `Graph` object in the returned list has the following properties:
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

# List all accessible graphs
graphs = db.list_graphs()

for graph in graphs:
    print(f"Graph: {graph.name}, Entities: {len(graph.entities)}, Relationships: {len(graph.relationships)}")

# Find the most recent graph
latest_graph = max(graphs, key=lambda g: g.updated_at)
print(f"Most recently updated: {latest_graph.name} (updated {latest_graph.updated_at})")
```

### Asynchronous
```python
from morphik import AsyncMorphik

async with AsyncMorphik() as db:
    # List all accessible graphs
    graphs = await db.list_graphs()

    for graph in graphs:
        print(f"Graph: {graph.name}, Entities: {len(graph.entities)}, Relationships: {len(graph.relationships)}")

    # Find the most recent graph
    latest_graph = max(graphs, key=lambda g: g.updated_at)
    print(f"Most recently updated: {latest_graph.name} (updated {latest_graph.updated_at})")
```

---

*Source: [Morphik Python SDK - list_graphs](https://docs.morphik.ai/python-sdk/list_graphs)* 
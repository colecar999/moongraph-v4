# ingest_text

The `ingest_text` method ingests a string of text as a document in Morphik. You can attach metadata, apply rules, and optionally use ColPali for improved retrieval.

---

## Function Signature

### Synchronous
```python
def ingest_text(
    content: str,
    filename: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    rules: Optional[List[RuleOrDict]] = None,
    use_colpali: bool = True,
) -> Document
```

### Asynchronous
```python
async def ingest_text(
    content: str,
    filename: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    rules: Optional[List[RuleOrDict]] = None,
    use_colpali: bool = True,
) -> Document
```

---

## Parameters
- `content` (str): Text content to ingest
- `filename` (str, optional): Optional filename for the document
- `metadata` (Dict[str, Any], optional): Optional metadata dictionary
- `rules` (List[RuleOrDict], optional): Optional list of rules to apply during ingestion. Can be:
  - `MetadataExtractionRule`: Extract metadata using a schema
  - `NaturalLanguageRule`: Transform content using natural language
- `use_colpali` (bool, optional): Whether to use ColPali-style embedding model (better retrieval for text/images). Defaults to True.

---

## Returns
- `Document`: Metadata of the ingested document

---

## Examples

### Synchronous
```python
from morphik import Morphik
from morphik.rules import MetadataExtractionRule, NaturalLanguageRule
from pydantic import BaseModel

class DocumentInfo(BaseModel):
    title: str
    author: str
    date: str

db = Morphik()

doc = db.ingest_text(
    "Machine learning is fascinating...",
    metadata={"category": "tech"},
    rules=[
        # Extract metadata using schema
        MetadataExtractionRule(schema=DocumentInfo),
        # Transform content
        NaturalLanguageRule(prompt="Shorten the content, use keywords")
    ]
)
```

### Asynchronous
```python
from morphik import AsyncMorphik
from morphik.rules import MetadataExtractionRule, NaturalLanguageRule
from pydantic import BaseModel

class DocumentInfo(BaseModel):
    title: str
    author: str
    date: str

async with AsyncMorphik() as db:
    doc = await db.ingest_text(
        "Machine learning is fascinating...",
        metadata={"category": "tech"},
        rules=[
            MetadataExtractionRule(schema=DocumentInfo),
            NaturalLanguageRule(prompt="Shorten the content, use keywords")
        ]
    )
```

---

*Source: [Morphik Python SDK - ingest_text](https://docs.morphik.ai/python-sdk/ingest_text)* 
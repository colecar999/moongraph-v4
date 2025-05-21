# ingest_file

The `ingest_file` method ingests a file (PDF, image, etc.) as a document in Morphik. You can attach metadata, apply rules, and optionally use ColPali for improved retrieval.

---

## Function Signature

### Synchronous
```python
def ingest_file(
    file: Union[str, bytes, BinaryIO, Path],
    filename: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    rules: Optional[List[RuleOrDict]] = None,
    use_colpali: bool = True,
) -> Document
```

### Asynchronous
```python
async def ingest_file(
    file: Union[str, bytes, BinaryIO, Path],
    filename: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    rules: Optional[List[RuleOrDict]] = None,
    use_colpali: bool = True,
) -> Document
```

---

## Parameters
- `file` (Union[str, bytes, BinaryIO, Path]): File to ingest (path string, bytes, file object, or Path)
- `filename` (str, optional): Name of the file
- `metadata` (Dict[str, Any], optional): Optional metadata dictionary
- `rules` (List[RuleOrDict], optional): Optional list of rules to apply during ingestion. Can be:
  - `MetadataExtractionRule`: Extract metadata using a schema
  - `NaturalLanguageRule`: Transform content using natural language
- `use_colpali` (bool, optional): Whether to use ColPali-style embedding model (better retrieval for images). Defaults to True.

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
    department: str

db = Morphik()

doc = db.ingest_file(
    "document.pdf",
    filename="document.pdf",
    metadata={"category": "research"},
    rules=[
        MetadataExtractionRule(schema=DocumentInfo),
        NaturalLanguageRule(prompt="Extract key points only")
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
    department: str

async with AsyncMorphik() as db:
    doc = await db.ingest_file(
        "document.pdf",
        filename="document.pdf",
        metadata={"category": "research"},
        rules=[
            MetadataExtractionRule(schema=DocumentInfo),
            NaturalLanguageRule(prompt="Extract key points only")
        ]
    )
```

---

*Source: [Morphik Python SDK - ingest_file](https://docs.morphik.ai/python-sdk/ingest_file)* 
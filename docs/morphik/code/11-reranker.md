```markdown
# Reranker (RERANKER.md)

The reranker module is designed to improve the relevance of search results by re-evaluating an initial set of retrieved chunks against the original query. It uses more sophisticated models than those typically used for initial retrieval to achieve higher accuracy in ranking.

## Table of Contents

- [BaseReranker](#basereranker)
- [FlagReranker](#flagreranker)

## BaseReranker (`core/reranker/base_reranker.py`)

`BaseReranker` is an abstract base class that defines the interface for all reranker implementations.

```python
from abc import ABC, abstractmethod
from typing import List, Union

from core.models.chunk import DocumentChunk


class BaseReranker(ABC):
    """Base class for reranking search results"""

    @abstractmethod
    async def rerank(
        self,
        query: str,
        chunks: List[DocumentChunk],
    ) -> List[DocumentChunk]:
        """Rerank chunks based on their relevance to the query"""
        pass

    @abstractmethod
    async def compute_score(
        self,
        query: str,
        text: Union[str, List[str]],
    ) -> Union[float, List[float]]:
        """Compute relevance scores between query and text"""
        pass

Key Methods:

rerank(query: str, chunks: List[DocumentChunk]): An abstract method that concrete rerankers must implement. It takes a query and a list of DocumentChunk objects, re-scores them based on relevance to the query, and returns the list of chunks sorted by the new scores.
compute_score(query: str, text: Union[str, List[str]]): An abstract method that computes relevance scores. It can take a single text or a list of texts and returns a single score or a list of scores, respectively.

FlagReranker (core/reranker/flag_reranker.py)
FlagReranker is a concrete implementation of BaseReranker that utilizes models from the FlagEmbedding library, such as BAAI's BGE reranker models.


from typing import List, Optional, Union

from FlagEmbedding import FlagAutoReranker # type: ignore

from core.models.chunk import DocumentChunk
from core.reranker.base_reranker import BaseReranker


class FlagReranker(BaseReranker):
    """Reranker implementation using FlagEmbedding"""

    def __init__(
        self,
        model_name: str = "BAAI/bge-reranker-v2-gemma",
        query_max_length: int = 256,
        passage_max_length: int = 512,
        use_fp16: bool = True,
        device: Optional[str] = None,
    ):
        """Initialize flag reranker"""
        devices = [device] if device else None # FlagAutoReranker expects a list or None
        self.reranker = FlagAutoReranker.from_finetuned(
            model_name_or_path=model_name,
            query_max_length=query_max_length,
            passage_max_length=passage_max_length,
            use_fp16=use_fp16,
            devices=devices,
        )

    async def rerank(
        self,
        query: str,
        chunks: List[DocumentChunk],
    ) -> List[DocumentChunk]:
        """Rerank chunks based on their relevance to the query"""
        if not chunks:
            return []

        passages = [chunk.content for chunk in chunks]
        # compute_score is expected to be async by the base class,
        # but FlagAutoReranker.compute_score is synchronous.
        # For a true async implementation, this would need to be run in a thread pool.
        # However, as the base class defines it as async, we'll call our async wrapper.
        scores = await self.compute_score(query, passages)

        # Update scores and sort chunks
        for chunk, score in zip(chunks, scores): # type: ignore
            chunk.score = float(score)

        return sorted(chunks, key=lambda x: x.score, reverse=True)

    async def compute_score(
        self,
        query: str,
        text: Union[str, List[str]],
    ) -> Union[float, List[float]]:
        """Compute relevance scores between query and text"""
        # The FlagAutoReranker.compute_score method is synchronous.
        # To make this method truly async, the synchronous call should be
        # wrapped with asyncio.to_thread if it's potentially blocking.
        # For simplicity in this example, we call it directly.
        if isinstance(text, str):
            text = [text]
        
        # The FlagAutoReranker expects a list of [query, passage] pairs
        query_passage_pairs = [[query, t] for t in text]
        scores = self.reranker.compute_score(query_passage_pairs, normalize=True)
        
        # If a single text was passed (now a list of one), return a single score
        if len(text) == 1 and isinstance(scores, list) and len(scores) == 1:
            return scores
        return scores

Initialization Parameters:

model_name (str): The name or path of the FlagEmbedding reranker model (e.g., "BAAI/bge-reranker-v2-gemma").
query_max_length (int): Maximum length for the query string. Default is 256.
passage_max_length (int): Maximum length for each passage (chunk content). Default is 512.
use_fp16 (bool): Whether to use FP16 precision for faster inference, if supported. Default is True.
device (Optional[str]): The device to run the model on (e.g., "cpu", "cuda:0"). If None, it's auto-detected.
Key Methods:

rerank(query: str, chunks: List[DocumentChunk]):
Extracts the content from each DocumentChunk.
Calls compute_score to get relevance scores for all query-passage pairs.
Updates the score attribute of each DocumentChunk.
Returns the list of chunks sorted in descending order of their new scores.
compute_score(query: str, text: Union[str, List[str]]):
If text is a single string, it's converted into a list containing that string.
Creates pairs of [query, passage] for each text.
Uses self.reranker.compute_score() from the FlagEmbedding library to calculate normalized relevance scores.
Returns a single score if a single text was provided, or a list of scores otherwise.
The core/reranker/__init__.py file is currently empty and serves as a package marker.
# Parser (PARSER.md)

The parser module is responsible for extracting text content from various file types and splitting that text into manageable chunks for further processing, such as embedding and indexing. It includes a base parser interface, a main `MorphikParser` implementation, and specialized components for video parsing and text chunking.

## Table of Contents

- [Base Classes](#base-classes)
  - [BaseParser](#baseparser)
  - [BaseChunker](#basechunker)
- [Main Parser](#main-parser)
  - [MorphikParser](#morphikparser)
- [Chunking Strategies](#chunking-strategies)
  - [StandardChunker](#standardchunker)
  - [ContextualChunker](#contextualchunker)
- [Video Parsing](#video-parsing)
  - [VideoParser](#videoparser)
  - [VisionModelClient](#visionmodelclient)

## Base Classes

### BaseParser (`core/parser/base_parser.py`)

`BaseParser` is an abstract base class that defines the contract for all parser implementations.

```python
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple

from core.models.chunk import Chunk


class BaseParser(ABC):
    """Base class for document parsing"""

    @abstractmethod
    async def parse_file_to_text(self, file: bytes, filename: str) -> Tuple[Dict[str, Any], str]:
        """
        Parse file content into text.

        Args:
            file: Raw file bytes
            filename: Name of the file

        Returns:
            Tuple[Dict[str, Any], str]: (metadata, extracted_text)
            - metadata: Additional metadata extracted during parsing
            - extracted_text: Raw text extracted from the file
        """
        pass

    @abstractmethod
    async def split_text(self, text: str) -> List[Chunk]:
        """
        Split plain text into chunks.

        Args:
            text: Text to split into chunks

        Returns:
            List[Chunk]: List of text chunks with metadata
        """
        pass
```

## Key Methods

-parse_file_to_text(file: bytes, filename: str): An abstract method that concrete parsers must implement to convert raw file bytes into extracted text and any associated metadata.
-split_text(text: str): An abstract method that concrete parsers must implement to divide a given text string into a list of Chunk objects.

## BaseChunker (core/parser/morphik_parser.py)
BaseChunker is an abstract base class defining the interface for different text chunking strategies.

from abc import ABC, abstractmethod
from typing import List
from core.models.chunk import Chunk # Assuming Chunk model is in core.models

class BaseChunker(ABC):
    """Base class for text chunking strategies"""

    @abstractmethod
    def split_text(self, text: str) -> List[Chunk]:
        """Split text into chunks"""
        pass

### Key Methods:

- split_text(text: str): An abstract method that specific chunker implementations must override to define how text is split into Chunk objects.

##Main Parser
MorphikParser (core/parser/morphik_parser.py)
MorphikParser is the primary parser implementation. It handles different file types, including videos and general documents (leveraging the unstructured library), and employs various chunking strategies.

import io
import logging
import os
import tempfile
from typing import Any, Dict, List, Optional, Tuple

import filetype # type: ignore
from langchain.text_splitter import RecursiveCharacterTextSplitter
from unstructured.partition.auto import partition # type: ignore

from core.models.chunk import Chunk
from core.parser.base_parser import BaseParser
from core.parser.video.parse_video import VideoParser, load_config
# ... (BaseChunker, StandardChunker, ContextualChunker defined in the same file)

logger = logging.getLogger(__name__)

class MorphikParser(BaseParser):
    """Unified parser that handles different file types and chunking strategies"""

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        use_unstructured_api: bool = False,
        unstructured_api_key: Optional[str] = None,
        assemblyai_api_key: Optional[str] = None,
        anthropic_api_key: Optional[str] = None, # For ContextualChunker
        frame_sample_rate: int = 1, # Default for video parsing
        use_contextual_chunking: bool = False,
    ):
        self.use_unstructured_api = use_unstructured_api
        self._unstructured_api_key = unstructured_api_key
        self._assemblyai_api_key = assemblyai_api_key
        self._anthropic_api_key = anthropic_api_key # Store for ContextualChunker
        self.frame_sample_rate = frame_sample_rate

        if use_contextual_chunking:
            if not anthropic_api_key:
                raise ValueError("Anthropic API key is required for Contextual Chunker.")
            self.chunker: BaseChunker = ContextualChunker(chunk_size, chunk_overlap, anthropic_api_key)
        else:
            self.chunker: BaseChunker = StandardChunker(chunk_size, chunk_overlap)
        # ... rest of the init

    def _is_video_file(self, file: bytes, filename: str) -> bool:
        # ... implementation
        try:
            kind = filetype.guess(file)
            return kind is not None and kind.mime.startswith("video/")
        except Exception as e:
            logging.error(f"Error detecting file type: {str(e)}")
            return False


    async def _parse_video(self, file: bytes) -> Tuple[Dict[str, Any], str]:
        # ... implementation
        if not self._assemblyai_api_key:
            raise ValueError("AssemblyAI API key is required for video parsing")

        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_file:
            temp_file.write(file)
            video_path = temp_file.name
        
        try:
            config = load_config()
            parser_config = config.get("parser", {})
            vision_config = parser_config.get("vision", {})
            frame_sample_rate = vision_config.get("frame_sample_rate", self.frame_sample_rate)

            parser = VideoParser(
                video_path,
                assemblyai_api_key=self._assemblyai_api_key,
                frame_sample_rate=frame_sample_rate,
            )
            results = await parser.process_video()

            frame_text = "\n".join(results.frame_descriptions.time_to_content.values())
            transcript_text = "\n".join(results.transcript.time_to_content.values())
            combined_text = f"Frame Descriptions:\n{frame_text}\n\nTranscript:\n{transcript_text}"

            metadata = {
                "video_metadata": results.metadata,
                "frame_timestamps": list(results.frame_descriptions.time_to_content.keys()),
                "transcript_timestamps": list(results.transcript.time_to_content.keys()),
            }
            return metadata, combined_text
        finally:
            os.unlink(video_path)


    async def _parse_document(self, file: bytes, filename: str) -> Tuple[Dict[str, Any], str]:
        # ... implementation
        elements = partition(
            file=io.BytesIO(file),
            content_type=None, # Let unstructured determine
            metadata_filename=filename,
            strategy="hi_res", # Uses hi_res strategy
            api_key=self._unstructured_api_key if self.use_unstructured_api else None,
        )
        text = "\n\n".join(str(element) for element in elements if str(element).strip())
        return {}, text


    async def parse_file_to_text(self, file: bytes, filename: str) -> Tuple[Dict[str, Any], str]:
        # ... implementation
        if self._is_video_file(file, filename):
            return await self._parse_video(file)
        return await self._parse_document(file, filename)

    async def split_text(self, text: str) -> List[Chunk]:
        # ... implementation
        return self.chunker.split_text(text)

### Initialization Parameters:

chunk_size (int): The target size for text chunks. Default is 1000.
chunk_overlap (int): The number of characters to overlap between consecutive chunks. Default is 200.
use_unstructured_api (bool): Whether to use the Unstructured API for parsing (requires unstructured_api_key). Default is False.
unstructured_api_key (Optional[str]): API key for the Unstructured service.
assemblyai_api_key (Optional[str]): API key for AssemblyAI, required for video parsing.
anthropic_api_key (Optional[str]): API key for Anthropic, required if use_contextual_chunking is True.
frame_sample_rate (int): Rate at which to sample frames for video description. Default is 1.
use_contextual_chunking (bool): If True, uses ContextualChunker; otherwise, uses StandardChunker. Default is False.

### Key Methods:

_is_video_file(file: bytes, filename: str): Internally checks if the provided file is a video using filetype.guess.
_parse_video(file: bytes): Parses video files. It writes the video to a temporary file, then uses VideoParser to extract transcriptions and frame descriptions. Requires assemblyai_api_key.
_parse_document(file: bytes, filename: str): Parses general document types (PDFs, DOCX, etc.) using the unstructured.partition function with a "hi_res" strategy. Can optionally use the Unstructured API.
parse_file_to_text(file: bytes, filename: str): Determines if the file is a video or another document type and routes it to the appropriate internal parsing method (_parse_video or _parse_document).
split_text(text: str): Splits the extracted text into chunks using the configured chunker (StandardChunker or ContextualChunker).

## Chunking Strategies
These classes are defined within core/parser/morphik_parser.py.

### StandardChunker
StandardChunker uses Langchain's RecursiveCharacterTextSplitter to split text. It splits based on a list of separators (["\n\n", "\n", ". ", " ", ""]) trying to keep chunks near the chunk_size.

class StandardChunker(BaseChunker):
    """Standard chunking using langchain's RecursiveCharacterTextSplitter"""

    def __init__(self, chunk_size: int, chunk_overlap: int):
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )

    def split_text(self, text: str) -> List[Chunk]:
        chunks = self.text_splitter.split_text(text)
        return [Chunk(content=chunk, metadata={}) for chunk in chunks]

## ContextualChunker

ContextualChunker first uses StandardChunker to get base chunks. Then, for each chunk, it calls an LLM (configured via contextual_chunking_model in morphik.toml, e.g., "claude_sonnet") to generate a succinct context that situates the chunk within the overall document. This context is prepended to the chunk's content to improve search retrieval.

class ContextualChunker(BaseChunker):
    """Contextual chunking using LLMs to add context to each chunk"""

    DOCUMENT_CONTEXT_PROMPT = """
<document>
{doc_content}
</document>
"""

    CHUNK_CONTEXT_PROMPT = """
Here is the chunk we want to situate within the whole document
<chunk>
{chunk_content}
</chunk>

Please give a short succinct context to situate this chunk within the overall document for the purposes of improving search retrieval of the chunk.
Answer only with the succinct context and nothing else.
"""
    # ... (init and other methods)

    def _situate_context(self, doc: str, chunk: str) -> str:
        import litellm
        # ... (gets model_name from self.model_config)
        # ... (constructs system_message and user_message)
        # ... (prepares model_params for litellm.completion)
        response = litellm.completion(**model_params)
        return response.choices.message.content

    def split_text(self, text: str) -> List[Chunk]:
        base_chunks = self.standard_chunker.split_text(text)
        contextualized_chunks = []
        for chunk in base_chunks:
            context = self._situate_context(text, chunk.content)
            content = f"{context}; {chunk.content}" # Prepends context
            contextualized_chunks.append(Chunk(content=content, metadata=chunk.metadata))
        return contextualized_chunks

Video Parsing (core/parser/video/parse_video.py)
This module handles the specifics of extracting information from video files.

VideoParser
The VideoParser class orchestrates the parsing of a video file. It uses AssemblyAI for transcription and a configurable vision model (via VisionModelClient) for generating descriptions of video frames.

python

Run

Copy
import base64
import logging
import os
from typing import Any, Dict, Optional

import assemblyai as aai # type: ignore
import cv2 # type: ignore
import litellm
import tomli # type: ignore

from core.config import get_settings
from core.models.video import ParseVideoResult, TimeSeriesData

logger = logging.getLogger(__name__)

# ... (debug_object and load_config functions)

class VideoParser:
    def __init__(self, video_path: str, assemblyai_api_key: str, frame_sample_rate: Optional[int] = None):
        # ... (initializes video capture, AssemblyAI, VisionModelClient)
        # ... (loads frame_sample_rate from config if not provided)
        ...

    def frame_to_base64(self, frame) -> str:
        # ... (converts OpenCV frame to base64 string)
        ...

    def get_transcript_object(self) -> aai.Transcript:
        # ... (uses AssemblyAI to transcribe video_path)
        ...

    def get_transcript(self) -> TimeSeriesData:
        # ... (processes AssemblyAI transcript into TimeSeriesData)
        ...

    async def get_frame_descriptions(self) -> TimeSeriesData:
        # ... (iterates through video frames, samples them at frame_sample_rate)
        # ... (for each sampled frame, calls self.vision_client.get_frame_description)
        # ... (collects descriptions into TimeSeriesData)
        # ... (if frame_sample_rate is -1, returns empty TimeSeriesData)
        ...

    async def process_video(self) -> ParseVideoResult:
        # ... (gets transcript and frame descriptions, returns ParseVideoResult)
        ...

    def __del__(self):
        # ... (releases video capture resources)
        ...
Key Methods:

__init__(...): Initializes cv2.VideoCapture, AssemblyAI transcriber, and VisionModelClient.
get_transcript(): Transcribes the video using AssemblyAI and returns the transcript as TimeSeriesData.
get_frame_descriptions(): Samples video frames at frame_sample_rate, generates descriptions for these frames using VisionModelClient, and returns them as TimeSeriesData. If frame_sample_rate is -1, frame captioning is disabled.
process_video(): Orchestrates the extraction of both transcript and frame descriptions, returning a ParseVideoResult object.
VisionModelClient
The VisionModelClient is responsible for interacting with a vision-capable LLM to get descriptions for video frames. It uses litellm to make the model calls.

python

Run

Copy
class VisionModelClient:
    def __init__(self, config: Dict[str, Any]):
        self.config = config["parser"]["vision"]
        self.model_key = self.config.get("model")
        self.settings = get_settings()
        # ... (loads model_config from settings.REGISTERED_MODELS)
        # ... (checks if model has vision capability)
        ...

    async def get_frame_description(self, image_base64: str, context: str) -> str:
        # ... (constructs system_message and user_message with image_base64 and context)
        # ... (handles different message formats for Ollama vs OpenAI-compatible models)
        # ... (calls litellm.acompletion with appropriate parameters)
        # ... (returns the content of the first choice from the response)
        ...
Key Methods:

__init__(...): Takes a configuration dictionary (typically from morphik.toml) to set up the vision model key and retrieve its full configuration from settings.REGISTERED_MODELS.
get_frame_description(image_base64: str, context: str): Sends a base64 encoded image and textual context (including nearby transcript and previous frame description) to the configured vision model via litellm and returns the generated description.
The core/parser/video/__init__.py and core/parser/__init__.py files are currently empty and serve as package markers.
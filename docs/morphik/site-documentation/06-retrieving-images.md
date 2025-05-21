# Retrieving Images with ColPali in Morphik

Morphik introduces ColPali, a state-of-the-art approach for visual retrieval that treats images as first-class citizens in Retrieval-Augmented Generation (RAG) systems. This guide explains the motivation, technical details, and usage of ColPali for high-fidelity image and visual content retrieval.

---

## Introduction

Traditional RAG techniques focus on text: documents are parsed, converted to text, and embedded for retrieval. However, most real-world documents are rich in visual elements—tables, charts, infographics, and layouts—that are essential for understanding and retrieval. Most RAG systems ignore or oversimplify these elements, leading to poor performance on visual tasks.

ColPali is designed to address this gap by enabling direct ingestion and retrieval of images, ensuring that visual information is preserved and retrievable with the same fidelity as text.

---

## What is ColPali?

ColPali's core idea is to eliminate preprocessing bottlenecks by embedding entire documents as lists of images, rather than relying solely on text extraction or layout detection. This approach:
- Speeds up document ingestion
- Improves retrieval quality for visual content
- Treats images and visual layouts as first-class data

---

## How Does It Work?

### Embedding Process

ColPali's embedding process is inspired by models like CLIP and uses **contrastive learning**:

1. A large dataset of image-text pairs is used.
2. Images and texts are passed through separate encoders (vision and text).
3. The dot product of image and text embeddings is computed.
4. The encoders are trained to maximize similarity for matching pairs and minimize it for non-matching pairs.

Over time, both encoders learn to project their inputs into a shared embedding space, so that, for example, the embedding of the word "dog" is close to the embedding of a dog image.

### Retrieval Process

ColPali's retrieval process borrows from late-interaction reranking techniques (e.g., ColBERT):
- Instead of embedding an entire image or text block, individual patches or tokens are embedded.
- A custom scoring function sums the similarities of the most similar patches/tokens.
- Morphik uses **hamming distance** for fast similarity computation, enabling scalable retrieval across millions of documents.

---

## How to Use ColPali in Morphik

Using ColPali in Morphik is simple—just set a parameter in your ingestion and query functions.

### Ingesting Documents with ColPali

```python
from morphik import Morphik

db = Morphik("YOUR-URI-HERE")

db.ingest_file("report_with_images_and_graphs.pdf", use_colpali=True)
```

### Querying with ColPali

```python
db.query("At what time-step did we see the highest GDP growth rate?", use_colpali=True)
```

---

## Why ColPali Matters

- **Visual Fidelity**: Preserves and retrieves visual information, not just text.
- **Performance**: Fast ingestion and retrieval, scalable to millions of documents.
- **Simplicity**: One line of code to enable advanced visual retrieval.

---

## Technical Summary

- **Contrastive Learning**: Trains vision and text encoders to share an embedding space.
- **Late-Interaction Retrieval**: Embeds and matches at the patch/token level for fine-grained similarity.
- **Hamming Distance**: Used for fast, scalable similarity search.

---

*Source: [Morphik Docs - Retrieving Images (ColPali)](https://docs.morphik.ai/concepts/colpali)* 
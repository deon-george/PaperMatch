"""RAG retrieval: build a vector index over the paper, score slide matches."""
from __future__ import annotations

from dataclasses import dataclass, field

import numpy as np

from .embedder import Embedder, LexicalVectorizer


@dataclass
class PaperIndex:
    chunks: list[dict] = field(default_factory=list)
    matrix: np.ndarray | None = None

    def n_chunks(self) -> int:
        return len(self.chunks)


def build_paper_index(chunk_texts: list[str], chunks: list[dict], embedder: Embedder) -> PaperIndex:
    """Index the paper chunks with the embedder."""
    matrix = embedder.embed_texts(chunk_texts)
    return PaperIndex(chunks=chunks, matrix=matrix)


def cosine_similarities(a: np.ndarray, b: np.ndarray) -> np.ndarray:
    """Pairwise cosine similarity: result[i, j] = cos(a[i], b[j])."""
    return a @ b.T


def lexical_overlap_matrix(slide_texts: list[str], chunk_texts: list[str]) -> np.ndarray:
    """TF-IDF lexical overlap between slide texts and paper chunks (cosine)."""
    vec = LexicalVectorizer(dim=1024).fit(slide_texts + chunk_texts)
    slide_vecs = vec.transform(slide_texts)
    chunk_vecs = vec.transform(chunk_texts)
    return cosine_similarities(slide_vecs, chunk_vecs)
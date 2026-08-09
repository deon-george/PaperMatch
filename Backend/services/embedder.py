"""Document embedding for the RAG pipeline.

Prefers a local sentence-transformer model; gracefully falls back to a
pure-python TF-IDF lexical vectorizer so the server always works.
"""
from __future__ import annotations

import math
import re
from collections import Counter

import numpy as np

_WORD = re.compile(r"[a-z0-9]+")
_STOP = {
    "the", "and", "for", "are", "with", "that", "this", "from", "was", "have",
    "has", "our", "they", "their", "them", "which", "where", "when", "were",
    "can", "will", "its", "but", "not", "all", "than", "then", "into", "over",
    "also", "such", "these", "those", "each", "using", "used", "use", "based",
}


class LexicalVectorizer:
    """Deterministic hashing TF-IDF vectorizer (no external dependencies)."""

    def __init__(self, dim: int = 512):
        self.dim = dim
        self.idf: dict[str, float] = {}

    @staticmethod
    def _tokenize(text: str) -> Counter:
        counts: Counter = Counter()
        for tok in _WORD.findall(text.lower()):
            if len(tok) > 2 and tok not in _STOP and not tok.isdigit():
                counts[tok] += 1
        return counts

    def fit(self, texts: list[str]) -> "LexicalVectorizer":
        tokenized = [self._tokenize(t) for t in texts]
        df: Counter = Counter()
        for cnt in tokenized:
            for term in cnt:
                df[term] += 1
        n = max(len(tokenized), 1)
        self.idf = {term: 1.0 + math.log((1 + n) / (1 + freq)) for term, freq in df.items()}
        return self

    def transform(self, texts: list[str]) -> np.ndarray:
        rows = np.zeros((len(texts), self.dim), dtype=np.float32)
        for i, text in enumerate(texts):
            vec: Counter = Counter()
            for term, tf in self._tokenize(text).items():
                if term in self.idf:
                    vec[self._h(term)] += tf * self.idf[term]
            for idx, val in vec.items():
                rows[i, idx] = val
        self._normalize(rows)
        return rows

    def _h(self, term: str) -> int:
        return (hash(term) & ((1 << 32) - 1)) % self.dim

    @staticmethod
    def _normalize(rows: np.ndarray) -> None:
        norms = np.linalg.norm(rows, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        rows /= norms


class Embedder:
    """Uniform embedding API used by the rest of the pipeline."""

    def __init__(self):
        self.backend = "lexical"
        self._model = None
        self._lexical = LexicalVectorizer()
        self._try_sentence_transformers()

    def _try_sentence_transformers(self) -> None:
        try:
            from sentence_transformers import SentenceTransformer  # type: ignore

            model_name = "all-MiniLM-L6-v2"
            self._model = SentenceTransformer(model_name)
            self.backend = "sentence-transformers"
            print(f"[embedder] using sentence-transformers ({model_name})")
        except Exception as exc:  # noqa: BLE001
            self.backend = "lexical"
            print(f"[embedder] sentence-transformers unavailable ({exc}); using lexical vectorizer")

    def fit(self, texts: list[str]) -> "Embedder":
        if self.backend == "lexical":
            self._lexical.fit(texts)
        return self

    def embed_texts(self, texts: list[str]) -> np.ndarray:
        texts = [t or "" for t in texts]
        if self.backend == "sentence-transformers":
            embs = self._model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
            return np.asarray(embs, dtype=np.float32)
        return self._lexical.transform(texts)

    def embed_one(self, text: str) -> np.ndarray:
        return self.embed_texts([text])[0]

    def backend_name(self) -> str:
        return self.backend
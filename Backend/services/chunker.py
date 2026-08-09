"""Split long documents into overlapping chunks (with char offsets)."""
from __future__ import annotations

import re

_SENT_SPLIT = re.compile(r"(?<=[.!?])\s+")


def _walk_paragraphs(text: str):
    """Yield (start_offset, end_offset, body) for each paragraph in `text`.

    Offsets are always relative to `text` itself so they can be compared with
    the section spans produced by sectionizer against the same string.
    """
    lines = text.split("\n")
    offset = 0
    para: list[str] = []
    para_start = 0
    for line in lines:
        stripped = line.strip()
        if stripped:
            if not para:
                para_start = offset
            para.append(stripped)
        else:
            if para:
                yield (para_start, offset + len(line), "\n".join(para))
                para = []
        offset += len(line) + 1
    if para:
        yield (para_start, offset, "\n".join(para))


def _split_sentences(body: str, start: int, size: int):
    """Hard-split an oversized paragraph by sentences, preserving offsets."""
    pieces = []
    pos = start
    for seg in _SENT_SPLIT.split(body):
        pieces.append((pos, pos + len(seg), seg))
        pos += len(seg) + 1

    merged = []
    cur_text, cur_start, cur_end = "", None, 0
    for s, e, piece in pieces:
        if cur_text and len(cur_text) + len(piece) + 1 > size:
            merged.append((cur_start, cur_end, cur_text))
            cur_text, cur_start, cur_end = piece, s, e
        else:
            cur_text = (cur_text + " " + piece) if cur_text else piece
            if cur_start is None:
                cur_start = s
            cur_end = e
    if cur_text:
        merged.append((cur_start, cur_end, cur_text))
    return merged


def chunk_text(text: str, size_chars: int = 1300) -> list[dict]:
    """Chunk `text` into paragraphs — returns [{"text", "start", "end"}, ...].

    `start`/`end` are character offsets into the original `text`.
    """
    text = (text or "").strip()
    if not text:
        return []

    chunks: list[dict] = []
    cur: list[str] = []
    cur_start = 0
    cur_len = 0
    cur_end = 0

    def flush():
        nonlocal cur, cur_len
        if cur:
            chunks.append({"text": " ".join(cur), "start": cur_start, "end": cur_end})
        cur = []
        cur_len = 0

    for start, end, body in _walk_paragraphs(text):
        if len(body) > int(size_chars * 1.5):
            for s, e, sub in _split_sentences(body, start, size_chars):
                if cur and cur_len + len(sub) + 2 > size_chars:
                    flush()
                if not cur:
                    cur_start = s
                cur.append(sub)
                cur_len += len(sub) + 2
                cur_end = e
            continue

        if cur and cur_len + len(body) + 2 > size_chars:
            flush()
        if not cur:
            cur_start = start
        cur.append(body)
        cur_len += len(body) + 2
        cur_end = end

    flush()
    return [c for c in chunks if c["text"].strip()]
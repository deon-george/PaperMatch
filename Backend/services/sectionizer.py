"""Detect the logical sections of a research paper from its extracted text."""
from __future__ import annotations

import re

# Canonical section names used across the whole pipeline.
DISPLAY_SECTIONS = [
    "Title / Abstract",
    "Introduction",
    "Related Work",
    "Background",
    "Methodology",
    "Experiments",
    "Results",
    "Discussion",
    "Limitations",
    "Conclusion",
    "Future Work",
    "Acknowledgements",
    "References",
    "Appendix",
]

# (display_name, [synonyms matched case-insensitively])
_SECTION_RULES = [
    ("Title / Abstract", ["abstract", "paper summary", "summary"]),
    ("Introduction", ["introduction", "intro"]),
    ("Related Work", ["related work", "related works", "prior work", "literature review", "background and related work"]),
    ("Background", ["background"]),
    ("Methodology", ["methodology", "proposed framework", "proposed approach", "proposed model", "proposed system", "proposed method", "methods", "system design", "model design", "algorithm"]),
    ("Experiments", ["experiments", "experimental setup", "evaluation", "implementation details", "datasets and", "dataset"]),
    ("Results", ["results", "results and analysis", "findings"]),
    ("Discussion", ["discussion"]),
    ("Limitations", ["limitations", "limitation", "threats to validity"]),
    ("Conclusion", ["conclusion", "conclusions"]),
    ("Future Work", ["future work", "future directions", "future scope", "future research"]),
    ("Acknowledgements", ["acknowledgment", "acknowledgement"]),
    ("References", ["references", "bibliography"]),
    ("Appendix", ["appendix"]),
]


def _strip_numbering(line: str) -> str:
    """Remove a leading number/numbered-grouping prefix like '1.', '1.1 ', '3) '."""
    return re.sub(r"^\d+(?:\.\d+)*[\)\.\s\-]*", "", line).strip()


def _looks_like_heading(line: str) -> bool:
    """A heading is a short line without terminal sentence punctuation."""
    if not line or len(line) > 80:
        return False
    if re.match(r"^(https?://|doi:|arxiv|10\.\d)", line, re.I):
        return False
    if re.match(r"^[\s\d]+$", line):
        return False
    if re.search(r"[.!?]$", line):
        return False
    return True


def _match_rule(probe_lower: str):
    for name, synonyms in _SECTION_RULES:
        for syn in synonyms:
            if probe_lower == syn or probe_lower.startswith(syn + " ") or probe_lower.startswith(syn + ":"):
                return name
    return None


def detect_sections(full_text: str) -> list[dict]:
    """Return ordered detected sections.

    Each entry is {"name": display_name, "start": char, "end": char}.
    """
    found: list[tuple[str, int]] = []
    offset = 0
    for raw_line in full_text.split("\n"):
        line = raw_line.strip()
        if line and _looks_like_heading(line):
            probe_lower = _strip_numbering(line).lower()
            name = _match_rule(probe_lower)
            if name:
                found.append((name, offset))
        offset += len(raw_line) + 1

    spans = []
    for name, start in found:
        if spans and spans[-1]["name"] == name:
            continue  # dedupe consecutive identical headings
        spans.append({"name": name, "start": start})
    for i, span in enumerate(spans):
        span["end"] = spans[i + 1]["start"] if i + 1 < len(spans) else len(full_text)
    return spans


def assign_sections(sections: list[dict], chunks: list[dict]) -> list[dict]:
    """Label each text chunk (with char-level 'start') with its belonging section.

    Returns a list of dicts: {"name", "start", "end", "chunks": [chunk_idx...]}.
    """
    result = []
    for sec in sections:
        sec = dict(sec)
        sec["chunks"] = []
        result.append(sec)

    for idx, chunk in enumerate(chunks):
        start = chunk.get("start", 0)
        assigned = None
        for sec in result:
            # A chunk belongs to a section if it starts at/inside it.
            if sec["start"] <= start < sec["end"]:
                assigned = sec
                break
        if assigned is None and result:
            # content before the first detected heading
            assigned = result[0]
        if assigned is not None:
            assigned["chunks"].append(idx)
    return result
"""Core comparison pipeline: RAG retrieval + optional LLM narrative."""
from __future__ import annotations

import re

import numpy as np

from config import Config

from .chunker import chunk_text
from .embedder import Embedder
from .llm import GeminiClient
from .rag import cosine_similarities, lexical_overlap_matrix
from .sectionizer import detect_sections

# Status thresholds (percent) used to label each paper section.
STATUS_RULES = ((85, "Excellent"), (65, "Good"), (45, "Fair"), (0, "Missing"))


def _status(pct: int) -> str:
    for threshold, label in STATUS_RULES:
        if pct >= threshold:
            return label
    return "Missing"


def _clamp(value, low=0.0, high=100.0):
    return max(low, min(high, value))


def _pct(x, lo, hi) -> int:
    if hi <= lo:
        return 50
    return int(_clamp((x - lo) / (hi - lo) * 100.0))


def _top2_mean(vec, axis=-1):
    k = min(2, vec.shape[axis])
    if k == 0:
        return np.zeros(vec.shape[:axis] if axis < 0 else ())
    top = np.partition(vec, -k, axis=axis)[..., -k:]
    return top.mean(axis=axis)


def _slide_label(hits_sorted, best) -> str:
    hits = [i for i, s in hits_sorted if s >= 0.85 * max(1e-9, best)]
    hits = sorted(hits)
    if not hits:
        return "Not Found"
    groups, group = [], [hits[0]]
    for cur, nxt in zip(hits, hits[1:]):
        if nxt == cur + 1:
            group.append(nxt)
        else:
            groups.append(group)
            group = [nxt]
    groups.append(group)
    parts = []
    for g in groups:
        parts.append(f"Slides {g[0]}-{g[-1]}" if len(g) > 1 else f"Slide {g[0]}")
    return ", ".join(parts)


def _short(text: str, limit: int) -> str:
    text = re.sub(r"\s+", " ", (text or "")).strip()
    return text[:limit] + ("…" if len(text) > limit else "")


def _summary_of(text: str, sent_limit: int = 3, char_limit: int = 320) -> str:
    sents = re.split(r"(?<=[.!?])\s+", re.sub(r"\s+", " ", (text or "")).strip())
    return _short(" ".join(sents[:sent_limit]), char_limit)


def _fallback_insights(sections_info, extra_slides, extra_pct, missing_section_names,
                       semantic, coverage, ai_quality):
    """Deterministic narrative used when no LLM key is configured."""
    missing_topics = [
        {
            "id": f"miss-{i}",
            "title": sec["name"],
            "desc": f'The paper discusses "{sec["name"]}" but the presentation does not cover it.',
        }
        for i, sec in enumerate(sections_info)
        if sec["status"] == "Missing"
    ]
    missing_chunks = [c for c in sections_info if c["status"] == "Missing"]
    for i, sec in enumerate(missing_chunks[:5]):
        if i < len(missing_topics):
            continue
        missing_topics.append({
            "id": f"miss-detailed-{i}",
            "title": sec["name"] + " details",
            "desc": "Details inside this paper section are only lightly covered by the slides.",
        })

    extra_topics = [
        {
            "id": f"extra-{i}",
            "title": _short(text, 34),
            "desc": f"Most of slide {num} does not map to content in the paper.",
        }
        for i, (num, text) in enumerate(extra_slides[:8])
    ]

    recommendations = []
    if missing_section_names:
        recommendations.append(
            "Cover the under-represented sections: " + ", ".join(missing_section_names[:4])
        )
    if missing_topics:
        recommendations.append("Add slides explaining " + ", ".join(t["title"] for t in missing_topics[:3]))
    if extra_topics:
        recommendations.append("Trim or rephrase slides that are unrelated to the paper content")
    recommendations.append("Use the paper's exact terminology when writing slide bullet points")
    if semantic >= 75 and extra_pct <= 15:
        recommendations.append("Great coverage — the deck follows the paper well!")

    ai_quote = (
        f"The presentation captures roughly {semantic}% of the paper's key sections "
        f"(semantic similarity). In all, coverage is "
        f"{'strong and the deck flows logically.' if semantic >= 75 else 'moderate and could be improved.'}"
        + (f" {len(extra_topics)} slide(s) appear mostly unrelated to the paper." if extra_topics else "")
    )
    return {
        "ai_quality": ai_quality,
        "ai_quote": ai_quote,
        "missing_topics": missing_topics,
        "extra_topics": extra_topics,
        "recommendations": recommendations,
    }


def _llm_prompt(sections_info, slides):
    lines = [
        "You are an academic assistant comparing a research paper with its seminar presentation.",
        "Return strict JSON only (no surrounding text):",
        '{"missing_topics":[{"title":"...","description":"..."}],'
        '"extra_topics":[{"title":"...","description":"..."}],'
        '"recommendations":["..."],"ai_quality":0-100,'
        '"ai_quote":"one summary sentence"}',
        "PAPER SECTIONS:",
    ]
    for i, sec in enumerate(sections_info):
        lines.append(f"[{i + 1}] {sec['name']} — {sec['chunk_text']}")
    lines.append("PRESENTATION SLIDES:")
    for num, text in slides:
        lines.append(f"[Slide {num}] {_short(text, 500)}")
    return "\n".join(lines)


def analyze_file(paper: dict, ppt: dict, embedder: Embedder) -> dict:
    paper_text = paper["full_text"]
    slide_nums = sorted(ppt["slides"].keys())
    slide_texts = [ppt["slides"][n] for n in slide_nums]

    # ---- sectionise the paper, then chunk each section separately so every
    #      chunk is attributed to its section (robust to missing blank lines).
    raw_sections = detect_sections(paper_text)
    if not raw_sections:
        raw_sections = [{"name": "Full Paper", "start": 0, "end": len(paper_text)}]

    chunks: list[dict] = []
    sections: list[dict] = []
    for sec in raw_sections:
        sec_start, sec_end = sec["start"], sec["end"]
        body = paper_text[sec_start:sec_end]
        sub_chunks = chunk_text(body)
        chunk_idx = []
        for c in sub_chunks:
            c["start"] += sec_start
            c["end"] += sec_start
            c["section"] = sec["name"]
            chunk_idx.append(len(chunks))
            chunks.append(c)
        sections.append({
            "name": sec["name"],
            "start": sec_start,
            "end": sec_end,
            "chunks": chunk_idx,
        })

    chunk_texts = [c["text"] for c in chunks]

    # ---- embeddings & similarity matrix (slides x chunks)
    embedder.fit(chunk_texts + slide_texts)
    chunk_matrix = embedder.embed_texts(chunk_texts)
    slide_matrix = embedder.embed_texts(slide_texts)
    sem = cosine_similarities(slide_matrix, chunk_matrix)

    if embedder.backend_name() == "sentence-transformers":
        lex = lexical_overlap_matrix(slide_texts, chunk_texts)
        combined = 0.7 * sem + 0.3 * lex
    else:
        combined = sem

    # ---- calibration percentiles over every slide/chunk pair
    lo = float(np.percentile(combined, 3))
    hi = float(np.percentile(combined, 92))
    if hi <= lo:
        lo, hi = -0.05, 1.0

    # ---- chunk-level best score per slide
    chunk_best = combined.max(axis=0)
    chunk_pct = np.asarray([_pct(v, lo, hi) for v in chunk_best])
    chunk_chars = np.asarray([max(len(c["text"]), 1) for c in chunks], dtype=np.float64)

    # ---- per-section rows
    section_rows = []
    for sec in sections:
        idx = sec["chunks"]
        if not idx:
            section_rows.append((sec, 0.0, []))
            continue
        sub = combined[:, idx]                      # slides x chunks-of-section
        per_slide = _top2_mean(sub, axis=1)          # one value per slide
        best = float(per_slide.max())
        slide_scores = list(enumerate(per_slide.tolist(), start=1))  # 1-based slide numbers
        section_rows.append((sec, best, slide_scores))

    sec_pcts = [_pct(best, lo, hi) for _, best, _ in section_rows]
    semantic = round(float(np.mean(sec_pcts)) if sec_pcts else 0.0)

    weights = chunk_chars / chunk_chars.sum()
    coverage = round(float((weights * chunk_pct).sum()))
    extra_pct = round(100 * (combined.max(axis=1) < (lo + Config.EXTRA_SLIDE_THRESHOLD * (hi - lo))).mean())

    ai_quality = round(0.55 * semantic + 0.45 * coverage)

    # ---- sections_info
    sections_info = []
    for i, (sec, best, slide_scores) in enumerate(section_rows):
        pct = sec_pcts[i]
        label = "Not Found" if not sec["chunks"] else _slide_label(slide_scores, best)
        section_text = " ".join(chunks[j]["text"] for j in sec["chunks"])
        sections_info.append({
            "name": sec["name"],
            "slides": label,
            "pct": pct,
            "status": _status(pct),
            "chunk_text": _summary_of(section_text),
        })

    missing_section_names = [s["name"] for s in sections_info if s["status"] == "Missing"]
    extra_slide_list = [
        (slide_nums[i], slide_texts[i])
        for i in range(len(slide_texts))
        if combined.max(axis=1)[i] < (lo + Config.EXTRA_SLIDE_THRESHOLD * (hi - lo))
    ]

    # ---- LLM narrative (optional)
    llm = GeminiClient()
    insights = llm.complete_json(_llm_prompt(sections_info, list(zip(slide_nums, slide_texts))))
    if not (insights and isinstance(insights, dict)):
        insights = _fallback_insights(
            sections_info,
            extra_slide_list,
            extra_pct,
            missing_section_names,
            semantic,
            coverage,
            ai_quality,
        )
    else:
        ai_quality = int(_clamp(insights.get("ai_quality", ai_quality)))
        insights["missing_topics"] = (insights.get("missing_topics") or [])[:8]
        insights["extra_topics"] = (insights.get("extra_topics") or [])[:8]
        insights["recommendations"] = (insights.get("recommendations") or [])[:8]
        insights.setdefault("ai_quote", "")

    overall = round(0.35 * semantic + 0.25 * coverage + 0.20 * ai_quality + 0.20 * (100 - extra_pct))
    overall = int(_clamp(overall))

    return {
        "semantic": semantic,
        "coverage": coverage,
        "missing_pct": round(100 - coverage),
        "extra_pct": extra_pct,
        "ai_quality": ai_quality,
        "overall": overall,
        "sections": sections_info,
        "num_slides": len(slide_texts),
        "missing_topics": insights["missing_topics"],
        "extra_topics": insights["extra_topics"],
        "recommendations": insights["recommendations"],
        "ai_quote": insights.get("ai_quote", ""),
        "llm_used": llm.enabled,
        "embedding_backend": embedder.backend_name(),
        "missing_section_names": missing_section_names,
        "quick": {
            "total_sections": len(sections_info),
            "total_slides": len(slide_texts),
            "matching_sections": sum(1 for s in sections_info if s["status"] != "Missing"),
            "missing_sections": sum(1 for s in sections_info if s["status"] == "Missing"),
            "extra_topics": len(insights["extra_topics"]),
        },
    }
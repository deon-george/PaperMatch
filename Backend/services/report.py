"""Map analysis results onto the exact JSON contract the frontend consumes."""
from __future__ import annotations


def _label(score: int) -> str:
    if score >= 85:
        return "Excellent Match"
    if score >= 70:
        return "Very Good Match"
    if score >= 55:
        return "Good Match"
    if score >= 40:
        return "Fair Match"
    return "Needs Improvement"


def _description(score: int, semantic: int, coverage: int, missing_pct: int, extra_pct: int, ai_quality: int) -> str:
    parts = []
    if score >= 75:
        parts.append("Great job! Your presentation faithfully represents the research paper.")
    elif score >= 55:
        parts.append("Your presentation covers the paper reasonably well, with room to improve.")
    else:
        parts.append("The presentation only partially represents the paper — consider restructuring it.")
    if semantic < 60:
        parts.append("The slides share little semantic overlap with the paper's text.")
    if coverage < 60:
        parts.append("A meaningful share of the paper's content (topics/sections) is untouched.")
    if missing_pct > 30:
        parts.append("Several paper topics are not reflected in the deck.")
    if extra_pct > 25:
        parts.append("Some slides contain material that is not grounded in the paper.")
    if not parts:
        parts.append("The presentation and paper are in reasonable alignment.")
    return " ".join(parts)


def build_report(analysis: dict, paper_meta: dict, ppt_meta: dict) -> dict:
    score = analysis["overall"]
    semantic = analysis["semantic"]
    coverage = analysis["coverage"]
    missing_pct = analysis["missing_pct"]
    extra_pct = analysis["extra_pct"]
    ai_quality = analysis["ai_quality"]

    breakdown = [
        {"label": "Semantic Similarity", "pct": semantic},
        {"label": "Topic Coverage", "pct": coverage},
        {"label": "Missing Topics", "pct": missing_pct},
        {"label": "Extra/Irrelevant Topics", "pct": extra_pct},
        {"label": "AI Quality Evaluation", "pct": ai_quality},
    ]

    return {
        "ok": True,
        "files": {
            "paper_name": paper_meta["name"],
            "paper_pages": paper_meta.get("num_pages"),
            "presentation_name": ppt_meta["name"],
            "num_slides": ppt_meta.get("num_slides"),
        },
        "overall_score": score,
        "score_label": _label(score),
        "score_description": _description(score, semantic, coverage, missing_pct, extra_pct, ai_quality),
        "breakdown": breakdown,
        "quick_summary": analysis["quick"],
        "sections": analysis["sections"],
        "ai_quote": analysis["ai_quote"],
        "ai_quality": ai_quality,
        "missing_topics": analysis["missing_topics"],
        "extra_topics": analysis["extra_topics"],
        "recommendations": analysis["recommendations"],
        "metadata": {
            "llm_used": analysis["llm_used"],
            "embedding_backend": analysis["embedding_backend"],
        },
    }
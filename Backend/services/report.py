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


def _description(score: int, semantic: int, coverage: int, missing_pct: int, extra_pct: int,
                 ai_quality: int, dimensions: dict | None = None) -> str:
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
    if dimensions:
        if dimensions.get("fact_consistency", 100) < 60:
            parts.append("Some numbers or metrics on the slides do not match the paper.")
        if dimensions.get("structure", 100) < 60:
            parts.append("The slide order does not follow the paper's logical flow.")
    if not parts:
        parts.append("The presentation and paper are in reasonable alignment.")
    return " ".join(parts)


# Order + labels shown in the score breakdown, keyed by analysis dimension.
BREAKDOWN_ITEMS = [
    ("semantic_content", "Semantic Content Similarity"),
    ("section_coverage", "Section Coverage"),
    ("topic_coverage", "Topic/Concept Coverage"),
    ("methodology", "Methodology Similarity"),
    ("results", "Results & Findings"),
    ("fact_consistency", "Claim/Fact Consistency"),
    ("missing_content", "No Missing Content"),
    ("extra_content", "No Extra/Unsupported Content"),
    ("structure", "Structural Similarity"),
]


def build_report(analysis: dict, paper_meta: dict, ppt_meta: dict) -> dict:
    score = analysis["overall"]
    semantic = analysis["semantic"]
    coverage = analysis["coverage"]
    missing_pct = analysis["missing_pct"]
    extra_pct = analysis["extra_pct"]
    ai_quality = analysis["ai_quality"]
    dimensions = analysis.get("dimensions") or {}

    breakdown = [
        {"label": label, "pct": dimensions.get(key, 0)}
        for key, label in BREAKDOWN_ITEMS
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
        "score_description": _description(score, semantic, coverage, missing_pct, extra_pct, ai_quality, dimensions),
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
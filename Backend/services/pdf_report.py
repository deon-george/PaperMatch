"""Render the comparison report as a PDF via reportlab."""
from __future__ import annotations

import io

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

PRIMARY = colors.HexColor("#4F46E5")
MUTED = colors.HexColor("#64748B")
LIGHT = colors.HexColor("#E2E8F0")
BADGE = {
    "Excellent": colors.HexColor("#065F46"),
    "Good": colors.HexColor("#1E40AF"),
    "Fair": colors.HexColor("#92400E"),
    "Missing": colors.HexColor("#991B1B"),
}
BADGE_BG = {
    "Excellent": colors.HexColor("#D1FAE5"),
    "Good": colors.HexColor("#DBEAFE"),
    "Fair": colors.HexColor("#FEF3C7"),
    "Missing": colors.HexColor("#FEE2E2"),
}


def _styles():
    base = getSampleStyleSheet()
    s = {
        "title": ParagraphStyle("title", parent=base["Title"], fontSize=20, textColor=colors.HexColor("#0F172A"), spaceAfter=2),
        "subtitle": ParagraphStyle("subtitle", parent=base["Normal"], fontSize=9, textColor=MUTED, spaceAfter=12),
        "h2": ParagraphStyle("h2", parent=base["Heading2"], fontSize=12.5, textColor=PRIMARY, spaceBefore=14, spaceAfter=6),
        "body": ParagraphStyle("body", parent=base["Normal"], fontSize=9.5, textColor=colors.HexColor("#334155"), leading=13),
        "quote": ParagraphStyle("quote", parent=base["Normal"], fontSize=9.5, leading=13, textColor=colors.HexColor("#334155"), leftIndent=8, rightIndent=8),
        "cell": ParagraphStyle("cell", parent=base["Normal"], fontSize=8.5, leading=11),
        "cellb": ParagraphStyle("cellb", parent=base["Normal"], fontSize=8.5, leading=11, fontName="Helvetica-Bold"),
        "small": ParagraphStyle("small", parent=base["Normal"], fontSize=8, textColor=MUTED),
    }
    return s


def build_report_pdf(report: dict) -> bytes:
    """Turn a report dict (same shape as /api/analyze) into PDF bytes."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=16 * mm, rightMargin=16 * mm,
                            topMargin=14 * mm, bottomMargin=14 * mm)
    st = _styles()
    story = []

    score = report.get("overall_score", 0)
    files = report.get("files", {})
    breakdown = report.get("breakdown", [])
    sections = report.get("sections", [])
    quick = report.get("quick_summary", {})

    story.append(Paragraph("PaperMatch — Similarity Report", st["title"]))
    sub = f"{files.get('paper_name', 'Paper')}  vs  {files.get('presentation_name', 'Presentation')}"
    meta = f"{quick.get('total_slides', '?')} slides · {quick.get('total_sections', '?')} paper sections"
    if files.get("paper_pages"):
        meta += f" · {files['paper_pages']} pages"
    story.append(Paragraph(f"{sub}<br/>{meta}", st["subtitle"]))

    # ---- score banner
    label = report.get("score_label", "No Analysis")
    score_table = Table(
        [[Paragraph(f"{score}%", ParagraphStyle("score", parent=st["title"], fontSize=30, textColor=PRIMARY)),
          Paragraph(f"<b>{label}</b><br/>{report.get('score_description', '')}", st["body"])]],
        colWidths=[34 * mm, None],
    )
    score_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BOX", (0, 0), (-1, -1), 0.8, LIGHT),
        ("BACKGROUND", (0, 0), (0, 0), colors.HexColor("#EEF2FF")),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(score_table)

    # ---- score breakdown
    story.append(Paragraph("Score Breakdown", st["h2"]))
    bd_rows = [["Metric", "Score"]]
    bd_rows += [[Paragraph(r["label"], st["cell"]), Paragraph(f"{r['pct']}%", st["cellb"])] for r in breakdown]
    bd = Table(bd_rows, colWidths=[120 * mm, 40 * mm])
    bd.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(bd)

    # ---- quick summary
    story.append(Paragraph("Quick Summary", st["h2"]))
    q = quick
    qrows = [
        [f"Total paper sections: <b>{q.get('total_sections', '-')}</b>",
         f"Matching sections: <b>{q.get('matching_sections', '-')}</b>"],
        [f"Total slides: <b>{q.get('total_slides', '-')}</b>",
         f"Missing sections: <b>{q.get('missing_sections', '-')}</b>"],
        [f"Extra topics: <b>{q.get('extra_topics', '-')}</b>", ""],
    ]
    qt = Table([[Paragraph(a, st["cell"]), Paragraph(b, st["cell"])] for a, b in qrows],
               colWidths=[None, None])
    qt.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.5, LIGHT),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(qt)

    # ---- section-wise
    story.append(Paragraph("Section-wise Similarity", st["h2"]))
    sec_rows = [[Paragraph("Paper Section", st["cellb"]), Paragraph("Best Slide", st["cellb"]),
                 Paragraph("Similarity", st["cellb"]), Paragraph("Status", st["cellb"])]]
    for s in sections:
        badge_txt = f"{s['status']} ({s['pct']}%)"
        sec_rows.append([
            Paragraph(s["name"], st["cell"]),
            Paragraph(s.get("slides") or "Not Found", st["cell"]),
            Paragraph(f"{s['pct']}%", st["cell"]),
            Paragraph(badge_txt, ParagraphStyle("bdg", parent=st["cell"], textColor=BADGE.get(s["status"], MUTED),
                                                backColor=BADGE_BG.get(s["status"], colors.white))),
        ])
    stbl = Table(sec_rows, colWidths=[48 * mm, 42 * mm, 32 * mm, 38 * mm])
    stbl.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ("GRID", (0, 0), (-1, -1), 0.5, LIGHT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(stbl)

    # ---- missing & extra topics
    missing = report.get("missing_topics", [])
    extra = report.get("extra_topics", [])
    if missing:
        story.append(Paragraph("Missing Topics (in the paper, not on the slides)", st["h2"]))
        for t in missing:
            story.append(Paragraph(f"• <b>{t.get('title', '')}</b> — {t.get('desc') or t.get('description', '')}", st["body"]))
            story.append(Spacer(1, 3))
    if extra:
        story.append(Paragraph("Extra / Unrelated Content in the Presentation", st["h2"]))
        for t in extra:
            story.append(Paragraph(f"• <b>{t.get('title', '')}</b> — {t.get('desc') or t.get('description', '')}", st["body"]))
            story.append(Spacer(1, 3))

    # ---- AI evaluation
    if report.get("ai_quote"):
        story.append(Paragraph("AI Evaluation", st["h2"]))
        story.append(Paragraph(f"“{report['ai_quote']}”", st["quote"]))

    # ---- recommendations
    recs = report.get("recommendations", [])
    if recs:
        story.append(Paragraph("Recommendations", st["h2"]))
        for i, rec in enumerate(recs, 1):
            story.append(Paragraph(f"{i}. {rec}", st["body"]))
            story.append(Spacer(1, 3))

    story.append(Spacer(1, 10))
    story.append(Paragraph("Generated by PaperMatch. Report data is stored locally in your browser.", st["small"]))

    doc.build(story)
    return buf.getvalue()
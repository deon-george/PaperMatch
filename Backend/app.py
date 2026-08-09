"""PaperMatch backend — Flask + RAG + Gemini (optional) comparison API."""
from __future__ import annotations

import os
import tempfile
import uuid

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import Config
from services.analyzer import analyze_file
from services.embedder import Embedder
from services.extractor import ExtractionError, extract_from_path
from services.pdf_report import build_report_pdf
from services.report import build_report

app = Flask(__name__)
app.config.from_object(Config)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# A single embedder instance is reused across requests (thread-safe encodes).
embedder = Embedder()


def _save_upload(file_storage, upload_dir: str) -> str:
    ext = os.path.splitext(file_storage.filename)[1].lower()
    if ext not in Config.ALLOWED_EXTENSIONS:
        raise ExtractionError(f"Unsupported file type '{ext}'. Please upload a .pdf and a .pptx.")
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(upload_dir, name)
    file_storage.save(path)
    return path


@app.get("/api/health")
def health():
    return jsonify({"status": "ok", "llm": bool(Config.GEMINI_API_KEY)})


@app.post("/api/analyze")
def analyze():
    """Compare a research paper (PDF) against a seminar presentation (PPTX).

    Multipart fields:
        paper        -> the PDF file
        presentation -> the PPTX file
    """
    paper = request.files.get("paper")
    ppt = request.files.get("presentation")
    if paper is None or ppt is None:
        return jsonify({"ok": False, "error": "Both 'paper' (.pdf) and 'presentation' (.pptx) are required."}), 400

    upload_dir = Config.UPLOAD_FOLDER
    paper_path = ppt_path = None
    try:
        paper_name = paper.filename
        ppt_name = ppt.filename
        paper_path = _save_upload(paper, upload_dir)
        ppt_path = _save_upload(ppt, upload_dir)

        paper_meta = extract_from_path(paper_path)
        ppt_meta = extract_from_path(ppt_path)

        analysis = analyze_file(paper_meta, ppt_meta, embedder)

        report = build_report(
            analysis,
            {"name": paper_name, "num_pages": paper_meta.get("num_pages")},
            {"name": ppt_name, "num_slides": ppt_meta.get("num_slides")},
        )
        return jsonify(report)
    except ExtractionError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 400
    except Exception as exc:  # noqa: BLE001
        app.logger.exception("Analysis failed")
        return jsonify({"ok": False, "error": f"Unexpected error: {exc}"}), 500
    finally:
        for path in (paper_path, ppt_path):
            if path and os.path.exists(path):
                try:
                    os.remove(path)
                except OSError:
                    pass


@app.post("/api/report/pdf")
def report_pdf():
    """Render an existing report (JSON body) as a PDF document.

    Expects the full report object produced by /api/analyze.
    """
    report = request.get_json(silent=True)
    if not report or not isinstance(report, dict):
        return jsonify({"ok": False, "error": "A report object is required."}), 400
    try:
        pdf_bytes = build_report_pdf(report)
        resp = app.make_response((pdf_bytes, 200))
        resp.headers["Content-Type"] = "application/pdf"
        resp.headers["Content-Disposition"] = "inline; filename=papermatch-report.pdf"
        return resp
    except Exception as exc:  # noqa: BLE001
        app.logger.exception("PDF generation failed")
        return jsonify({"ok": False, "error": f"Could not generate PDF: {exc}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)
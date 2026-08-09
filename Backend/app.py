"""PaperMatch backend — Flask + RAG + Gemini (optional) comparison API."""
from __future__ import annotations

import os
import tempfile
import uuid

from flask import Flask, jsonify, request
from flask_cors import CORS

from config import Config
from services import auth as authsvc
from services import db
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


def _auth_user():
    """Resolve the requesting user from the Authorization header, or None."""
    header = request.headers.get("Authorization", "")
    if not header.startswith("Bearer "):
        return None
    payload = authsvc.decode_token(header[7:])
    if not payload:
        return None
    return db.get_user(payload.get("uid"))


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
    return jsonify({
        "status": "ok",
        "llm": bool(Config.GEMINI_API_KEY),
        "db": db.available(),
    })


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


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

@app.post("/api/auth/register")
def register():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    email = (body.get("email") or "").strip()
    password = body.get("password") or ""
    if not username or not email or not password:
        return jsonify({"ok": False, "error": "Username, email and password are required."}), 400
    if len(password) < 6:
        return jsonify({"ok": False, "error": "Password must be at least 6 characters."}), 400
    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"ok": False, "error": "Please enter a valid email address."}), 400

    user, err = db.create_user(username, email, authsvc.hash_password(password))
    if err:
        if err == "database unavailable":
            return jsonify({"ok": False, "error": "Database is unavailable. Try again later."}), 503
        return jsonify({"ok": False, "error": err}), 409
    token = authsvc.create_token(user["id"])
    return jsonify({"ok": True, "token": token, "user": user})


@app.post("/api/auth/login")
def login():
    body = request.get_json(silent=True) or {}
    identifier = (body.get("username") or body.get("email") or "").strip()
    password = body.get("password") or ""
    if not identifier or not password:
        return jsonify({"ok": False, "error": "Username/email and password are required."}), 400

    user_doc = db.get_user_by_username(identifier) or db.get_user_by_email(identifier)
    if not user_doc or not authsvc.verify_password(user_doc["password_hash"], password):
        return jsonify({"ok": False, "error": "Invalid username or password."}), 401
    user = {"id": str(user_doc["_id"]), "username": user_doc["username"], "email": user_doc["email"]}
    token = authsvc.create_token(user["id"])
    return jsonify({"ok": True, "token": token, "user": user})


@app.get("/api/auth/me")
def me():
    user_doc = _auth_user()
    if not user_doc:
        return jsonify({"ok": False, "error": "Not authenticated."}), 401
    return jsonify({
        "ok": True,
        "user": {"id": str(user_doc["_id"]), "username": user_doc["username"], "email": user_doc["email"]},
    })


# ---------------------------------------------------------------------------
# Per-user comparison history (MongoDB)
# ---------------------------------------------------------------------------

@app.get("/api/history")
def history_list():
    user_doc = _auth_user()
    if not user_doc:
        return jsonify({"ok": False, "error": "Not authenticated."}), 401
    if not db.available():
        return jsonify({"ok": False, "error": "Database is unavailable."}), 503
    return jsonify({"ok": True, "entries": db.list_comparisons(str(user_doc["_id"]))})


@app.post("/api/history")
def history_create():
    user_doc = _auth_user()
    if not user_doc:
        return jsonify({"ok": False, "error": "Not authenticated."}), 401
    body = request.get_json(silent=True) or {}
    report = body.get("report")
    if not isinstance(report, dict) or not report:
        return jsonify({"ok": False, "error": "A report object is required."}), 400
    entry, err = db.save_comparison(str(user_doc["_id"]), body.get("files") or {}, report)
    if err:
        app.logger.warning("Could not save comparison: %s", err)
        return jsonify({"ok": False, "error": "Could not save to database."}), 500
    return jsonify({"ok": True, "entry": entry}), 201


@app.get("/api/history/<comparison_id>")
def history_get(comparison_id):
    user_doc = _auth_user()
    if not user_doc:
        return jsonify({"ok": False, "error": "Not authenticated."}), 401
    entry = db.get_comparison(str(user_doc["_id"]), comparison_id)
    if not entry:
        return jsonify({"ok": False, "error": "Comparison not found."}), 404
    return jsonify({"ok": True, "entry": entry})


@app.delete("/api/history/<comparison_id>")
def history_delete(comparison_id):
    user_doc = _auth_user()
    if not user_doc:
        return jsonify({"ok": False, "error": "Not authenticated."}), 401
    if db.delete_comparison(str(user_doc["_id"]), comparison_id):
        return jsonify({"ok": True})
    return jsonify({"ok": False, "error": "Comparison not found."}), 404


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")), debug=False, threaded=True)
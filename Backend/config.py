import os

from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


class Config:
    APP_NAME = "PaperMatch"
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 30 * 1024 * 1024  # 30 MB per upload
    ALLOWED_EXTENSIONS = {".pdf", ".pptx"}

    # Gemini API configuration. The server falls back to a deterministic
    # heuristic analysis (with the same JSON contract) when no key is set.
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or ""
    if GEMINI_API_KEY in ("your_gemini_api_key_here", "<your key here>"):
        GEMINI_API_KEY = ""
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    GEMINI_TIMEOUT = int(os.getenv("GEMINI_TIMEOUT", "90"))

    # MongoDB Atlas persistence (history + user accounts). Empty URI disables
    # the database layer; the app keeps working anonymously in that case.
    MONGODB_URI = os.getenv("MONGODB_URI", "")
    MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "papermatch")
    MONGODB_TIMEOUT_MS = int(os.getenv("MONGODB_TIMEOUT_MS", "10000"))

    # Auth tokens (signed with PyJWT). Change JWT_SECRET in production.
    JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-change-me")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "168"))  # 7 days

    # Number of top retrieval results used while reasoning over each slide.
    RETRIEVAL_TOP_K = int(os.getenv("RETRIEVAL_TOP_K", "6"))
    # Paper chunks that do not match any slide as strongly as this fraction of
    # the reference distribution are treated as "missing" paper content.
    MISS_MATCH_THRESHOLD = float(os.getenv("MISS_MATCH_THRESHOLD", "0.45"))
    # A slide is considered "extra/unrelated" when its best library match stays
    # below this fraction of the reference distribution.
    EXTRA_SLIDE_THRESHOLD = float(os.getenv("EXTRA_SLIDE_THRESHOLD", "0.35"))


os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
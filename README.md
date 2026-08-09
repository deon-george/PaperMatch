# PaperMatch

Compare a research paper (PDF) against a seminar presentation (PPTX) and get an instant, evidence-based similarity score.

PaperMatch uses **retrieval-augmented generation (RAG)** to break a paper into sections, match every slide against the paper's content, and report how well the presentation represents the paper — section by section, topic by topic.

## Features

- **Overall similarity score** (0–100%) with a human-readable label and explanation
- **Section-wise analysis** — every paper section matched against the slides
- **Missing topics** — paper content that the presentation doesn't cover
- **Extra / unrelated content** — slides not grounded in the paper
- **AI summary** — optional Gemini-generated evaluation and recommendations
- **PDF report export** — styled, downloadable similarity report
- **User accounts & synced history** — optional login backed by MongoDB Atlas
- **Graceful degradation** — deterministic analysis + local-only history when no API keys or database are configured

## Tech Stack

| Layer    | Technology |
| -------- | ---------- |
| Frontend | React 18 + Vite |
| Backend  | Flask (Python 3) |
| RAG      | `sentence-transformers` embeddings, automatic TF-IDF fallback |
| LLM      | Google Gemini (`google-genai`), optional |
| Storage  | MongoDB Atlas (PyMongo) + browser `localStorage` fallback |
| PDF      | ReportLab |

## Project Structure

```
papermatch/
├── Backend/
│   ├── app.py                  # Flask app + REST API
│   ├── config.py               # Environment configuration
│   ├── requirements.txt
│   ├── .env                    # API keys & secrets (not committed)
│   ├── _smoke_test.py          # End-to-end smoke test with generated fixtures
│   └── services/
│       ├── extractor.py        # PDF / PPTX text extraction
│       ├── sectionizer.py      # Paper section detection
│       ├── chunker.py          # Paragraph-aware text chunking
│       ├── embedder.py         # Embeddings (sentence-transformers / lexical)
│       ├── rag.py              # Indexing + cosine-similarity retrieval
│       ├── analyzer.py         # Scoring, missing/extra topic detection
│       ├── llm.py              # Gemini client with graceful fallback
│       ├── report.py           # Maps analysis -> frontend JSON contract
│       ├── pdf_report.py       # ReportLab PDF renderer
│       ├── auth.py             # Password hashing + signed tokens
│       └── db.py               # MongoDB Atlas persistence (users, history)
└── Frontend/
    ├── vite.config.js          # Dev proxy: /api -> localhost:5000
    ├── package.json
    └── src/
        ├── App.jsx             # Routing + state
        ├── lib/                # history + auth helpers
        └── components/         # Dashboard, AuthPage, History, Reports, ...
```

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- (Optional) MongoDB Atlas cluster for accounts + synced history
- (Optional) Google Gemini API key for AI analysis

### 1. Backend

```bash
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # if present; otherwise create one (see Configuration)
python app.py
```

The backend runs on `http://localhost:5000`.

### 2. Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies `/api/*` requests to the backend.

## Configuration

Create a `.env` file inside `Backend/`:

```dotenv
# Google Gemini (optional — enables the AI evaluation)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash

# MongoDB Atlas (optional — enables accounts + synced history)
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net
MONGODB_DB_NAME=papermatch

# Secret used to sign auth tokens
JWT_SECRET=replace-with-a-long-random-string
```

| Variable               | Default              | Purpose |
| ---------------------- | -------------------- | ------- |
| `GEMINI_API_KEY`       | *(empty)*            | Enables the AI summary; falls back to deterministic analysis otherwise |
| `GEMINI_MODEL`         | `gemini-3.5-flash`   | Gemini model used for analysis |
| `GEMINI_TIMEOUT`       | `90`                 | LLM request timeout (seconds) |
| `MONGODB_URI`          | *(empty)*            | Atlas connection string; enables login + cloud history |
| `MONGODB_DB_NAME`      | `papermatch`         | Database name on the cluster |
| `MONGODB_TIMEOUT_MS`   | `10000`              | MongoDB connection timeout (ms) |
| `JWT_SECRET`           | `dev-secret-change-me` | Token signing secret — set a strong value in production |
| `RETRIEVAL_TOP_K`      | `6`                  | Retrieval depth per slide |
| `MISS_MATCH_THRESHOLD` | `0.45`               | Sensitivity for missing-topic detection |
| `EXTRA_SLIDE_THRESHOLD`| `0.35`               | Sensitivity for extra-slide detection |

> **Note on embeddings:** install `sentence-transformers` in the venv for semantic (transformer-based) matching. If it's not available, the server automatically falls back to a lightweight TF-IDF lexical vectorizer.

## API Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint                 | Auth   | Description |
| ------ | ------------------------ | ------ | ----------- |
| GET    | `/api/health`            | —      | Server status (`llm`, `db` availability) |
| POST   | `/api/analyze`           | —      | Multipart (`paper` PDF + `presentation` PPTX) → full report |
| POST   | `/api/report/pdf`        | —      | Render a report object (JSON body) → PDF |
| POST   | `/api/auth/register`     | —      | Create account → `{ token, user }` |
| POST   | `/api/auth/login`        | —      | Sign in → `{ token, user }` |
| GET    | `/api/auth/me`           | Bearer | Current user |
| GET    | `/api/history`           | Bearer | List the signed-in user's comparisons |
| POST   | `/api/history`           | Bearer | Save a comparison (report object) |
| GET    | `/api/history/<id>`      | Bearer | Fetch one comparison |
| DELETE | `/api/history/<id>`      | Bearer | Delete a comparison |

Authenticated requests send the token in the `Authorization: Bearer <token>` header.

### Smoke test

```bash
cd Backend
source venv/bin/activate
python _smoke_test.py
```

This generates a sample PDF and PPTX in `_smoke/` and runs the full analysis pipeline without any external services.

## How It Works

1. **Extract** — text is pulled from the PDF and PPTX (`pypdf`, `python-pptx`).
2. **Structure** — the paper is split into sections; the deck into individual slides.
3. **Index** — paper sections are chunked and embedded into a vector index.
4. **Match** — each slide is scored against the paper using cosine similarity retrieval.
5. **Analyze** — scores are normalized into an overall similarity score, with section coverage, missing topics, and extra content identified.
6. **Explain** — (optional) Gemini writes a summary and recommendations; otherwise deterministic narratives are used.

## Troubleshooting

- **`sentence-transformers` unavailable** — expected if the optional dependency isn't installed; the lexical fallback keeps everything working.
- **Gemini calls time out** — the LLM has a configurable timeout and falls back gracefully. Verify the key in `Backend/.env` and network access to the Gemini API.
- **MongoDB unavailable** — without a `MONGODB_URI`, the app runs in anonymous mode and history is stored in the browser only. `/api/health` reports `db: false`.
- **Backend not responding** — make sure the Flask app is running on port `5000` and that the Vite dev proxy is active.

## License

Released under the [MIT License](LICENSE).

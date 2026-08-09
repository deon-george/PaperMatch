# PaperMatch

Compare a research paper (PDF) against a seminar presentation (PPTX) and get an instant, evidence-based similarity score.

PaperMatch uses **retrieval-augmented generation (RAG)** to break a paper into sections, match every slide against the paper's content, and report how well the presentation represents the paper — section by section, topic by topic.

## Features

- **Overall similarity score** (0–100%) with a human-readable label and explanation
- **9-dimension similarity scoring** — semantic content, section & topic coverage, methodology, results, claim/fact consistency, missing/extra content, and structural flow
- **Section-wise analysis** — every paper section matched against the slides
- **Missing topics** — paper content that the presentation doesn't cover
- **Extra / unrelated content** — slides not grounded in the paper
- **AI summary** — optional Gemini-generated evaluation and recommendations
- **PDF report export** — styled, downloadable similarity report
- **User accounts & synced history** — optional login backed by MongoDB Atlas
- **Graceful degradation** — deterministic analysis + local-only history when no API 
keys or database are configured

## WebApp Live at

https://paper-match-dusky.vercel.app/


## Live Video

Youtube Link: https://youtu.be/n7CvF82r8Eo

## Technical Documentation

Google Drive Link: https://docs.google.com/document/d/1YfHu1uFUuxIn4Mdyx6qOslIZ2ypDRZxS/edit?usp=sharing&ouid=104082011666407737330&rtpof=true&sd=true
 
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
│       ├── analyzer.py         # 9-dimension scoring, missing/extra detection
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

## Deployment

### Frontend on Vercel

Deploy the `Frontend/` directory as a Vite project on Vercel. Set this environment variable in the Vercel project settings:

```dotenv
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

That makes the frontend call the Render backend directly in production while keeping local development on the Vite proxy.

### Backend on Render

Deploy the `Backend/` service on Render using the included `render.yaml`, or create a Python web service with:

```bash
cd Backend
pip install -r requirements.txt
gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --threads 4
```

Render will inject `PORT`, and the Flask app now binds to it automatically.

Recommended backend environment variables on Render:

```dotenv
GEMINI_API_KEY=...
MONGODB_URI=...
JWT_SECRET=...
```

If you use custom frontend and backend domains, keep `flask-cors` enabled as-is; the API already allows cross-origin requests for `/api/*`.

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

## AI Model Architecture & Similarity Scoring

The comparison engine evaluates a presentation against the paper along **nine independent dimensions**. Every dimension is a calibrated 0–100 score (higher = better) computed deterministically in `services/analyzer.py`, so results are reproducible even without an LLM.

| # | Dimension | What is compared | How it is computed |
| - | --------- | ---------------- | ------------------ |
| 1 | **Semantic Content Similarity** | Does the PPT convey the same meaning/concepts as the paper? | Cosine similarity between slide embeddings and paper-chunk embeddings (`all-MiniLM-L6-v2`, TF-IDF fallback), calibrated via percentile normalization, averaged over paper sections. |
| 2 | **Section Coverage** | Are the paper's key sections represented? | Share of detected sections whose best slide match clears the *Missing* status threshold. |
| 3 | **Topic/Concept Coverage** | Do the paper's important topics appear? | Length-weighted share of paper chunks matched by at least one slide. |
| 4 | **Methodology Similarity** | Is the actual research methodology represented? | Section score for *Methodology / Experiments*; falls back to semantic score if absent. |
| 5 | **Results & Findings** | Do results and conclusions match? | Section score for *Results / Discussion / Conclusion*. |
| 6 | **Claim/Fact Consistency** | Do the PPT's claims agree with the paper? | Extracts numeric facts from the paper (percentages, comma-separated counts, numbers next to metric keywords like *accuracy/AUC/F1*) and scores the share that also appear on the slides — e.g. paper says `94.2%`, deck says `98%` ⇒ mismatch detected. |
| 7 | **Missing Content** | Is important paper content absent from the PPT? | Share of paper chunks whose best match stays below `MISS_MATCH_THRESHOLD`. |
| 8 | **Extra/Unsupported Content** | Is there PPT content not supported by the paper? | Share of slides whose best paper match stays below `EXTRA_SLIDE_THRESHOLD` (inverted). |
| 9 | **Structural Similarity** | Does the deck follow the paper's logical flow? | Each slide is assigned its best-matching section; scores the share of slide-to-slide transitions that keep increasing paper section order (Introduction → Methodology → Results → Conclusion). |

### Scoring pipeline

```
paper PDF ──▶ extract ──▶ sectionize ──▶ chunk ──▶ embed (sentence-transformers / TF-IDF)
                                                          │
                                                          ▼
                              slides × chunks cosine similarity matrix
                                                          │
                       combine semantic (0.7) + lexical (0.3)  ◀── when transformer embeddings are on
                                                          │
                    calibrate percentile (3rd ↔ 92nd)     │
                                                          ▼
                    9 dimension scores (0–100 each)  ──▶  overall score (weighted)
```

The **overall score** is a weighted blend of the nine dimensions (weights in `DIM_WEIGHTS`):

| Dimension | Weight |
| --------- | ------ |
| Semantic Content Similarity | 0.15 |
| Section Coverage | 0.10 |
| Topic/Concept Coverage | 0.15 |
| Methodology Similarity | 0.10 |
| Results & Findings | 0.10 |
| Claim/Fact Consistency | 0.10 |
| Missing Content | 0.05 |
| Extra/Unsupported Content | 0.10 |
| Structural Similarity | 0.15 |

These scores are also injected into the (optional) Gemini prompt as *DIMENSION SCORES*, so the LLM's evaluation and recommendations stay grounded in the same numbers. The `ai_quality` field still reports the LLM's independent 0–100 verdict, and the final label/description is derived from the weighted overall score.

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
5. **Analyze** — scores are normalized into **nine similarity dimensions** (semantic content, section/topic coverage, methodology, results, claim/fact consistency, missing/extra content, structure) and combined into an overall similarity score.
6. **Explain** — (optional) Gemini writes a summary and recommendations grounded in the dimension scores; otherwise deterministic narratives are used.

## Troubleshooting

- **`sentence-transformers` unavailable** — expected if the optional dependency isn't installed; the lexical fallback keeps everything working.
- **Gemini calls time out** — the LLM has a configurable timeout and falls back gracefully. Verify the key in `Backend/.env` and network access to the Gemini API.
- **MongoDB unavailable** — without a `MONGODB_URI`, the app runs in anonymous mode and history is stored in the browser only. `/api/health` reports `db: false`.
- **Backend not responding** — make sure the Flask app is running on port `5000` and that the Vite dev proxy is active.

## License

Released under the [MIT License](LICENSE).

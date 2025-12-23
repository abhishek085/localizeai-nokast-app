## Overview

Nokast is a local-first newsletter summarization platform. It automates fetching newsletters from Gmail, cleaning and extracting stories using a local Ollama model, and saving curated results to a local DuckDB database.

Key files:
- `backend/top_news_pipeline.py` — Core pipeline logic (Gmail fetch, Ollama processing, DuckDB storage).
Architecture & Patterns:
- **Database**: DuckDB is the source of truth for whitelists, keywords, and stories. The pipeline uses `read_only=True` to allow concurrent access with the FastAPI server.
Environment Variables (managed in `backend/secrets/.env`):
- `FETCH_LIMIT`, `TOP_N`, `SIMILARITY_THRESHOLD`
Development Guidelines:
- **Path Resolution**: Always use `resolve_secret_path` or `resolve_db_path` to ensure files are found regardless of the working directory.
Debugging:
- Check `backend/secrets/status` for file existence.
`http://localhost:11434/api/tags` or set the `OLLAMA_BASE_URL` environment variable to point to your Ollama server.
- **Frontend**: React + Vite. Uses global polling (8s) to monitor background pipeline status.

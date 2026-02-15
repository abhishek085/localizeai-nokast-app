# Nokast Backend (FastAPI)

This backend handles Gmail fetching, Ollama model orchestration, and DuckDB storage.

## Setup

1. **Install system dependencies**:
   - `libmagic` is required for WhatsApp integration.
   - **macOS**: `brew install libmagic`
   - **Linux**: `sudo apt-get install libmagic1`

2. **Install `uv`** (recommended):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```
3. **Sync dependencies**:
   ```bash
   uv venv
   source .venv/bin/activate
   uv pip sync
   ```
3. **Run the server**:
   ```bash
   uvicorn main:app --reload --port 4000
   ```

## Secrets Management

The backend expects secrets in the `backend/secrets/` directory:
- `Google_credentials.json`: OAuth2 credentials for Gmail API.
- `token.json`: Generated after the first successful Gmail authentication.
- `.env`: Optional environment variables.

**Note**: You can upload these files directly through the frontend Settings UI.

## Database

- **DuckDB**: Data is stored in `backend/top_news.duckdb`. This includes fetched emails, processed stories, newsletter lists, and priority keywords.

## API Endpoints

- `GET /api/secrets/status`: Check which secret files exist.
- `POST /api/upload-google-credentials`: Upload the credentials JSON.
- `GET /api/models`: List downloaded Ollama models.
- `POST /api/run`: Trigger the newsletter processing pipeline.

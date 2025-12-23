<div align="center">
<img width="200" alt="Nokast Logo" src="/logo.png" />
<h1>LocalizeAI by Nokast</h1>
<p>Automate fetching newsletters from Gmail, cleaning and extracting stories using a local Ollama model, and saving curated results to a local DuckDB database.</p>
</div>

## Features

- **Local-First AI**: Uses Ollama for all LLM tasks (cleaning, extraction, social post generation).
- **Gmail Integration**: Securely fetches newsletters from your whitelisted senders.
- **Smart Ranking**: Uses priority keywords and authority scores to surface the most relevant news.
- **DuckDB Persistence**: All your data (newsletters, keywords, stories) stays on your machine.
- **Real-time Monitoring**: Background pipeline status polling every 8 seconds.
- **Curated Dashboard**: View individual story cards with LinkedIn/X post drafts and newsletter source info.

## Prerequisites

- **Node.js** (v18+)
- **Python** (v3.12+)
- **Ollama** (installed and running)
- **Google Cloud Project** (for Gmail API access)

## Setup Instructions

### 1. Backend Setup (Python)

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   uv venv
   source .venv/bin/activate
   uv pip sync
   ```
3. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 4000
   ```

### 2. Frontend Setup (React)

1. From the root directory, install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Connecting Gmail (Google Credentials)

To fetch emails, you need to provide a `Google_credentials.json` file.

### How to get your Google Credentials:

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create a Project**: Click the project dropdown and select "New Project".
3.  **Enable Gmail API**: 
    - Go to "APIs & Services" > "Library".
    - Search for "Gmail API" and click **Enable**.
4.  **Configure OAuth Consent Screen**:
    - Go to "APIs & Services" > "OAuth consent screen".
    - Select **External** and click **Create**.
    - Fill in the required app information (App name, user support email).
    - In "Test users", add your own Gmail address.
5.  **Create Credentials**:
    - Go to "APIs & Services" > "Credentials".
    - Click **+ Create Credentials** > **OAuth client ID**.
    - Select **Desktop app** as the Application type.
    - Click **Create**.
6.  **Download JSON**:
    - Find your new client ID under "OAuth 2.0 Client IDs".
    - Click the **Download** icon (JSON).
    - **Rename** the downloaded file to `Google_credentials.json`.
7.  **Upload in App**:
    - Open the app at `localhost:3000`.
    - Go to **Settings**.
    - Click **Connect with Gmail** and upload your `Google_credentials.json`.

## Local AI Models (Ollama)

This app uses Ollama for local processing.
1. Download Ollama from [ollama.com](https://ollama.com).
2. Ensure it is running (`ollama serve`).
3. Go to the **Model Management** tab in the app to download and activate models like `llama3.2:1b` or `phi3:mini`.

## Configuration & Database

### Pipeline Settings
You can configure the pipeline behavior in the **Settings** tab:
- **Fetch Limit**: Maximum number of emails to fetch per run.
- **Top N**: Number of top stories to keep after ranking.
- **Similarity Threshold**: Threshold for deduplicating similar stories (0.0 to 1.0).
- **Ollama Model**: The model used for cleaning and extraction.

### Database (DuckDB)
All data is stored locally in `backend/top_news.duckdb`. This includes:
- **Whitelisted Newsletters**: Managed via the Settings UI.
- **Priority Keywords**: Used for ranking stories.
- **Fetched Emails**: Raw email content.
- **Processed Stories**: The final curated results.

The database is shared between the FastAPI server and the background pipeline using DuckDB's multi-process support (read-only mode for the pipeline).

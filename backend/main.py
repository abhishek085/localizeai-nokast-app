from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import shutil
import threading
import asyncio
import duckdb
import json
from typing import Any
import uuid
import subprocess
import json as _json

# Import user's pipeline
try:
    from top_news_pipeline import NewsPipeline
    PIPELINE_AVAILABLE = True
except Exception as e:
    print(f"[warn] Could not import NewsPipeline: {e}")
    NewsPipeline = None
    PIPELINE_AVAILABLE = False

BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIST = os.path.join(os.path.dirname(BASE_DIR), "dist")
SECRETS_DIR = os.path.join(BASE_DIR, "secrets")
os.makedirs(SECRETS_DIR, exist_ok=True)

# Allow overriding Ollama server/base URL via environment variable so we don't
# hardcode localhost/port in multiple places. When not set, default to
# localhost:11434 which is the Ollama local server default.
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')

def resolve_secret_path(env_var: str, default_name: str) -> str:
    val = os.getenv(env_var)
    if not val:
        return os.path.join(SECRETS_DIR, default_name)
    if os.path.isabs(val):
        return val
    return os.path.join(SECRETS_DIR, val)

def resolve_db_path():
    val = os.getenv("DUCKDB_PATH")
    if not val:
        return os.path.join(BASE_DIR, "top_news.duckdb")
    if os.path.isabs(val):
        return val
    return os.path.join(BASE_DIR, val)

app = FastAPI()

# Serve static frontend if built
if os.path.isdir(FRONTEND_DIST):
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")

# Shared pipeline instance (lazy)
_pipeline = None
_pipeline_lock = threading.Lock()
_last_run = {"running": False, "last_result": None}


def get_pipeline():
    global _pipeline
    with _pipeline_lock:
        if _pipeline is None and PIPELINE_AVAILABLE:
            _pipeline = NewsPipeline()
        return _pipeline


class RunRequest(BaseModel):
    newsletters: list = []
    fetch_limit: int | None = None


@app.get('/api/status')
async def status():
    return {
        "ok": True,
        "pipeline_available": PIPELINE_AVAILABLE,
        "last_run": _last_run,
    }


@app.post('/api/upload-google-credentials')
async def upload_google_credentials(file: UploadFile = File(...)):
    dest = os.path.join(SECRETS_DIR, 'Google_credentials.json')
    with open(dest, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "path": dest}


@app.post('/api/upload-google-token')
async def upload_google_token(file: UploadFile = File(...)):
    dest = os.path.join(SECRETS_DIR, 'token.json')
    with open(dest, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "path": dest}


@app.post('/api/upload-env')
async def upload_env(file: UploadFile = File(...)):
    dest = os.path.join(SECRETS_DIR, '.env')
    with open(dest, 'wb') as f:
        shutil.copyfileobj(file.file, f)
    return {"ok": True, "path": dest}


@app.post('/api/delete-credentials')
async def delete_credentials():
    """Delete stored Google credentials and token from backend/secrets."""
    removed = []
    errors = []
    targets = [
        'Google_credentials.json', 
        'token.json', 
        '.env', 
        'authority_scores.json', 
        'model_processes.json'
    ]
    for t in targets:
        p = os.path.join(SECRETS_DIR, t)
        try:
            if os.path.exists(p):
                os.remove(p)
                removed.append(t)
        except Exception as e:
            errors.append({"file": t, "error": str(e)})
    return {"ok": True, "removed": removed, "errors": errors}


@app.get('/api/config')
async def get_config():
    """Read current configuration from .env file."""
    env_path = os.path.join(SECRETS_DIR, '.env')
    config = {
        "FETCH_LIMIT": os.getenv("FETCH_LIMIT", "10"),
        "TOP_N": os.getenv("TOP_N", "10"),
        "SIMILARITY_THRESHOLD": os.getenv("SIMILARITY_THRESHOLD", "0.85"),
        "OLLAMA_MODEL": os.getenv("OLLAMA_MODEL", "qwen3:8b"),
    }
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    config[k] = v.split('#')[0].strip()
    return {"ok": True, "config": config}


@app.post('/api/config')
async def post_config(payload: dict):
    """Update .env file with new configuration."""
    env_path = os.path.join(SECRETS_DIR, '.env')
    existing = {}
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if '=' in line and not line.startswith('#'):
                    k, v = line.strip().split('=', 1)
                    existing[k] = v
    
    # Update with new values
    for k, v in payload.items():
        existing[k] = str(v)
    
    with open(env_path, 'w') as f:
        for k, v in existing.items():
            f.write(f"{k}={v}\n")
    
    # Reload environment variables for the current process
    from dotenv import load_dotenv
    load_dotenv(env_path, override=True)
    
    return {"ok": True}


@app.get('/api/secrets/status')
async def secrets_status():
    """Return which secret files exist in backend/secrets and whether the DuckDB exists."""
    targets = {
        'google_credentials': resolve_secret_path("GOOGLE_CREDENTIALS", "Google_credentials.json"),
        'google_token': resolve_secret_path("GOOGLE_TOKEN", "token.json"),
        'env': os.path.join(SECRETS_DIR, '.env'),
        'duckdb': resolve_db_path(),
        'authority_scores': resolve_secret_path("AUTHORITY_SCORES_PATH", "authority_scores.json"),
        'model_processes': resolve_secret_path("MODEL_PROCESSES_PATH", "model_processes.json")
    }
    out = {}
    for k, p in targets.items():
        out[k] = {
            'exists': os.path.exists(p),
            'path': p
        }
    return {"ok": True, "secrets": out}


def run_cmd(cmd: list, timeout: int = 600):
    """Run a command and return (ok, stdout, stderr, returncode)"""
    try:
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=timeout)
        return True, proc.stdout, proc.stderr, proc.returncode
    except Exception as e:
        return False, '', str(e), 1


@app.get('/api/ollama/status')
async def ollama_status():
    # Check whether ollama CLI is available
    ok, out, err, code = run_cmd(['which', 'ollama'], timeout=5)
    cli_available = ok and out.strip() != ''
    
    # Check if ollama server is responding
    server_up = False
    try:
        import requests
        tags_url = OLLAMA_BASE_URL.rstrip('/') + '/api/tags'
        r = requests.get(tags_url, timeout=2)
        server_up = r.status_code == 200
    except Exception:
        server_up = False

    # check running models using 'ollama ps'
    running_models = []
    if cli_available and server_up:
        ok2, ps_out, ps_err, _ = run_cmd(['ollama', 'ps'])
        if ok2 and ps_out:
            lines = ps_out.splitlines()
            if len(lines) > 1: # Skip header
                for line in lines[1:]:
                    parts = line.split()
                    if parts:
                        running_models.append(parts[0])
    
    return {
        "ok": True, 
        "cli_available": cli_available, 
        "server_up": server_up,
        "running": len(running_models) > 0, 
        "running_models": running_models
    }


@app.get('/api/models')
async def list_models():
    # Use 'ollama list' to get all downloaded models
    ok, out, err, code = run_cmd(['ollama', 'list'])
    if ok and code == 0:
        lines = out.splitlines()
        models = []
        if len(lines) > 1: # Skip header
            for l in lines[1:]:
                parts = l.split()
                if len(parts) >= 3:
                    name = parts[0]
                    size = parts[2]
                    models.append({"name": name, "size": size})
        return {"ok": True, "models": models, "raw": out}
    return {"ok": False, "models": [], "error": "ollama list failed"}


@app.post('/api/models/pull')
async def pull_model(payload: dict):
    model = payload.get('model')
    if not model:
        return {"ok": False, "error": "no model specified"}
    # Pulling can take a long time, but we'll wait for it here for simplicity
    # In a real app, this should be a background task with progress updates
    ok, out, err, code = run_cmd(['ollama', 'pull', model], timeout=3600)
    return {"ok": ok and code == 0, "out": out, "err": err, "code": code}


@app.post('/api/models/remove')
async def remove_model(payload: dict):
    model = payload.get('model')
    if not model:
        return {"ok": False, "error": "no model specified"}
    ok, out, err, code = run_cmd(['ollama', 'rm', model])
    return {"ok": ok and code == 0, "out": out, "err": err, "code": code}


@app.post('/api/models/activate')
async def activate_model(payload: dict):
    model = payload.get('model')
    if not model:
        return {"ok": False, "error": "no model specified"}
    
    # 'ollama run' starts the model. We'll run it with '/bye' to just ensure it's loaded 
    # into memory and then exit the CLI.
    ok, out, err, code = run_cmd(['ollama', 'run', model, '/bye'], timeout=60)
    if ok and code == 0:
        return {"ok": True, "message": f"Model {model} activated"}
    return {"ok": False, "error": err or "Failed to activate model"}


@app.post('/api/models/deactivate')
async def deactivate_model(payload: dict):
    model = payload.get('model')
    if not model:
        return {"ok": False, "error": "no model specified"}
    
    ok, out, err, code = run_cmd(['ollama', 'stop', model])
    if ok and code == 0:
        return {"ok": True, "message": f"Model {model} stopped"}
    return {"ok": False, "error": err or "Failed to stop model"}


@app.get('/api/newsletters')
async def get_newsletters():
    db_path = resolve_db_path()
    if not os.path.exists(db_path):
        return {"ok": True, "newsletters": []}
    con = duckdb.connect(db_path)
    try:
        # newsletter_addresses table: id, sender, email, priority
        try:
            rows = con.execute('SELECT id, sender, email, priority FROM newsletter_addresses ORDER BY sender').fetchall()
            cols = [c[0] for c in con.description]
            nl = [dict(zip(cols, r)) for r in rows]
            return {"ok": True, "newsletters": nl}
        except Exception:
            return {"ok": True, "newsletters": []}
    finally:
        con.close()


@app.post('/api/newsletters')
async def post_newsletters(payload: dict):
    items = payload.get('newsletters', [])
    db_path = resolve_db_path()
    con = duckdb.connect(db_path)
    try:
        con.execute('CREATE TABLE IF NOT EXISTS newsletter_addresses (id TEXT PRIMARY KEY, sender TEXT, email TEXT, priority INTEGER)')
        # replace contents
        con.execute('DELETE FROM newsletter_addresses')
        for it in items:
            _id = it.get('id') or str(uuid.uuid4())
            sender = it.get('sender') or ''
            email = it.get('email') or ''
            priority = int(it.get('priority') or 5)
            con.execute('INSERT INTO newsletter_addresses (id, sender, email, priority) VALUES (?, ?, ?, ?)', (_id, sender, email, priority))
        return {"ok": True, "count": len(items)}
    finally:
        con.close()


@app.get('/api/priority-keywords')
async def get_priority_keywords():
    db_path = resolve_db_path()
    if not os.path.exists(db_path):
        return {"ok": True, "keywords": []}
    con = duckdb.connect(db_path)
    try:
        try:
            rows = con.execute('SELECT keyword, score FROM priority_keywords ORDER BY keyword').fetchall()
            cols = [c[0] for c in con.description]
            kws = [dict(zip(cols, r)) for r in rows]
            return {"ok": True, "keywords": kws}
        except Exception:
            return {"ok": True, "keywords": []}
    finally:
        con.close()


@app.post('/api/priority-keywords')
async def post_priority_keywords(payload: dict):
    items = payload.get('keywords', [])
    db_path = resolve_db_path()
    con = duckdb.connect(db_path)
    try:
        con.execute('CREATE TABLE IF NOT EXISTS priority_keywords (keyword TEXT PRIMARY KEY, score DOUBLE)')
        con.execute('DELETE FROM priority_keywords')
        for kw in items:
            if isinstance(kw, dict):
                keyword = kw.get('keyword')
                score = float(kw.get('score', 1.0))
            else:
                keyword = str(kw)
                score = 1.0
            if not keyword:
                continue
            con.execute('INSERT INTO priority_keywords (keyword, score) VALUES (?, ?)', (keyword, score))
        return {"ok": True, "count": len(items)}
    finally:
        con.close()


def run_pipeline_job(newsletters: list, fetch_limit: int | None):
    global _last_run
    try:
        _last_run = {"running": True, "last_result": None}
        p = get_pipeline()
        if p is None:
            _last_run = {"running": False, "last_result": "pipeline_not_available"}
            return
        result = p.run(fetch_limit=fetch_limit or None)
        _last_run = {"running": False, "last_result": "ok"}
    except Exception as e:
        _last_run = {"running": False, "last_result": f"error: {e}"}


@app.post('/api/run')
async def run(req: RunRequest, background_tasks: BackgroundTasks):
    # Start pipeline in background to avoid blocking
    if not PIPELINE_AVAILABLE:
        return JSONResponse({"ok": False, "error": "pipeline_unavailable"}, status_code=500)

    fetch_limit = req.fetch_limit
    newsletters = req.newsletters or []
    # Start background task
    background_tasks.add_task(run_pipeline_job, newsletters, fetch_limit)
    return {"ok": True, "message": "pipeline_started"}


@app.get('/api/stories')
async def stories():
    # Read from DuckDB file used by pipeline
    db_path = resolve_db_path()
    if not os.path.exists(db_path):
        return {"ok": True, "stories": []}
    con = duckdb.connect(db_path)
    try:
        rows = con.execute('SELECT id, title, summary, linkedIn, x_post, branding_tag, action_suggestion, score, date_iso, sender_email, processed_at FROM top_stories ORDER BY processed_at DESC').fetchall()
        cols = [c[0] for c in con.description]
        stories = [dict(zip(cols, r)) for r in rows]
        return {"ok": True, "stories": stories}
    finally:
        con.close()


@app.get('/api/emails')
async def emails():
    db_path = resolve_db_path()
    if not os.path.exists(db_path):
        return {"ok": True, "emails": []}
    con = duckdb.connect(db_path)
    try:
        rows = con.execute('SELECT id, subject, sender_email, date_iso, substring(body,1,1000) as body, fetched_at FROM emails ORDER BY fetched_at DESC').fetchall()
        cols = [c[0] for c in con.description]
        emails = [dict(zip(cols, r)) for r in rows]
        return {"ok": True, "emails": emails}
    finally:
        con.close()


@app.post('/api/ai-helper')
async def ai_helper(payload: dict):
    # A simple wrapper to call the local ollama-based helper via pipeline functions
    p = get_pipeline()
    if p is None:
        return JSONResponse({"ok": False, "error": "pipeline_unavailable"}, status_code=500)
    # The pipeline module exposes generate_social etc. Use call_ollama helper if available
    try:
        from top_news_pipeline import call_ollama
        prompt = payload.get('prompt') or ''
        summary = payload.get('summary') or ''
        full_prompt = f"User prompt: {prompt}\n\nSummary:\n{summary}"
        res = call_ollama(full_prompt)
        return {"ok": True, "response": res}
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)}, status_code=500)


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('main:app', host='0.0.0.0', port=4000, reload=True)

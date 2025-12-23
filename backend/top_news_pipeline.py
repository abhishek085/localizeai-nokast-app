#!/usr/bin/env python3
import os
import json
import re
import base64
import requests
import duckdb
import uuid
from datetime import datetime, timezone, date
from typing import List, Dict, Any
from difflib import SequenceMatcher
from email.utils import parsedate_to_datetime, parseaddr
from dotenv import load_dotenv
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

# LangChain imports for chunking
try:
    from langchain_text_splitters import TokenTextSplitter
except ImportError:
    try:
        from langchain.text_splitter import TokenTextSplitter
    except ImportError:
        TokenTextSplitter = None

try:
    from langchain_core.documents import Document
except ImportError:
    try:
        from langchain.schema import Document
    except ImportError:
        class Document:
            def __init__(self, page_content, metadata=None):
                self.page_content = page_content
                self.metadata = metadata or {}

from prompts import CLEAN_PROMPT, EXTRACT_PROMPT, SOCIAL_PROMPT

load_dotenv()
# Also try loading from secrets/.env if it exists
SECRETS_ENV = os.path.join(os.path.dirname(__file__), "secrets", ".env")
if os.path.exists(SECRETS_ENV):
    load_dotenv(SECRETS_ENV, override=True)

# Env / config
# Provide sensible defaults that live in the backend/ directory so the UI can upload secrets there
BASE_DIR = os.path.dirname(__file__)
SECRETS_DIR = os.path.join(BASE_DIR, "secrets")
os.makedirs(SECRETS_DIR, exist_ok=True)

def resolve_secret_path(env_key, default_name):
    val = os.getenv(env_key)
    if not val:
        return os.path.join(SECRETS_DIR, default_name)
    if os.path.isabs(val):
        return val
    # If it's just a filename, assume it's in SECRETS_DIR
    return os.path.join(SECRETS_DIR, val)

GOOGLE_CREDENTIALS = resolve_secret_path("GOOGLE_CREDENTIALS", "Google_credentials.json")
GOOGLE_TOKEN = resolve_secret_path("GOOGLE_TOKEN", "token.json")
FETCH_LIMIT = int(os.getenv("FETCH_LIMIT", 10))
# Allow configuring the Ollama base URL (host:port) separately. If a full
# OLLAMA_URL is provided in env, prefer that; otherwise construct the generate
# endpoint from OLLAMA_BASE_URL so users can override just the host/port.
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
OLLAMA_URL = os.getenv("OLLAMA_URL", f"{OLLAMA_BASE_URL.rstrip('/')}/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen3:8b")

def resolve_db_path():
    val = os.getenv("DUCKDB_PATH")
    if not val:
        return os.path.join(BASE_DIR, "top_news.duckdb")
    if os.path.isabs(val):
        return val
    return os.path.join(BASE_DIR, val)

DUCKDB_PATH = resolve_db_path()

TOP_N = 10
SIM_THRESHOLD = float(os.getenv("SIM_THRESHOLD", 0.85))
PRIORITY_KEYWORDS = os.getenv("PRIORITY_KEYWORDS", "ai,ml,openai,gpt,model,llm,langchain,nvidia,huggingface").split(",")

AUTHORITY_SCORES = {}
try:
    # Try loading from environment variable first
    env_scores = os.getenv("AUTHORITY_SCORES")
    if env_scores:
        AUTHORITY_SCORES = json.loads(env_scores)
    else:
        # Fallback to authority_scores.json in secrets folder
        scores_path = resolve_secret_path("AUTHORITY_SCORES_PATH", "authority_scores.json")
        if os.path.exists(scores_path):
            with open(scores_path, 'r') as f:
                AUTHORITY_SCORES = json.load(f)
except Exception as e:
    print(f"[warn] Could not load authority scores: {e}")
    AUTHORITY_SCORES = {}

SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

# --- Chunking Logic (from ollama_newsletter_test.py) ---
MAX_TOKENS = 2000
OVERLAP_TOKENS = 100

def chunk_text_with_overlap(text, max_tokens=MAX_TOKENS, overlap=OVERLAP_TOKENS):
    if TokenTextSplitter is None:
        # Naive fallback
        approx = max(1000, max_tokens * 2)
        return [{"page_content": text[i:i+approx]} for i in range(0, len(text), approx)]

    splitter = TokenTextSplitter(chunk_size=max_tokens, chunk_overlap=overlap)
    chunks = None
    if hasattr(splitter, "create_documents"):
        try:
            docs = splitter.create_documents([text])
            if docs and hasattr(docs[0], "page_content"):
                return docs
            chunks = [getattr(d, "page_content", d) for d in docs]
        except Exception:
            chunks = None

    if not chunks:
        if hasattr(splitter, "split_text"):
            chunks = splitter.split_text(text)
        else:
            approx = max(1000, max_tokens * 2)
            chunks = [text[i:i+approx] for i in range(0, len(text), approx)]

    if Document is not None:
        return [Document(page_content=c) if not hasattr(c, "page_content") else c for c in chunks]

    class _Doc:
        def __init__(self, page_content):
            self.page_content = page_content
    return [_Doc(c) if not hasattr(c, "page_content") else c for c in chunks]

# --- Gmail Utilities ---
def load_newsletter_addresses(con=None) -> set:
    # Load newsletter addresses from the DuckDB table
    out = set()
    
    # If no connection provided, try to create a temporary one in read-only mode
    close_con = False
    if con is None:
        if not os.path.exists(DUCKDB_PATH):
            return out
        try:
            # Use read_only=True to avoid locking issues with the main app
            con = duckdb.connect(DUCKDB_PATH, read_only=True)
            close_con = True
        except Exception as e:
            print(f"[error] DB connection failed in load_newsletter_addresses: {e}")
            return out

    try:
        # Check if table exists first
        res = con.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'newsletter_addresses'").fetchone()
        if res and res[0] > 0:
            rows = con.execute('SELECT email FROM newsletter_addresses').fetchall()
            for r in rows:
                if r and r[0]:
                    out.add(str(r[0]).strip().lower())
            print(f"[info] Loaded {len(out)} newsletter addresses from database.")
        else:
            print("[warn] Table 'newsletter_addresses' does not exist in database.")
    except Exception as e:
        print(f"[warn] Could not read newsletter_addresses from DB: {e}")
    finally:
        if close_con and con:
            con.close()
    return out

def extract_email(from_header: str) -> str | None:
    if not from_header:
        return None
    _, email_addr = parseaddr(from_header)
    return email_addr or None

def parse_gmail_date(date_str: str) -> str | None:
    if not date_str:
        return None
    try:
        dt = parsedate_to_datetime(date_str)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    except Exception:
        return None

def get_gmail_service():
    creds = None
    if GOOGLE_TOKEN and os.path.exists(GOOGLE_TOKEN):
        creds = Credentials.from_authorized_user_file(GOOGLE_TOKEN, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(GOOGLE_CREDENTIALS, SCOPES)
            creds = flow.run_local_server(port=0)
        if GOOGLE_TOKEN:
            with open(GOOGLE_TOKEN, "w") as token:
                token.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)

def fetch_emails_from_gmail(service, max_results=FETCH_LIMIT, query="") -> List[Dict[str, Any]]:
    results = service.users().messages().list(userId="me", maxResults=max_results, q=query).execute()
    messages = results.get("messages", [])
    emails = []
    for msg in messages:
        try:
            msg_data = service.users().messages().get(userId="me", id=msg["id"], format="full").execute()
            payload = msg_data.get("payload", {})
            headers = payload.get("headers", [])
            subject = sender = date = None
            for h in headers:
                name = h.get("name", "")
                val = h.get("value")
                if name == "Subject": subject = val
                elif name == "From": sender = val
                elif name == "Date": date = val

            body = ""
            def decode_part_data(data_b64):
                try:
                    return base64.urlsafe_b64decode(data_b64).decode("utf-8", errors="ignore")
                except Exception:
                    return ""

            if "parts" in payload:
                for part in payload["parts"]:
                    mime = part.get("mimeType", "")
                    part_body = part.get("body", {})
                    if mime == "text/plain" and "data" in part_body:
                        body = decode_part_data(part_body["data"])
                        break
                    if "parts" in part:
                        for sub in part["parts"]:
                            if sub.get("mimeType") == "text/plain" and "data" in sub.get("body", {}):
                                body = decode_part_data(sub["body"]["data"])
                                break
                        if body: break
            else:
                b = payload.get("body", {}).get("data")
                if b: body = decode_part_data(b)

            emails.append({
                "id": msg["id"],
                "subject": subject,
                "sender_email": extract_email(sender),
                "date_iso": parse_gmail_date(date),
                "body": body or ""
            })
        except Exception as e:
            print(f"[error] fetching message {msg.get('id')} -> {e}")
    return emails

# --- Ollama Helpers ---
def extract_json_block(s: Any) -> Any | None:
    if isinstance(s, (dict, list)):
        if isinstance(s, dict) and "response" in s:
            return extract_json_block(s.get("response"))
        return s
    if not isinstance(s, str): return None
    text = s.strip()
    if not text: return None
    try: return json.loads(text)
    except Exception: pass
    start_idx = None
    for i, ch in enumerate(text):
        if ch in "{[":
            start_idx = i
            break
    if start_idx is None: return None
    stack = []
    for i in range(start_idx, len(text)):
        ch = text[i]
        if ch in "{[": stack.append(ch)
        elif ch in "}]" and stack:
            last = stack[-1]
            if (last == "{" and ch == "}") or (last == "[" and ch == "]"):
                stack.pop()
                if not stack:
                    try: return json.loads(text[start_idx:i+1])
                    except Exception: pass
    m = re.search(r'(\{[\s\S]*?\}|\[[\s\S]*?\])', text)
    if m:
        try: return json.loads(m.group(1))
        except Exception: pass
    return None

def call_ollama(prompt: str, model: str = OLLAMA_MODEL, format: str = None, retries: int = 2) -> Any:
    payload = {"model": model, "prompt": prompt, "stream": False}
    if format: payload["format"] = format
    headers = {"Content-Type": "application/json"}
    
    for attempt in range(retries + 1):
        try:
            # Increased timeout to 300s
            resp = requests.post(OLLAMA_URL, json=payload, headers=headers, timeout=300)
            resp.raise_for_status()
            raw = resp.text or ""
            parsed = extract_json_block(raw)
            if isinstance(parsed, dict) and "response" in parsed:
                inner = parsed.get("response")
                if isinstance(inner, (dict, list)): return inner
                if isinstance(inner, str):
                    inner_parsed = extract_json_block(inner)
                    return inner_parsed if inner_parsed is not None else inner
            return parsed if parsed is not None else raw
        except (requests.exceptions.Timeout, requests.exceptions.ConnectionError) as e:
            if attempt < retries:
                print(f"[warn] Ollama call timed out/failed, retrying ({attempt + 1}/{retries})...")
                continue
            print(f"[error] Ollama call failed after {retries} retries: {e}")
            return None
        except Exception as e:
            print(f"[error] Ollama call failed: {e}")
            return None
    return None

# --- Pipeline Logic ---
def clean_newsletter(body: str) -> str:
    prompt = CLEAN_PROMPT.format(newsletter=body)
    return str(call_ollama(prompt) or "").strip()

def extract_stories(cleaned_text: str) -> List[Dict[str, str]]:
    # Use chunking for extraction if text is long
    docs = chunk_text_with_overlap(cleaned_text)
    all_stories = []
    for doc in docs:
        prompt = EXTRACT_PROMPT.format(cleaned=doc.page_content)
        res = call_ollama(prompt, format="json")
        if isinstance(res, dict) and "stories" in res:
            all_stories.extend(res["stories"])
        elif isinstance(res, list):
            all_stories.extend(res)
    return all_stories

def generate_social(title: str, summary: str) -> Dict[str, str]:
    prompt = SOCIAL_PROMPT.format(title=title, summary=summary)
    res = call_ollama(prompt, format="json")
    if not isinstance(res, dict):
        return {"linkedIn": summary, "x_post": summary[:280], "branding_tag": "#AI", "action_suggestion": "Read more"}
    return {
        "linkedIn": res.get("linkedIn", summary),
        "x_post": res.get("x", res.get("x_post", summary[:280])),
        "branding_tag": res.get("branding_tag", "#AI"),
        "action_suggestion": res.get("action_suggestion", "Read more")
    }

# --- Scoring & Dedupe ---
def text_similarity(a: str, b: str) -> float:
    a = re.sub(r'\W+', ' ', a.lower()).strip()
    b = re.sub(r'\W+', ' ', b.lower()).strip()
    return SequenceMatcher(None, a, b).ratio()

def compute_score(story: dict, keywords: List[str]) -> float:
    score = 0.0
    text = (story.get("title", "") + " " + story.get("summary", "")).lower()
    
    # Keyword scoring
    for kw in keywords:
        if kw.lower() in text: 
            score += 1.0
            
    # Authority scoring (multiplier or bonus)
    sender = story.get("sender_email", "").lower()
    if sender in AUTHORITY_SCORES:
        # If it's a multiplier
        score *= AUTHORITY_SCORES[sender]
        # Or if it's a flat bonus, you could do: score += AUTHORITY_SCORES[sender]
        
    return score

# --- Pipeline Class ---
class NewsPipeline:
    def __init__(self, db_path=DUCKDB_PATH):
        self.db_path = db_path
        self.con = self.init_db()
        self.priority_keywords = self.load_priority_keywords()

    def load_priority_keywords(self) -> List[str]:
        try:
            res = self.con.execute("SELECT count(*) FROM information_schema.tables WHERE table_name = 'priority_keywords'").fetchone()
            if res and res[0] > 0:
                rows = self.con.execute('SELECT keyword FROM priority_keywords').fetchall()
                if rows:
                    return [r[0] for r in rows if r and r[0]]
        except Exception as e:
            print(f"[warn] Could not load priority keywords from DB: {e}")
        return PRIORITY_KEYWORDS

    def init_db(self):
        con = duckdb.connect(self.db_path)
        con.execute("""
            CREATE TABLE IF NOT EXISTS emails (
                id TEXT PRIMARY KEY,
                subject TEXT,
                sender_email TEXT,
                date_iso TEXT,
                body TEXT,
                fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS top_stories (
                id TEXT PRIMARY KEY,
                title TEXT,
                summary TEXT,
                linkedIn TEXT,
                x_post TEXT,
                branding_tag TEXT,
                action_suggestion TEXT,
                score DOUBLE,
                date_iso TEXT,
                sender_email TEXT,
                processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        # Newsletter and priority keyword tables managed via UI
        con.execute("""
            CREATE TABLE IF NOT EXISTS newsletter_addresses (
                id TEXT PRIMARY KEY,
                sender TEXT,
                email TEXT,
                priority INTEGER
            )
        """)
        con.execute("""
            CREATE TABLE IF NOT EXISTS priority_keywords (
                keyword TEXT PRIMARY KEY,
                score DOUBLE
            )
        """)
        return con

    def run(self, fetch_limit=None, top_n=None):
        print("[info] Starting Top News Pipeline")
        
        # Load config from env or defaults
        limit = fetch_limit or int(os.getenv("FETCH_LIMIT", 10))
        n_stories = top_n or int(os.getenv("TOP_N", 10))
        sim_threshold = float(os.getenv("SIMILARITY_THRESHOLD", 0.85))
        
        whitelist = load_newsletter_addresses(self.con)
        if not whitelist:
            print("[warn] No newsletters in whitelist. Skipping fetch.")
            return []

        # Build Gmail query for today's emails from whitelist
        today_str = date.today().strftime("%Y/%m/%d")
        from_query = " OR ".join([f"from:{email}" for email in whitelist])
        query = f"after:{today_str} ({from_query})"
        
        print(f"[info] Fetching emails with query: {query}")
        service = get_gmail_service()
        emails = fetch_emails_from_gmail(service, max_results=limit, query=query)
        
        if not emails:
            print("[info] No new emails found for today.")
            return []
        
        # Save emails to DB
        for e in emails:
            self.con.execute("""
                INSERT OR IGNORE INTO emails (id, subject, sender_email, date_iso, body)
                VALUES (?, ?, ?, ?, ?)
            """, (e["id"], e["subject"], e["sender_email"], e["date_iso"], e["body"]))

        all_extracted_stories = []

        for e in emails:
            print(f"[step] Processing: {e['subject']}")
            cleaned = clean_newsletter(e["body"])
            if not cleaned: continue
            stories = extract_stories(cleaned)
            for s in stories:
                s["date_iso"] = e["date_iso"]
                s["sender_email"] = e["sender_email"]
                keywords = getattr(self, 'priority_keywords', PRIORITY_KEYWORDS)
                s["score"] = compute_score(s, keywords)
                all_extracted_stories.append(s)

        # Deduplicate and Rank
        all_extracted_stories.sort(key=lambda x: x["score"], reverse=True)
        unique_stories = []
        for s in all_extracted_stories:
            if len(unique_stories) >= n_stories: break
            is_dup = False
            for u in unique_stories:
                if text_similarity(s.get("title", ""), u.get("title", "")) > sim_threshold:
                    is_dup = True
                    break
            if not is_dup:
                social = generate_social(s.get("title", ""), s.get("summary", ""))
                s.update(social)
                unique_stories.append(s)

        # Save to DuckDB
        for s in unique_stories:
            story_id = str(uuid.uuid4())
            self.con.execute("""
                INSERT INTO top_stories (id, title, summary, linkedIn, x_post, branding_tag, action_suggestion, score, date_iso, sender_email)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                story_id,
                s.get("title"),
                s.get("summary"),
                s.get("linkedIn"),
                s.get("x_post"),
                s.get("branding_tag"),
                s.get("action_suggestion"),
                s.get("score"),
                s.get("date_iso"),
                s.get("sender_email")
            ))
        
        print(f"[info] Saved {len(unique_stories)} stories to {self.db_path}")
        return unique_stories

    def get_latest_stories(self, limit=10):
        return self.con.execute("SELECT * FROM top_stories ORDER BY processed_at DESC LIMIT ?", (limit,)).df()

    def get_fetched_emails(self, limit=20):
        return self.con.execute("SELECT * FROM emails ORDER BY fetched_at DESC LIMIT ?", (limit,)).df()

    def close(self):
        self.con.close()

def main():
    pipeline = NewsPipeline()
    try:
        stories = pipeline.run()
        if stories:
            print("\n--- TOP 10 STORIES ---")
            for i, s in enumerate(stories):
                print(f"{i+1}. {s.get('title')} (Score: {s.get('score')})")
    finally:
        pipeline.close()

if __name__ == "__main__":
    main()

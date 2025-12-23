import os
import re
import json

BASE = os.path.dirname(__file__)

def _load_json():
    p = os.path.join(BASE, "prompts.json")
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

def _load_individual():
    out = {}
    for name in ("CLEAN_PROMPT", "EXTRACT_PROMPT", "SOCIAL_PROMPT"):
        p = os.path.join(BASE, f"{name}.txt")
        if os.path.exists(p):
            with open(p, "r", encoding="utf-8") as f:
                out[name] = f.read().strip()
    return out

def _load_from_prompts_txt():
    # support both "prompts.txt" and "prompt.txt"
    for fname in ("prompts.txt", "prompt.txt"):
        p = os.path.join(BASE, fname)
        if not os.path.exists(p):
            continue
        with open(p, "r", encoding="utf-8") as f:
            s = f.read()
        # headers like "### CLEAN_PROMPT" or "== CLEAN_PROMPT =="
        hdr_re = re.compile(r'^\s*(?:#+|=+|-+)\s*(CLEAN_PROMPT|EXTRACT_PROMPT|SOCIAL_PROMPT)\s*$', re.MULTILINE)
        matches = list(hdr_re.finditer(s))
        if not matches:
            # no matching headers -> put entire file into CLEAN_PROMPT
            return {"CLEAN_PROMPT": s.strip()}
        parts = {}
        for i, m in enumerate(matches):
            key = m.group(1)
            start = m.end()
            end = matches[i+1].start() if i+1 < len(matches) else len(s)
            parts[key] = s[start:end].strip()
        return parts
    return {}

# original defaults (used if no external files found)
_DEFAULTS = {
    "CLEAN_PROMPT": (
        "Aggressively clean this newsletter email. Remove: ads, sponsorship copy, subscribe/unsubscribe footers, "
        "tracking fragments, social links, repeated headers, nav bars, 'view in browser' text, and any marketing "
        "boilerplate. Preserve only legitimate news content, reporting, analysis, or actionable items. "
        "Return only the cleaned newsletter text (no explanations).\\n\\n"
        "Newsletter:\\n{newsletter}"
    ),
    "EXTRACT_PROMPT": (
        "From the cleaned newsletter text below, extract every distinct story or announcement. "
        "For each story produce a JSON entry with fields: \"title\" (short 6-12 word headline) and \"summary\" "
        "(a concise 2-4 sentence summary focused on facts and implications). DO NOT output bullet lists or "
        "other prose — return a JSON object exactly in this shape: "
        "{{\"stories\": [{{\"title\": \"...\", \"summary\": \"...\"}}, ...]}}\\n\\n"
        "Extracted content:{Extracted content}"
    ),
    "SOCIAL_PROMPT": (
        "You are a concise social media writer and content strategist. Given a story with a title and summary, "
        "produce JSON with fields: \"linkedIn\" (a 2-4 sentence LinkedIn post suitable for professionals), "
        "\"x\" (a ≤280-character post suitable for X/Twitter, punchy and factual), "
        "\"branding_tag\" (single recommended hashtag or short tag like '#AILeadership'), "
        "and \"action_suggestion\" (one short actionable suggestion, e.g. 'Comment asking about adoption', 'Share this with your team'). "
        "Return only JSON with this exact structure: "
        "{{\"linkedIn\":\"...\",\"x\":\"...\",\"branding_tag\":\"...\",\"action_suggestion\":\"...\"}}\\n\\n"
        "Title: {title}\\nSummary: {summary}"
    )
}

_loaded = {}
_loaded.update(_load_json())
_loaded.update(_load_individual())
_loaded.update(_load_from_prompts_txt())

CLEAN_PROMPT = _loaded.get("CLEAN_PROMPT", _DEFAULTS["CLEAN_PROMPT"])
EXTRACT_PROMPT = _loaded.get("EXTRACT_PROMPT", _DEFAULTS["EXTRACT_PROMPT"])
SOCIAL_PROMPT = _loaded.get("SOCIAL_PROMPT", _DEFAULTS["SOCIAL_PROMPT"])

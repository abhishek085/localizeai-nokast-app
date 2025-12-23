// Frontend API service — talks to the local FastAPI backend instead of Gemini
import { Newsletter } from '../types';

async function postJson(path: string, body: any) {
    const resp = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Backend error ${resp.status}: ${text}`);
    }
    return resp.json();
}

export const summarizeNewsletters = async (newslettersToSummarize: Newsletter[]): Promise<string> => {
    // Trigger the backend pipeline. The backend will fetch emails, run Ollama, and save to DuckDB.
    // We pass an optional list of newsletter addresses to filter immediate processing.
    const payload = { newsletters: newslettersToSummarize.map(n => n.email) };
    const data = await postJson('/api/run', payload);
    // Backend returns { ok: true, summary: string } or { ok: true, stories: [...] }
    if (data.summary) return data.summary;
    if (Array.isArray(data.stories)) {
        return data.stories.map((s: any, i: number) => `${i+1}. ${s.title}\n${s.summary}`).join('\n\n');
    }
    return JSON.stringify(data);
};

export const generateAIHelperResponse = async (summary: string, prompt: string): Promise<string> => {
    const data = await postJson('/api/ai-helper', { summary, prompt });
    return data.response ?? data.result ?? 'No response from backend';
};
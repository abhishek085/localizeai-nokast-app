

import { Newsletter, LocalModel, ModelStatus } from './types';

// Fix: Added the required 'priority' property to each newsletter object.
export const MOCK_NEWSLETTERS: Newsletter[] = [
  { id: '1', sender: 'Tech Weekly', email: 'newsletter@techweekly.com', priority: 5 },
  { id: '2', sender: 'Design Finds', email: 'hello@designfinds.co', priority: 5 },
  { id: '3', sender: 'React Status', email: 'updates@reactstatus.com', priority: 5 },
  { id: '4', sender: 'AI Breakfast', email: 'news@aibreakfast.com', priority: 5 },
  { id: '5', sender: 'Frontend Focus', email: 'alerts@frontendfocus.io', priority: 5 },
  { id: '6', sender: 'Indie Hackers', email: 'digest@indiehackers.com', priority: 5 },
];

export const MOCK_MODELS: LocalModel[] = [
    { id: '1', name: 'Mistral-7B-Instruct-v0.2', size: '3.8 GB', status: ModelStatus.Running, isActive: true },
    { id: '2', name: 'Llama-3-8B-Instruct-v1.0', size: '4.1 GB', status: ModelStatus.Idle, isActive: false },
    { id: '3', name: 'Phi-3-mini-4k-instruct', size: '2.1 GB', status: ModelStatus.NotDownloaded, isActive: false },
];

export const MOCK_SUMMARY = `
**Tech Weekly Digest:** AI advancements are accelerating, with new models achieving state-of-the-art results in language and image generation. The new M4 chip from Apple is also making headlines with its impressive performance benchmarks.

**Design Finds:** This week's focus is on brutalist web design, showcasing a curated list of websites that challenge traditional aesthetics. There's also a tutorial on creating complex animations using CSS alone.

**AI Breakfast:** A deep-dive into retrieval-augmented generation (RAG) techniques, explaining how they enhance LLM accuracy by grounding responses in external knowledge sources.
`;
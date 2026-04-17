/**
 * AI description helper — one-sentence summaries of components, used on the
 * component detail page when the source has no JSDoc. Kept small and cheap:
 * Gemini Flash-Lite, ~60 output tokens per call, cached in-process by a
 * content hash so we don't re-call on every mount.
 */

import { sanitizeForAI } from './sanitize';

export interface DescribeRequest {
  component_name: string;
  source: string;
}

export interface DescribeResult {
  ok: boolean;
  description?: string;
  cached?: boolean;
  error?: string;
  model?: string;
}

// Simple in-process LRU. Multi-instance deployments will share nothing; a
// Supabase-backed cache keyed on components.source_sha is the V2 upgrade.
const CACHE_MAX = 500;
const cache = new Map<string, string>();

function cacheKey(name: string, source: string): string {
  // Tiny fnv-like hash — we don't need cryptographic strength, just a stable
  // key that fits in a Map. Same source → same key.
  let h = 2166136261 >>> 0;
  const input = `${name}\u0000${source}`;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return `${name}:${h.toString(16)}`;
}

function cachePut(key: string, value: string) {
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_MAX) {
    const first = cache.keys().next().value;
    if (first === undefined) break;
    cache.delete(first);
  }
}

const SYSTEM_PROMPT = `You describe React components in one short sentence (<= 20 words). Plain prose, no prefix, no quotes, no code. Describe what the component is for from a product perspective, not how it is implemented.`;

export async function proposeDescription(
  req: DescribeRequest,
  opts: { apiKey?: string; model?: string } = {},
): Promise<DescribeResult> {
  const apiKey = process.env.GEMINI_API_KEY || opts.apiKey;
  const model = opts.model ?? 'gemini-2.5-flash-lite';
  if (!apiKey) {
    return { ok: false, error: 'No Gemini API key configured. Add one in Settings.' };
  }

  const key = cacheKey(req.component_name, req.source);
  const hit = cache.get(key);
  if (hit) return { ok: true, description: hit, cached: true, model };

  const safeSource = sanitizeForAI(req.source).slice(0, 6000);
  const user = `Component: ${req.component_name}\n\nSource:\n${safeSource}`;

  try {
    const raw = await callGemini({ apiKey, model, system: SYSTEM_PROMPT, user });
    const cleaned = raw.trim().replace(/^["'`]|["'`]$/g, '').slice(0, 240);
    if (!cleaned) throw new Error('Empty description.');
    cachePut(key, cleaned);
    return { ok: true, description: cleaned, cached: false, model };
  } catch (err) {
    return { ok: false, error: (err as Error).message ?? String(err), model };
  }
}

interface GeminiCallArgs {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}

async function callGemini(args: GeminiCallArgs): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
  const body = {
    systemInstruction: { role: 'system', parts: [{ text: args.system }] },
    contents: [{ role: 'user', parts: [{ text: args.user }] }],
    generationConfig: {
      temperature: 0.2,
      topP: 0.9,
      maxOutputTokens: 80,
    },
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Gemini ${res.status}: ${text.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!text) throw new Error('Empty response from model.');
  return text;
}

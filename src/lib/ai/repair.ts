/**
 * AI repair fallback.
 *
 * When the iframe runtime fails to compile or mount a component, we can ask a
 * fast, cheap model (Gemini Flash-Lite by default) to propose a patch. The
 * patch is returned as a *diff of files* — replacements keyed by the same
 * virtual paths used by `RenderConfig.files`. The caller re-attempts the
 * render with the patched files.
 *
 * This module is intentionally lightweight: it speaks plain HTTPS and has no
 * hard dependency on `@google/genai`. Drop in any compatible provider by
 * swapping `callGemini` for another client — the rest of the pipeline is
 * unchanged.
 *
 * Privacy: source code is only sent to the provider when the user has saved a
 * Gemini API key in Settings *and* opts into a repair from the Fallback
 * panel. Nothing is sent automatically.
 */

import type { RenderConfig } from '@/lib/render/types';
import { sanitizeFilesForAI, sanitizeForAI } from './sanitize';

export interface RepairRequest {
  /** The component the user was trying to render. */
  component_name: string;
  /** The file the iframe reported the error in, if known. */
  error_file?: string;
  /** The browser/runtime error message. */
  error_message: string;
  error_stack?: string;
  /** The current in-memory filesystem the iframe was using. */
  files: Record<string, string>;
  /** Dependencies already resolved via esm.sh. */
  dependencies: Record<string, string>;
}

export interface RepairPatch {
  /** Files to replace wholesale. Keyed by the same virtual path as the input. */
  files: Record<string, string>;
  /** One-line summary of what changed, surfaced in the UI. */
  explanation: string;
  /** Confidence score in [0, 1]. Low confidence → we render but warn. */
  confidence: number;
}

export interface RepairResult {
  ok: boolean;
  patch?: RepairPatch;
  error?: string;
  /** Model identifier actually used. */
  model?: string;
}

const SYSTEM_PROMPT = `You are autoDSM's render repair agent. You receive a React/TypeScript component whose source code fails to compile or mount inside a sandboxed iframe. Your job is to propose the smallest possible patch to make it render.

Rules you MUST follow:
- Only modify the files you receive. Do NOT invent new files.
- Do NOT change public prop types or default values.
- Do NOT introduce new npm dependencies.
- Prefer removing unresolved imports (replace with inlined stubs) over adding new ones.
- Keep all existing className strings untouched — they encode the design system.
- Output a single JSON object that matches the schema. No prose, no markdown fences.

JSON schema:
{
  "files": { "<path>": "<full replacement source>" },
  "explanation": "<one short sentence>",
  "confidence": <number between 0 and 1>
}`;

export function buildPrompt(req: RepairRequest): string {
  // Strip secrets and env reads before the source leaves the server.
  const safeFiles = sanitizeFilesForAI(req.files);
  const filesBlock = Object.entries(safeFiles)
    .map(([path, src]) => `--- FILE ${path} ---\n${src}`)
    .join('\n\n');
  const depsBlock = Object.keys(req.dependencies).sort().join(', ') || '(none)';
  return [
    `Component: ${req.component_name}`,
    `Dependencies available via esm.sh: ${depsBlock}`,
    req.error_file ? `Error file: ${req.error_file}` : null,
    `Error message: ${sanitizeForAI(req.error_message)}`,
    req.error_stack ? `Error stack:\n${sanitizeForAI(req.error_stack)}` : null,
    `\nFiles:\n${filesBlock}`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Proposes a patch for a failing component. Returns `{ ok: false }` if no API
 * key is configured or the provider refused.
 */
export async function proposeRepair(
  req: RepairRequest,
  opts: { apiKey?: string; model?: string } = {},
): Promise<RepairResult> {
  // Prefer the server env key so secrets don't need to ride inside request
  // bodies. Client-posted keys are only used when the server has nothing
  // configured (local dev / self-hosted without env).
  const apiKey = process.env.GEMINI_API_KEY || opts.apiKey;
  const model = opts.model ?? 'gemini-2.5-flash-lite';
  if (!apiKey) {
    return { ok: false, error: 'No Gemini API key configured. Add one in Settings.' };
  }

  try {
    const raw = await callGemini({
      apiKey,
      model,
      system: SYSTEM_PROMPT,
      user: buildPrompt(req),
    });
    const patch = parsePatch(raw, req);
    return { ok: true, patch, model };
  } catch (err) {
    return {
      ok: false,
      error: (err as Error).message ?? String(err),
      model,
    };
  }
}

interface GeminiCallArgs {
  apiKey: string;
  model: string;
  system: string;
  user: string;
}

/** Minimal fetch wrapper around Gemini's REST API. */
async function callGemini(args: GeminiCallArgs): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${args.model}:generateContent?key=${encodeURIComponent(args.apiKey)}`;
  const body = {
    systemInstruction: { role: 'system', parts: [{ text: args.system }] },
    contents: [{ role: 'user', parts: [{ text: args.user }] }],
    generationConfig: {
      temperature: 0.1,
      topP: 0.9,
      responseMimeType: 'application/json',
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

function parsePatch(raw: string, req: RepairRequest): RepairPatch {
  // The model is asked to respond with pure JSON, but be defensive.
  const trimmed = raw.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    throw new Error('Model response was not valid JSON.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Model response missing object shape.');
  }

  const obj = parsed as {
    files?: Record<string, string>;
    explanation?: string;
    confidence?: number;
  };

  const files = obj.files ?? {};
  const cleanedFiles: Record<string, string> = {};

  for (const [path, contents] of Object.entries(files)) {
    if (typeof contents !== 'string') continue;
    // Only allow paths that were in the original request to prevent the model
    // from introducing new files we can't sandbox.
    if (!(path in req.files)) continue;
    cleanedFiles[path] = contents;
  }

  return {
    files: cleanedFiles,
    explanation: typeof obj.explanation === 'string'
      ? obj.explanation.slice(0, 240)
      : 'Patch applied.',
    confidence: typeof obj.confidence === 'number'
      ? Math.max(0, Math.min(1, obj.confidence))
      : 0.5,
  };
}

/**
 * Applies a repair patch to a render config, returning a new config with the
 * patched files merged in. Pure — does not mutate its input.
 */
export function applyRepair(config: RenderConfig, patch: RepairPatch): RenderConfig {
  return { ...config, files: { ...config.files, ...patch.files } };
}

import { NextRequest, NextResponse } from 'next/server';
import { proposeRepair, type RepairRequest } from '@/lib/ai/repair';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/repair
 *
 * Body:
 *   {
 *     request: RepairRequest,
 *     // Optional client-supplied key. If omitted, falls back to GEMINI_API_KEY
 *     // on the server. Keys never leave this request — nothing is logged.
 *     apiKey?: string,
 *     model?: string
 *   }
 *
 * Response: RepairResult
 *
 * The endpoint is rate-limited by virtue of being called at most once per
 * failed render (the Fallback panel only exposes the "Repair" button after an
 * error event from the iframe runtime).
 */
export async function POST(req: NextRequest) {
  let body: { request?: RepairRequest; apiKey?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const request = body.request;
  if (!request || !request.component_name || !request.error_message || !request.files) {
    return NextResponse.json(
      { ok: false, error: 'request.component_name, request.error_message, and request.files are required.' },
      { status: 400 },
    );
  }

  const result = await proposeRepair(request, {
    apiKey: body.apiKey,
    model: body.model,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}

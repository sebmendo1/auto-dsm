import { parseRepoIdentifier } from '@/lib/github/files';
import { scanRepo } from '@/lib/scan/orchestrator';
import { saveScan, scanKey } from '@/lib/scan/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * SSE scan progress stream.
 *   GET /api/scan/stream?repo=owner/name
 * Emits:
 *   data: {"phase":"fetching","message":"Fetching repository…"}
 *   ...
 *   data: {"phase":"done","message":"Done."}
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = url.searchParams.get('repo') ?? '';
  const ref = parseRepoIdentifier(raw);
  if (!ref) {
    return new Response('Invalid repo identifier', { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (ev: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`));
      };
      try {
        const result = await scanRepo(ref.owner, ref.name, (ev) => {
          // Strip the huge `result` payload from streamed events — only the
          // cache holds the full thing. The client just needs progress.
          if (ev.phase === 'done') {
            saveScan(scanKey(ref.owner, ref.name), ev.result);
            send({ phase: 'done', message: ev.message });
          } else {
            send(ev);
          }
        });
        if (!result) {
          // scanRepo emitted an unsupported/error event itself
        }
      } catch (err) {
        send({ phase: 'error', message: String((err as Error)?.message ?? err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

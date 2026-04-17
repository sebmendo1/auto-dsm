import { NextResponse } from 'next/server';
import { IFRAME_RUNTIME_SOURCE } from '@/lib/render/iframe-runtime';

export const runtime = 'edge';

/**
 * Serves the HTML document loaded inside the render iframe.
 * The iframe has no access to parent origin cookies (we use
 * sandbox="allow-scripts" without allow-same-origin on the parent side).
 *
 * The ?css query param (optional) is a URL to a precompiled Tailwind CSS
 * bundle. The parent renders with one CSS url per repo.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const cssUrl = url.searchParams.get('css');
  const html = buildHtml(cssUrl);
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}

function buildHtml(cssUrl: string | null): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>autoDSM render</title>
    ${cssUrl ? `<link rel="stylesheet" href="${escapeHtml(cssUrl)}" />` : ''}
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        font-family: 'Sora', system-ui, sans-serif;
        color: #F5F5F7;
      }
      #root {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #root > * {
        max-width: 100%;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module">
      ${IFRAME_RUNTIME_SOURCE}
    </script>
  </body>
</html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

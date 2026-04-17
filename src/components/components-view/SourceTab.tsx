'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface Props {
  source: string;
  fileName: string;
}

export function SourceTab({ source, fileName }: Props) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Shiki is heavy; load lazily.
        const shiki = await import('shiki');
        const h = await shiki.codeToHtml(source, { lang: 'tsx', theme: 'github-dark' });
        if (!cancelled) setHtml(h);
      } catch {
        if (!cancelled) setHtml(`<pre>${escapeHtml(source)}</pre>`);
      }
    })();
    return () => { cancelled = true; };
  }, [source]);

  return (
    <div className="relative h-full overflow-auto">
      <button
        onClick={() => {
          navigator.clipboard.writeText(source);
          toast.success('Copied source', { description: fileName });
        }}
        className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-[var(--bg-elevated)] border border-t-default px-2 py-1 text-[12px] text-t-secondary hover:text-t-primary transition-base"
      >
        <Copy size={12} strokeWidth={1.5} /> Copy
      </button>
      <div
        className="px-6 py-6 text-[13px] leading-[20px] font-mono"
        // Shiki emits a <pre> with inline styles. Safe to dangerouslySetInnerHTML
        // because the payload is our own server-generated output from trusted lib.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
}

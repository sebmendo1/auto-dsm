'use client';

import { useState } from 'react';
import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import type { RenderConfig } from '@/lib/render/types';
import type { RepairPatch, RepairResult } from '@/lib/ai/repair';

interface Props {
  error: { message: string; stack?: string };
  /** Current render config — supplied when AI repair is available. */
  config?: RenderConfig;
  componentName?: string;
  onRetry?: () => void;
  /** Called with a patched config produced by the AI repair endpoint. */
  onRepair?: (patchedConfig: RenderConfig, patch: RepairPatch) => void;
}

export function FallbackPanel({ error, config, componentName, onRetry, onRepair }: Props) {
  const [open, setOpen] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairError, setRepairError] = useState<string | null>(null);

  const canRepair = Boolean(config && onRepair && componentName);

  async function runRepair() {
    if (!config || !onRepair || !componentName) return;
    setRepairing(true);
    setRepairError(null);
    try {
      const apiKey = typeof window !== 'undefined'
        ? localStorage.getItem('autodsm.gemini_key') ?? undefined
        : undefined;
      const res = await fetch('/api/ai/repair', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          request: {
            component_name: componentName,
            error_message: error.message,
            error_stack: error.stack,
            files: config.files,
            dependencies: config.dependencies,
          },
        }),
      });
      const data = (await res.json()) as RepairResult;
      if (!data.ok || !data.patch) {
        setRepairError(data.error ?? 'Repair failed. Try again.');
        return;
      }
      onRepair({ ...config, files: { ...config.files, ...data.patch.files } }, data.patch);
    } catch (e) {
      setRepairError((e as Error).message ?? 'Repair failed.');
    } finally {
      setRepairing(false);
    }
  }

  return (
    <div className="max-w-md text-center">
      <div
        className="mx-auto h-10 w-10 rounded-full flex items-center justify-center"
        style={{ background: 'var(--accent-subtle)' }}
      >
        <AlertTriangle size={20} strokeWidth={1.5} style={{ color: 'var(--warning)' }} />
      </div>
      <h3 className="mt-4 font-display font-semibold text-[16px] text-t-primary">Preview unavailable</h3>
      <p className="mt-2 text-[13px] leading-[20px] text-t-secondary">
        We couldn't render this component automatically. This is usually because of a missing provider or an unusual dependency.
      </p>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-4 text-[12px] underline underline-offset-4 text-t-tertiary hover:text-t-secondary"
      >
        {open ? 'Hide' : 'Show'} technical details
      </button>
      {open && (
        <pre className="mt-3 rounded-md border border-t-default bg-[var(--bg-code)] p-3 text-left text-[11px] font-mono text-t-primary max-h-[140px] overflow-auto whitespace-pre-wrap">
          {error.message}
          {error.stack ? '\n' + error.stack : ''}
        </pre>
      )}

      <div className="mt-4 flex items-center justify-center gap-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-[13px] font-medium text-t-primary hover:opacity-90 transition-base"
          >
            <RotateCcw size={14} strokeWidth={1.5} /> Retry render
          </button>
        )}
        {canRepair && (
          <button
            onClick={runRepair}
            disabled={repairing}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-white transition-base disabled:opacity-60"
            style={{ background: 'var(--accent)' }}
          >
            <Sparkles size={14} strokeWidth={1.5} />
            {repairing ? 'Repairing…' : 'Try AI repair'}
          </button>
        )}
      </div>

      {repairError && (
        <p className="mt-3 text-[12px]" style={{ color: 'var(--danger)' }}>
          {repairError}
        </p>
      )}
    </div>
  );
}

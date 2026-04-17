'use client';

/**
 * RenderCanvas — the parent-side React component that hosts the render iframe
 * and drives it via postMessage.
 *
 * Contract:
 *   • Accepts a RenderConfig (from the scan pipeline).
 *   • Mounts once via MOUNT.
 *   • On `props` changes (debounced 200ms), sends UPDATE_PROPS.
 *   • Reports RENDER_OK / RENDER_ERROR up via `onStatus`.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { IframeMessage, RenderConfig } from '@/lib/render/types';

const RENDER_TIMEOUT_MS = 8000;

interface Props {
  config: RenderConfig;
  props: Record<string, unknown>;
  /** Optional override for the iframe URL. Defaults to /api/render/iframe. */
  iframeUrl?: string;
  onStatus?: (status: 'loading' | 'ok' | 'error', error?: { message: string; stack?: string }) => void;
  className?: string;
}

export function RenderCanvas({ config, props, iframeUrl, onStatus, className }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settledRef = useRef(false);

  const url = useMemo(() => {
    const base = iframeUrl ?? '/api/render/iframe';
    const u = new URL(base, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    if (config.css_url) u.searchParams.set('css', config.css_url);
    return u.toString().replace(typeof window !== 'undefined' ? window.location.origin : '', '');
  }, [iframeUrl, config.css_url]);

  // Listen for messages from the iframe.
  useEffect(() => {
    settledRef.current = false;

    function handler(ev: MessageEvent<IframeMessage & { source?: string }>) {
      const data = ev.data;
      if (!data || data.source !== 'autodsm-iframe') return;
      if (data.type === 'RUNTIME_READY') {
        iframeRef.current?.contentWindow?.postMessage(
          { type: 'MOUNT', config },
          '*',
        );
        setMounted(true);
      } else if (data.type === 'RENDER_OK') {
        settledRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onStatus?.('ok');
      } else if (data.type === 'RENDER_ERROR') {
        settledRef.current = true;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        onStatus?.('error', data.error);
      }
    }
    window.addEventListener('message', handler);
    onStatus?.('loading');

    // Surface an explicit error if MOUNT never produces RENDER_OK/RENDER_ERROR.
    // Covers infinite loops, unresolved imports that hang esbuild, and blank iframes.
    timeoutRef.current = setTimeout(() => {
      if (settledRef.current) return;
      onStatus?.('error', {
        message: `Render timed out after ${RENDER_TIMEOUT_MS}ms. The component may be stuck in an infinite loop or waiting on a module that never resolves.`,
      });
    }, RENDER_TIMEOUT_MS);

    return () => {
      window.removeEventListener('message', handler);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  // Debounced prop updates.
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'UPDATE_PROPS', props },
        '*',
      );
    }, 200);
    return () => clearTimeout(t);
  }, [props, mounted]);

  return (
    <iframe
      ref={iframeRef}
      src={url}
      // IMPORTANT: no allow-same-origin — the iframe cannot touch the parent.
      sandbox="allow-scripts"
      className={className ?? 'w-full h-full border-0 bg-transparent'}
      title="component-preview"
    />
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useScanStore } from '@/stores/scan';
import { RenderCanvas } from '@/components/components-view/RenderCanvas';
import { PreferencesRail } from '@/components/components-view/PreferencesRail';
import { FallbackPanel } from '@/components/components-view/FallbackPanel';
import { SourceTab } from '@/components/components-view/SourceTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function ComponentDetailPage() {
  const params = useParams();
  const slug = String(params?.slug ?? '');
  const { result, repo } = useScanStore();
  const component = result?.components.find((c) => c.slug === slug);
  const baseRenderConfig = result?.render_configs[slug];

  const [patchedConfig, setPatchedConfig] = useState<typeof baseRenderConfig | null>(null);
  const renderConfig = patchedConfig ?? baseRenderConfig;
  const [props, setProps] = useState<Record<string, unknown>>(
    renderConfig ? { ...renderConfig.initial_props } : {},
  );
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [error, setError] = useState<{ message: string; stack?: string } | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const fileName = component ? `${component.name}.tsx` : '';
  const githubUrl = useMemo(() => {
    if (!component || !repo) return undefined;
    return `https://github.com/${repo}/blob/HEAD/${component.file_path}`;
  }, [component, repo]);

  if (!component || !renderConfig) {
    return <div className="p-10 text-t-secondary">Component not found.</div>;
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* LEFT column — top bar + tabs + render canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[56px] px-6 flex items-center border-b border-t-default">
          <span className="text-[14px] font-medium text-t-primary">{fileName}</span>
        </div>
        <Tabs defaultValue="demo" className="flex-1 flex flex-col min-h-0">
          <TabsList>
            <TabsTrigger value="demo">Demo</TabsTrigger>
            <TabsTrigger value="props">Props</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
          </TabsList>
          <TabsContent value="demo" asChild>
            <div
              className="flex-1 relative dot-grid min-h-[480px]"
              style={{ background: 'var(--bg-canvas)' }}
            >
              {status === 'error' && error ? (
                <div className="absolute inset-0 flex items-center justify-center p-6">
                  <FallbackPanel
                    error={error}
                    config={renderConfig}
                    componentName={component.name}
                    onRetry={() => {
                      setError(null);
                      setStatus('loading');
                      setRetryKey((k) => k + 1);
                    }}
                    onRepair={(patched) => {
                      setPatchedConfig(patched);
                      setError(null);
                      setStatus('loading');
                      setRetryKey((k) => k + 1);
                    }}
                  />
                </div>
              ) : (
                <RenderCanvas
                  key={retryKey}
                  config={renderConfig}
                  props={props}
                  className="w-full h-full border-0 bg-transparent"
                  onStatus={(s, err) => {
                    setStatus(s);
                    if (s === 'error') setError(err ?? { message: 'Unknown render error' });
                  }}
                />
              )}
            </div>
          </TabsContent>
          <TabsContent value="props" className="flex-1 overflow-auto">
            <PropsTable controls={renderConfig.prop_controls} />
          </TabsContent>
          <TabsContent value="source" className="flex-1 overflow-hidden">
            <SourceTab source={component.source_code} fileName={fileName} />
          </TabsContent>
        </Tabs>
      </div>

      {/* RIGHT column — preferences */}
      <PreferencesRail
        config={renderConfig}
        props={props}
        onChange={setProps}
        fileName={fileName}
        githubUrl={githubUrl}
      />
    </div>
  );
}

function PropsTable({ controls }: { controls: import('@/lib/render/types').PropControl[] }) {
  return (
    <div className="p-6">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="text-left text-t-secondary border-b border-t-default">
            <th className="py-2 pr-4 font-medium">Prop</th>
            <th className="py-2 pr-4 font-medium">Type</th>
            <th className="py-2 pr-4 font-medium">Required</th>
          </tr>
        </thead>
        <tbody>
          {controls.map((c) => (
            <tr key={c.name} className="border-b border-t-subtle">
              <td className="py-2 pr-4 font-mono text-t-primary">{c.name}</td>
              <td className="py-2 pr-4 font-mono text-t-secondary">{c.raw ?? c.type}</td>
              <td className="py-2 pr-4 text-t-tertiary">{c.required ? 'yes' : 'no'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import { Github } from 'lucide-react';
import type { RenderConfig } from '@/lib/render/types';
import { PropControl } from './PropControl';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  config: RenderConfig;
  props: Record<string, unknown>;
  onChange: (props: Record<string, unknown>) => void;
  fileName: string;
  githubUrl?: string;
}

export function PreferencesRail({ config, props, onChange, fileName, githubUrl }: Props) {
  const preset = presetLabel(config, props);

  return (
    <aside
      className="w-[320px] shrink-0 flex flex-col"
      style={{ background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-default)' }}
    >
      <div className="h-[56px] px-6 py-4 border-b border-t-default flex items-center">
        <span className="font-display font-semibold text-[16px] text-t-primary">Preferences</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {config.presets && config.presets.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[14px] font-medium text-t-primary">Configuration</label>
            <Select
              value={preset}
              onValueChange={(label) => {
                const p = config.presets!.find((x) => x.label === label);
                if (p) onChange({ ...props, ...p.props });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Label & icon" />
              </SelectTrigger>
              <SelectContent>
                {config.presets.map((p) => (
                  <SelectItem key={p.label} value={p.label}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {config.prop_controls
          .filter((c) => c.name !== 'className')
          .map((c) => (
            <PropControl
              key={c.name}
              control={c}
              value={props[c.name]}
              onChange={(v) => onChange({ ...props, [c.name]: v })}
            />
          ))}

        {githubUrl && (
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 self-end rounded-lg bg-[var(--bg-tertiary)] px-3 py-2 text-[13px] font-medium text-t-primary hover:opacity-90 transition-base"
          >
            <Github size={16} strokeWidth={1.5} />
            {fileName}
          </a>
        )}
      </div>
    </aside>
  );
}

function presetLabel(config: RenderConfig, props: Record<string, unknown>): string {
  for (const p of config.presets ?? []) {
    const match = Object.entries(p.props).every(([k, v]) => {
      if (k === 'children') return !!props.children === !!v || props.children === v;
      return props[k] === v;
    });
    if (match) return p.label;
  }
  return config.presets?.[0]?.label ?? '';
}

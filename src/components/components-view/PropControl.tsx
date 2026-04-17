'use client';

import type { PropControl as PC } from '@/lib/render/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  control: PC;
  value: unknown;
  onChange: (v: unknown) => void;
}

export function PropControl({ control, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[14px] font-medium text-t-primary">
        {prettyLabel(control.name)}
      </label>
      {renderControl(control, value, onChange)}
    </div>
  );
}

function renderControl(
  control: PC,
  value: unknown,
  onChange: (v: unknown) => void,
) {
  if (control.type === 'boolean') {
    return <BooleanToggle value={!!value} onChange={onChange} />;
  }
  if (control.type === 'enum') {
    return (
      <Select value={String(value ?? '')} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select…" />
        </SelectTrigger>
        <SelectContent>
          {(control.values ?? []).map((v) => (
            <SelectItem key={v} value={v}>{v}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
  if (control.type === 'number') {
    return (
      <Input
        type="number"
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
      />
    );
  }
  if (control.type === 'node') {
    return (
      <Input
        placeholder="Value"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (control.type === 'string') {
    return (
      <Input
        placeholder="Value"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={control.name === 'className' ? 'font-mono' : ''}
      />
    );
  }
  return (
    <div className="h-10 flex items-center px-3 rounded-lg border border-t-default bg-[var(--bg-tertiary)] text-[12px] font-mono text-t-tertiary">
      {control.raw ?? 'unknown'}
    </div>
  );
}

function BooleanToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      className="inline-flex rounded-full bg-[var(--bg-tertiary)] p-1 w-fit"
    >
      <button
        onClick={() => onChange(false)}
        className={
          'rounded-full px-3.5 py-1 text-[13px] font-medium transition-base ' +
          (!value
            ? 'bg-[var(--accent)] text-white'
            : 'text-t-secondary')
        }
      >
        Off
      </button>
      <button
        onClick={() => onChange(true)}
        className={
          'rounded-full px-3.5 py-1 text-[13px] font-medium transition-base ' +
          (value
            ? 'bg-[var(--accent)] text-white'
            : 'text-t-secondary')
        }
      >
        On
      </button>
    </div>
  );
}

function prettyLabel(name: string) {
  if (name === 'children') return 'Label text';
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_.]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

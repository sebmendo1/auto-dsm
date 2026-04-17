'use client';

import { toast } from 'sonner';
import type { Token } from '@/lib/parsers/tokens';
import { groupTokens } from '@/lib/parsers/tokens';
import { colorToTriplet } from '@/lib/utils';

const GROUP_DESCRIPTIONS: Record<string, string> = {
  Primary: 'Primary colors are used for your main brand. These are the essential pieces of your experience',
  Secondary: 'Secondary colors support the primary brand without overpowering it.',
  Accent: 'Accent colors draw attention to interactive or featured surfaces.',
  Neutral: 'Neutral colors form the scaffolding of every surface and text treatment.',
  Semantic: 'Semantic colors communicate status — success, error, warning, info.',
};

export function ColorsPage({ tokens }: { tokens: Token[] }) {
  const groups = groupTokens(tokens, 'colors');
  return (
    <div className="flex flex-col gap-16 py-8">
      {groups.map((g) => (
        <section key={g.name}>
          <h1 className="font-display font-bold text-[28px] text-t-primary">{g.name}</h1>
          <p className="mt-2 text-[15px] leading-[22px] text-t-secondary max-w-[640px]">
            {GROUP_DESCRIPTIONS[g.name] ?? 'These tokens are grouped by the prefix detected in your source.'}
          </p>
          <ul className="mt-6 flex flex-col">
            {g.tokens.map((t, i) => (
              <li
                key={t.name + i}
                className={
                  'flex items-center py-5 ' +
                  (i < g.tokens.length - 1 ? 'border-b border-t-subtle' : '')
                }
              >
                <Swatch value={t.value} />
                <div className="flex-1 min-w-0 pl-6">
                  <p className="font-medium text-[16px] text-t-primary truncate">{t.name}</p>
                  <p className="text-[13px] text-t-secondary">{t.css_variable ?? 'token'}</p>
                </div>
                <ColorValues value={t.value} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Swatch({ value }: { value: string }) {
  return (
    <div
      className="h-14 w-14 rounded-2xl border border-t-default shrink-0"
      style={{ background: value }}
      aria-label={`Swatch ${value}`}
    />
  );
}

function ColorValues({ value }: { value: string }) {
  const { hex, rgb, hsl } = colorToTriplet(value);
  const copy = (v: string) => {
    navigator.clipboard.writeText(v).then(() => toast.success('Copied', { description: v }));
  };
  return (
    <div className="text-right shrink-0 w-[200px] font-mono text-[13px] leading-[18px]">
      {hex && <button onClick={() => copy(hex)} className="block w-full text-right text-t-primary hover:underline">{hex}</button>}
      {rgb && <button onClick={() => copy(rgb)} className="block w-full text-right text-t-tertiary hover:underline">{rgb}</button>}
      {hsl && <button onClick={() => copy(hsl)} className="block w-full text-right text-t-tertiary hover:underline">{hsl}</button>}
    </div>
  );
}

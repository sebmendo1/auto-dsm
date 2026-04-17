'use client';

import type { Token } from '@/lib/parsers/tokens';

/**
 * One rendering covers spacing, radii, borders, shadows, motion, z-index, and
 * breakpoints. Each row shows a visual cue on the left + spec on the right.
 */
export function GenericTokenPage({ category, tokens }: { category: string; tokens: Token[] }) {
  return (
    <div className="py-8">
      <h1 className="font-display font-bold text-[28px] text-t-primary capitalize">{category}</h1>
      <p className="mt-2 text-[15px] leading-[22px] text-t-secondary max-w-[640px]">
        {description(category)}
      </p>
      <ul className="mt-8 flex flex-col">
        {tokens.map((t, i) => (
          <li
            key={t.name + i}
            className="grid grid-cols-[160px_1fr_auto] items-center gap-8 py-5 border-t border-t-subtle"
          >
            <Preview category={category} value={t.value} />
            <div className="min-w-0">
              <p className="font-medium text-[15px] text-t-primary truncate">{t.name}</p>
              {t.css_variable && (
                <p className="font-mono text-[12px] text-t-tertiary">{t.css_variable}</p>
              )}
            </div>
            <p className="font-mono text-[13px] text-t-primary whitespace-nowrap">{t.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function description(cat: string): string {
  switch (cat) {
    case 'spacing': return 'Spacing tokens drive every padding, margin, and gap in your application. Keep multiples consistent.';
    case 'radii': return 'Border-radius values used across your components. Small values for UI, larger for cards and modals.';
    case 'shadows': return 'Elevation tokens. Dark mode prefers borders; light mode prefers soft shadows.';
    case 'motion': return 'Transition durations and easings. Keep animations short to feel immediate.';
    case 'z-index': return 'Stacking order tokens — higher numbers render on top.';
    case 'breakpoints': return 'Viewport widths that trigger responsive layout changes.';
    case 'borders': return 'Border widths and styles available in your system.';
    default: return 'Tokens detected in your source.';
  }
}

function Preview({ category, value }: { category: string; value: string }) {
  if (category === 'spacing') {
    return (
      <div className="h-10 flex items-center">
        <div
          className="h-3 bg-[var(--accent)] rounded"
          style={{ width: cssLength(value) || '8px' }}
        />
      </div>
    );
  }
  if (category === 'radii') {
    return (
      <div
        className="h-14 w-14 border border-t-default"
        style={{ borderRadius: value, background: 'var(--bg-tertiary)' }}
      />
    );
  }
  if (category === 'borders') {
    return (
      <div className="h-14 w-14" style={{ border: `${value} solid var(--accent)`, background: 'var(--bg-tertiary)' }} />
    );
  }
  if (category === 'shadows') {
    return (
      <div
        className="h-14 w-[120px] rounded-lg"
        style={{ background: 'var(--bg-elevated)', boxShadow: value }}
      />
    );
  }
  if (category === 'motion') {
    return (
      <button
        className="h-10 w-10 rounded-lg bg-[var(--accent)]"
        style={{ transition: `transform ${value}` }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(80px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
        aria-label="Motion preview"
      />
    );
  }
  return <div className="h-10 font-mono text-[12px] text-t-tertiary flex items-center">{value}</div>;
}

function cssLength(v: string): string | undefined {
  if (!v) return undefined;
  if (/^\d/.test(v) && !v.includes(' ')) return v.match(/^(\d+)$/) ? v + 'px' : v;
  return v;
}

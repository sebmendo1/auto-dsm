'use client';

import { useState } from 'react';
import type { Token } from '@/lib/parsers/tokens';

interface Group {
  title: string;
  description: string;
  predicate: (t: Token) => boolean;
}

const GROUPS: Group[] = [
  {
    title: 'Headings',
    description:
      'There are 6 heading options in your application. Headings can be used in elements like headlines, navigation, and section headings.',
    predicate: (t) =>
      /^(h[1-6]|heading|display|title)/i.test(t.name) ||
      /^text-(4xl|5xl|6xl|7xl|8xl|3xl)/.test(t.name),
  },
  {
    title: 'Body',
    description: 'Body styles are used for long-form content like paragraphs, rich-text, and table cells.',
    predicate: (t) => /body|paragraph|lead|text-(base|lg|md|xl|2xl)/i.test(t.name),
  },
  {
    title: 'Utility',
    description: 'Utility styles cover captions, overlines, labels and other supporting UI chrome.',
    predicate: (t) => /caption|label|overline|small|mono|utility|text-(xs|sm)/i.test(t.name),
  },
];

function matchesAnyTypographyGroup(t: Token): boolean {
  return GROUPS.some((g) => g.predicate(t));
}

export function TypographyPage({ tokens }: { tokens: Token[] }) {
  const otherTypography = tokens
    .filter((t) => !matchesAnyTypographyGroup(t))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-16 py-8">
      {GROUPS.map((g) => {
        const items = tokens.filter(g.predicate);
        if (!items.length) return null;
        return (
          <section key={g.title}>
            <h1 className="font-display font-bold text-[28px] text-t-primary">{g.title}</h1>
            <p className="mt-2 text-[15px] leading-[22px] text-t-secondary max-w-[640px]">
              {g.description}
            </p>
            <ul className="mt-8 flex flex-col">
              {items.map((t, i) => (
                <TypographyRow
                  key={`${g.title}-${t.name}-${t.value}-${i}`}
                  token={t}
                  last={i === items.length - 1}
                />
              ))}
            </ul>
          </section>
        );
      })}
      {otherTypography.length > 0 ? (
        <section>
          <h1 className="font-display font-bold text-[28px] text-t-primary">Other typography</h1>
          <p className="mt-2 text-[15px] leading-[22px] text-t-secondary max-w-[640px]">
            Line heights, font weights, families, and scale tokens that did not match the heading, body, or
            utility heuristics — everything else extracted as typography from your repo.
          </p>
          <ul className="mt-8 flex flex-col">
            {otherTypography.map((t, i) => (
              <TypographyRow
                key={`other-${t.name}-${t.value}-${t.source_file ?? ''}-${i}`}
                token={t}
                last={i === otherTypography.length - 1}
              />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function TypographyRow({ token }: { token: Token; last: boolean }) {
  const [text, setText] = useState('the fox jumped over the lazy dog');
  const [editing, setEditing] = useState(false);

  const inferred = inferTypographyFields(token);
  const fromSize = parseSize(token.value);
  const meta = parseMeta(token);

  const fontFamily = inferred.fontFamily ?? meta.fontFamily;
  const fontSize = inferred.fontSize ?? fromSize.fontSize;
  const lineHeight = inferred.lineHeight ?? fromSize.lineHeight;
  const letterSpacing = inferred.letterSpacing ?? meta.letterSpacing;
  const fontWeight = inferred.fontWeight ?? meta.weight;

  const style = {
    fontFamily: fontFamily ?? 'var(--font-display)',
    fontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
  } as const;

  return (
    <li className="grid grid-cols-[380px_1fr] gap-8 py-6 border-t border-t-subtle">
      <div>
        <h3 className="font-display font-semibold text-[17px] text-t-primary">{prettyName(token.name)}</h3>
        <dl className="mt-4 grid grid-cols-[88px_1fr] gap-y-1 text-[13px]">
          <dt className="text-t-secondary">Font Family</dt>
          <dd className="text-t-primary">{fontFamily ?? '—'}</dd>
          <dt className="text-t-secondary">Size</dt>
          <dd className="text-t-primary">{fontSize ?? '—'}</dd>
          <dt className="text-t-secondary">Line Height</dt>
          <dd className="text-t-primary">{lineHeight ?? '—'}</dd>
          <dt className="text-t-secondary">Letter Spacing</dt>
          <dd className="text-t-primary">{letterSpacing ?? '—'}</dd>
        </dl>
      </div>
      <div className="flex items-center">
        {editing ? (
          <input
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={(e) => { setEditing(false); if (!e.target.value) setText('the fox jumped over the lazy dog'); }}
            className="w-full bg-transparent border-0 outline-none text-t-primary"
            style={style}
          />
        ) : (
          <span
            role="textbox"
            tabIndex={0}
            onClick={() => setEditing(true)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditing(true); }}
            className="text-t-primary cursor-text"
            style={style}
          >
            {text}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * Map Tailwind / CSS token shape to preview fields (fontSize tuple vs lineHeight-only keys, etc.).
 */
function inferTypographyFields(token: Token): {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: string;
  letterSpacing?: string;
  fontWeight?: number;
} {
  const name = token.name.toLowerCase().replace(/_/g, '-');
  const v = token.value.trim();
  const g = (token.group ?? '').toLowerCase();

  if (g === 'lineheight' || /(^|-)leading(-|$)/.test(name) || name.includes('line-height')) {
    return { lineHeight: v };
  }
  if (g === 'letterspacing' || /(^|-)tracking(-|$)/.test(name) || name.includes('letter-spacing')) {
    return { letterSpacing: v };
  }
  if (g === 'fontweight' || name.includes('font-weight') || (name.endsWith('weight') && /^\d+$/.test(v))) {
    const w = Number.parseInt(v, 10);
    return Number.isFinite(w) ? { fontWeight: w } : {};
  }
  if (
    g === 'family' ||
    name.includes('font-family') ||
    /^font-(?!weight|size|feature|variant|stretch|style)(?:[\w-]+)?$/i.test(token.name)
  ) {
    return { fontFamily: v };
  }
  return {};
}

function parseSize(value: string): { fontSize?: string; lineHeight?: string } {
  if (!value) return {};
  const trimmed = value.trim().replace(/^\[|\]$/g, '');
  const parts = trimmed.split(',').map((p) => p.replace(/['"\s]/g, ''));
  if (parts.length >= 2) return { fontSize: parts[0], lineHeight: parts[1] };
  return { fontSize: trimmed };
}

function parseMeta(token: Token): {
  fontFamily?: string;
  weight?: number;
  letterSpacing?: string;
} {
  const lower = token.name.toLowerCase();
  const weight =
    /bold/.test(lower) ? 700 :
    /semi|600/.test(lower) ? 600 :
    /medium|500/.test(lower) ? 500 :
    /light/.test(lower) ? 300 :
    undefined;
  const family =
    /mono/.test(lower) ? 'var(--font-mono)' :
    /display|heading|title/.test(lower) ? 'var(--font-display)' :
    'var(--font-sans)';
  return { fontFamily: family, weight, letterSpacing: undefined };
}

function prettyName(n: string): string {
  if (/^h1$/i.test(n)) return 'Heading 1';
  if (/^h2$/i.test(n)) return 'Heading 2';
  if (/^h3$/i.test(n)) return 'Heading 3';
  if (/^h4$/i.test(n)) return 'Heading 4';
  if (/^h5$/i.test(n)) return 'Heading 5';
  if (/^h6$/i.test(n)) return 'Heading 6';
  return n.replace(/[-_.]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

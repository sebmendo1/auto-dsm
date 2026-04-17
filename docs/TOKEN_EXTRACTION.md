# Token extraction

How autoDSM finds your design tokens in a repo, without configuration.

The parser lives at `src/lib/parsers/tokens.ts`. It runs in Node on the scan path (no browser-only APIs) and emits a flat list of `Token` records that the dashboard groups by `category`.

## Inputs — in priority order

1. **`tailwind.config.{ts,js,mjs,cjs}`** — read the `theme` and `theme.extend` objects.
2. **CSS files with `@theme { ... }`** (Tailwind 4 syntax).
3. **CSS files with `:root { --foo: ... }`** and `.dark { --foo: ... }`.
4. **DTCG JSON** — `tokens.json`, `design-tokens.json`, `src/tokens/*.json`.
5. **shadcn/ui `globals.css`** — matches the shadcn CSS-var convention.

When the same token name appears in multiple sources, higher-priority wins. This means: if you have a `tailwind.config.ts` defining `colors.primary` and a `:root { --primary: ... }`, the Tailwind value shows up.

## Token shape

```ts
interface Token {
  id: string;            // stable, unique across the scan
  name: string;          // "primary-500" or "--primary" — whatever the source used
  category: TokenCategory; // "colors" | "typography" | "spacing" | ...
  value: string;         // normalized string ("#8F23FA", "16px", "500")
  raw_value: string;     // the original value before normalization
  source: {
    file: string;        // path in the repo
    line?: number;
  };
  // Category-specific fields
  contrast_ratio?: { against: string; ratio: number }[];
  font_family?: string;
  font_weight?: number;
  font_size?: string;
  line_height?: string;
}
```

## Categories

| Category     | What lands here                                                           |
| ------------ | ------------------------------------------------------------------------- |
| `colors`     | Any value that parses as a color (hex, rgb, hsl, oklch, named).           |
| `typography` | `font-size`, `line-height`, `font-weight`, `font-family`, letter-spacing. |
| `spacing`    | Anything inside `theme.spacing` or `--spacing-*` or `--space-*`.          |
| `radii`      | `border-radius` tokens, `theme.borderRadius`.                             |
| `shadows`    | `box-shadow` tokens, `theme.boxShadow`.                                   |
| `motion`     | Durations and easings — `theme.transitionTimingFunction`, `--ease-*`.     |
| `breakpoint` | `theme.screens` and `--breakpoint-*`.                                     |
| `z-index`    | Numeric `--z-*` or `theme.zIndex`.                                        |
| `misc`       | Anything else — surfaced in Settings but not highlighted.                 |

Unknown custom properties fall into `misc`. They're still shown; we just don't group them into a special view.

## Tailwind config parsing

We don't execute the config. Executing user code server-side is a non-starter. Instead we run a regex-assisted extract:

1. Locate the `theme` object literal.
2. Walk its keys via Babel AST (JS/TS object expressions).
3. For each `colors`, `fontSize`, `spacing`, etc., recurse and flatten nested keys (`blue.500` → `blue-500`).
4. Resolve string interpolations that reference CSS vars (`rgb(var(--primary) / <alpha-value>)`) — we keep the var reference verbatim in `raw_value` and render the resolved hex (if known) in `value`.

This covers 95% of configs. Dynamically-generated token maps (`Object.fromEntries(...)`, spread from another file) are ignored with a warning in the scan log.

## CSS parsing

Pattern matches:

```css
:root {
  --bg-primary: #0b0b0f;
  --accent: oklch(63% 0.22 295);
}

.dark {
  --bg-primary: #0b0b0f;
}

@theme {
  --color-brand: #8F23FA;
}
```

We handle nesting one level deep (`.dark`, `@media (prefers-color-scheme: dark)`) and emit both light and dark variants when found. The token's `value` is always the light variant; `raw_value` for dark is stored on an adjacent token with `name: "<name>@dark"`.

## DTCG JSON

If we find a file like `tokens.json`:

```json
{
  "color": {
    "primary": { "$value": "#8F23FA", "$type": "color" }
  }
}
```

We walk the tree, resolve `$value` + `$type`, and emit tokens. Refs (`{color.primary}`) are dereferenced.

## Color normalization

All colors end up as hex for consistency:

- `rgb(143, 35, 250)` → `#8F23FA`
- `oklch(63% 0.22 295)` → approximated via the OKLCH → sRGB matrix, clamped to gamut.
- Named colors (`red`, `rebeccapurple`) → mapped via the CSS named colors table.

Contrast ratios are computed against `--bg-primary` and `--bg-secondary` at scan time (WCAG 2.1 formula) and attached to each color token as `contrast_ratio[]`. The Colors page uses these to flag any token below 4.5:1 on its primary background.

## Typography

Font family names are extracted from `@import url('...')` in CSS and `next/font` calls in TSX. We list each family and sample one specimen in the Typography page. Weights and sizes come from Tailwind `theme.fontSize` + `theme.fontWeight` and `--font-*` vars.

## What we intentionally don't do

- **We don't run the config**. No `esbuild`, no `require`, no `eval`. It's not worth the security and cold-start cost.
- **We don't emit synthetic tokens**. If a color is used inline in JSX but not declared as a token, it's not a token. (This may change — we're considering a "used colors" diagnostics view.)
- **We don't normalize casing**. If your tokens are `primaryBlue` and `primary-blue` in different files, they show up as two tokens. That's a bug in your config, not something we silently fix.

## Extending

To add a new source or category:

1. Add a parser in `src/lib/parsers/tokens.ts` returning `Token[]`.
2. Register it in `extractAllTokens()`.
3. If it's a new category, add a `<category>/page.tsx` route under `src/components/tokens/` and a case in `src/components/shell/Sidebar.tsx`.

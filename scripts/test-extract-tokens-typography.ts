import assert from 'node:assert/strict';
import { extractTokens } from '../src/lib/parsers/tokens';

const tailwindFixture = `
module.exports = {
  theme: {
    extend: {
      fontSize: { sm: ['0.875rem', { lineHeight: '1.25rem' }], hero: '3.5rem' },
      fontFamily: { sans: 'Inter, system-ui' },
      lineHeight: { snug: '1.375' },
      letterSpacing: { tight: '-0.02em' },
      fontWeight: { extrabold: '800', book: 450 },
    },
  },
};
`;

const cssFixture = `
:root {
  --font-sans: ui-sans-serif, system-ui;
  --text-sm: 0.875rem;
  --text-primary: #111113;
  --leading-custom: 1.6;
}
`;

const typo = (files: Record<string, string>) =>
  extractTokens({ files }).filter((t) => t.category === 'typography');

const fromTw = typo({ 'tailwind.config.js': tailwindFixture });
// Tuple / object fontSize values are not yet parsed by parseKVPairs; simple string entries are.
assert.ok(fromTw.some((t) => t.name === 'hero'), 'fontSize hero');
assert.ok(fromTw.some((t) => t.name === 'sans'), 'fontFamily');
assert.ok(fromTw.some((t) => t.name === 'snug' && t.group === 'lineHeight'), 'lineHeight');
assert.ok(fromTw.some((t) => t.name === 'tight' && t.group === 'letterSpacing'), 'letterSpacing');
assert.ok(fromTw.some((t) => t.name === 'extrabold' && t.group === 'fontWeight'), 'fontWeight string');
assert.ok(fromTw.some((t) => t.name === 'book' && t.group === 'fontWeight' && t.value === '450'), 'fontWeight numeric');

const allCss = extractTokens({ files: { 'src/app/globals.css': cssFixture } });
const fromCss = allCss.filter((t) => t.category === 'typography');
assert.ok(fromCss.some((t) => t.name === 'font-sans'), 'css font var');
assert.ok(fromCss.some((t) => t.name === 'text-sm'), 'css text scale as typography');
assert.ok(allCss.some((t) => t.name === 'text-primary' && t.category === 'colors'), 'text-primary color');
assert.ok(!fromCss.some((t) => t.name === 'text-primary'), 'text-primary not typography');
assert.ok(fromCss.some((t) => t.name === 'leading-custom'), 'custom leading var');

console.log('test-extract-tokens-typography: ok');

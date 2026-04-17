import assert from 'node:assert/strict';
import { sanitizeForAI, sanitizeFilesForAI } from '../src/lib/ai/sanitize';

// process.env reads are redacted.
const src1 = `const key = process.env.API_KEY; const url = process.env.NEXT_PUBLIC_URL;`;
const s1 = sanitizeForAI(src1);
assert.ok(!s1.includes('API_KEY'), 'API_KEY should be redacted');
assert.ok(!s1.includes('NEXT_PUBLIC_URL'), 'NEXT_PUBLIC_URL should be redacted');
assert.ok(s1.includes('__REDACTED__'), 'redaction sentinel present');

// 32+ char uppercase/digit strings are redacted.
const src2 = `const token = "AKIAIOSFODNN7EXAMPLE1234567890ABCD";`;
const s2 = sanitizeForAI(src2);
assert.ok(!s2.includes('AKIAIOSFODNN7EXAMPLE1234567890ABCD'), 'long token should be redacted');

// Short uppercase identifiers are not touched.
const src3 = `const TOKEN = "abc"; const FOO = BAR;`;
const s3 = sanitizeForAI(src3);
assert.ok(s3.includes('TOKEN'), 'short identifiers preserved');
assert.ok(s3.includes('FOO'), 'short identifiers preserved');
assert.ok(s3.includes('BAR'), 'short identifiers preserved');

// Bearer + token header shapes are redacted.
const src4 = `headers: { Authorization: "Bearer ghp_abcdefghijklmnopqrstuvwxyz01234567" }`;
const s4 = sanitizeForAI(src4);
assert.ok(!s4.includes('ghp_abcdefghijklmnopqrstuvwxyz01234567'), 'bearer token redacted');

// Line count is preserved so stack traces stay aligned.
const src5 = `line1\nprocess.env.SECRET\nline3\n`;
const s5 = sanitizeForAI(src5);
assert.equal(s5.split('\n').length, src5.split('\n').length, 'line count preserved');

// sanitizeFilesForAI applies per-file.
const files = sanitizeFilesForAI({
  'a.ts': 'const a = process.env.X;',
  'b.ts': 'const b = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";',
});
assert.ok(!files['a.ts'].includes('process.env.X'), 'file a redacted');
assert.ok(!files['b.ts'].includes('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'), 'file b redacted');

// Empty input is a no-op.
assert.equal(sanitizeForAI(''), '', 'empty input passthrough');

console.log('test-sanitize: ok');

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// The hub's webfonts come from assets/fonts/ (npm run sync:fonts), never from
// Google Fonts: see scripts/sync-fonts.mjs for why. consent.test.mjs checks
// that no page names a Google host; this checks the replacement is complete,
// so the page still gets Geist and Geist Mono.
const root = fileURLToPath(new URL('..', import.meta.url));
const fonts = join(root, 'assets/fonts');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
const sheet = readFileSync(join(fonts, 'fonts.css'), 'utf8');

const faces = [...sheet.matchAll(/@font-face \{([^}]*)\}/g)].map((m) => ({
  family: m[1].match(/font-family: '([^']+)';/)[1],
  file: m[1].match(/src: url\(\.\/([^)]+)\)/)[1],
  range: m[1].match(/unicode-range: ([^;]+);/)[1],
}));

test('index.html loads the self-hosted font stylesheet, once, in its head', () => {
  assert.equal(head.split('<link rel="stylesheet" href="/assets/fonts/fonts.css" />').length - 1, 1);
  assert.ok(!/fonts\.(googleapis|gstatic)\.com/.test(html), 'no Google Fonts link or preconnect');
});

test('fonts.css declares the families the page’s CSS asks for, from files that exist', () => {
  const asked = new Set([...html.matchAll(/font-family:\s*'([^']+)'/g)].map((m) => m[1]));
  assert.ok(asked.has('Geist') && asked.has('Geist Mono'), `the page asks for ${[...asked]}`);
  assert.deepEqual([...new Set(faces.map((f) => f.family))].sort(), ['Geist', 'Geist Mono']);
  for (const { family, file } of faces) assert.ok(existsSync(join(fonts, file)), `${family}: ${file}`);
  for (const family of ['Geist', 'Geist Mono']) {
    // Basic Latin is the subset every hub locale draws (names, code, numbers).
    assert.ok(faces.some((f) => f.family === family && f.range.startsWith('U+0000-00FF')), `${family} has a Basic Latin face`);
  }
});

test('each preloaded font is one the stylesheet declares', () => {
  const preloads = [...head.matchAll(/<link rel="preload" href="\/assets\/fonts\/([^"]+)" as="font" type="font\/woff2" crossorigin \/>/g)].map((m) => m[1]);
  assert.deepEqual(preloads.sort(), ['geist-latin-wght-normal.woff2', 'geist-mono-latin-wght-normal.woff2']);
  for (const file of preloads) assert.ok(faces.some((f) => f.file === file), file);
});

test('assets/fonts carries the SIL Open Font License for each family and nothing unaccounted for', () => {
  for (const licence of ['OFL-geist.txt', 'OFL-geist-mono.txt']) {
    assert.match(readFileSync(join(fonts, licence), 'utf8'), /SIL Open Font License, Version 1\.1/, licence);
    assert.ok(sheet.includes(licence), `fonts.css names ${licence}`);
  }
  const accounted = new Set(['fonts.css', 'OFL-geist.txt', 'OFL-geist-mono.txt', ...faces.map((f) => f.file)]);
  assert.deepEqual(readdirSync(fonts).filter((f) => !accounted.has(f)), []);
});

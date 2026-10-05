import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

const CONTAINER = 'GTM-5WGTTWSF';
const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['.git', 'node_modules', '.worktrees', '.playwright-cli']);

// Every HTML file Pages serves, found by walking the tree rather than listed by
// hand, so a page added later fails here until it carries the container too.
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const pages = htmlFiles(root);

test('the walk finds the hub and its move pages', () => {
  const found = pages.map((p) => relative(root, p).replaceAll('\\', '/')).sort();
  for (const expected of ['index.html', 'gitlinq/index.html', 'gitlinq/docs/index.html']) {
    assert.ok(found.includes(expected), `${expected} was not found`);
  }
});

for (const page of pages) {
  const name = relative(root, page).replaceAll('\\', '/');

  test(`${name} loads GTM once, first thing after <meta charset>`, () => {
    const html = readFileSync(page, 'utf8');
    assert.equal(html.split('googletagmanager.com/gtm.js?id=').length - 1, 1, 'exactly one GTM loader');
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    const afterCharset = head.slice(head.indexOf('<meta charset="utf-8" />') + '<meta charset="utf-8" />'.length);
    assert.ok(head.includes('<meta charset="utf-8" />'), 'the page declares its charset');
    // Only whitespace and Google's own marker comment may sit between them.
    assert.match(afterCharset, /^\s*<!-- Google Tag Manager -->\s*<script>\(function\(w,d,s,l,i\)/);
    const loader = afterCharset.match(/<script>([\s\S]*?)<\/script>/)[1];
    assert.ok(loader.includes(`'dataLayer','${CONTAINER}'`), `the loader names ${CONTAINER}`);

    // Run it: it must queue gtm.start and request gtm.js for this container.
    const inserted = [];
    const document = {
      getElementsByTagName: () => [{ parentNode: { insertBefore: (el) => inserted.push(el) } }],
      createElement: () => ({}),
    };
    const window = {};
    runInNewContext(loader, { window, document, Date });
    assert.equal(window.dataLayer[0].event, 'gtm.js');
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].async, true);
    assert.equal(inserted[0].src, `https://www.googletagmanager.com/gtm.js?id=${CONTAINER}`);
  });

  test(`${name} opens <body> with the GTM noscript`, () => {
    const html = readFileSync(page, 'utf8');
    assert.equal(html.split('googletagmanager.com/ns.html?id=').length - 1, 1, 'exactly one GTM noscript');
    const afterBody = html.slice(html.indexOf('<body>') + '<body>'.length);
    const firstElement = afterBody.replace(/^(\s|<!--[\s\S]*?-->)*/, '');
    assert.match(
      firstElement,
      new RegExp(`^<noscript><iframe src="https://www\\.googletagmanager\\.com/ns\\.html\\?id=${CONTAINER}"`),
    );
  });
}

test('the hub footer links the company privacy policy in every hub locale', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const link = html.match(/<a id="privacy-link" href="([^"]+)">([^<]+)<\/a>/);
  assert.ok(link, 'the footer carries the privacy link');
  assert.equal(link[1], 'https://devslab.kr/privacy/');
  assert.equal(link[2], '개인정보처리방침');
  assert.ok(html.slice(html.indexOf('<footer>'), html.indexOf('</footer>')).includes(link[0]), 'it sits in the footer');

  const supported = JSON.parse(html.match(/var SUPPORTED = (\[[^\]]+\]);/)[1].replaceAll("'", '"'));
  const labels = html.match(/privacy\.textContent = \((\{[\s\S]*?\})\)\[lang\];/)[1];
  const map = runInNewContext(`(${labels})`);
  assert.deepEqual(Object.keys(map).sort(), [...supported].sort(), 'one label per hub locale');
  for (const lang of supported) assert.ok(map[lang].trim(), `${lang} has a label`);
  assert.ok(!/↗/.test(link[0]) && !Object.values(map).some((l) => l.includes('↗')), 'no external-link arrow');
});

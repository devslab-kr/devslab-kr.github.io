import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('..', import.meta.url));
const html = () => readFileSync(join(root, 'index.html'), 'utf8');
const ids = Array.from({ length: 13 }, (_, index) => `O${String(index + 1).padStart(2, '0')}`);

test('renders exactly the O01 through O13 brand cards in registry order', () => {
  const page = html();
  const matches = [...page.matchAll(/data-registry-id="(O\d{2})"/g)].map((match) => match[1]);
  assert.deepEqual(matches, ids);
  for (const id of ids) assert.match(page, new RegExp(`data-registry-id="${id}"[\\s\\S]*?aria-label=`));
});

test('discovers Workspace with all fourteen translations and canonical destinations', () => {
  const page = html();
  const dictionary = runInNewContext('(' + page.match(/var I18N = (.+);/)[1] + ')');
  assert.equal(Object.keys(dictionary).length, 14);
  for (const [locale, messages] of Object.entries(dictionary)) {
    assert.ok(messages.cards.workspace, `${locale} must translate Workspace`);
    for (const adapter of ['Solid', 'React', 'Vue', 'Svelte']) assert.ok(messages.cards.workspace.includes(adapter));
  }
  const card = page.match(/<article class="card" data-registry-id="O13">([\s\S]*?)<\/article>/)[1];
  for (const href of ['/workspace/', '/workspace/demo/', 'https://github.com/devslab-kr/workspace', 'https://www.npmjs.com/package/@devslab/workspace']) {
    assert.ok(card.includes(`href="${href}"`), href);
  }
  assert.match(card, /<h3>Workspace<\/h3>/);
  assert.ok(readFileSync(join(root, 'sitemap.xml'), 'utf8').includes('<loc>https://devslab-kr.github.io/workspace/</loc>'));
});

test('preserves the separately pinned canonical Workspace light and dark marks', () => {
  const provenance = JSON.parse(readFileSync(join(root, 'assets/workspace/provenance.json'), 'utf8'));
  assert.equal(provenance.registryId, 'O13');
  assert.match(provenance.sourceCommit, /^[a-f0-9]{40}$/);
  for (const file of provenance.files) {
    const bytes = readFileSync(join(root, 'assets/workspace', file.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), file.sha256);
    assert.match(bytes.toString(), /data-oss-project="O13"/);
  }
});

test('publishes local favicon and complete canonical social metadata once', () => {
  const page = html();
  for (const name of ['canonical', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt', 'og:image:width', 'og:image:height', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    const count = (page.match(new RegExp(`(?:name|property)="${name}"`, 'g')) || []).length + (name === 'canonical' ? (page.match(/rel="canonical"/g) || []).length : 0);
    assert.equal(count, 1, `${name} must occur once`);
  }
  assert.match(page, /content="1200"/);
  assert.match(page, /content="630"/);
  assert.match(page, /href="assets\/oss-brand\/[^\"]*favicon/);
  assert.ok(existsSync(join(root, 'assets', 'oss-brand', 'og-portfolio.png')));
});

test('keeps the fourteen locale runtime, endorsement, and safe OSS atmosphere contract', () => {
  const page = html();
  const locales = ['ko', 'en', 'ja', 'zh-HK', 'zh-TW', 'hi', 'vi', 'id', 'th', 'pt-BR', 'fr', 'de', 'es', 'ar'];
  for (const locale of locales) assert.match(page, new RegExp(`data-lang="${locale.replace('-', '\\-')}"`));
  assert.match(page, /Open source by DevsLab/);
  assert.match(page, /https:\/\/devslab\.kr\/brand\/open-source\//);
  assert.match(page, /class="hero-atmosphere__glow" aria-hidden="true"/);
  assert.match(page, /pointer-events:\s*none/);
  assert.match(page, /@media \(forced-colors: active\)/);
  assert.match(page, /@media print/);
});

test('reflows the header and language menu at a 200 percent mobile zoom viewport', () => {
  const page = html();
  assert.match(page, /@media \(max-width:\s*260px\)/);
  assert.match(page, /\.brand \.word,\s*\.brand \.slash\s*{\s*display:\s*none/);
  assert.match(page, /details\.lang \.menu\s*{[^}]*width:\s*min\(11rem,\s*calc\(100vw - 1rem\)\)/s);
  assert.match(page, /details\.lang \.menu\s*{[^}]*min-width:\s*0/s);
  assert.match(page, /grid-template-columns:\s*repeat\(auto-fill,\s*minmax\(min\(280px,\s*100%\),\s*1fr\)\)/);
  assert.match(page, /@media \(max-width:\s*260px\)[\s\S]*?header\.top\s*{[^}]*backdrop-filter:\s*none/s);
  assert.match(page, /\.card p,\s*\.card h3\s*{[^}]*overflow-wrap:\s*anywhere/s);
  assert.match(page, /@media \(max-width:\s*260px\)[\s\S]*?\.card\s*{[^}]*padding:\s*0\.75rem/s);
  assert.match(page, /@media \(max-width:\s*260px\)[\s\S]*?\.card-top\s*{[^}]*flex-wrap:\s*wrap/s);
});

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import { CONSENT_MESSAGES_EN, CONSENT_MESSAGES_KO, readConsentCookie } from '@devslab/site-kit';
import { consentBootScript } from '../scripts/consent-boot.mjs';
import { GTM_ID, MEASUREMENT_IDS, POLICY_VERSION, privacyHref } from '../assets/consent/config.js';
import { CONSENT_MESSAGES, consentMessagesFor } from '../assets/consent/messages.js';

const CONTAINER = 'GTM-5WGTTWSF';
const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP = new Set(['.git', 'node_modules', '.worktrees', '.playwright-cli']);
const BOOT = `<script>${consentBootScript({ policyVersion: POLICY_VERSION, gtm: GTM_ID })}</script>`;

// Every HTML file Pages serves, found by walking the tree rather than listed by
// hand, so a page added later fails here until it carries the consent boot.
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}
const pages = htmlFiles(root);

test('the hub config names this container and its GA4 stream', () => {
  assert.equal(GTM_ID, CONTAINER);
  assert.deepEqual(MEASUREMENT_IDS, ['G-PVH5EZ8XPP']);
  assert.equal(privacyHref('ar'), 'https://devslab.kr/privacy/?lang=ar#cookies');
});

test('the walk finds the hub and its move pages', () => {
  const found = pages.map((p) => relative(root, p).replaceAll('\\', '/')).sort();
  for (const expected of ['index.html', 'gitlinq/index.html', 'gitlinq/docs/index.html']) {
    assert.ok(found.includes(expected), `${expected} was not found`);
  }
});

for (const page of pages) {
  const name = relative(root, page).replaceAll('\\', '/');

  test(`${name} asks before it loads Google: the consent boot runs first, no unconditional loader, no noscript`, () => {
    const html = readFileSync(page, 'utf8').replaceAll('\r\n', '\n');
    assert.equal(html.split(BOOT).length - 1, 1, 'exactly one consent boot script');
    assert.ok(!html.includes('googletagmanager.com/ns.html'), 'no noscript iframe (no JavaScript, no way to consent)');
    assert.ok(!html.replace(BOOT, '').includes('googletagmanager.com'), 'Google only inside the boot script’s granted branch');
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    const afterCharset = head.slice(head.indexOf('<meta charset="utf-8" />') + '<meta charset="utf-8" />'.length);
    assert.match(afterCharset, /^\s*<!-- consent:start -->\s*<script>\(function\(w,d\)\{/, 'first thing after <meta charset>');
  });
}

test('index.html loads the consent bar and has a footer control for it', () => {
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
  assert.ok(head.includes('<script type="module" src="/assets/consent/main.js"></script>'));
  const footer = html.slice(html.indexOf('<footer>'), html.indexOf('</footer>'));
  assert.match(footer, /<a id="cookie-settings-link" href="#cookie-settings" role="button" data-consent-settings data-consent-label>쿠키 설정<\/a>/);
});

// Runs the boot script the way a browser would and reports what it did.
const NOW = 1_780_000_000;
const ID = 'a'.repeat(32);
const cookieFor = (state) => {
  const c = { v: POLICY_VERSION, a: 1, t: NOW, id: ID, ...state };
  return `site_consent=v=${c.v}&a=${c.a}&t=${c.t}&id=${c.id}`;
};
function boot(cookie) {
  const inserted = [];
  const document = {
    cookie,
    querySelector: () => null,
    getElementsByTagName: () => [{ parentNode: { insertBefore: (el) => inserted.push(el) } }],
    createElement: () => ({ setAttribute() {} }),
  };
  const window = {};
  class FixedDate extends Date {
    constructor() { super(NOW * 1000); }
    static now() { return NOW * 1000; }
  }
  runInNewContext(consentBootScript({ policyVersion: POLICY_VERSION, gtm: GTM_ID }), { window, document, Date: FixedDate });
  return { gtm: inserted.map((el) => el.src), dataLayer: window.dataLayer.map((e) => ('0' in e ? Array.from(e) : e)) };
}

test('boot: no decision pushes Consent Mode defaults only and requests nothing', () => {
  const run = boot('');
  assert.deepEqual(run.gtm, []);
  assert.equal(run.dataLayer.length, 1);
  assert.deepEqual(run.dataLayer[0].slice(0, 2), ['consent', 'default']);
  assert.equal(run.dataLayer[0][2].analytics_storage, 'denied');
});

test('boot: a current grant loads this container once', () => {
  assert.deepEqual(boot(`theme=dark; ${cookieFor({})}`).gtm, [`https://www.googletagmanager.com/gtm.js?id=${CONTAINER}`]);
});

for (const [label, cookie] of [
  ['a refusal', cookieFor({ a: 0 })],
  ['an older policy version', cookieFor({ v: '2020-01-01' })],
  ['an expired grant', cookieFor({ t: NOW - 366 * 24 * 60 * 60 })],
  ['a grant from the future', cookieFor({ t: NOW + 3600 })],
  ['an extra key', `${cookieFor({})}&x=1`],
  ['a repeated key', `${cookieFor({})}&a=1`],
]) {
  test(`boot: ${label} loads nothing, as the kit agrees`, () => {
    assert.deepEqual(boot(cookie).gtm, []);
    assert.notEqual(readConsentCookie(cookie, { policyVersion: POLICY_VERSION, now: NOW * 1000 })?.a, 1);
  });
}

test('the bar strings: ko/en are the kit’s, all fourteen hub locales filled', () => {
  assert.deepEqual(CONSENT_MESSAGES.ko, CONSENT_MESSAGES_KO);
  assert.deepEqual(CONSENT_MESSAGES.en, CONSENT_MESSAGES_EN);
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  const supported = JSON.parse(html.match(/var SUPPORTED = (\[[^\]]+\]);/)[1].replaceAll("'", '"'));
  assert.deepEqual(Object.keys(CONSENT_MESSAGES).sort(), [...supported].sort());
  for (const lang of supported) {
    const m = consentMessagesFor(lang).messages;
    assert.ok(m.body.includes(m.trigger), `${lang}: the body names the footer control`);
    for (const value of Object.values(m)) assert.ok(value.trim() && !/[§↗]/.test(value), `${lang}: ${value}`);
  }
});

test('the vendored site-kit consent module is the pinned kit version', () => {
  const pinned = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies['@devslab/site-kit'];
  for (const file of ['site-kit-consent.js', 'site-kit-gtm.js']) {
    const first = readFileSync(join(root, 'assets/consent', file), 'utf8').split('\n')[0];
    assert.ok(first.includes(`@devslab/site-kit@${pinned} `), `${file}: ${first}`);
  }
});

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

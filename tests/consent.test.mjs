import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
import * as kit from '@devslab/site-kit';
import { CONSENT_MESSAGES_EN, CONSENT_MESSAGES_KO, readConsentCookie } from '@devslab/site-kit';
import { consentBootScript } from '../scripts/consent-boot.mjs';
import { GTM_ID, LEARN_MORE_SECTION, MEASUREMENT_IDS, POLICY_VERSION, learnMoreHref, privacyHref } from '../assets/consent/config.js';
import { CONSENT_MESSAGES, consentMessagesFor } from '../assets/consent/messages.js';
import { mountConsentUI } from '../assets/consent/consent-ui.js';

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

// The kit's ConsentBanner rule for learnMoreHref (site-kit 0.17.0): one #anchor, no spaces.
const ANCHORED_HREF = /^[^#\s]*#[^#\s]+$/;

test('"자세히 보기" opens the shared policy at the section devslab.kr’s bar opens, in the reader’s language', () => {
  // devslab.kr's CONSENT_LEARN_MORE_SECTION: 5, processing and transfers
  // abroad, whose Google LLC card carries the full analytics disclosure. Its
  // privacy-page test pins that the id exists in both the Korean and English
  // policy and says all of it; this pins that the hub links to the same id.
  assert.equal(LEARN_MORE_SECTION, 'processors');
  assert.equal(learnMoreHref('ko'), 'https://devslab.kr/privacy/?lang=ko#processors');
  for (const lang of Object.keys(CONSENT_MESSAGES)) {
    const href = learnMoreHref(lang);
    assert.match(href, ANCHORED_HREF, lang);
    assert.equal(new URL(href).hash, `#${LEARN_MORE_SECTION}`, lang);
    assert.equal(new URL(href).searchParams.get('lang'), lang, lang);
  }
});

// The checks run before the bar touches the DOM, so a stub window is enough.
function mountWith(options) {
  const previous = globalThis.window;
  const started = [];
  globalThis.window = { document: { documentElement: { lang: 'ko' } } };
  try {
    mountConsentUI({
      manager: { start: () => { started.push(true); throw new Error('started'); } },
      messagesFor: consentMessagesFor,
      privacyHref,
      ...options,
    });
  } catch (error) {
    return { error, started: started.length > 0 };
  } finally {
    globalThis.window = previous;
  }
  return { error: null, started: started.length > 0 };
}

test('the bar refuses a "자세히 보기" without its #anchor, before anything starts', () => {
  for (const learnMore of [undefined, () => 'https://devslab.kr/privacy/', () => 'https://devslab.kr/privacy/#', () => '#a b']) {
    const run = mountWith({ learnMoreHref: learnMore });
    assert.ok(run.error instanceof RangeError, `${learnMore}: ${run.error}`);
    assert.equal(run.started, false, 'the consent manager never started');
  }
  const ok = mountWith({ learnMoreHref });
  assert.equal(ok.error?.message, 'started', 'with the hub’s href the mount goes on to start the manager');
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
  const keys = Object.keys(CONSENT_MESSAGES_KO).sort();
  for (const lang of supported) {
    const m = consentMessagesFor(lang).messages;
    assert.deepEqual(Object.keys(m).sort(), keys, `${lang}: the kit's keys, learnMore and cancel included`);
    assert.ok(m.settingsIntro.includes(m.trigger), `${lang}: the settings intro names the footer control`);
    for (const value of Object.values(m)) assert.ok(value.trim() && !/[§↗]/.test(value), `${lang}: ${value}`);
    // Short copy: the recipient, country and retention period live in the policy's analytics section, not here.
    for (const value of Object.values(m)) assert.ok(!/Google|LLC|14/.test(value), `${lang}: ${value}`);
  }
});

test('the vendored site-kit consent module is the installed kit version, which package.json pins', () => {
  const range = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).devDependencies['@devslab/site-kit'];
  const kitDir = join(fileURLToPath(import.meta.resolve('@devslab/site-kit')), '..', '..', '..');
  const installed = JSON.parse(readFileSync(join(kitDir, 'package.json'), 'utf8')).version;
  assert.equal(range, `^${installed}`, 'package.json pins the installed kit at its own caret range');
  for (const file of ['site-kit-consent.js', 'site-kit-gtm.js']) {
    const first = readFileSync(join(root, 'assets/consent', file), 'utf8').split('\n')[0];
    assert.ok(first.includes(`@devslab/site-kit@${installed} `), `${file}: ${first}`);
  }
});

// Every value the hub's own code imports from the kit, found by reading the
// import statements, exists at runtime: 0.16.0's entry declared consent
// exports its runtime did not have (CONSENT_RECORD_MAX_BYTES and others).
test('every name the hub imports from @devslab/site-kit is a real runtime export', () => {
  const sources = ['scripts', 'tests'].flatMap((dir) =>
    readdirSync(join(root, dir)).filter((f) => f.endsWith('.mjs')).map((f) => join(root, dir, f)),
  );
  const names = new Set();
  for (const file of sources) {
    const code = readFileSync(file, 'utf8');
    for (const match of code.matchAll(/import\s*\{([^}]*)\}\s*from\s*['"]@devslab\/site-kit['"]/g)) {
      for (const name of match[1].split(',').map((n) => n.trim().split(/\s+as\s+/)[0]).filter(Boolean)) names.add(name);
    }
  }
  for (const expected of ['CONSENT_COOKIE_NAME', 'CONSENT_MAX_AGE_SECONDS', 'consentHeadScript', 'readConsentCookie']) {
    assert.ok(names.has(expected), `${expected} is among the imports found`);
  }
  for (const name of names) assert.notEqual(kit[name], undefined, `${name} exists at runtime`);
  assert.equal(kit.CONSENT_MAX_AGE_SECONDS, 365 * 24 * 60 * 60, 'the boot script’s twelve months');
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

/**
 * Keeps the hub's analytics consent in step with @devslab/site-kit:
 *
 *   1. vendors the kit's framework-free consent module (src/core/consent.mjs
 *      and the gtm.mjs it imports) into assets/consent/ as plain .js files,
 *      so GitHub Pages serves them without a build step;
 *   2. writes the head boot script (scripts/consent-boot.mjs) into every HTML
 *      page, between <!-- consent:start --> and <!-- consent:end -->.
 *
 * `--check` changes nothing and fails if either is stale (npm test runs it).
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consentBootScript } from './consent-boot.mjs';
import { GTM_ID, POLICY_VERSION } from '../assets/consent/config.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const check = process.argv.includes('--check');
// The package exports only its entry (src/core/index.mjs); its root is two levels up.
const kitDir = join(dirname(fileURLToPath(import.meta.resolve('@devslab/site-kit'))), '..', '..');
const kitVersion = JSON.parse(readFileSync(join(kitDir, 'package.json'), 'utf8')).version;
const SKIP = new Set(['.git', 'node_modules', '.worktrees', '.playwright-cli']);
const stale = [];

const sameText = (a, b) => a.replaceAll('\r\n', '\n') === b.replaceAll('\r\n', '\n');
function sync(path, next) {
  let current = null;
  try {
    current = readFileSync(path, 'utf8');
  } catch {
    // a new file
  }
  if (current !== null && sameText(current, next)) return;
  if (check) stale.push(relative(root, path).replaceAll('\\', '/'));
  else writeFileSync(path, current?.includes('\r\n') ? next.replace(/\r?\n/g, '\r\n') : next);
}

// 1. The kit's consent module, as files a static host serves as JavaScript.
const header = (file) =>
  `// Vendored from @devslab/site-kit@${kitVersion} src/core/${file} by scripts/sync-consent.mjs — do not edit.\n`;
const gtm = readFileSync(join(kitDir, 'src/core/gtm.mjs'), 'utf8');
const consent = readFileSync(join(kitDir, 'src/core/consent.mjs'), 'utf8');
if (!consent.includes('from "./gtm.mjs";')) throw new Error('site-kit consent.mjs no longer imports ./gtm.mjs as expected');
sync(join(root, 'assets/consent/site-kit-gtm.js'), header('gtm.mjs') + gtm);
sync(join(root, 'assets/consent/site-kit-consent.js'), header('consent.mjs') + consent.replace('from "./gtm.mjs";', 'from "./site-kit-gtm.js";'));

// 2. The boot script on every page.
const boot = consentBootScript({ policyVersion: POLICY_VERSION, gtm: GTM_ID });
const block = /([ \t]*)<!-- consent:start -->[\s\S]*?<!-- consent:end -->/;
function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}
for (const page of htmlFiles(root)) {
  const html = readFileSync(page, 'utf8');
  const match = html.match(block);
  if (!match) throw new Error(`${relative(root, page)} has no <!-- consent:start --> block`);
  const indent = match[1];
  sync(page, html.replace(block, () => `${indent}<!-- consent:start -->\n${indent}<script>${boot}</script>\n${indent}<!-- consent:end -->`));
}

if (stale.length) {
  console.error(`Consent files are stale — run npm run sync:consent:\n  ${stale.join('\n  ')}`);
  process.exit(1);
}
console.log(check ? 'consent files are current' : `consent synced (site-kit ${kitVersion})`);

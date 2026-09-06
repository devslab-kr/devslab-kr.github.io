import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join, posix, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const source = resolve(process.env.OSS_BRAND_DIST ?? 'C:/Users/jlc48/workspace/oss-brand/dist');
const output = join(root, 'scripts', 'oss-brand-v0.3.0.manifest.json');

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(join(directory, entry.name), relative));
    if (entry.isFile()) files.push(relative);
  }
  return files.sort();
}

const packageRoot = resolve(source, '..');
const packageJson = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8'));
if (packageJson.name !== '@devslab/oss-brand' || packageJson.version !== '0.3.0') {
  throw new Error('Expected @devslab/oss-brand 0.3.0');
}

const { stdout } = await execFileAsync('git', ['-C', packageRoot, 'rev-parse', 'v0.3.0^{}']);
const sourceCommit = stdout.trim();
try {
  await execFileAsync('git', ['-C', packageRoot, 'diff', '--quiet', sourceCommit, '--', 'dist']);
} catch {
  throw new Error('Refusing to generate a manifest from a dist tree that differs from v0.3.0');
}

const paths = await listFiles(source);
if (paths.length !== 305) throw new Error(`Expected 305 release files, found ${paths.length}`);
const files = await Promise.all(paths.map(async (path) => ({
  path,
  sha256: createHash('sha256').update(await readFile(join(source, path))).digest('hex'),
})));

await writeFile(output, `${JSON.stringify({ version: packageJson.version, source: source.replaceAll('\\', '/'), sourceCommit, files }, null, 2)}\n`);
console.log(`Generated immutable OSS Q-line v${packageJson.version} manifest with ${files.length} files.`);

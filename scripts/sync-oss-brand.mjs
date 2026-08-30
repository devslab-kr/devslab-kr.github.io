import { createHash } from 'node:crypto';
import { cp, lstat, mkdir, readFile, readdir, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const manifestPath = join(root, 'scripts', 'oss-brand-v0.1.1.manifest.json');
const target = join(root, 'assets', 'oss-brand');

function hash(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function assertSafeRelative(path) {
  if (!path || path.includes('\\') || path.startsWith('/') || path.includes('../') || path === '..') {
    throw new Error('Unsafe brand asset path: ' + path);
  }
}

function overlaps(left, right) {
  const relation = relative(left, right);
  return relation === '' || (!relation.startsWith('..' + sep) && relation !== '..' && !relation.includes('..' + sep));
}

async function listFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix + entry.name;
    const fullPath = join(directory, entry.name);
    const status = await lstat(fullPath);
    if (status.isSymbolicLink() || (!status.isFile() && !status.isDirectory())) {
      throw new Error('Brand source contains a symlink, junction, or unsupported entry: ' + relativePath);
    }
    if (status.isDirectory()) files.push(...await listFiles(fullPath, relativePath + '/'));
    else files.push(relativePath);
  }
  return files.sort();
}

async function verifyChecksums(source, manifest) {
  const sourceFiles = await listFiles(source);
  const expected = manifest.files.map((file) => file.path).sort();
  if (JSON.stringify(sourceFiles) !== JSON.stringify(expected)) {
    throw new Error('Pinned OSS brand source has extra, missing, or renamed files');
  }
  for (const file of manifest.files) {
    assertSafeRelative(file.path);
    const contents = await readFile(join(source, file.path));
    if (hash(contents) !== file.sha256) throw new Error('Checksum mismatch: ' + file.path);
  }

  const zipChecksums = await readFile(join(source, 'downloads', 'SHA256SUMS.txt'), 'utf8');
  for (const line of zipChecksums.trim().split(/\r?\n/)) {
    const [expectedHash, file] = line.trim().split(/\s{2,}/);
    assertSafeRelative('downloads/' + file);
    if (hash(await readFile(join(source, 'downloads', file))) !== expectedHash) {
      throw new Error('Release ZIP checksum mismatch: ' + file);
    }
  }

  const projects = manifest.files.map((file) => file.path.split('/')[0])
    .filter((value, index, values) => values.indexOf(value) === index);
  for (const project of projects) {
    const checksumPath = join(source, project, 'checksums.txt');
    try {
      const contents = await readFile(checksumPath, 'utf8');
      for (const line of contents.trim().split(/\r?\n/)) {
        const [expectedHash, file] = line.trim().split(/\s{2,}/);
        assertSafeRelative(project + '/' + file);
        if (hash(await readFile(join(source, project, file))) !== expectedHash) {
          throw new Error('Internal asset checksum mismatch: ' + project + '/' + file);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
}

const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (manifest.version !== '0.1.1' || manifest.files.length !== 292) {
  throw new Error('Expected immutable OSS brand v0.1.1 manifest with 292 files');
}
const source = await realpath(manifest.source);
const resolvedTarget = resolve(target);
if (overlaps(source, resolvedTarget) || overlaps(resolvedTarget, source)) {
  throw new Error('Refusing overlapping OSS brand source and target paths');
}
await verifyChecksums(source, manifest);

const stage = join(root, '.oss-brand-stage-' + process.pid);
await rm(stage, { recursive: true, force: true });
await mkdir(stage, { recursive: true });
try {
  await cp(source, stage, { recursive: true, verbatimSymlinks: true, errorOnExist: true });
  await writeFile(join(stage, 'snapshot.json'), JSON.stringify({
    version: manifest.version,
    source: manifest.source,
    files: manifest.files,
  }, null, 2) + '\n');
  await rm(resolvedTarget, { recursive: true, force: true });
  await mkdir(dirname(resolvedTarget), { recursive: true });
  await rename(stage, resolvedTarget);
  console.log('Synced ' + manifest.files.length + ' checksum-verified OSS brand files from v' + manifest.version + '.');
} catch (error) {
  await rm(stage, { recursive: true, force: true });
  throw error;
}

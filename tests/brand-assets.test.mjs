import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { readZipEntries, replaceDirectoryAtomically, verifyProjectZip, verifyTreeAgainstManifest } from '../scripts/oss-brand-sync-lib.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const snapshotPath = join(root, 'assets', 'oss-brand', 'snapshot.json');

test('vendors the pinned 0.3.0 OSS Q-line brand snapshot with all 305 verified files', () => {
  assert.ok(existsSync(snapshotPath), 'snapshot metadata must exist');
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  assert.equal(snapshot.version, '0.3.0');
  assert.equal(snapshot.files.length, 305);
  for (const file of snapshot.files) {
    const target = join(root, 'assets', 'oss-brand', file.path);
    assert.ok(existsSync(target), `${file.path} must be vendored`);
    const hash = createHash('sha256').update(readFileSync(target)).digest('hex');
    assert.equal(hash, file.sha256, `${file.path} must match its pinned hash`);
  }
  for (const special of ['og-portfolio.png', 'atmosphere.css', 'downloads/SHA256SUMS.txt']) {
    assert.ok(existsSync(join(root, 'assets', 'oss-brand', special)), `${special} must be available locally`);
  }
});

test('validates ZIP internals and rejects unsafe paths and symlink entries', () => {
  const zipPath = join(root, 'assets', 'oss-brand', 'downloads', 'editor-ruler.zip');
  const source = readFileSync(zipPath);
  assert.doesNotThrow(() => verifyProjectZip(source, 'editor-ruler'));

  const unsafe = Buffer.from(source);
  const central = unsafe.indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]));
  const nameOffset = central + 46;
  unsafe[nameOffset] = 0x2f;
  assert.throws(() => readZipEntries(unsafe), /Unsafe ZIP path/);

  const symlink = Buffer.from(source);
  symlink.writeUInt16LE(3 << 8, central + 4);
  symlink.writeUInt32LE(0xa1ff0000, central + 38);
  assert.throws(() => readZipEntries(symlink), /symlink or unsupported entry/);

  const disguisedSymlink = Buffer.from(source);
  disguisedSymlink.writeUInt16LE(0, central + 4);
  disguisedSymlink.writeUInt32LE(0xa1ff0000, central + 38);
  assert.throws(() => readZipEntries(disguisedSymlink), /symlink or unsupported entry/);

  const junction = Buffer.from(source);
  junction.writeUInt16LE(0, central + 4);
  junction.writeUInt32LE(0x00000400, central + 38);
  assert.throws(() => readZipEntries(junction), /reparse point or unsupported entry/);
});

test('rejects a staged tree changed after its source was verified', async () => {
  const stage = await mkdtemp(join(tmpdir(), 'oss-brand-stage-'));
  const original = Buffer.from('original');
  const manifest = { files: [{ path: 'asset.txt', sha256: createHash('sha256').update(original).digest('hex') }] };
  await writeFile(join(stage, 'asset.txt'), original);
  await assert.doesNotReject(() => verifyTreeAgainstManifest(stage, manifest));
  await writeFile(join(stage, 'asset.txt'), 'changed after verification');
  await assert.rejects(() => verifyTreeAgainstManifest(stage, manifest), /Checksum mismatch/);
  await rm(stage, { recursive: true, force: true });

  const syncSource = readFileSync(join(root, 'scripts', 'sync-oss-brand.mjs'), 'utf8');
  const copyIndex = syncSource.indexOf('await cp(source, stage');
  const stageVerifyIndex = syncSource.indexOf('await verifyChecksums(stage, manifest)');
  const installIndex = syncSource.indexOf('await replaceDirectoryAtomically(stage, resolvedTarget)');
  assert.ok(copyIndex >= 0 && stageVerifyIndex > copyIndex && installIndex > stageVerifyIndex,
    'the copied stage must receive the full checksum and ZIP validation before installation');
});

test('restores the previous snapshot when the staged rename fails', async () => {
  const parent = await mkdtemp(join(tmpdir(), 'oss-brand-atomic-'));
  const stage = join(parent, 'stage');
  const target = join(parent, 'target');
  const backup = join(parent, 'backup');
  await mkdir(stage);
  await mkdir(target);
  await writeFile(join(stage, 'new.txt'), 'new');
  await writeFile(join(target, 'old.txt'), 'old');
  let renameCount = 0;
  await assert.rejects(() => replaceDirectoryAtomically(stage, target, {
    backup,
    renamePath: async (source, destination) => {
      renameCount += 1;
      if (renameCount === 2) throw new Error('simulated install failure');
      await rename(source, destination);
    },
  }), /simulated install failure/);
  assert.equal(await readFile(join(target, 'old.txt'), 'utf8'), 'old');
  assert.equal(await readFile(join(stage, 'new.txt'), 'utf8'), 'new');
  assert.equal(existsSync(backup), false);
  await rm(parent, { recursive: true, force: true });
});

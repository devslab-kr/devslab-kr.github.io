import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const snapshotPath = join(root, 'assets', 'oss-brand', 'snapshot.json');

test('vendors the pinned 0.1.1 OSS brand snapshot with all 292 verified files', () => {
  assert.ok(existsSync(snapshotPath), 'snapshot metadata must exist');
  const snapshot = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  assert.equal(snapshot.version, '0.1.1');
  assert.equal(snapshot.files.length, 292);
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

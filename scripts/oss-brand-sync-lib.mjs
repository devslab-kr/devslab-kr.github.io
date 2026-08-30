import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, rename, rm } from 'node:fs/promises';
import { join, posix } from 'node:path';
import { inflateRawSync } from 'node:zlib';

const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;
const END_SIGNATURE = 0x06054b50;
const UNIX_FILE_TYPE_MASK = 0xf000;
const UNIX_DIRECTORY = 0x4000;
const UNIX_REGULAR_FILE = 0x8000;

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex');
}

export function assertSafeArchivePath(name) {
  const normalized = posix.normalize(name);
  if (!name || name.includes('\\') || name.startsWith('/') || /^[A-Za-z]:/.test(name)
    || normalized === '..' || normalized.startsWith('../') || normalized !== name.replace(/\/$/, '')) {
    throw new Error('Unsafe ZIP path: ' + name);
  }
}

function findEndRecord(buffer) {
  const minimum = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minimum; offset -= 1) {
    if (buffer.readUInt32LE(offset) === END_SIGNATURE) return offset;
  }
  throw new Error('ZIP end record is missing');
}

export function readZipEntries(buffer) {
  const end = findEndRecord(buffer);
  const entryCount = buffer.readUInt16LE(end + 10);
  const centralSize = buffer.readUInt32LE(end + 12);
  const centralOffset = buffer.readUInt32LE(end + 16);
  if (centralOffset + centralSize > end) throw new Error('ZIP central directory is out of bounds');

  const entries = new Map();
  let cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) throw new Error('Invalid ZIP central directory entry');
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const madeBy = buffer.readUInt16LE(cursor + 4) >> 8;
    const externalAttributes = buffer.readUInt32LE(cursor + 38);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    if ((flags & 1) !== 0) throw new Error('Encrypted ZIP entries are not supported');
    const name = buffer.subarray(cursor + 46, cursor + 46 + nameLength).toString('utf8');
    const isDirectory = name.endsWith('/');
    const safeName = isDirectory ? name.slice(0, -1) : name;
    assertSafeArchivePath(safeName);
    if (entries.has(safeName)) throw new Error('Duplicate ZIP path: ' + safeName);

    const fileType = (externalAttributes >>> 16) & UNIX_FILE_TYPE_MASK;
    if (fileType === 0xa000) {
      throw new Error('ZIP contains a symlink or unsupported entry: ' + safeName);
    }
    if (madeBy === 3) {
      const expectedType = isDirectory ? UNIX_DIRECTORY : UNIX_REGULAR_FILE;
      if (fileType !== 0 && fileType !== expectedType) {
        throw new Error('ZIP contains a symlink or unsupported entry: ' + safeName);
      }
    }
    if ((externalAttributes & 0x00000400) !== 0) {
      throw new Error('ZIP contains a reparse point or unsupported entry: ' + safeName);
    }
    if (buffer.readUInt32LE(localOffset) !== LOCAL_SIGNATURE) throw new Error('Invalid ZIP local entry');
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const localName = buffer.subarray(localOffset + 30, localOffset + 30 + localNameLength).toString('utf8');
    if (localName !== name) throw new Error('ZIP local and central paths differ: ' + safeName);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    if (compressed.length !== compressedSize) throw new Error('ZIP entry data is out of bounds: ' + safeName);
    let contents;
    if (method === 0) contents = Buffer.from(compressed);
    else if (method === 8) contents = inflateRawSync(compressed);
    else throw new Error('Unsupported ZIP compression method: ' + method);
    if (contents.length !== uncompressedSize) throw new Error('ZIP entry size mismatch: ' + safeName);
    entries.set(safeName, { contents, isDirectory });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  if (cursor !== centralOffset + centralSize) throw new Error('ZIP central directory size mismatch');
  return entries;
}

async function listTreeFiles(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relativePath = prefix + entry.name;
    const fullPath = join(directory, entry.name);
    const status = await lstat(fullPath);
    if (status.isSymbolicLink() || (!status.isFile() && !status.isDirectory())) {
      throw new Error('Brand source contains a symlink, junction, or unsupported entry: ' + relativePath);
    }
    if (status.isDirectory()) files.push(...await listTreeFiles(fullPath, relativePath + '/'));
    else files.push(relativePath);
  }
  return files.sort();
}

export async function verifyTreeAgainstManifest(directory, manifest) {
  const actual = await listTreeFiles(directory);
  const expected = manifest.files.map((file) => file.path).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error('Pinned OSS brand source has extra, missing, or renamed files');
  }
  for (const file of manifest.files) {
    assertSafeArchivePath(file.path);
    if (sha256(await readFile(join(directory, file.path))) !== file.sha256) {
      throw new Error('Checksum mismatch: ' + file.path);
    }
  }
}

export function verifyProjectZip(buffer, project) {
  const entries = readZipEntries(buffer);
  const checksumEntry = entries.get('checksums.txt');
  if (!checksumEntry || checksumEntry.isDirectory) throw new Error(project + ' ZIP is missing checksums.txt');
  const expectedFiles = new Set();
  for (const line of checksumEntry.contents.toString('utf8').trim().split(/\r?\n/)) {
    const match = /^([a-f0-9]{64})  (.+)$/.exec(line);
    if (!match) throw new Error(project + ' ZIP has an invalid checksum line');
    const [, expectedHash, name] = match;
    assertSafeArchivePath(name);
    if (expectedFiles.has(name)) throw new Error(project + ' ZIP repeats a checksum path: ' + name);
    expectedFiles.add(name);
    const entry = entries.get(name);
    if (!entry || entry.isDirectory) throw new Error(project + ' ZIP is missing checked file: ' + name);
    if (sha256(entry.contents) !== expectedHash) throw new Error(project + ' ZIP checksum mismatch: ' + name);
  }
  const actualFiles = [...entries.entries()].filter(([, entry]) => !entry.isDirectory)
    .map(([name]) => name).filter((name) => name !== 'checksums.txt').sort();
  if (JSON.stringify(actualFiles) !== JSON.stringify([...expectedFiles].sort())) {
    throw new Error(project + ' ZIP contains unchecked files');
  }
}

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export async function replaceDirectoryAtomically(stage, target, options = {}) {
  const renamePath = options.renamePath ?? rename;
  const removePath = options.removePath ?? rm;
  const backup = options.backup ?? target + '.backup-' + process.pid + '-' + Date.now();
  const hadTarget = await pathExists(target);
  let movedExisting = false;
  let installed = false;
  try {
    if (hadTarget) {
      await renamePath(target, backup);
      movedExisting = true;
    }
    await renamePath(stage, target);
    installed = true;
    if (movedExisting) await removePath(backup, { recursive: true, force: true });
  } catch (error) {
    if (!installed && movedExisting) {
      try {
        await renamePath(backup, target);
      } catch (restoreError) {
        throw new AggregateError([error, restoreError], 'OSS brand install failed and the previous snapshot could not be restored');
      }
    }
    throw error;
  }
}

export async function verifyProjectZipFile(path, project) {
  verifyProjectZip(await readFile(path), project);
}

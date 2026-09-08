import assert from 'node:assert/strict';
import test from 'node:test';

const module = await import('../assets/gitlinq/release.js').catch(() => ({}));
const releasePage = 'https://github.com/devslab-kr/gitlinq-releases/releases/latest';
const base = 'https://github.com/devslab-kr/gitlinq-releases/releases/download/v0.2.2/';
const installer = 'GitLinq-0.2.2-windows-x64-setup.exe';
const portable = 'GitLinq-0.2.2-windows-x64-portable.zip';
const asset = (name) => ({ name, state: 'uploaded', size: 1234, browser_download_url: base + name });
const payload = () => ({ tag_name: 'v0.2.2', draft: false, prerelease: false, assets: [asset(installer), asset(portable), asset('notes.txt')] });

test('selects the exact Windows installer and portable assets from the current release', () => {
  assert.equal(typeof module.selectRelease, 'function', 'release selection is not implemented');
  assert.deepEqual(module.selectRelease(payload()), {
    version: '0.2.2', installer: base + installer, portable: base + portable, releaseURL: releasePage,
  });
});

test('never offers another host, repository, tag, platform, or ambiguous asset as a download', () => {
  assert.equal(typeof module.selectRelease, 'function');
  for (const url of [
    'https://github.com.evil.test/' + installer,
    'https://user:pass@github.com/devslab-kr/gitlinq-releases/releases/download/v0.2.2/' + installer,
    base.replace('gitlinq-releases', 'different-project') + installer,
    base.replace('v0.2.2', 'v0.2.1') + installer,
    base + installer + '?redirect=elsewhere',
    base + installer + '#download',
    base.replace('https:', 'http:') + installer,
    'javascript:alert(1)',
  ]) {
    const data = payload();
    data.assets[0].browser_download_url = url;
    assert.equal(module.selectRelease(data).installer, null);
    assert.equal(module.selectRelease(data).portable, base + portable);
  }
  for (const extra of [asset(installer), { ...asset(installer), size: 0 }, asset('GitLinq-0.2.2-windows-arm64-setup.exe')]) {
    const data = payload();
    data.assets = extra.name === installer && extra.size === 1234 ? [...data.assets, extra] : [extra];
    assert.equal(module.selectRelease(data).installer, null);
  }
  for (const data of [null, {}, { ...payload(), draft: true }, { ...payload(), prerelease: true }, { ...payload(), tag_name: '<img onerror=alert(1)>' }]) {
    assert.equal(module.selectRelease(data).installer, null);
    assert.equal(module.selectRelease(data).releaseURL, releasePage);
  }
});

test('returns the usable release page when the API is unavailable, malformed, or oversized', async () => {
  assert.equal(typeof module.loadLatestRelease, 'function');
  for (const fetcher of [
    async () => { throw new Error('offline'); },
    async () => new Response('{}', { status: 404 }),
    async () => new Response('not json'),
    async () => new Response('x'.repeat(262145)),
  ]) {
    assert.deepEqual(await module.loadLatestRelease(fetcher), { version: null, installer: null, portable: null, releaseURL: releasePage });
  }
});

test('uses the public endpoint without credentials and refuses HTTP redirects', async () => {
  assert.equal(typeof module.loadLatestRelease, 'function');
  const result = await module.loadLatestRelease(async (url, options) => {
    assert.equal(url, 'https://api.github.com/repos/devslab-kr/gitlinq-releases/releases/latest');
    assert.equal(options.credentials, 'omit');
    assert.equal(options.redirect, 'error');
    assert.ok(options.signal instanceof AbortSignal);
    return new Response(JSON.stringify(payload()));
  });
  assert.equal(result.installer, base + installer);
});

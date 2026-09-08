import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

for (const [path, destination] of [
  ['gitlinq/index.html', 'https://devslab.kr/products/gitlinq/'],
  ['gitlinq/docs/index.html', 'https://devslab.kr/products/gitlinq/docs/'],
]) {
  test(`${path} moves to its company page with the fragment intact and a no-script fallback`, () => {
    const file = new URL(`../${path}`, import.meta.url);
    assert.ok(existsSync(file), 'the redirect page is not implemented');
    const html = readFileSync(file, 'utf8');
    const script = html.match(/<script id="gitlinq-move">([\s\S]*?)<\/script>/)?.[1];
    assert.ok(script, 'the old product page must be replaced by the move page');
    for (const hash of ['', '#start', '#//elsewhere.example/path', '#%3Cscript%3E']) {
      const navigations = [];
      runInNewContext(script, { window: { location: { hash, replace: (url) => navigations.push(url) } } });
      assert.deepEqual(navigations, [destination + hash]);
      assert.equal(new URL(navigations[0]).origin, 'https://devslab.kr');
    }
    const noScript = html.match(/<noscript>([\s\S]*?)<\/noscript>/)?.[1];
    assert.ok(noScript, 'JavaScript-disabled visitors need a redirect');
    assert.equal(noScript.match(/content="0;url=([^"]+)"/)?.[1], destination);
    assert.equal(html.match(/<link rel="canonical" href="([^"]+)"/)?.[1], destination);
    assert.ok(html.includes(`<a href="${destination}">`), 'a visible fallback link must remain available');
  });
}

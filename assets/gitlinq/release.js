export const RELEASE_PAGE = 'https://github.com/devslab-kr/gitlinq-releases/releases/latest';
const API = 'https://api.github.com/repos/devslab-kr/gitlinq-releases/releases/latest';
const emptyRelease = () => ({ version: null, installer: null, portable: null, releaseURL: RELEASE_PAGE });

export function selectRelease(data) {
  const result = emptyRelease();
  if (!data || data.draft !== false || data.prerelease !== false || !Array.isArray(data.assets)) return result;
  const version = typeof data.tag_name === 'string' && /^v?(\d+\.\d+\.\d+)$/.exec(data.tag_name);
  if (!version || data.assets.length > 100) return result;
  result.version = version[1];
  for (const [kind, suffix] of [['installer', 'setup.exe'], ['portable', 'portable.zip']]) {
    const name = `GitLinq-${result.version}-windows-x64-${suffix}`;
    const matches = data.assets.filter((asset) => asset && asset.name === name);
    if (matches.length !== 1) continue;
    const asset = matches[0];
    if (asset.state !== 'uploaded' || !Number.isSafeInteger(asset.size) || asset.size <= 0) continue;
    try {
      const url = new URL(asset.browser_download_url);
      const path = `/devslab-kr/gitlinq-releases/releases/download/${encodeURIComponent(data.tag_name)}/${encodeURIComponent(name)}`;
      if (url.protocol === 'https:' && url.hostname === 'github.com' && !url.port && !url.username && !url.password && !url.search && !url.hash && url.pathname === path) {
        result[kind] = url.href;
      }
    } catch { /* Keep the public release page as the fallback. */ }
  }
  return result;
}

export async function loadLatestRelease(fetcher = globalThis.fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetcher(API, {
      credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer',
      signal: controller.signal, headers: { Accept: 'application/vnd.github+json' },
    });
    if (!response.ok || !response.body || Number(response.headers.get('content-length')) > 262144) return emptyRelease();
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = '';
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > 262144) { await reader.cancel(); return emptyRelease(); }
        text += decoder.decode(chunk.value, { stream: true });
      }
      text += decoder.decode();
    } finally { reader.releaseLock(); }
    return selectRelease(JSON.parse(text));
  } catch { return emptyRelease(); }
  finally { clearTimeout(timeout); controller.abort(); }
}

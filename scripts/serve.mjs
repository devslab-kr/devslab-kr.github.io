import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const types = { '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.xml': 'application/xml' };
const port = Number(process.env.PORT || 4173);
createServer((request, response) => {
  const pathname = new URL(request.url, 'http://' + request.headers.host).pathname;
  let candidate = normalize(join(root, pathname === '/' ? 'index.html' : pathname));
  if (candidate.startsWith(root) && existsSync(candidate) && statSync(candidate).isDirectory()) candidate = join(candidate, 'index.html');
  if (!candidate.startsWith(root) || !existsSync(candidate)) {
    response.writeHead(404); response.end('Not found'); return;
  }
  response.writeHead(200, { 'Content-Type': types[extname(candidate)] || 'application/octet-stream' });
  createReadStream(candidate).pipe(response);
}).listen(port, () => console.log('OSS hub served at http://127.0.0.1:' + port));

import { readFileSync, writeFileSync } from 'node:fs';
import { buildPublisher, renderPublisherHtml, serializeJsonLd } from '@devslab/site-kit';
import { DEVSLAB_PUBLISHER } from '@devslab/site-kit/devslab';

const target = new URL('../index.html', import.meta.url);
const publisher = buildPublisher(DEVSLAB_PUBLISHER);
const website = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': 'https://devslab-kr.github.io/#website',
  name: '데브스랩 오픈소스',
  alternateName: ['DevsLab Open Source', 'devslab open source'],
  url: 'https://devslab-kr.github.io/',
  publisher: publisher.reference,
};
const block = `<!-- publisher:start -->\n${renderPublisherHtml(DEVSLAB_PUBLISHER)}\n<script type="application/ld+json">${serializeJsonLd(website)}</script>\n<!-- publisher:end -->`;
const source = readFileSync(target, 'utf8');
const marker = /<!-- publisher:start -->[\s\S]*?<!-- publisher:end -->/g;
if ([...source.matchAll(marker)].length !== 1) throw new Error('Expected exactly one publisher block');
const output = source.replace(marker, block);
if (process.argv.includes('--check')) {
  if (source.replaceAll('\r\n', '\n') !== output.replaceAll('\r\n', '\n')) throw new Error('Run npm run build:publisher to refresh site-kit attribution');
} else writeFileSync(target, output);

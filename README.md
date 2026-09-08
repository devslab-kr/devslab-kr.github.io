# devslab-kr.github.io

Root hub for devslab's GitHub Pages project sites — a card index of every
open-source library with live demo / GitHub / npm links, plus the org-wide
`sitemap.xml` and Google Search Console verification for the whole
`devslab-kr.github.io` prefix.

Live: **https://devslab-kr.github.io/**

## GitLinq product page

`gitlinq/index.html` publishes **https://devslab-kr.github.io/gitlinq/** as a
standalone Korean/English Windows product page. It uses the hub's persisted
`theme` and `hub-lang` preferences; unsupported language preferences are kept
and displayed in English on this page. The home-page product card has all
fourteen hub translations and is separate from the OSS registry.

GitLinq product source is private. Public downloads come from
[`devslab-kr/gitlinq-releases`](https://github.com/devslab-kr/gitlinq-releases).
`assets/gitlinq/release.js` reads its latest published release without
credentials, selects the exact version's Windows x64 installer and portable
ZIP, and accepts only matching GitHub asset URLs. If the API or an asset is
unavailable, the links remain usable through the public Release page.
No version number or direct asset URL needs to be updated for each release.

The product illustration is HTML with synthetic content, not a user screenshot.
GitLinq assets are separate from the generated OSS brand snapshot. `site-kit`
continues to own only the existing publisher metadata block on the home page.
Run `npm test`; use `npm run serve` to preview both `/` and `/gitlinq/`.

## OSS brand snapshot

This hub vendors the public DevsLab OSS brand release rather than consuming it
at runtime. The pinned Q-line snapshot is **v0.3.0**, represented by the immutable
305-file SHA-256 manifest at
**scripts/oss-brand-v0.3.0.manifest.json**. Run **npm run sync:brand** to
verify the source release, every project checksum, and release ZIP checksum
before the local snapshot is replaced. Generated content under
**assets/oss-brand/** must only change through that command.

The central registry and release source is
[`devslab-kr/oss-brand`](https://github.com/devslab-kr/oss-brand). The
canonical human brand guide is
[devslab.kr/brand/open-source](https://devslab.kr/brand/open-source/).

## Design

The page shares [devslab.kr](https://devslab.kr)'s design language (see that
site's repo for the reference implementation): zinc palette with a
light/dark toggle (`localStorage 'theme'`, light default), electric cyan
accent, Geist / Geist Mono webfonts, DevsLab logo mark + wordmark, dot-grid
hero, mono `//` labels and `[NN]` card numbering. devslab.kr links back here
from its header (`Open Source`) and footer. No external-link `↗` arrows —
hover color/border carries the affordance. When one side's look changes,
keep the other in sync.

The technical cyan hero atmosphere is ambient decoration only. It remains on
the physical right at 86% 22%, never fills a mark, and is disabled for
forced-colors and print.

## i18n

Same 14 locales as devslab.kr (ko en ja zh-HK zh-TW hi vi id th pt-BR fr
de es ar), implemented as an inline dictionary in `index.html`: header
language dropdown, browser-language auto-detect, `localStorage 'hub-lang'`
persistence, RTL for Arabic (mono/code elements stay pinned LTR). Source
HTML stays Korean for SEO; the dictionary swaps text client-side. When a
card is added or copy changes, update every locale in the `I18N` object.

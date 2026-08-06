# devslab-kr.github.io

Root hub for devslab's GitHub Pages project sites — a card index of every
open-source library with live demo / GitHub / npm links, plus the org-wide
`sitemap.xml` and Google Search Console verification for the whole
`devslab-kr.github.io` prefix.

Live: **https://devslab-kr.github.io/**

## Design

The page shares [devslab.kr](https://devslab.kr)'s design language (see that
site's repo for the reference implementation): zinc palette with a
light/dark toggle (`localStorage 'theme'`, light default), electric cyan
accent, Geist / Geist Mono webfonts, DevsLab logo mark + wordmark, dot-grid
hero, mono `//` labels and `[NN]` card numbering. devslab.kr links back here
from its header (`Open Source`) and footer. No external-link `↗` arrows —
hover color/border carries the affordance. When one side's look changes,
keep the other in sync.

## i18n

Same 14 locales as devslab.kr (ko en ja zh-HK zh-TW hi vi id th pt-BR fr
de es ar), implemented as an inline dictionary in `index.html`: header
language dropdown, browser-language auto-detect, `localStorage 'hub-lang'`
persistence, RTL for Arabic (mono/code elements stay pinned LTR). Source
HTML stays Korean for SEO; the dictionary swaps text client-side. When a
card is added or copy changes, update every locale in the `I18N` object.

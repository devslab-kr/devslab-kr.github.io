# Workspace discovery verification

Base: `4d4649d` (hub main). Canonical mark source:
`oss-brand` commit `3870b9ea86f5ccc443d06b49d991592591b110da`.

- Local `npm test`: 45 passed, 0 failed. Publisher, consent, fonts, v0.3.0
  snapshot checksums, O01–O13 ordering, all 14 Workspace translations,
  destinations, and pinned O13 SVG checksums are included.
- Playwright at `http://127.0.0.1:4281/`: all 14 locales at 390px rendered
  Workspace text and four links without horizontal page overflow.
- Screenshots inspected: [English dark desktop](workspace-en-dark-1440.png),
  [Korean light mobile](workspace-ko-light-390.png),
  [Arabic RTL dark mobile](workspace-ar-dark-390.png). Both canonical marks
  loaded and the dark variant was selected in dark mode.
- The first test invocation failed: Windows checkout CRLF conversion caused
  a v0.3.0 asset checksum mismatch (expected
  `261f93f98c5627e7e06d56e9e61d7580ef8c40bb729076560f856eec71747c88`,
  observed `4763c25e8e27d0505f6312cf710627774ed57816df20bd8b8850d3a1eb1cf560`).
  Restoring the existing tracked snapshot bytes directly from HEAD corrected
  that local checkout issue; no snapshot content change is in this PR.
  The initial O13 insertion missed the CRLF HTML section delimiter and the
  ordering/link tests failed. Inserting the card inside the final grid fixed
  the failure before the 45-test pass and screenshot capture.

This is local evidence. CI, merge, Pages deployment, and production link checks
remain release steps. `/workspace/` and `/workspace/demo/` are served by the
Workspace project Pages site, so they return 404 on the standalone hub local
server. Publish the Workspace docs/demo and canonical brand release before
merging/deploying this hub change. The canonical
[v0.4.0 brand release](https://github.com/devslab-kr/oss-brand/releases/tag/v0.4.0)
is now published; Workspace Pages publication and production verification
remain pending.

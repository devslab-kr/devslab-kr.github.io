# OSS Brand JavaScript Repository Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the released OSS identity assets and project hero atmosphere to the six JavaScript/TypeScript repositories without changing library behavior.

**Architecture:** Each repository vendors only its generated project assets from `oss-brand` v0.1.0, preserves its feature screenshots and runtime APIs, and adds consistent README, metadata, favicon, social, and documentation hero surfaces.

**Tech Stack:** npm/pnpm, static HTML/CSS, Vite/Vue, browser extension assets, existing native test/build pipelines.

**Spec:** `docs/superpowers/specs/2026-08-30-devslab-oss-brand-system-design.md`

## Global Constraints

- Work only in isolated worktrees created from the current remote default branch.
- Never edit generated `.pages/`, `demo-dist/`, or packaged ZIP outputs.
- Preserve badges, localized feature copy, demo screenshots, package names, component variables, and library behavior.
- Use full project names and accessible linked marks; gradients remain ambient backgrounds.

---

### Task 1: editor-ruler O01

**Files:** Modify root and five package pairs of `README.md`/`README.ko.md`, `site/index.html`; replace `site/favicon.svg`, `site/favicon.ico`, `site/apple-touch-icon.png`, `site/og.png`; create `docs/assets/brand/readme-header.png`, `project-mark.svg`, `project-lockup.svg`.

- [ ] Add a failing `scripts/check-brand-assets.mjs` assertion for O01 registry ID, checksums, metadata, and README endorsement; expose `pnpm check:brand`.
- [ ] Vendor O01 assets, update README headers and site hero/metadata while preserving every adapter demo.
- [ ] Run `pnpm install --frozen-lockfile && pnpm check:versions && pnpm build && pnpm typecheck && pnpm test && pnpm build:pages`.
- [ ] Commit `feat: apply DevsLab OSS identity to editor-ruler`.

### Task 2: ssrf-guard-js O03

**Files:** Modify `README.md`, `README.ko.md`, `site/index.html`, `site/ko/index.html`, `examples/workers/README.md`, and `examples/workers/README.ko.md`; create site favicon/Apple/OG assets and `docs/assets/brand/**`. The Workers example READMEs receive endorsement links only, not independent glyphs.

- [ ] Add failing brand checks for the shared O02 security core, O03 runtime lockup, both localized metadata pages, and checksums.
- [ ] Vendor O03 assets and implement matching EN/KO project atmosphere without changing the security palette or generated `.pages/`.
- [ ] Run root `pnpm install --frozen-lockfile && pnpm verify && pnpm build:pages`, then `pnpm install --frozen-lockfile && pnpm verify` in `examples/workers`.
- [ ] Commit `feat: apply DevsLab OSS identity to ssrf-guard-js`.

### Task 3: numkey O04

**Files:** Modify `README.md`, `README.ko.md`, `site/index.html`; create `docs/assets/brand/**` and site favicon/Apple/OG assets; retain `docs/preview.png`.

- [ ] Add failing checks for O04, README endorsement, social metadata, asset checksums, and preserved preview reference.
- [ ] Vendor the stable-caret mark and apply the project atmosphere without implying a calculator.
- [ ] Run `npm ci && npm run typecheck && npm run test && npm run build`.
- [ ] Commit `feat: apply DevsLab OSS identity to numkey`.

### Task 4: kokey O05

**Files:** Modify nine root localized READMEs, `site/index.html`, two extension READMEs; create `docs/assets/brand/**` and site assets; replace `extension/icons/icon16.png`, `icon48.png`, `icon128.png`; regenerate store promos through the asset pipeline.

- [ ] Add failing checks that all nine README headers reference O05, extension icon dimensions match 16/48/128, and privacy/legal pages remain neutral.
- [ ] Vendor O05 assets, update the demo surface and extension collateral, preserving `docs/preview.png`, store screenshots, `Alt+K`, and manifest permissions.
- [ ] Run `npm ci && npm run typecheck && npm run test && npm run build && npm run build:extension && npm run package:extension`.
- [ ] Commit `feat: apply DevsLab OSS identity to kokey`.

### Task 5: vue-date-rail O06

**Files:** Modify `README.md`, `README.ko.md`, `demo/App.vue`, `demo/index.html`; create `demo/public/favicon.svg`, `favicon.ico`, `apple-touch-icon.png`, `og.png` and `docs/assets/brand/**`.

- [ ] Create a worktree from updated `origin/main`, leaving the canonical untracked `.claude/launch.json` untouched; add failing brand checks for O06 and isolation from `--vdr-*` tokens.
- [ ] Vendor O06 assets and apply the hero atmosphere only to the demo shell.
- [ ] Run `npm ci && npm run test:run && npm run build && npm run build:types && npm run build:demo`.
- [ ] Commit `feat: apply DevsLab OSS identity to vue-date-rail`.

### Task 6: locale-match O07

**Files:** Modify root and four package README pairs plus `site/index.html`; create `docs/assets/brand/**` and local favicon/Apple/OG assets.

- [ ] Add failing checks for O07 across all README pairs, local metadata assets, checksum validity, and absence of flag/globe imagery.
- [ ] Vendor the resolution-path glyph and replace the remote corporate favicon while preserving the existing locale playground and script guards.
- [ ] Run `pnpm install --frozen-lockfile && pnpm build && pnpm typecheck && pnpm test`.
- [ ] Commit `feat: apply DevsLab OSS identity to locale-match`.

### Task 7: Coordinated JavaScript review and release

- [ ] Run each repository's brand checker and native suite fresh; confirm all worktrees are clean.
- [ ] Capture desktop/mobile light/dark screenshots for all six landing pages and RTL for Kokey/locale-match.
- [ ] Open six independent pull requests that pin `oss-brand` v0.1.0 and include test evidence.
- [ ] Merge only after central assets and canonical `/brand/open-source` are live; verify repository social previews and deployed Pages URLs.

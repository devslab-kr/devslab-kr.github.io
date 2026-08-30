# OSS Brand Foundation and Shared Surfaces Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic DevsLab OSS brand asset source, publish all twelve asset sets, and apply the system to DevsLab and the OSS demo hub.

**Architecture:** A public `devslab-kr/oss-brand` repository owns the O01–O12 registry and generated assets. DevsLab and the hub vendor versioned, checksum-verified snapshots; a portable CSS atmosphere contract supplies corporate, OSS, Linq, and project hero variants.

**Tech Stack:** Node.js 20+ ESM, node:test, sharp, fontkit, fflate, png-to-ico, React/Next.js, static HTML/CSS, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-08-30-devslab-oss-brand-system-design.md`

## Global Constraints

- Keep the DevsLab corporate notched mark, Linq two-square mark, and OSS glyph family distinct.
- Use O01–O12 immutable registry IDs and a 32×32 master with a centered 24×24 active area.
- Use `#06B6D4` raw cyan, `#0E7490` on light surfaces, and `#22D3EE` on dark surfaces.
- Never use gradients inside marks; atmosphere alpha ceilings are .11 light, .10 dark, and .08 for project accents.
- Preserve every existing dirty worktree and never edit generated MkDocs `site/` directories.
- Every generated archive is deterministic and every vendored snapshot is checksum verified.

---

### Task 1: Establish the OSS registry and validation core

**Files:**
- Create: `C:/Users/jlc48/workspace/oss-brand/package.json`
- Create: `C:/Users/jlc48/workspace/oss-brand/registry/oss-projects.json`
- Create: `C:/Users/jlc48/workspace/oss-brand/src/registry.mjs`
- Create: `C:/Users/jlc48/workspace/oss-brand/src/color.mjs`
- Create: `C:/Users/jlc48/workspace/oss-brand/tests/registry.test.mjs`
- Create: `C:/Users/jlc48/workspace/oss-brand/tests/color.test.mjs`

**Interfaces:**
- Produces: `loadRegistry(url): Promise<readonly OssProject[]>`, `validateRegistry(projects): string[]`, `validateProjectColors(project): string[]`.

- [ ] **Step 1: Write failing registry and contrast tests**

```js
test('loads exactly O01 through O12 in order', async () => {
  const projects = await loadRegistry(new URL('../registry/oss-projects.json', import.meta.url));
  assert.deepEqual(projects.map((p) => p.registryId), Array.from({length: 12}, (_, i) => `O${String(i + 1).padStart(2, '0')}`));
  assert.deepEqual(validateRegistry(projects), []);
});
```

- [ ] **Step 2: Run `npm test` and confirm missing-module failure**
- [ ] **Step 3: Implement the twelve records and validation for unique IDs, exact names, relationships, links, surfaces, hex colors, and WCAG thresholds**
- [ ] **Step 4: Run `npm test` and confirm the registry/color tests pass**
- [ ] **Step 5: Commit with `git commit -m "feat: establish OSS brand registry"`**

### Task 2: Generate canonical glyphs and outlined lockups

**Files:**
- Create: `src/glyphs.mjs`, `src/svg.mjs`, `src/wordmark.mjs`, `src/assets.mjs`
- Create: `tests/glyphs.test.mjs`, `tests/validation.test.mjs`, `tests/wordmark.test.mjs`

**Interfaces:**
- Produces: `getGlyphDefinition(id)`, `buildGlyphSvg(project, {variant})`, `buildWordmark(name)`, `buildProjectLockup(project, {endorsement})`, `validateSvg(fileName, svg, project)`.

- [ ] **Step 1: Add failing tests for the 32×32 viewBox, 4-unit safety margin, 2-unit outline, prohibited SVG content, and twelve distinct geometry hashes**
- [ ] **Step 2: Run `node --test tests/glyphs.test.mjs tests/validation.test.mjs tests/wordmark.test.mjs` and confirm failure**
- [ ] **Step 3: Implement the O01–O12 functional glyph definitions from the spec, Geist outline conversion, monochrome/reversed variants, sibling lockups, and endorsement lockups**
- [ ] **Step 4: Run the focused tests and visually inspect one SVG from each relationship group**
- [ ] **Step 5: Commit with `git commit -m "feat: generate OSS project glyph family"`**

### Task 3: Generate raster, social, terminal, and extension assets

**Files:**
- Create: `src/social.mjs`, `src/archive.mjs`, `scripts/generate.mjs`
- Create: `tests/generated-assets.test.mjs`, `tests/social.test.mjs`, `tests/archive.test.mjs`
- Generate: `dist/index.json`, `dist/tokens.css`, `dist/atmosphere.css`, `dist/og-portfolio.png`, `dist/<project-id>/**`, `dist/downloads/**`

**Interfaces:**
- Produces: `buildSocialSvg(project, {kind})`, `generateProject(project, outputUrl)`, `createDeterministicZip(entries)`, `sha256(buffer)`.

- [ ] **Step 1: Add failing tests for PNG dimensions, ICO frames, maskable safe zones, 1200×630 OG, 1280×320 README headers, Kokey 16/48/128 extension icons, and DataLinq ASCII/no-color output**
- [ ] **Step 2: Run focused tests and confirm missing assets fail**
- [ ] **Step 3: Implement generation with pinned sharp/fontkit/fflate/png-to-ico/@fontsource-geist dependencies and fixed ZIP timestamps**
- [ ] **Step 4: Run `npm run generate && npm test` and inspect the portfolio OG plus twelve 512px marks**
- [ ] **Step 5: Commit with `git commit -m "feat: generate complete OSS brand asset sets"`**

### Task 4: Enforce determinism and publish the central release

**Files:**
- Create: `scripts/validate.mjs`, `scripts/check-determinism.mjs`, `scripts/release-dry-run.mjs`
- Create: `tests/determinism.test.mjs`, `tests/release-package.test.mjs`, `.github/workflows/ci.yml`
- Create: `README.md`, `LICENSE`, `BRAND-LICENSE.md`, `.gitignore`

- [ ] **Step 1: Add a failing test that generates twice into separate temporary directories and compares every relative path and SHA-256**
- [ ] **Step 2: Implement `npm run check` as generate, tests, validation, determinism, and release dry-run**
- [ ] **Step 3: Run `npm ci && npm run check`; require zero failures and twelve deterministic ZIPs**
- [ ] **Step 4: Create public `devslab-kr/oss-brand`, push `main`, tag `v0.1.0`, and attach all ZIPs plus checksums to the GitHub Release**
- [ ] **Step 5: Verify unauthenticated GitHub download responses and commit `docs: prepare OSS brand v0.1.0` before tagging**

### Task 5: Add the portable atmosphere and canonical OSS page to DevsLab

**Files:**
- Create: `src/components/HeroAtmosphere.tsx`, `src/styles/brand-atmosphere.css`, `src/pages/brand/open-source.tsx`, `src/data/oss-projects.json`, `scripts/sync-oss-brand.mjs`
- Create: `src/__tests__/hero-atmosphere.test.tsx`, `src/__tests__/oss-brand-page.test.tsx`, `src/__tests__/oss-brand-assets.test.ts`
- Modify: `src/pages/index.tsx`, `src/pages/brand.tsx`, `src/pages/brand/products.tsx`, `src/styles/globals.css`, `src/utils/seo.ts`, `src/utils/__tests__/seo.test.ts`, `scripts/generate-seo.ts`, `package.json`

**Interfaces:**
- Produces: `HeroAtmosphere({variant, projectAccent?, className?})` and `npm run sync:oss-brand`.

- [ ] **Step 1: Create an isolated DevsLab worktree from `origin/main` and write failing atmosphere/page/assets/SEO tests**
- [ ] **Step 2: Run the five focused Vitest files and confirm failures for missing component, route, and assets**
- [ ] **Step 3: Implement the CSS-first contract, migrate `/brand/products`, apply corporate variants to `/` and `/brand`, and build `/brand/open-source` with Korean/English copy and canonical metadata**
- [ ] **Step 4: Sync from `C:/Users/jlc48/workspace/oss-brand/dist`, then run `npm test`, `npx tsc --noEmit`, focused ESLint, and `npm run build`**
- [ ] **Step 5: Commit in reviewable slices: atmosphere, OSS page/assets, SEO integration**

### Task 6: Upgrade the OSS hub from the central registry

**Files:**
- Create: `assets/oss-brand/**`, `scripts/sync-oss-brand.mjs`, `tests/brand-assets.test.mjs`, `tests/index-brand.test.mjs`, `package.json`
- Modify: `index.html`, `README.md`, `sitemap.xml`

- [ ] **Step 1: Add failing node tests for twelve O01–O12 cards, accessible marks, endorsement, atmosphere contract, OG/Twitter metadata, and ZIP hashes**
- [ ] **Step 2: Run `npm test` and confirm the current static page fails the new identity assertions**
- [ ] **Step 3: Implement checksum sync, technical cyan atmosphere, twelve glyph cards, local favicons/social image, and `Open source by DevsLab` footer while preserving all fourteen locales**
- [ ] **Step 4: Run `npm test`, serve at port 4173, and verify desktop/mobile light/dark/RTL/200%/forced-colors with no overflow or broken assets**
- [ ] **Step 5: Commit with `git commit -m "feat: unify OSS hub identity"`**

### Task 7: Integrate, review, and deploy shared surfaces

- [ ] **Step 1: Review the central, DevsLab, and hub diffs against every spec section and run all three full verification suites fresh**
- [ ] **Step 2: Push feature branches and open pull requests with screenshots, test evidence, and explicit existing-lint disclosures**
- [ ] **Step 3: Merge central assets first, then DevsLab and hub after checks pass**
- [ ] **Step 4: Verify `https://devslab.kr/brand/open-source/`, `/`, `/brand/`, `/brand/products/`, and `https://devslab-kr.github.io/` in production**
- [ ] **Step 5: Record release URLs, commit hashes, asset version, and production HTTP evidence in verification notes**

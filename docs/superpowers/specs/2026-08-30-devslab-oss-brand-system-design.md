# DevsLab Open Source Brand System

**Status:** Approved direction; implementation specification for review  
**Date:** 2026-08-30  
**Scope:** The twelve projects listed at `https://devslab-kr.github.io/`, the OSS hub, DevsLab corporate pages, and their public documentation surfaces

## 1. Purpose

DevsLab open-source projects currently share package scopes, repository ownership, badges, and some typography, but they do not present a coherent identity after a visitor leaves the central demo hub. Several projects have no favicon or social image, while `easy-paging`, `api-log`, and `devslab-kit` currently reuse the same mark.

The new system must make every project visibly part of DevsLab without turning the OSS portfolio into the Linq Product Family or forcing twelve unrelated standalone brands. It must remain inexpensive to extend when new projects are added.

## 2. Brand architecture

The system has four distinct layers:

1. **DevsLab corporate brand** — owner and endorsement. It retains the corporate notched block mark.
2. **DevsLab Open Source** — the portfolio and governance layer. It uses the corporate cyan, Geist/Geist Mono, zinc neutrals, technical labels, and the phrase `Open source by DevsLab`.
3. **OSS project identity** — a project name plus a function-derived glyph made on the common OSS grid.
4. **Sibling families** — related projects may share a core glyph or structural cue, but they remain installable and identifiable independently.

The Linq two-square mark and Linq Color IDs are reserved for the Linq Product Family. OSS glyphs must not use the two-square Linq geometry or Linq product colors as ownership signals.

## 3. Selected approach

Use a **common glyph construction system with project-specific functional symbols and a separate DevsLab endorsement**.

Rejected alternatives:

- A single DevsLab mark on every project would be consistent but would not distinguish browser tabs, repository cards, or documentation sites.
- Twelve unconstrained standalone identities would be distinctive but costly to govern and visually disconnect the portfolio.

The selected system gives each project a useful small mark while keeping typography, spacing, asset formats, endorsement, and social layouts consistent.

## 4. Glyph construction rules

- Master coordinate system: `32 × 32` units.
- Active drawing area: centered `24 × 24` units with a 4-unit safety margin.
- Primary outline weight: 2 units at the master size.
- Corners and terminals align to the integer grid; optical exceptions require a recorded registry note.
- Standard variants: color, monochrome, reversed, and simplified small-size raster master.
- Marks must remain recognizable at 16px and in monochrome.
- Letters, package initials, gradients, shadows, and platform logos are not part of the core glyph.
- The DevsLab corporate mark is an endorsement placed beside or below the project identity; it is never fused into a project glyph.
- Gradients are ambient page decoration only and never fill a logo or glyph.

## 5. Project concepts

| Registry ID | Project | Glyph concept | Family behavior |
| --- | --- | --- | --- |
| O01 | editor-ruler | measured rail with a movable stop | Parent identity for all editor adapters |
| O02 | ssrf-guard | protected boundary interrupting an inbound path | Shared core with the JS implementation |
| O03 | ssrf-guard-js | O02 core plus a neutral runtime attachment in lockups, not inside the glyph | Must read as the JavaScript implementation of the same security model |
| O04 | numkey | stable caret crossing grouped numeric units | Input sibling; avoid calculator imagery |
| O05 | kokey | two key surfaces connected by a correction path | Input sibling; preserve multilingual and extension equity |
| O06 | vue-date-rail | three date cells on a horizontal rail with one selected position | Project accent must remain separate from consumer `--vdr-*` component tokens |
| O07 | locale-match | multiple candidate paths resolving into one matched line | No flags or globe cliché |
| O08 | easy-paging | a page stack advanced by a bounded cursor | Must replace the shared generic backend mark |
| O09 | api-log | event lines entering a durable record stack | Must replace the shared generic backend mark |
| O10 | devslab-kit | modular blocks assembling into one platform frame | Must replace the shared generic backend mark |
| O11 | DataLinq | two data columns connected by a controlled transfer bridge | Requires SVG, Unicode-safe text, ASCII, and no-color variants |
| O12 | devslab-examples | a bracketed run/play symbol representing a collection | Endorsement and navigation identity, not a competing product brand |

## 6. Color system

The portfolio owns one parent accent, not twelve mandatory product colors:

- Corporate/OSS raw cyan: `#06B6D4`.
- Readable light-surface accent: `#0E7490`.
- Readable dark-surface accent: `#22D3EE`.
- Base neutrals: the existing DevsLab zinc scale.

Project glyphs default to monochrome or the readable OSS accent. Existing project accents are retained as application accents in demos, social-card details, or the second ambient gradient after validation; an anchor that fails contrast is adjusted to the nearest compliant tone. Project accents do not replace the OSS parent accent and are not used as the sole means of identification.

Every optional project accent must have separate light and dark anchors recorded in the central registry and pass the same contrast checks as the Linq registry. Consumer-facing component theme variables remain independent from brand tokens.

## 7. Typography and naming

- Geist is the primary interface and editorial family.
- Geist Mono is used for package names, commands, category labels, registry IDs, and version details.
- Project names keep their published spelling. `DataLinq` retains its display case while its artifact coordinate remains unchanged.
- Standard endorsement: `Open source by DevsLab` in English and `DevsLab 오픈소스` in Korean.
- README banners and social cards show the full project name. Color or glyph alone is never sufficient.

## 8. Shared asset set

Each project receives:

- master SVG and SVG variants: color, monochrome, reversed;
- transparent PNG marks at 16, 32, 48, 180, 192, and 512px;
- multi-frame favicon ICO plus favicon SVG;
- Apple touch and PWA/maskable icons where the project has an installable web surface;
- GitHub social/OG image at `1200 × 630`;
- README header at `1280 × 320` with safe dark/light rendering;
- horizontal project lockup and `Open source by DevsLab` endorsement lockup;
- checksums and a deterministic project ZIP.

Kokey additionally receives extension icons and store collateral derivatives. DataLinq receives ASCII and no-color terminal assets. Editor-ruler retains its adapter hierarchy under the new parent lockup.

## 9. Source of truth and distribution

Create a public `devslab-kr/oss-brand` repository as the machine-readable source of truth.

The repository contains:

- `registry/oss-projects.json` — immutable project IDs, names, relationships, accents, asset paths, and status;
- `scripts/` — deterministic vector/raster/social generation and validation;
- `dist/` — generated release assets and checksums;
- `BRAND-LICENSE.md` — permitted and prohibited brand usage;
- versioned GitHub Releases containing per-project ZIP files.

The asset repository is not required as a runtime dependency. Java, raw HTML, MkDocs, and JavaScript projects vendor a versioned snapshot through a small checksum-verifying sync script. This avoids forcing non-JavaScript projects to depend on npm.

Human-readable canonical rules live at `https://devslab.kr/brand/open-source/`. Discovery and live demos remain at `https://devslab-kr.github.io/`.

## 10. Hero atmosphere system

The right-side color field seen on the Linq brand page becomes a shared ambient component, separate from logos.

### Variants

- `corporate` — one broad, very light cyan radial field for the DevsLab homepage and corporate brand page.
- `oss` — a slightly tighter technical cyan field for the OSS hub.
- `linq` — spatially separated right-side radials using the four governed Linq hues; never a rainbow fill inside a mark.
- `project` — the OSS cyan field plus one optional low-alpha project accent.

### CSS contract

The portable API is CSS-first so React, raw HTML, and MkDocs can share it:

- container class: `.hero-atmosphere`;
- decorative child: `.hero-atmosphere__glow` with `aria-hidden="true"` and `pointer-events: none`;
- variant selector: `data-atmosphere="corporate|oss|linq|project"`;
- default position: physical right at `86% 22%`;
- default alpha ceiling: 0.11 on light surfaces and 0.10 on dark surfaces;
- optional project accent ceiling: 0.08;
- content remains in a higher stacking context.

The field remains on the physical right in RTL layouts as an intentional composition. It is disabled in forced-colors and print. Static radial backgrounds are used instead of large blurred filter elements.

Initial application surfaces are the DevsLab homepage, `/brand`, `/brand/products`, `/brand/open-source`, the OSS hub, and project documentation/demo landing pages. Blog and long-form article heroes remain neutral.

## 11. Accessibility

- Normal text must meet 4.5:1 and large text or component boundaries must meet 3:1.
- White text on cyan-500 is prohibited; readable cyan-700 or cyan-400 anchors are used according to surface.
- Every functional linked mark has an accessible name; decorative duplicates are hidden.
- Project recognition always includes a name or equivalent accessible label.
- Verify light, dark, forced colors, reduced motion, 200% zoom, 16px raster output, RTL, and color-vision simulations.
- Hero contrast is measured at the brightest gradient overlap, not only against the base page color.

## 12. Repository integration

Every repository receives only the surfaces it actually uses:

- README: common header, badges retained, full name, endorsement, canonical hub/brand links.
- GitHub: repository social preview and consistent description/topics across the twelve organization repositories.
- Static/Vite sites: favicon, OG/Twitter metadata, hero atmosphere, and footer endorsement.
- MkDocs: source `docs/assets` only; generated `site/` output is never edited directly.
- Browser extension: manifest/store icon matrix generated from the approved Kokey master.
- Terminal application: ASCII/no-color identity loaded without changing functional terminal colors.

Existing demos and screenshots remain feature evidence and are not replaced by decorative identity boards.

## 13. Safe rollout

The rollout is one coordinated release program but uses isolated worktrees and reviewable batches:

1. Build and release `devslab-kr/oss-brand` with all twelve approved asset sets.
2. Add `/brand/open-source` and migrate the shared atmosphere implementation on DevsLab.
3. Update the OSS hub from the central registry.
4. Integrate all twelve project repositories in relationship groups: security, interactive web tools, language/input, backend platform, terminal, and umbrella.
5. Open independent pull requests, run every repository's native checks, and merge only after the full portfolio preview is approved.
6. Deploy the official page and hub first, then merge project repositories in one coordinated window so canonical links are never broken.

Dirty canonical worktrees for `vue-date-rail`, `easy-paging`, `devslab-kit`, and `datalinq` are never modified. Easy Paging uses its clean clone only as a read reference; implementation starts from the canonical repository's remote default branch in a new worktree.

## 14. Verification and acceptance

The central asset repository must enforce:

- exact glyph geometry and allowed SVG content;
- unique immutable registry IDs;
- complete asset matrices and checksum validity;
- deterministic archives;
- raster dimensions, favicon frames, and maskable safe zones;
- palette contrast and malformed-color rejection;
- outlined or licensed wordmark output without runtime font dependencies.

Every consumer repository must pass its existing test, typecheck, build, and documentation build commands. Browser verification covers desktop and mobile light/dark modes, English/Korean plus one RTL locale, 200% zoom, broken assets, horizontal overflow, metadata, console errors, and download responses.

Acceptance requires all twelve projects to show a distinct project glyph, a consistent DevsLab endorsement, correct canonical links, a valid social preview, and no regression to package/application behavior.

## 15. Explicit non-goals

- Rebranding the Linq Product Family or merging Linq and OSS identities.
- Renaming published npm/Maven packages.
- Replacing feature screenshots with decorative mockups.
- Applying atmospheric gradients to article bodies or filling logos with gradients.
- Changing application semantic colors, component APIs, or package behavior as part of brand rollout.

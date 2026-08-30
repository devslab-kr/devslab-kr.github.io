# OSS Brand JVM and Terminal Repository Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the released OSS identity to the six JVM, terminal, and umbrella repositories while preserving native behavior and dirty canonical worktrees.

**Architecture:** MkDocs projects receive source-only logo/favicon/social/override/CSS updates; DataLinq receives web and ASCII/no-color assets; devslab-examples receives a collection endorsement rather than per-demo brands.

**Tech Stack:** Gradle/Kotlin/Java 21, MkDocs Material, static assets, DataLinq TUI, native repository CI.

**Spec:** `docs/superpowers/specs/2026-08-30-devslab-oss-brand-system-design.md`

## Global Constraints

- Create worktrees from `origin/main`, except api-log from `origin/master`.
- Do not touch canonical dirty files in Easy Paging, devslab-kit, or DataLinq.
- Never edit generated MkDocs `site/` output.
- README headers use `.github/assets/readme-header.png`; social previews use `.github/assets/social-preview.png`.
- MkDocs sources use `docs/assets/logo.svg`, `docs/assets/favicon.svg`, `docs/assets/social-preview.png`, `docs/overrides/main.html`, and `docs/stylesheets/extra.css`.

---

### Task 1: easy-paging O08

- [ ] Create a worktree from `origin/main`; leave canonical `gradlew.bat` and `.ai/` untouched. Add a failing brand check for O08 and distinct hashes from O09/O10.
- [ ] Update `README.md`, `README.ko.md`, `mkdocs.yml`, `docs/index.md`, `docs/index.ko.md`; replace `docs/assets/logo.svg`; add favicon/social/override assets and atmosphere CSS.
- [ ] Run `./gradlew.bat build jacocoTestReport --no-configuration-cache --stacktrace`, `./gradlew.bat testDialect --no-configuration-cache --stacktrace`, install `docs/requirements.txt`, and run `mkdocs build --strict`.
- [ ] Commit `feat: apply DevsLab OSS identity to easy-paging`.

### Task 2: ssrf-guard O02

- [ ] Add a failing check for O02 shared security geometry, twelve module naming compatibility, metadata, and checksums.
- [ ] Update both READMEs, `mkdocs.yml`, both docs indexes; create the missing logo/favicon/social/override/extra.css sources with the protected-boundary glyph.
- [ ] Run `./gradlew.bat build jacocoTestReport --no-configuration-cache --stacktrace` and `mkdocs build --strict` after installing docs requirements.
- [ ] Commit `feat: apply DevsLab OSS identity to ssrf-guard`.

### Task 3: api-log O09

- [ ] Create a worktree from `origin/master` and add a failing check proving O09 differs from the former shared backend mark.
- [ ] Update both READMEs, `mkdocs.yml`, both docs indexes; replace `docs/assets/logo.svg`; add favicon/social/override assets and atmosphere CSS.
- [ ] Run `./gradlew.bat build jacocoTestReport --no-configuration-cache --stacktrace` and `mkdocs build --strict`.
- [ ] Commit `feat: apply DevsLab OSS identity to api-log`.

### Task 4: devslab-kit O10

- [ ] Create a worktree from `origin/main`; leave canonical `.claude/` and generated `site/` untouched. Add a failing check for O10 and source-only MkDocs assets.
- [ ] Update both READMEs, `mkdocs.yml`, both docs indexes; replace `docs/assets/logo.svg`; add favicon/social/override assets and atmosphere CSS.
- [ ] Run `./gradlew.bat build testCodeCoverageReport --no-daemon --stacktrace` and `mkdocs build --strict`.
- [ ] Commit `feat: apply DevsLab OSS identity to devslab-kit`.

### Task 5: DataLinq O11

- [ ] Create a worktree from `origin/main`; preserve the canonical divergent dirty branch. Add `src/test/java/kr/devslab/datalinq/ui/LogoTest.java` asserting bundled ASCII output, stable line width, UTF-8 loading, and no ANSI escapes.
- [ ] Update `README.md`, `README.ko.md`, add `.github/assets` web assets, and replace `src/main/resources/branding/logo.txt`; keep `Logo.java`, semantic TUI colors, and artifact coordinates unchanged unless the test exposes a loader defect.
- [ ] Run `./gradlew.bat build --no-daemon --stacktrace`, `./gradlew.bat shadowJar --no-daemon`, and `./gradlew.bat run --args="logo"`; verify no-color output.
- [ ] Commit `feat: apply DevsLab OSS identity to DataLinq`.

### Task 6: devslab-examples O12

- [ ] Add a failing check for the collection mark, README endorsement, social image, and absence of per-demo branding changes.
- [ ] Update `README.md`, `README.ko.md` and add `.github/assets/readme-header.png`, `social-preview.png`, and the O12 mark/lockup.
- [ ] Run the existing `.github/workflows/ci.yml` matrix equivalently: each JVM demo `./gradlew.bat build --no-daemon`; Workers demo `pnpm install --frozen-lockfile && pnpm verify`; run native-image `nativeCompile` when GraalVM 21+ is available and otherwise record the existing environment limitation.
- [ ] Commit `feat: apply DevsLab OSS identity to devslab-examples`.

### Task 7: Coordinated JVM review and release

- [ ] Run every Gradle and strict MkDocs command fresh and inspect generated English/Korean index metadata without committing `site/`.
- [ ] Confirm the O08/O09/O10 hashes differ, O02/O03 share the security core, and DataLinq works in no-color terminal output.
- [ ] Open six independent pull requests with asset version, tests, screenshots, and dirty-canonical preservation notes.
- [ ] Merge after central assets and official page deployment; verify Maven/docs links and GitHub social previews.

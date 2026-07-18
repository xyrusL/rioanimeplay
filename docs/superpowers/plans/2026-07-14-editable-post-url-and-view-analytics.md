# Editable Post URL and View Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add safe editable public post slugs without changing `anime_id`, and make existing view data clearer in Overview.

**Architecture:** Add a nullable unique `url_slug` to `anime`; public URL lookup resolves `url_slug`, with `anime_id` allowed only while `url_slug` is null. API payloads continue carrying immutable `animeId` for related data calls and add the public slug/path separately. Overview uses the existing view-history data without introducing view writes or polling.

**Tech Stack:** Next.js 15, React 19, Cloudflare Worker, D1/SQLite migrations, Node test runner, TypeScript.

## Global Constraints

- Never mutate `anime_id` or rewrite its foreign-key relationships.
- Old URLs stop resolving after a custom slug is assigned.
- Existing records keep their current URLs until customized.
- Changes to Worker/D1 require focused tests, local migration verification, `npm run worker:check`, and final `npm run lint -- --quiet`.
- Never run `npm build`, deploy, or apply a remote migration without explicit approval.

---

### Task 1: Slug schema and validation contract

**Files:**
- Create: `migrations/0020_anime_url_slug.sql`
- Create: `shared/lib/post-url-slug.mjs`
- Create: `shared/lib/post-url-slug.test.mjs`

**Interfaces:**
- Produces: `normalizePostUrlSlug(value): string` and `isValidPostUrlSlug(value): boolean`.

- [ ] Write failing tests for lowercase normalization, separator collapse, invalid empty values, and 1–100 character validation.
- [ ] Run `node --test shared/lib/post-url-slug.test.mjs`; expect failure because the module does not exist.
- [ ] Implement the helpers and additive migration with `url_slug TEXT` plus a partial unique index where non-null.
- [ ] Rerun the focused test; expect pass.

### Task 2: Worker URL resolution and admin updates

**Files:**
- Modify: `worker.js:10-15,48-50,383-417,972-1002,1109-1176,1368-1424,1501-1562`
- Create: `shared/lib/post-url-worker.test.mjs`

**Interfaces:**
- Consumes: slug helpers from Task 1.
- Produces: media `urlSlug`; admin item `urlSlug` and `postPath`; PATCH accepts `urlSlug`; public detail resolves custom slug while episode calls remain keyed by returned immutable `animeId`.

- [ ] Write source-level regression tests proving `anime_id` is never updated, duplicate slugs return 409, custom-slug lookup excludes the old ID, and `postPath` uses `url_slug ?? anime_id`.
- [ ] Run the test and verify expected failure.
- [ ] Add `url_slug` to media selection/output, validate and normalize PATCH input, preflight uniqueness, update only `url_slug`, and increment catalog revision through the existing flow.
- [ ] Change public detail resolution to `url_slug = ? OR (url_slug IS NULL AND anime_id = ?)` and return immutable `animeId` in the library payload.
- [ ] Keep episode endpoints keyed by immutable `animeId`; the web watch model already uses the detail response's `libraryId` for episode calls.
- [ ] Rerun focused tests; expect pass.

### Task 3: Admin URL editor

**Files:**
- Modify: `features/dashboard/content-manager.tsx:8-35,84-113,221-227`
- Create: `features/dashboard/content-editor-url.test.mjs`

**Interfaces:**
- Consumes: admin item `urlSlug`, `postPath`.
- Produces: PATCH payload `urlSlug` and live `/watch/{slug}` preview.

- [ ] Write a failing test that requires an editable URL slug field, immutable anime ID display, normalized input, and `urlSlug` in the save payload.
- [ ] Run the test and verify expected failure.
- [ ] Add `urlSlug` to `ContentItem`, initialize it from API data, add a `/watch/`-prefixed field near the editor header, normalize input client-side, and include it in save payloads.
- [ ] Preserve server conflict errors through existing `responseError` behavior.
- [ ] Rerun the test; expect pass.

### Task 4: Overview view presentation

**Files:**
- Modify: `features/dashboard/overview-analytics.tsx:24-60,136-179`
- Create: `features/dashboard/overview-views.test.mjs`

**Interfaces:**
- Consumes: existing `activeViewers` and `lifetimeViews` analytics values.
- Produces: clearly named Views card and a viewer-record trend without claiming unavailable per-period repeated-view deltas.

- [ ] Write a failing test requiring the card label `Views`, lifetime-view primary value, selected-period active viewer-record detail, and a `Viewer records` chart series.
- [ ] Run the test and verify expected failure.
- [ ] Rename/reframe the current ambiguous Audience card so lifetime views are primary and selected-period viewer records are explicit supporting data.
- [ ] Keep the existing chart series because the current schema stores cumulative `view_count` but not timestamped increments; do not fabricate period view totals.
- [ ] Rerun the test; expect pass.

### Task 5: Focused and final verification

**Files:**
- Test all files above and existing dashboard tests.

- [ ] Apply migration locally: `npm run db:migrate:local`; expect migration 0020 succeeds.
- [ ] Run focused tests: `node --test shared/lib/post-url-slug.test.mjs shared/lib/post-url-worker.test.mjs features/dashboard/content-editor-url.test.mjs features/dashboard/overview-views.test.mjs`.
- [ ] Run relevant dashboard tests and resolve only regressions caused by this change.
- [ ] Run `npm run worker:check`; expect dry-run success.
- [ ] Run `npm run lint -- --quiet` once; expect no errors.
- [ ] Do not deploy or apply the migration remotely; report those as required production follow-ups.

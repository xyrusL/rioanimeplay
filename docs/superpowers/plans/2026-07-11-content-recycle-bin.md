# Content Recycle Bin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 30-day recoverable recycle bin with individual and bulk permanent deletion plus automatic cleanup.

**Architecture:** Extend the existing `deleted_at` soft-delete model. Pure retention helpers calculate expiry metadata, Worker routes perform authenticated restore/permanent deletion, Next routes proxy them, and the existing ContentManager renders a dedicated Deleted view with accessible menus and confirmations.

**Tech Stack:** Cloudflare Workers, D1/SQLite, Next.js 15 route handlers, React 19, Node built-in tests.

## Global Constraints

- Retention is exactly 30 days from the original `deleted_at` UTC timestamp.
- Repeated soft deletion cannot reset the retention clock.
- Restore always returns content as draft.
- Permanent deletion only targets already-deleted rows.
- Bulk deletion only targets `deleted_at IS NOT NULL`.
- All destructive routes retain existing administrator and service-key authorization.
- Scheduled cleanup runs daily and purges only expired rows.

---

### Task 1: Retention calculations

**Files:**
- Create: `shared/lib/content-retention.mjs`
- Create: `shared/lib/content-retention.test.mjs`

**Interfaces:**
- Produces: `contentRetention(deletedAt, now?) -> { expiresAt, daysRemaining, expired }` and `CONTENT_RETENTION_DAYS`.

- [ ] Write failing tests for 30 days, partial-day ceiling, one day, expiry boundary, and invalid timestamps.
- [ ] Run `node --test shared/lib/content-retention.test.mjs` and confirm RED.
- [ ] Implement UTC millisecond calculations with a 30-day constant.
- [ ] Rerun and confirm GREEN.

### Task 2: Worker recycle-bin APIs

**Files:**
- Modify: `worker.js:795-980,1300-1367`
- Create: `worker-content-recycle-bin.test.mjs`

**Interfaces:**
- Extends admin item with `expiresAt` and `daysRemaining`.
- Adds permanent item and bulk endpoints.
- Adds `purgeExpiredContent(env, now?)` and Worker `scheduled()`.

- [ ] Inspect all migrations for tables referencing `anime.anime_id` and encode dependency deletion order.
- [ ] Write source/behavior tests for idempotent soft delete SQL, restore-as-draft, route specificity, active-row protection, bulk predicate, and 30-day purge predicate.
- [ ] Run tests and confirm RED.
- [ ] Make soft delete use `WHERE deleted_at IS NULL`; return unchanged success for already-deleted rows.
- [ ] Make restore require a deleted row and set `content_status='draft'` while clearing deletion metadata.
- [ ] Implement shared permanent deletion helpers and the two explicit endpoints.
- [ ] Add expiry fields to deleted admin items.
- [ ] Add scheduled cleanup and catalog/activity updates.
- [ ] Run tests to GREEN.

### Task 3: Next proxy routes and cron config

**Files:**
- Create: `app/api/dashboard/content/[id]/permanent/route.ts`
- Create: `app/api/dashboard/content/deleted/route.ts`
- Modify: `wrangler.jsonc`

**Interfaces:**
- Proxies permanent DELETE requests through `requestAdminApi` and revalidates catalog paths.
- Registers daily cron `17 3 * * *`.

- [ ] Write source-level route/config tests and confirm RED.
- [ ] Implement both dynamic route handlers with existing error relay patterns.
- [ ] Add the cron trigger without changing deployment routes or D1 bindings.
- [ ] Run tests to GREEN.

### Task 4: Deleted-tab UI

**Files:**
- Modify: `features/dashboard/content-manager.tsx`
- Create: `features/dashboard/content-recycle-bin.test.mjs`

**Interfaces:**
- Consumes API expiry metadata and permanent endpoints.
- Produces Deleted-specific header, countdown, overflow menu, confirmation dialog, restore, permanent item deletion, and bulk deletion.

- [ ] Write regression tests for retention copy, Deleted-only bulk action, exact endpoint calls, dialog copy, and empty state; confirm RED.
- [ ] Add reusable local confirmation dialog state with focus trapping/restoration.
- [ ] Add item overflow menus that close on outside click and Escape.
- [ ] Render deletion/expiration/countdown metadata.
- [ ] Implement restore, individual permanent deletion, and bulk deletion request flows.
- [ ] Correct pagination after deleting the final row on a later page.
- [ ] Run tests to GREEN.

### Task 5: Verification

- [ ] Run focused Node tests.
- [ ] Run `npm run lint -- --quiet`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Run `npm run worker:check`.
- [ ] Apply the migration set to a local D1 database and exercise soft-delete, restore, permanent-delete, and scheduled-purge boundaries.
- [ ] Drive the Content Deleted tab end to end, including keyboard menus and dialogs.

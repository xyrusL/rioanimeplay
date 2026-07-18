# Public Data Cache Implementation Record

**Goal:** Reduce Cloudflare Free-plan requests and D1 work while preserving safe public updates.

**Architecture:** One no-store revision manifest per browser visit, browser-local IndexedDB reuse, Cloudflare edge caching, and D1 as the authority. Public cache data is validated and repairable; sensitive and video data is excluded.

## Completed

- [x] Add Worker ETags, edge cache keys, resource revisions, and `/v1/cache-manifest`.
- [x] Increment catalog revisions from admin content changes, featured changes, retention deletion, and catalog synchronization.
- [x] Increment announcement revisions from create, edit, lifecycle, and delete operations.
- [x] Add protocol/schema/checksum validation, optional migration hooks, atomic replacement, automatic IndexedDB repair, cross-tab notices, and 25 MB LRU eviction.
- [x] Replace per-keystroke autocomplete requests with a compact revisioned search index and local Fuse.js ranking.
- [x] Cache public announcement payloads with a 30-second TTL and offline stale-data fallback.
- [x] Keep episode video sources, admin data, credentials, and private content out of IndexedDB.
- [x] Add bounded upstream timeouts so browser fallback is not blocked indefinitely.
- [x] Add focused regression tests, pass Worker dry-run, and complete lint with zero errors.
- [x] Apply remote migrations and deploy the Worker cache manifest on 2026-07-18.

## Remaining rollout and extensions

- [ ] Deploy the Next.js frontend worktree through the normal site deployment workflow.
- [ ] Add browser resource definitions for anime detail and episode-number DTOs before claiming those reads are browser-cached.
- [ ] Increment `episodes_revision` from any future episode-list import, edit, or deletion path.
- [ ] Seed route-rendered public DTOs into IndexedDB only where it measurably removes a duplicate client request.

## Verification baseline

- Focused Node tests: 16 passing.
- Worker deployment dry-run: passing.
- Repository lint: zero errors; unrelated existing warnings remain.
- Live manifest: protocol `2`, catalog revision available, search index endpoint returns `200`.

# Public Data Cache Design

## Implemented architecture

Public data uses three layers: validated browser IndexedDB, Cloudflare edge cache, then D1 on a cache miss. Next.js remains the hybrid SSR entrypoint, while browser-owned reads avoid repeated requests when a matching resource revision is already stored.

Each full browser visit requests `/api/public/manifest` once. The Worker returns cache protocol version `2` and independent `catalog`, `episodes`, and `announcements` resource revisions. The manifest is intentionally `no-store`: approximately one small metadata check per visitor provides predictable consistency without per-search or per-anime polling.

The catalog revision changes after content edits, visibility/deletion changes, featured-post changes, retention purges, and catalog synchronization. Announcement create, edit, lifecycle, and delete operations increment the announcement revision. The episode revision is registered for future episode-list mutation paths; episode video URLs remain uncached and `no-store`.

## Browser integrity and recovery

`shared/lib/public-resource-cache.ts` stores public resources in `rioanime-public-cache-v2`. Every record includes the cache protocol version, resource schema version, server revision, checksum, expiration, last-access time, estimated size, and validated data.

Reads verify the envelope, checksum, revision, schema, and resource-specific DTO validator. Supported older records may use a registered migration. Missing optional values may be normalized, but missing or invalid required values cause only that record to be deleted and fetched again. Replacement writes are validated before the previous key is overwritten. If IndexedDB cannot be opened or transacted, the cache database is recreated once and normal network fallback remains available.

Storage targets 25 MB and evicts low-priority, least-recently-used records first. Catalog indexes receive higher retention priority than transient announcement payloads. Cache changes are broadcast to other tabs. When the manifest or resource server is unavailable, a valid older record remains usable and the UI displays a saved-data/stale notice.

## Active resources and boundaries

- Autocomplete loads a compact index on first search focus/use and performs all ranking locally with Fuse.js. Keystrokes never call `/api/search`.
- Public announcements use revision validation plus a 30-second TTL so scheduled state changes do not remain stale indefinitely.
- SSR home, browse, watch details, and episode-number loading remain authoritative server paths. The cache registry is ready for those DTOs, but they should not be documented as browser-cached until their client consumers are wired.
- Video URLs, API keys, credentials, admin responses, user-private data, draft/private/deleted records, and unrestricted database rows are excluded.
- New public tables are uncached by default. Adding one requires a DTO validator, resource schema, revision source, mutation invalidation, and focused tests.

## Deployment status

On 2026-07-18, remote D1 migrations through `0020_public_cache_revisions.sql` were applied and Worker version `f1943fea-2cb1-4aa9-8744-c1b2a916f101` was deployed. The live Worker manifest reports protocol `2`. The Next.js browser-cache code is implemented in the worktree and becomes production-active through the normal frontend commit/deployment workflow.

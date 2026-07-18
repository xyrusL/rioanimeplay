# Content Recycle Bin Design

## Goal

Turn the existing content soft-delete filter into a complete recycle bin. Deleted anime posts remain recoverable for 30 days, display their remaining retention time, and can be restored or permanently deleted individually or in bulk.

## Existing foundation

The `anime` table already has `deleted_at` and `deleted_by`. Public catalog queries exclude deleted rows, the admin content API exposes a `deleted` filter, and the UI can restore deleted rows. The feature extends this foundation rather than introducing a second trash table.

## Retention model

`deleted_at` is the source of truth. Expiration is exactly 30 days after that UTC timestamp. The API returns `deletedAt`, `expiresAt`, and `daysRemaining`. Remaining days use a ceiling so any positive partial day displays as one day; an expired item displays zero and “Deletes today” until scheduled cleanup runs.

Normal `DELETE /v1/admin/content/:id` remains a soft delete. Repeating it for an already deleted item is idempotent and must not reset its retention clock.

## Restore

Restoration is an authenticated PATCH action. It clears `deleted_at` and `deleted_by`, sets `content_status` to `draft`, updates audit fields, increments catalog revision, and records `content_restored`. Restoring active content is rejected.

## Permanent deletion APIs

- `DELETE /v1/admin/content/:id/permanent` permanently deletes one already-deleted record.
- `DELETE /v1/admin/content/deleted` permanently deletes all deleted records.

Both require the existing administrator and service-key checks. The item endpoint rejects active content. Bulk deletion only targets `deleted_at IS NOT NULL`. Responses include deleted counts where applicable. Each operation increments catalog revision and records an activity event without logging sensitive data.

Dependent tables referencing anime must be inspected. Permanent deletion uses D1 batch statements to remove dependent records that do not cascade before deleting anime rows, preventing foreign-key failures and orphaned data.

## Scheduled purge

Wrangler config registers a daily off-peak cron trigger. The Worker exports `scheduled(_controller, env, ctx)` and runs cleanup with `ctx.waitUntil`. Cleanup permanently removes records whose `deleted_at` is at least 30 days old, handles dependencies the same way as manual deletion, increments catalog revision when rows were removed, and writes a system activity event containing the count. Failures are logged and reject the scheduled task for observability.

## Admin UI

The existing Deleted filter becomes the recycle-bin view. When selected:

- Header copy states that deleted posts are retained for 30 days.
- A danger-styled `Delete all permanently` button appears when deleted records exist.
- Rows show deletion date, expiration date, and remaining days.
- Normal edit/publish/privacy/NSFW controls are hidden.
- Each row has an accessible overflow menu containing `Restore as draft` and `Delete permanently`.
- The empty state says `Recycle bin is empty`.

Permanent actions use reusable in-app confirmation dialogs. Individual confirmation names the post. Bulk confirmation states the exact count and that the action cannot be undone. While requests run, destructive controls are disabled. Success refreshes the current page; failures remain visible without losing the current filter.

If deleting the final item on a page beyond page one, pagination moves to the previous valid page after refresh.

## Time copy

- More than one day: `{n} days remaining`
- One day: `1 day remaining`
- Zero: `Deletes today`

The expiration date is also displayed so the countdown is not the only source of information.

## Tests

Worker tests or focused extracted helper tests cover expiry calculation, idempotent soft deletion, restore-as-draft, active-content permanent-delete rejection, individual deletion, bulk deletion, dependency cleanup, and scheduled expiry boundaries. UI regression tests cover Deleted-only controls, remaining-day copy, confirmation dialogs, empty state, and pagination correction. Repository lint, TypeScript, Worker dry-run, and an end-to-end admin flow complete verification.

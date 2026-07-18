# Account Library Sync Blueprint

## Status

Implemented on 2026-07-18.

- D1 schema deployed through `0021_account_library.sql`.
- Worker deployed as version `d4a55c44-3a9e-49eb-b115-c2df2ce87610`.
- Next.js browser and relay code implemented in the current worktree.
- Frontend publication remains dependent on the repository's normal Git deployment workflow.

## Goal

Keep followed/bookmarked anime, episode history, watched episodes, and view totals available across browsers for Google-authenticated members without removing local/offline behavior.

## Architecture

```text
Browser localStorage
        |
        v
UserLibrarySync ---> /api/library ---> NextAuth session
                                           |
                                           v
                                  private Worker key
                                           |
                                           v
                              /v1/user/library Worker
                                           |
                  +------------------------+------------------------+
                  v                        v                        v
           accounts D1            account_bookmarks       account_episode_progress
                                                                   |
                                                                   v
                                                       anime_view_history
```

The browser owns the responsive UI state and offline copy. Next.js owns session verification. The Worker owns input validation, account provisioning, D1 relationships, and view-history updates.

## Identity and security boundary

- Google sign-in is handled by NextAuth with JWT sessions.
- Only `app/api/library/route.ts` derives the member email and name from the session.
- The browser cannot choose an account ID or call the Worker user endpoint with site authority.
- The Next relay sends `X-RioAnime-Key`, `X-RioAnime-User-Email`, and `X-RioAnime-User-Name` server-to-server.
- `/v1/user/library` accepts only the Worker deployment key. Managed catalog API keys cannot use this route.
- The Worker creates a member account on first use with `oauth:google` as the non-password credential marker.
- Disabled D1 accounts receive `403` and cannot read or update library state.
- View history uses a SHA-256 hash derived from the D1 account ID instead of a raw device or network identifier.

## Data model

### `account_bookmarks`

- Composite primary key: `(account_id, anime_id)`
- Stores `position` so browser bookmark order survives a round trip.
- References the immutable D1 anime ID, not the editable URL slug.

### `account_episode_progress`

- Composite primary key: `(account_id, anime_id)`
- Stores the last episode, watched episode JSON, cumulative view count, and viewed timestamps.
- Retains historical progress even when a title is not currently bookmarked.

### `anime_view_history`

- Reuses the existing account-aware analytics schema.
- Receives the latest episode and cumulative view count from account progress.
- A view increments when the last episode changes or the watched set gains an episode; repeated identical synchronization does not increment views.

## Synchronization rules

### First sign-in in a browser

- Union local and server bookmarks.
- Union local and server watched episodes.
- Use the server last episode when both sides contain the same anime.
- Keep local-only progress.
- Upload the merged snapshot after hydration.

### Returning clean browser

- Treat D1 as authoritative.
- Replace local bookmarks and progress with the server response.
- Notify mounted bookmark and watch components immediately.

### Returning dirty/offline browser

- Keep the local snapshot.
- Upload it after authentication succeeds.
- Retain the dirty marker when a request fails.
- Retry on the browser `online` event.

### Live updates

- Bookmark toggles and episode saves mark the local library dirty.
- Same-tab consumers receive `rioanime:library-change`.
- Existing `storage` listeners continue handling cross-tab updates.
- Server writes are debounced to avoid a request for every React render or duplicate state write.

## API contract

`GET /api/library` returns:

```json
{
  "accountId": "uuid",
  "bookmarks": [12345],
  "progress": [
    {
      "animeId": 12345,
      "lastEpisode": 3,
      "watchedEpisodes": [1, 2, 3],
      "viewCount": 3,
      "lastViewedAt": "2026-07-18 12:00:00"
    }
  ]
}
```

`PUT /api/library` accepts the browser snapshot:

```json
{
  "bookmarks": [12345],
  "progress": [
    {
      "animeId": 12345,
      "lastEpisode": 3,
      "watchedEpisodes": [1, 2, 3]
    }
  ]
}
```

The Worker resolves numeric source IDs to immutable D1 anime IDs and ignores unknown or invalid values.

## Verification performed

- Inspected the production D1 schema before implementation: one account, zero view-history records, and no personal-library tables.
- Applied and verified the new migration locally.
- Ran a local Worker round trip that provisioned a test member, wrote one bookmark and episodes `1,2,3`, read back last episode `3`, and created view count `1`.
- Removed all temporary local test records.
- Passed `shared/lib/user-library.test.mjs`.
- Passed ESLint with existing unrelated warnings.
- Passed the Worker deployment dry-run.
- Applied the remote migration and verified both new production tables.
- Deployed and verified the production Worker endpoint rejects requests without the private key.

The full Next.js production build currently reaches type checking but is blocked by unrelated existing declaration and test configuration errors. Those blockers must be resolved before the frontend worktree can be published through its Git deployment workflow.

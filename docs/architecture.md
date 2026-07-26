# RioAnime Architecture

## Overview

RioAnime is a Next.js 15 application backed by a Cloudflare Worker and D1 database. It serves desktop and mobile anime browsing experiences from the same codebase, uses React 19 and Tailwind CSS 4 for UI composition, and keeps a local JSON settings file for supplemental runtime customization.

The project is organized around feature composition:

- `app/` defines routes, page-level orchestration, layout wiring, and server entrypoints.
- `features/` contains page and screen composition for home, browse, watch, search, and mobile-specific experiences.
- `entities/anime/` owns the RioAnime catalog client, domain mapping, formatting helpers, slugs, and shared anime-facing types.
- `shared/` contains cross-cutting UI primitives and runtime utilities such as local settings, admin auth, mobile detection, caching, and client helpers.
- `data/` stores persisted local site settings used by the admin surface and public site.
- `app/api/` contains server-side proxies that keep the Worker API key out of browser code.
- `worker.js` owns public catalog reads, account-library persistence, admin mutations, edge caching, revisions, and D1 access.

## System Map

### Runtime layers

1. Route entrypoints in `app/` receive request context and query params.
2. Feature loaders in `features/*/model/` fetch and shape Worker catalog data for a route.
3. Server-only Worker access lives in `entities/anime/api/catalog.ts` and sends the deployment API key.
4. Mapper and formatter helpers convert catalog media into UI-ready models.
5. Screen components in `features/*/sections/` and `features/mobile/*/` render desktop or mobile layouts.
6. Browser-safe public resources use a revision manifest and validated IndexedDB records before requesting changed data.
7. Site-wide runtime settings are read from `shared/lib/site-settings.ts`, backed by `data/site-settings.json`.
8. Signed-in library state is hydrated through `app/api/library`, merged with existing browser state, and persisted to D1 through the private Worker user-library route.

### Shared architectural decisions

- The home, filter, account, and watch routes use a split rendering strategy: server-side user-agent detection picks an initial form factor, then `ResponsiveRender` confirms the breakpoint on the client.
- Desktop and mobile screens are separate component trees. Shared data loaders are reused, while presentation remains intentionally split.
- Public anime content is stored in D1. Administrative content mutations are authenticated, update D1, and increment the relevant public revision.
- Google identity is verified by NextAuth. The browser never sends a trusted account ID directly to the Worker; the authenticated Next route adds the user identity and private Worker key server-side.
- Bookmarks and episode progress remain available locally when signed out or offline. Signed-in users receive automatic server hydration and debounced updates.
- Anime visibility rules are enforced in data loaders before UI rendering.
- Video source URLs, credentials, admin responses, and private records are never stored in the public browser cache.

## Directory Guide

### `app/`

Primary route entrypoints and layout configuration.

- `layout.tsx` loads fonts, global CSS, applies `data-theme-preset` and `data-font-preset`, and mounts the account-library synchronization coordinator.
- `page.tsx` is the home route and coordinates home data with responsive rendering.
- `watch/[slug]/page.tsx` resolves a title slug into an available, locked, or not-found watch experience.
- `filter/page.tsx` builds the searchable browse view for both desktop and mobile.
- `anime/a-z/page.tsx` renders an alphabetical directory built from the browse catalog.
- `random/page.tsx` redirects to a random visible title.
- `account/page.tsx` renders Google sign-in, the signed-in account state, and auth-lockdown messaging.
- `bookmarks/page.tsx` currently serves the mobile bookmarks experience backed by the browse catalog.
- `api/library/route.ts` authenticates the NextAuth session and relays private library reads and writes to the Worker without exposing the deployment key.
- `admin/page.tsx` is the authentication boundary and entrypoint for the D1-backed operations console.
- `api/watch-episode/route.ts` privately relays the selected episode-source request to the Worker.

### `features/`

Feature-level composition, loaders, and route-specific UI.

- `features/home/` owns home page data shaping and desktop sections such as hero, grid, sidebars, and shared site chrome.
- `features/browse/` owns catalog assembly, filtering, sorting, pagination inputs, and desktop filter results UI.
- `features/watch/` owns watch-page data loading and available/unavailable watch screens.
- `features/search/` owns compact search-index assembly, browser validation, and local autocomplete ranking.
- `features/mobile/` owns the mobile shells, bottom navigation, and mobile-first screens for home, filter, bookmarks, account, and shared responsive behavior.

### `entities/anime/`

Anime-domain integration layer.

- `api/catalog.ts` contains authenticated server-only reads from the RioAnime Worker.
- `lib/mappers.ts` translates catalog media into UI-facing models.
- `lib/formatters.ts` and `lib/slug.ts` normalize labels and URL slugs.
- `model/types.ts` defines the shared `HomeAnimeItem`, `WatchAnimeItem`, `WeeklyTopEntry`, and `HomePageData` contracts used across features.

### `shared/`

Cross-cutting runtime and UI helpers.

- `shared/lib/site-settings.ts` defines the persisted site settings contract and helper functions for reading, normalizing, and updating settings.
- `shared/lib/admin-auth.ts` verifies D1 administrator credentials and manages the signed admin session cookie flow.
- `shared/lib/watch-storage.ts` owns browser bookmarks, episode progress, dirty/synced metadata, and library change notifications.
- `shared/lib/mobile-detection.ts` performs server-side mobile user-agent guessing.
- `shared/ui/user-library-sync.tsx` hydrates signed-in library state, preserves first-sign-in local data, debounces server updates, and retries after connectivity returns.
- `shared/ui/` also contains reusable building blocks such as panels, custom selects, modals, route progress, lockdown messaging, icons, and scroll helpers.

## Route Entry Points

### Home route

Entry: `app/page.tsx`

- Reads the request user agent via `headers()`.
- Determines an initial mobile guess through `isLikelyMobileUserAgent()`.
- Loads both `getHomePageData()` and `getSiteSettings()` in parallel.
- Passes the same data model into either `MobileHomeScreen` or `DesktopHomeScreen`.

`getHomePageData()` in `features/home/model/home-page-data.ts`:

- fetches the public home catalog from the Worker
- maps catalog media into `HomeAnimeItem`
- merges and deduplicates media
- filters out titles marked as `private`
- builds spotlight, featured rows, the main grid, weekly rankings, and sidebar genres

### Watch route

Entry: `app/watch/[slug]/page.tsx`

- Resolves the incoming slug through `getWatchPageData(slug)`.
- Returns one of three states:
  - `available`
  - `locked`
  - `not-found`
- Uses separate desktop and mobile unavailable screens when a title is locked.

`getWatchPageData()` in `features/watch/model/watch-page-data.ts`:

- checks local site rules by slug first
- hides `private` titles as not found
- returns a locked state immediately for `locked` titles
- resolves the public Worker record by URL slug, with a title-derived catalog fallback
- maps the matched result into `WatchAnimeItem`
- loads episode-number metadata separately from video sources
- re-checks title-based rules after mapping

### Filter and browse routes

Entries:

- `app/filter/page.tsx`
- `app/anime/a-z/page.tsx`
- `app/random/page.tsx`

`features/browse/model/browse-page-data.ts` provides the shared browse catalog:

- loads the complete public browse catalog from D1 through the Worker
- maps and deduplicates items
- sorts the result alphabetically
- filters out `private` titles for public-facing routes

That catalog powers:

- desktop and mobile filter screens
- the A-Z directory
- the random redirect
- bookmarks screen content

### Account route

Entry: `app/account/page.tsx`

- authenticates members with Google through NextAuth
- renders the signed-in member name and email when a session is active
- redirects Google sign-in and sign-out back to the account route
- reads site settings to disable new sign-ins when auth lockdown is active

The NextAuth session is the identity boundary for personal library access. Normal Google sign-in creates an active D1 member when the email is new; returning users reuse their existing account. Admin Google sign-in remains restricted to existing active accounts with the `admin` role.

### Account library synchronization

Browser entry: `shared/ui/user-library-sync.tsx`

Server relay: `app/api/library/route.ts`

Worker entry: `GET|PUT /v1/user/library`

The synchronization sequence is:

1. `UserLibrarySync` requests `/api/library` after the root layout mounts.
2. The Next route calls `auth()` and returns `401` without a signed-in Google email.
3. For a signed-in user, the Next route forwards the encoded email and display name with the private `RIOANIME_API_KEY`.
4. The Worker accepts this route only when the provided key matches the Worker deployment `API_KEY`.
5. The Worker reuses the D1 account identified by its case-insensitive email and rejects disabled accounts.
6. The Worker returns bookmarks and episode progress using numeric catalog source IDs, matching the existing browser storage format.
7. On first sign-in in a browser, bookmarks and watched episodes are merged so existing local data is preserved; the server's last episode wins when both sides have progress.
8. On later clean loads for the same account, the server copy replaces local state. Locally dirty state is uploaded instead, preserving offline changes.
9. Bookmark and episode mutations dispatch `rioanime:library-change`; the coordinator batches them into a debounced `PUT` and retries when the browser comes online.

Browser storage remains:

- `rioanime:bookmarks`: ordered numeric source IDs
- `rioanime:episodes`: last episode and watched-episode arrays per numeric source ID
- `rioanime:library-sync`: last synchronized account ID and dirty status

D1 persistence added by `migrations/0021_account_library.sql`:

- `account_bookmarks`: ordered account-to-anime bookmarks
- `account_episode_progress`: last episode, watched episode JSON, view count, and first/last viewed timestamps
- `anime_view_history`: existing analytics/history table updated with the account viewer hash, last episode, and cumulative view count

The Worker hashes `account:{account_id}` before writing `viewer_key_hash`. Raw browser identifiers, IP addresses, Google tokens, and the private Worker key are not stored in browser library data.

Operational limits protect the Worker and D1 request budget:

- at most 500 bookmarks per synchronized payload
- at most 400 anime progress entries per synchronized payload
- at most 10,000 watched episode numbers per anime
- source IDs and episode numbers must be positive safe integers within configured bounds

The canonical Worker host is `api.rioanime.dezely.com`. Direct protected requests without an accepted API key return `404`.

### Search and browser cache

The active autocomplete path is browser-local:

- `app/api/public/manifest` returns catalog, episode, and announcement revisions once per browser visit.
- `app/api/public/search-index` returns the compact public search index only when the catalog revision changed or no valid index exists.
- `features/search/model/browser-anime-search.ts` validates the index and ranks exact, alternate-title, prefix, boundary, and fuzzy matches locally.

`shared/lib/public-resource-cache.ts` owns protocol-v2 IndexedDB validation, checksums, resource schema versions, optional migrations, atomic replacement, stale fallback, cross-tab change notices, and a 25 MB LRU target. Invalid entries are removed individually; an unusable database is recreated automatically.

Announcements use the same cache manager with a 30-second TTL because scheduled visibility can change without a database mutation. Search indexes use the manifest revision as their primary invalidation signal.

### D1 and edge budget protection

Public Worker routes check the Cloudflare Cache API before loading catalog, anime, episode, announcement, or manifest data from D1. The first-party deployment key keeps its policy in a short-lived isolate cache, and canonical site origins avoid a per-request domain-lock lookup. Non-site API keys still use full D1-backed authentication, domain locking, limits, and usage accounting.

Successful request metrics are sampled at 2% and weighted to preserve approximate totals; errors are recorded immediately. Policy usage remains exact only for keys with an active request, daily, or bandwidth limit. Public Vercel proxies use shared `s-maxage`, stale revalidation, and stale-on-error headers, while account, admin, and library responses remain private and uncached.

### Current D1 boundaries

- `anime`, `episodes`, `featured_posts`, and the announcement tables own public content.
- `accounts`, library tables, view history, and reactions own member state and analytics.
- `api_keys`, `api_key_domain_settings`, and `api_key_allowed_domains` own per-key access policy.
- The former global `domain_lock_settings` and `allowed_domains` tables are removed by `0026_drop_global_domain_lock.sql` after migration into the per-key schema.
- Migration files are append-only history. Schema removal or data conversion must be implemented in a new numbered migration.

## Settings and Admin Control

### Settings persistence

`shared/lib/site-settings.ts` is the source of truth for local runtime configuration.

Persisted local settings include:

- `themePreset`
- `fontPreset`
- `authLockdown`
- `animeRules`
- `adminAppearance`

The module:

- creates `data/site-settings.json` if it is missing
- normalizes persisted values at read time
- exposes helper functions used by public visibility checks and admin appearance persistence

### Admin route and mutations

`app/admin/page.tsx` renders a D1-authenticated operations console with overview analytics, content management, members, API keys, status/announcements, activity, and account/settings panels.

- Login is verified against the D1 account database and stored in a signed server session.
- Browser admin requests use `app/api/dashboard/*` proxies; admin API responses remain `no-store`.
- Content, featured posts, announcements, content notices, account policy, per-key domain locks, and recycle-bin operations are handled by authenticated Worker routes and recorded in the activity log.
- The active local server action persists only the admin console appearance and revalidates `/admin`.
- Public content mutations increment resource revisions so returning browsers refresh affected cache groups.

### Anime visibility rules

`animeRules` supports three statuses:

- `public`: no active restriction
- `locked`: keep the title visible but block watch access with a message
- `private`: remove the title from public discovery and watch access

Enforcement points:

- home and browse loaders filter out `private` titles
- watch loader converts `private` to not found
- watch loader converts `locked` to a dedicated unavailable state

## Themes and Styling

Theme tokens live in `app/theme.css`.

The theme system works by:

- defining shared CSS custom properties in `:root`
- overriding token groups with `html[data-theme-preset="..."]`
- swapping font families with `html[data-font-preset="..."]`
- applying the active preset in `app/layout.tsx` from persisted site settings

Operational impact:

- persisted theme and font presets are applied by `app/layout.tsx`; the current admin appearance panel controls the console independently
- components consume semantic variables such as `--bg-base`, `--accent`, and `--line-soft` instead of hard-coded colors where theming matters

## Key Interfaces

### Catalog access

`entities/anime/api/catalog.ts` exposes server-only home, browse, alphabetical, detail, episode-number, and episode-source reads. Public metadata reads use bounded upstream timeouts and Worker/Next caching where appropriate. Episode video-source reads remain `no-store`.

### Shared UI models

`entities/anime/model/types.ts` contains the main view models:

- `HomeAnimeItem`
- `WeeklyTopEntry`
- `WatchAnimeItem`
- `HomePageData`

These are the contracts to update when adding a catalog field to UI components.

## Where To Start

| Task | Primary entrypoint | Supporting modules |
| --- | --- | --- |
| Change the home page layout | `app/page.tsx` | `features/home/sections/*`, `features/home/model/home-page-data.ts` |
| Change mobile shell or bottom navigation | `features/mobile/shared/mobile-app-shell.tsx` | `features/mobile/shared/mobile-bottom-nav.tsx` |
| Change watch page data or slug matching | `features/watch/model/watch-page-data.ts` | `entities/anime/lib/slug.ts`, `entities/anime/lib/mappers.ts` |
| Change search autocomplete | `features/search/model/browser-anime-search.ts` | `app/api/public/search-index`, `shared/lib/public-resource-cache.ts` |
| Change public cache invalidation | `worker.js` | `app/api/public/manifest`, `shared/lib/public-resource-cache.ts` |
| Change account library synchronization | `shared/ui/user-library-sync.tsx` | `shared/lib/watch-storage.ts`, `app/api/library/route.ts`, `worker.js` |
| Change account library D1 storage | `migrations/0021_account_library.sql` | `worker.js`, `anime_view_history` |
| Change browse filtering or A-Z behavior | `features/browse/model/filter-utils.ts` | `features/browse/model/browse-page-data.ts` |
| Add or update a theme preset | `app/theme.css` | `shared/lib/appearance-presets.ts`, `shared/lib/site-settings.ts` |
| Change admin console appearance persistence | `app/admin/actions.ts` | `shared/lib/site-settings.ts`, `shared/lib/admin-auth.ts` |
| Change D1 dashboard operations | `features/dashboard/*` | `app/api/dashboard/*`, `worker.js` |
| Add catalog fields to the UI | `worker.js` | `entities/anime/api/catalog.ts`, `entities/anime/lib/mappers.ts` |

## Maintenance Notes

### Add a new route

- create the route entry in `app/`
- prefer a feature loader in `features/*/model/` if data shaping is non-trivial
- reuse `ResponsiveRender` only when the mobile and desktop experiences are intentionally separate

### Add a new theme preset

- add the preset key to `shared/lib/appearance-presets.ts`
- define the token overrides in `app/theme.css`
- update the persisted setting through an explicit supported workflow
- confirm the preset survives normalization through `site-settings.json`

### Add a new public cached resource

- expose a public DTO that contains no credentials, private data, or video URLs
- register a metadata revision and increment it from every relevant mutation or sync path
- add a runtime validator and schema version to the browser resource definition
- normalize optional values, but invalidate records missing required identity fields
- add the resource to the manifest only after its invalidation path is complete

### Change personal library data

- keep Google/session validation in the Next server route; never trust a browser-provided account ID
- keep the Worker user-library route behind the deployment `API_KEY`, separate from managed public API keys
- preserve offline local storage behavior for signed-out users
- define first-sign-in and same-account merge semantics before adding fields
- use immutable `anime.anime_id` as the D1 foreign key and numeric `source_id` only at the browser/API boundary
- update both account progress and `anime_view_history` when a new watched state should count as a view
- add an additive D1 migration and verify local round-tripping before remote deployment

### Update architecture docs

Update this document and the desktop/mobile flow documents whenever any of the following change:

- route ownership
- data-loader boundaries
- settings persistence behavior
- mobile versus desktop rendering strategy
- search or watch resolution behavior

The dated plans and specifications under `docs/superpowers/` are historical implementation records. Update these three top-level documents for the current system rather than rewriting completed historical records.

# RioAnime Architecture

## Overview

RioAnime is a Next.js 15 application that serves a desktop and mobile anime browsing experience from the same codebase. The app uses App Router pages for primary route entrypoints, React 19 for UI composition, Tailwind CSS 4 for styling, AniList GraphQL as the live content source, and a local JSON settings file for runtime site customization.

The project is organized around feature composition:

- `app/` defines routes, page-level orchestration, layout wiring, and server entrypoints.
- `features/` contains page and screen composition for home, browse, watch, search, and mobile-specific experiences.
- `entities/anime/` owns AniList integration, domain mapping, formatting helpers, slugs, and shared anime-facing types.
- `shared/` contains cross-cutting UI primitives and runtime utilities such as theme settings, admin auth, mobile detection, and client helpers.
- `data/` stores persisted local site settings used by the admin surface and public site.
- `pages/api/` contains the legacy API route used by the search autocomplete.

## System Map

### Runtime layers

1. Route entrypoints in `app/` receive request context and query params.
2. Feature loaders in `features/*/model/` fetch and shape data for a route.
3. AniList access lives in `entities/anime/api/anilist.ts`.
4. Mapper and formatter helpers convert AniList media into UI-ready models.
5. Screen components in `features/*/sections/` and `features/mobile/*/` render desktop or mobile layouts.
6. Site-wide runtime settings are read from `shared/lib/site-settings.ts`, backed by `data/site-settings.json`.

### Shared architectural decisions

- The home, filter, account, and watch routes use a split rendering strategy: server-side user-agent detection picks an initial form factor, then `ResponsiveRender` confirms the breakpoint on the client.
- Desktop and mobile screens are separate component trees. Shared data loaders are reused, while presentation remains intentionally split.
- Public content is mostly read-only and external. Administrative changes update local settings, not a database.
- Anime visibility rules are enforced in data loaders before UI rendering.

## Directory Guide

### `app/`

Primary route entrypoints and layout configuration.

- `layout.tsx` loads fonts, global CSS, and applies `data-theme-preset` and `data-font-preset` to the root HTML element.
- `page.tsx` is the home route and coordinates home data with responsive rendering.
- `watch/[slug]/page.tsx` resolves a title slug into an available, locked, or not-found watch experience.
- `filter/page.tsx` builds the searchable browse view for both desktop and mobile.
- `anime/a-z/page.tsx` renders an alphabetical directory built from the browse catalog.
- `random/page.tsx` redirects to a random visible title.
- `account/page.tsx` renders the login/register surface and respects auth lockdown settings.
- `bookmarks/page.tsx` currently serves the mobile bookmarks experience backed by the browse catalog.
- `admin/page.tsx` is the operations surface for theme, announcement, auth lockdown, and anime visibility settings.

### `features/`

Feature-level composition, loaders, and route-specific UI.

- `features/home/` owns home page data shaping and desktop sections such as hero, grid, sidebars, and shared site chrome.
- `features/browse/` owns catalog assembly, filtering, sorting, pagination inputs, and desktop filter results UI.
- `features/watch/` owns watch-page data loading and available/unavailable watch screens.
- `features/search/` owns autocomplete ranking logic and search suggestion assembly.
- `features/mobile/` owns the mobile shells, bottom navigation, and mobile-first screens for home, filter, bookmarks, account, and shared responsive behavior.

### `entities/anime/`

Anime-domain integration layer.

- `api/anilist.ts` contains all AniList GraphQL reads.
- `lib/mappers.ts` translates AniList media into UI-facing models.
- `lib/formatters.ts` and `lib/slug.ts` normalize labels and URL slugs.
- `model/types.ts` defines the shared `HomeAnimeItem`, `WatchAnimeItem`, `WeeklyTopEntry`, and `HomePageData` contracts used across features.

### `shared/`

Cross-cutting runtime and UI helpers.

- `shared/lib/site-settings.ts` defines the persisted site settings contract and helper functions for reading, normalizing, and updating settings.
- `shared/lib/admin-auth.ts` implements the demo admin session cookie flow.
- `shared/lib/mobile-detection.ts` performs server-side mobile user-agent guessing.
- `shared/ui/` contains reusable building blocks such as panels, select fields, action forms, route progress, lockdown action messaging, icons, and scroll helpers.

## Route Entry Points

### Home route

Entry: `app/page.tsx`

- Reads the request user agent via `headers()`.
- Determines an initial mobile guess through `isLikelyMobileUserAgent()`.
- Loads both `getHomePageData()` and `getSiteSettings()` in parallel.
- Passes the same data model into either `MobileHomeScreen` or `DesktopHomeScreen`.

`getHomePageData()` in `features/home/model/home-page-data.ts`:

- fetches trending anime and trending movies from AniList
- maps AniList media into `HomeAnimeItem`
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
- searches AniList by slug-derived text when no blocking rule exists
- maps the matched result into `WatchAnimeItem`
- re-checks title-based rules after mapping

### Filter and browse routes

Entries:

- `app/filter/page.tsx`
- `app/anime/a-z/page.tsx`
- `app/random/page.tsx`

`features/browse/model/browse-page-data.ts` provides the shared browse catalog:

- assembles multiple AniList trending pages plus movies
- maps and deduplicates items
- sorts the result alphabetically
- filters out `private` titles for public-facing routes

That catalog powers:

- desktop and mobile filter screens
- the A-Z directory
- the random redirect
- bookmarks screen content
- admin anime rule selection

### Account route

Entry: `app/account/page.tsx`

- supports `login` and `register` modes from the query string
- reuses the responsive rendering split for mobile and desktop
- reads site settings to determine whether auth lockdown is active
- uses `LockdownAction` to prevent interactive submission when lockdown is enabled

This route is currently a front-end flow only. It presents the intended UX but does not connect to a real account backend.

### Search API

Entry: `pages/api/search.ts`

- accepts `q` as a query parameter
- returns an empty result set for blank input
- delegates to `searchAnimeSuggestions()`

`features/search/model/anime-search.ts`:

- builds a cached search catalog from multiple AniList pages plus movies
- filters out `private` titles
- ranks exact, alternate-title, prefix, boundary, and fuzzy matches
- limits the final result set to eight entries

## Settings and Admin Control

### Settings persistence

`shared/lib/site-settings.ts` is the source of truth for local runtime configuration.

Persisted settings include:

- `themePreset`
- `fontPreset`
- `announcement`
- `authLockdown`
- `animeRules`

The module:

- creates `data/site-settings.json` if it is missing
- normalizes persisted values at read time
- exposes helper functions for lookup and update workflows

### Admin route and server actions

`app/admin/page.tsx` renders the operations UI. Mutations are handled by `app/admin/actions.ts`.

Current actions:

- `loginAdminAction`
- `logoutAdminAction`
- `updateAppearanceAction`
- `updateAnnouncementAction`
- `updateAuthLockdownAction`
- `saveAnimeRuleAction`
- `deleteAnimeRuleAction`

These actions:

- require demo admin authentication where appropriate
- update `site-settings.json` through `updateSiteSettings()`
- call `revalidatePath()` to refresh affected pages

### Anime visibility rules

`animeRules` supports three statuses:

- `public`: no active restriction
- `locked`: keep the title visible but block watch access with a message
- `private`: remove the title from public discovery and watch access

Enforcement points:

- home and browse loaders filter out `private` titles
- watch loader converts `private` to not found
- watch loader converts `locked` to a dedicated unavailable state
- admin uses the browse catalog to select titles for rule changes

## Themes and Styling

Theme tokens live in `app/theme.css`.

The theme system works by:

- defining shared CSS custom properties in `:root`
- overriding token groups with `html[data-theme-preset="..."]`
- swapping font families with `html[data-font-preset="..."]`
- applying the active preset in `app/layout.tsx` from persisted site settings

Operational impact:

- changing theme or font in admin updates the public site without code changes
- components consume semantic variables such as `--bg-base`, `--accent`, and `--line-soft` instead of hard-coded colors where theming matters

## Key Interfaces

### AniList access

`entities/anime/api/anilist.ts` exposes:

- `fetchTrendingAnimePage()`
- `fetchTrendingMoviePage()`
- `searchAnimeByTitle()`

All AniList reads funnel through a single `fetchAniList()` helper for consistent request and error handling.

### Shared UI models

`entities/anime/model/types.ts` contains the main view models:

- `HomeAnimeItem`
- `WeeklyTopEntry`
- `WatchAnimeItem`
- `HomePageData`

These are the contracts to update when adding a new field that should move from AniList into UI components.

## Where To Start

| Task | Primary entrypoint | Supporting modules |
| --- | --- | --- |
| Change the home page layout | `app/page.tsx` | `features/home/sections/*`, `features/home/model/home-page-data.ts` |
| Change mobile shell or bottom navigation | `features/mobile/shared/mobile-app-shell.tsx` | `features/mobile/shared/mobile-bottom-nav.tsx` |
| Change watch page data or slug matching | `features/watch/model/watch-page-data.ts` | `entities/anime/lib/slug.ts`, `entities/anime/lib/mappers.ts` |
| Change search autocomplete | `pages/api/search.ts` | `features/search/model/anime-search.ts` |
| Change browse filtering or A-Z behavior | `features/browse/model/filter-utils.ts` | `features/browse/model/browse-page-data.ts` |
| Add or update a theme preset | `app/theme.css` | `shared/lib/site-settings.ts`, `app/admin/page.tsx` |
| Change admin persistence behavior | `app/admin/actions.ts` | `shared/lib/site-settings.ts`, `shared/lib/admin-auth.ts` |
| Add AniList fields to the UI | `entities/anime/api/anilist.ts` | `entities/anime/lib/mappers.ts`, `entities/anime/model/types.ts` |

## Maintenance Notes

### Add a new route

- create the route entry in `app/`
- prefer a feature loader in `features/*/model/` if data shaping is non-trivial
- reuse `ResponsiveRender` only when the mobile and desktop experiences are intentionally separate

### Add a new theme preset

- add the preset key to `THEME_PRESETS`
- add the admin label in `app/admin/page.tsx`
- define the token overrides in `app/theme.css`
- confirm the updated preset survives round-tripping through `site-settings.json`

### Add a new AniList field

- extend the GraphQL field selection in `entities/anime/api/anilist.ts`
- update the relevant mapped UI type
- add the mapping logic in `entities/anime/lib/mappers.ts`
- update the feature screens that consume the field

### Update architecture docs

Update this document and the desktop/mobile flow documents whenever any of the following change:

- route ownership
- data-loader boundaries
- settings persistence behavior
- mobile versus desktop rendering strategy
- search or watch resolution behavior

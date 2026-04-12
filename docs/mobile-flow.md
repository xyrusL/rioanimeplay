# Mobile Flow

## Purpose

This document shows how the mobile experience is assembled, where routing decisions happen, and which shared mobile primitives should be updated when the small-screen product changes.

## Mobile Rendering Strategy

The mobile experience is selected in two stages:

1. Server entrypoints estimate the device type from the incoming user agent.
2. `ResponsiveRender` confirms the viewport on the client and swaps between mobile and desktop trees.

That pattern is used by the home, filter, account, and watch routes.

## Mobile Route Flow

```mermaid
flowchart TD
    A[Incoming request] --> B[App route entry in app/]
    B --> C[headers() + isLikelyMobileUserAgent()]
    C --> D[Load route data]
    D --> E[ResponsiveRender]
    E -->|mobile| F[Mobile screen component]
    E -->|desktop| G[Desktop screen component]
```

## Mobile Navigation Map

```mermaid
flowchart TD
    H[MobileHomeScreen] --> I[MobileAppShell]
    I --> J[MobileBottomNav]
    J --> K[/]
    J --> L[/bookmarks]
    J --> M[/filter]
    J --> N[/account]
    H --> O[MobileFeaturedCarousel]
    H --> P[MobileRecentUpdatesSection]
    L --> Q[MobileBookmarksScreen]
    M --> R[MobileFilterScreen]
    N --> S[MobileSettingsScreen]
```

## Mobile Watch Flow

```mermaid
flowchart TD
    A[app/watch/[slug]/page.tsx] --> B[getWatchPageData(slug)]
    B --> C{Result state}
    C -->|available| D[MobileWatchScreen]
    C -->|locked| E[MobileWatchUnavailableScreen]
    C -->|not-found| F[next/notFound]
```

## Shared Mobile Components

- `features/mobile/shared/mobile-app-shell.tsx` provides the high-level mobile shell.
- `features/mobile/shared/mobile-bottom-nav.tsx` owns persistent bottom navigation.
- `features/mobile/shared/mobile-anime-card.tsx` is the reusable card primitive across mobile surfaces.
- `features/mobile/shared/responsive-render.tsx` is the client-side viewport switch used by mixed mobile/desktop routes.

## Notes For Changes

- If a change affects all mobile pages, start in the shared mobile shell and bottom navigation.
- If a route needs different data but the same chrome, keep the loader in the route feature and avoid moving API logic into mobile components.
- If mobile and desktop should share behavior but not structure, keep the split at the screen layer and share loaders or utility helpers instead.

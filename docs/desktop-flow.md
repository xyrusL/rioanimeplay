# Desktop Flow

## Purpose

This document maps the desktop-facing route composition and highlights which components own the primary public browsing experience versus the separate admin surface.

## Desktop Rendering Strategy

Desktop routes usually enter through `app/` pages, load data on the server, and render feature sections directly. For routes that support both form factors, desktop is selected by `ResponsiveRender` after the route computes an initial device guess from the request headers.

## Public Site Flow

```mermaid
flowchart TD
    A["Home route"] --> B["Home page loader"]
    B --> C["AniList fetch and mapping"]
    C --> D["Responsive render switch"]
    D -->|desktop| E["Desktop home screen"]
    E --> F["Site header"]
    E --> G["Featured hero"]
    E --> H["Anime grid"]
    E --> I["Right sidebar"]
    E --> J["Site footer"]
```

## Browse and Directory Flow

```mermaid
flowchart TD
    A["Browse catalog loader"] --> B["Raw catalog fetch"]
    B --> C["Map dedupe and sort"]
    C --> D["Public browse catalog"]
    D --> E["Filter page"]
    D --> F["A to Z directory"]
    D --> G["Bookmarks source"]
    D --> H["Admin anime selector"]
    D --> I["Random route redirect"]
```

## Watch and Admin Flow

```mermaid
flowchart TD
    A["Watch route"] --> B["Watch page loader"]
    B --> C{"State"}
    C -->|available| D["Watch screen"]
    C -->|locked| E["Watch unavailable screen"]
    C -->|not-found| F["Not found"]

    G["Admin route"] --> H["Admin forms"]
    H --> I["Server actions"]
    I --> J["Update site settings"]
    J --> K["site-settings.json"]
    I --> L["Route revalidation"]
```

## Desktop Ownership Notes

- `features/home/sections/desktop-home-screen.tsx` is the top-level desktop home composition root.
- `features/browse/sections/filter-toolbar.tsx` and `filter-results-panel.tsx` own the desktop filter page.
- `features/watch/sections/watch-screen.tsx` owns the desktop watch experience.
- `app/admin/page.tsx` is intentionally separate from the public desktop flow and functions as an operations console rather than a consumer-facing page.

## Notes For Changes

- Start at route entrypoints when changing data flow or route-level loading behavior.
- Start in `features/home/sections/` when adjusting desktop landing-page composition.
- Start in `features/browse/sections/` when changing the desktop catalog exploration UI.
- Keep admin changes isolated from the public browsing surface unless the change affects `site-settings.json` behavior or page revalidation.

# Public Visibility and NSFW Gate Design

## Scope

Private, draft, and deleted posts remain excluded at the Worker query layer from every public list, search, detail, and episode endpoint. The existing `PUBLIC_ANIME_PREDICATE` remains the canonical condition. This change only refines the warning shown when someone opens an NSFW watch page.

## Behavior and data flow

NSFW posts remain discoverable. Their `isNsfw` flag propagates from catalog responses into home and watch view models. A root client provider stores age confirmation in `sessionStorage`, scoped to the current browser tab. A shared sensitive-image treatment blurs NSFW covers and banners and displays an 18+ marker until confirmation.

Both watch-screen variants check `anime.isNsfw` and the shared age-gate state before rendering the page. Until the provider is ready and consent exists, they render only the warning dialog; the video player and descriptive watch content are not mounted. Confirming records consent and reveals NSFW content for the remainder of that tab session.

## Warning dialog

The shared dialog follows the supplied mock: a dark, strongly blurred full-screen backdrop; a centered dark panel with a subtle pink border and glow; a circular 18+ shield; “Mature Content” heading; concise 18+ warning; a blurred artwork preview strip with a hidden-content indicator; a prominent pink gradient “I AM 18 OR OLDER” action; a Go back action; and a top-right close button. It is responsive, preserving comfortable spacing and touch targets on narrow screens.

The dialog receives the anime title and available artwork from the watch model. Artwork is decorative and remains blurred. If artwork is unavailable or fails to load, the strip retains its dark gradient treatment without blocking either action.

Close, Go back, and Escape share one navigation behavior: use browser history when available, otherwise replace the route with `/`. Continue is the only action that grants consent.

## Accessibility

The overlay is an `aria-modal` dialog labelled by its heading. The close control has an accessible name, the initial focus lands on the primary confirmation action, Tab and Shift+Tab remain within the dialog, and Escape performs the safe back action. Background content is absent rather than merely visually obscured, preventing keyboard or assistive-technology access before confirmation. Motion respects the project’s reduced-motion conventions.

## Verification

Focused tests cover the public SQL predicate and `isNsfw` model propagation, session-only consent, blocked player rendering before confirmation, dialog copy and actions, keyboard focus containment, Escape handling, and the blurred preview treatment. Runtime verification opens an NSFW watch route at desktop and mobile widths, confirms that the player is initially absent, exercises back and continue, and verifies that consent persists only within the current tab. After focused checks, run the required final lint once; do not run `npm build`.

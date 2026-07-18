# NSFW Warning Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing basic NSFW watch-page warning with a responsive, accessible 18+ gate matching the approved mock while keeping the player unmounted until session consent.

**Architecture:** Keep the existing root `AgeGateProvider` and watch-screen guards. Expand the shared `AgeWarningDialog` interface to receive optional artwork, contain keyboard focus, and render the approved presentation; pass existing watch-model artwork from both desktop and mobile screens. Add focused source-contract regression coverage because this repository currently uses Node’s built-in test runner rather than a React DOM test stack.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, `next/image`, Node test runner.

## Global Constraints

- Preserve all unrelated uncommitted user work; modify only the listed feature files.
- Consent remains in `sessionStorage` under `rioanime:adult-content-confirmed` and lasts for the current browser tab.
- The player and descriptive watch content must remain unmounted before consent.
- Close, Go back, and Escape use browser history when available and otherwise replace the route with `/`.
- Do not add dependencies and do not run `npm build`.
- Run focused tests during implementation and `npm run lint -- --quiet` once after all work is complete.

---

## File structure

- `shared/ui/age-warning-dialog.tsx`: owns the modal presentation, safe-back behavior, focus containment, and artwork fallback.
- `features/watch/sections/watch-screen.tsx`: supplies desktop watch artwork to the shared gate.
- `features/watch/sections/mobile-watch-screen.tsx`: supplies mobile watch artwork to the same shared gate.
- `features/watch/nsfw-gate.test.mjs`: verifies the gate contract and watch-screen integration without introducing a new test framework.

### Task 1: Lock the dialog contract with regression tests

**Files:**
- Modify: `features/watch/nsfw-gate.test.mjs:1-23`

**Interfaces:**
- Consumes: existing source files and Node `readFile`.
- Produces: regression assertions for `AgeWarningDialog({ title, artwork })`, session-only consent, modal semantics, keyboard handling, and both watch-screen call sites.

- [ ] **Step 1: Write the failing source-contract test**

Add source reads for `age-warning-dialog.tsx`, `age-gate-provider.tsx`, and both watch screens. Add a test asserting all of these exact contracts:

```js
assert.match(dialog, /title: string; artwork\?: string \| null/);
assert.match(dialog, /aria-modal="true"/);
assert.match(dialog, /aria-labelledby="age-warning-title"/);
assert.match(dialog, /event\.key === "Escape"/);
assert.match(dialog, /event\.key !== "Tab"/);
assert.match(dialog, /I AM 18 OR OLDER/);
assert.match(dialog, /Mature Content/);
assert.match(provider, /sessionStorage\.getItem\(SESSION_KEY\)/);
assert.match(provider, /sessionStorage\.setItem\(SESSION_KEY, "1"\)/);
assert.match(desktopWatch, /artwork=\{anime\.bannerImage \?\? anime\.coverImage\}/);
assert.match(mobileWatch, /artwork=\{anime\.bannerImage \?\? anime\.coverImage\}/);
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --test features/watch/nsfw-gate.test.mjs`

Expected: FAIL because the current dialog has no `artwork` prop, mock copy, focus-trap branch, or artwork call sites.

- [ ] **Step 3: Commit the failing regression test**

```bash
git add features/watch/nsfw-gate.test.mjs
git commit -m "test: specify NSFW warning modal behavior"
```

### Task 2: Implement the shared mock-aligned warning dialog

**Files:**
- Modify: `shared/ui/age-warning-dialog.tsx:1-27`

**Interfaces:**
- Consumes: `useAgeGate().confirmAdult`, Next router, `MaterialIcon`, optional artwork URL.
- Produces: `AgeWarningDialog({ title, artwork }: { title: string; artwork?: string | null })`.

- [ ] **Step 1: Add the dialog state and behavior**

Refactor the component to use a stable `goBack` callback, a panel ref, and a confirmation-button ref. In one mount-only effect:

```tsx
confirmButtonRef.current?.focus();

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape") {
    event.preventDefault();
    goBack();
    return;
  }
  if (event.key !== "Tab") return;
  const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable?.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
```

Register and clean up `keydown` exactly once. Keep safe back behavior as `router.back()` when `window.history.length > 1`, otherwise `router.replace("/")`.

- [ ] **Step 2: Build the responsive modal presentation**

Render a full-screen `fixed inset-0 z-[100]` backdrop with black translucency and strong backdrop blur. Inside a responsive `max-w-2xl` panel, render:

- top-right close button with `aria-label="Close mature content warning"`;
- circular pink 18+ emblem and shield/lock icon;
- `<h1 id="age-warning-title">Mature Content</h1>`;
- warning copy that includes the escaped title and “only suitable for adults 18 years and older”;
- a fixed-height preview strip using a blurred decorative background image when `artwork` exists, plus five translucent thumbnail cells and a centered visibility-off icon/label;
- a full-width pink gradient button labelled `I AM 18 OR OLDER`, wired to `confirmAdult` and assigned `confirmButtonRef`;
- a text-style `Go back` button wired to `goBack`.

Use existing project colors and Material icons. Give all controls visible focus rings, at least 44px touch height, and use `motion-reduce:transition-none` on animated transitions. Do not render an unblurred `<Image>` element.

- [ ] **Step 3: Pass artwork from both watch screens**

Change both guards to:

```tsx
return (
  <AgeWarningDialog
    title={anime.title}
    artwork={anime.bannerImage ?? anime.coverImage}
  />
);
```

This retains the existing guard, so `SmartVideoPlayer` remains absent before consent.

- [ ] **Step 4: Run focused tests**

Run: `node --test features/watch/nsfw-gate.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Commit the implementation**

```bash
git add shared/ui/age-warning-dialog.tsx features/watch/sections/watch-screen.tsx features/watch/sections/mobile-watch-screen.tsx
git commit -m "feat: refine NSFW warning modal"
```

### Task 3: Verify interaction and final quality

**Files:**
- Verify: `shared/ui/age-warning-dialog.tsx`
- Verify: `features/watch/sections/watch-screen.tsx`
- Verify: `features/watch/sections/mobile-watch-screen.tsx`

**Interfaces:**
- Consumes: an NSFW anime route exposed by the local catalog.
- Produces: observed desktop/mobile gate behavior and a clean focused test/lint result.

- [ ] **Step 1: Run the app and open an NSFW watch route**

Run the project through the repository’s run/verify workflow. At desktop width, verify the mock-aligned overlay appears, the player is absent, focus starts on `I AM 18 OR OLDER`, Tab stays inside the dialog, and Escape performs safe back navigation.

- [ ] **Step 2: Verify confirmation and tab-session persistence**

Reopen the NSFW route, choose `I AM 18 OR OLDER`, and verify the watch screen/player renders. Navigate to another NSFW title in the same tab and verify no repeat prompt. Open a fresh browser context/tab session and verify the prompt returns.

- [ ] **Step 3: Verify the mobile layout**

At approximately 390px viewport width, verify the panel fits without horizontal scrolling, all copy remains readable, controls remain at least 44px high, and the blurred preview does not expose unblurred artwork.

- [ ] **Step 4: Run the focused test again**

Run: `node --test features/watch/nsfw-gate.test.mjs`

Expected: all tests PASS.

- [ ] **Step 5: Run the required final lint once**

Run: `npm run lint -- --quiet`

Expected: exit code 0 with no lint errors. Do not run `npm build`.

- [ ] **Step 6: Commit verification-only fixes if needed**

If runtime verification or lint required source fixes, stage only the listed feature files and commit:

```bash
git add shared/ui/age-warning-dialog.tsx features/watch/sections/watch-screen.tsx features/watch/sections/mobile-watch-screen.tsx features/watch/nsfw-gate.test.mjs
git commit -m "fix: polish NSFW gate interactions"
```

If no fixes were needed, do not create an empty commit.

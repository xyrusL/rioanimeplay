# Public Visibility and NSFW Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce public editorial visibility server-side and add session-scoped 18+ protection for NSFW imagery and watch pages.

**Architecture:** Keep `PUBLIC_ANIME_PREDICATE` as the server security boundary. Propagate `isNsfw` through view models, then use a root session provider and shared sensitive-image wrapper for blur/reveal behavior; the watch page blocks player rendering behind an accessible confirmation modal.

**Tech Stack:** Cloudflare Worker/D1, React 19 context, Next.js, sessionStorage, Node tests.

## Global Constraints

- Private, draft, and deleted content never appears through public APIs.
- NSFW content remains discoverable but artwork is blurred before confirmation.
- Consent lasts only for the current browser tab session.
- The video player is not mounted before NSFW confirmation.
- Cancel navigates back, falling back to `/`.

---

### Task 1: Security and model regression tests
- Create a source regression test proving all public endpoint queries use `PUBLIC_ANIME_PREDICATE` and it includes published/public/not-deleted.
- Add `isNsfw` to `HomeAnimeItem`, `WeeklyTopEntry`, and `WatchAnimeItem`, and propagate it in mappers.
- Run focused tests.

### Task 2: Session age gate
- Create `shared/ui/age-gate-provider.tsx` with `AgeGateProvider` and `useAgeGate`.
- Initialize from `sessionStorage`, expose `confirmed` and `confirmAdult`, and persist only in session storage.
- Mount provider in the root layout.

### Task 3: Sensitive artwork and warning dialog
- Create reusable `SensitiveImage` around Next Image, applying strong blur and an 18+ overlay while unconfirmed.
- Replace public cover/banner images in desktop cards, mobile cards, featured hero, and watch details.
- Create accessible `AgeWarningDialog` with Continue and Go back; Escape invokes Go back.
- In watch screens, render the dialog and do not mount the player/content until confirmed.

### Task 4: Verification
- Run focused tests, lint, TypeScript, Worker dry-run, and drive public/private/draft/deleted/NSFW flows.

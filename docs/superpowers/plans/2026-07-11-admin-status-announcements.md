# Admin Status Announcements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose the existing scheduled announcement backend through a complete admin Status tab.

**Architecture:** A focused `StatusManager` owns CRUD, composer state, anime lookup, preview, and derived lifecycle states. `AdminDashboard` retains the panel like other tabs. Existing APIs and public modal remain the runtime delivery layer.

**Tech Stack:** React 19, Next.js route handlers, Worker/D1 announcements API, custom modal/select UI.

## Global Constraints
- New announcements default disabled.
- Scope is global or one anime post.
- Start/end are optional; end must follow start.
- Preview never enables or saves.
- Anime-specific active notices outrank global notices on matching watch pages.

---

### Task 1: Regression tests
- Add source tests for Status navigation/panel, disabled default, scheduling fields, anime scope, preview/edit/toggle/delete, and public scheduling SQL.

### Task 2: Status manager
- Create `features/dashboard/status-manager.tsx`.
- Implement list load, create/update/delete, enable toggle, form validation, local/UTC conversion, anime search through dashboard content, lifecycle badges, preview modal, and confirmation deletion.

### Task 3: Dashboard integration and public fix
- Add Status navigation item and retained panel.
- Fix nullable pathname handling in scheduled public modal.
- Ensure new Worker announcement input defaults disabled rather than enabled.

### Task 4: Verification
- Run focused tests, lint, TypeScript, and Worker dry-run; exercise global and anime scheduled announcements.

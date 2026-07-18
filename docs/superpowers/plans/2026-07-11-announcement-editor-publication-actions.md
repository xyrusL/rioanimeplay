# Announcement Editor Publication Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the duplicate status control from both announcement editor variants so Save as draft and Publish exclusively determine visitor visibility, then rebalance the shared modal layout.

**Architecture:** Keep the existing shared `StatusManager` editor and Worker contract. Resolve `enabled` from the submitting button's `intent`, remove the checkbox from the presentation layer, and retain list-level Enable/Disable actions for later state changes.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Node test runner, Cloudflare Worker/D1.

## Global Constraints

- Preserve existing announcement storage, scheduling, and public cache semantics.
- Preserve list-level Enable/Disable controls.
- Do not redesign unrelated dashboard surfaces.
- Protect the existing uncommitted working tree and do not commit unless explicitly requested.
- Never run `npm build`.
- Run `npm run lint -- --quiet` once after the complete implementation.

---

### Task 1: Lock Publication Intent and Layout with Regression Tests

**Files:**
- Modify: `features/dashboard/status-publication-actions.test.mjs:1-25`
- Test: `features/dashboard/status-publication-actions.test.mjs`

**Interfaces:**
- Consumes: Source text from `features/dashboard/status-manager.tsx`.
- Produces: Regression assertions for the absence of duplicate status controls, explicit submit intents, intent-to-enabled mapping, and the responsive editor layout.

- [ ] **Step 1: Confirm the regression test expresses the approved behavior**

Ensure the modal slice assertions require all of the following:

```js
test("announcement editor has no duplicate enabled control", () => {
  assert.doesNotMatch(modal, />Status</);
  assert.doesNotMatch(modal, /type="checkbox"/);
  assert.doesNotMatch(modal, />Enabled</);
});

test("draft and publish submit actions own publication state", () => {
  assert.match(modal, /name="intent" value="draft"/);
  assert.match(modal, /name="intent" value="publish"/);
  assert.match(source, /submitter\?\.value === "publish" \? true/);
  assert.match(source, /submitter\?\.value === "draft" \? false/);
});

test("editor uses a single-column content layout with paired schedule fields", () => {
  assert.match(modal, /className="space-y-5"/);
  assert.match(modal, /className="grid gap-4 sm:grid-cols-2"/);
  assert.match(modal, /admin-label sm:col-span-2">Title/);
});
```

- [ ] **Step 2: Run the focused regression test and verify the current UI fails**

Run:

```bash
node --test features/dashboard/status-publication-actions.test.mjs
```

Expected: FAIL because the current editor still renders `Status`, a checkbox, and `Enabled`, and its title is not full-width.

---

### Task 2: Remove Duplicate Status UI and Rebalance the Shared Editor

**Files:**
- Modify: `features/dashboard/status-manager.tsx:133-137`
- Test: `features/dashboard/status-publication-actions.test.mjs`
- Test: `features/dashboard/status-manager.test.mjs`
- Test: `features/dashboard/status-integration.test.mjs`

**Interfaces:**
- Consumes: Existing `save(event: FormEvent)` intent mapping and the shared `Draft` state.
- Produces: A shared editor with no publication checkbox; `Save as draft` submits `enabled: false`, and `Publish` submits `enabled: true`.

- [ ] **Step 1: Remove the Status field while retaining the type control**

Replace the first two-column block in the editor with a single type control:

```tsx
<div>
  {editorKind === "home" ? (
    <CustomSelect
      label="Homepage message type"
      value={draft.placement}
      options={placementOptions}
      onChange={(value) => setDraft((current) => ({
        ...current,
        placement: value as Placement,
        animeId: "",
        animeTitle: ""
      }))}
      className="admin-label"
      buttonClassName="mt-2 h-11 rounded-xl border-[var(--admin-border)] bg-[var(--admin-input)] px-4 font-semibold text-[var(--admin-text)]"
      menuClassName="rounded-xl border-[var(--admin-border)] bg-[var(--admin-surface-muted)] text-[var(--admin-text)]"
    />
  ) : (
    <div className="admin-label">
      <span>Message type</span>
      <div className="mt-2 flex h-11 items-center gap-2 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] px-4 font-semibold text-[var(--admin-text)]">
        <MaterialIcon className="text-[18px] text-[var(--admin-accent-text)]" name="post_add" />
        Post notification
      </div>
    </div>
  )}
</div>
```

Do not add another status control. Keep `draft.enabled` because edit, preview, and list-level update flows still consume it.

- [ ] **Step 2: Make title full-width and keep schedule fields paired**

Use this field structure:

```tsx
<div className="grid gap-4 sm:grid-cols-2">
  <label className="admin-label sm:col-span-2">
    Title
    <input
      required
      maxLength={120}
      className={input}
      value={draft.title}
      onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
    />
  </label>
  <label className="admin-label sm:col-span-2">
    Message
    <textarea
      required
      maxLength={5000}
      rows={5}
      className={`${input} h-auto py-3`}
      value={draft.message}
      onChange={(event) => setDraft((current) => ({ ...current, message: event.target.value }))}
    />
  </label>
  <label className="admin-label">
    Starts at
    <input type="datetime-local" className={input} value={draft.startsAt} onChange={(event) => setDraft((current) => ({ ...current, startsAt: event.target.value }))} />
  </label>
  <label className="admin-label">
    Ends at
    <input type="datetime-local" className={input} value={draft.endsAt} onChange={(event) => setDraft((current) => ({ ...current, endsAt: event.target.value }))} />
  </label>
</div>
```

- [ ] **Step 3: Update editor guidance to describe action-owned state**

Use concise copy that applies to creation and editing:

```tsx
<p className="admin-support mt-1">
  {editingId
    ? "Update the message or schedule, then save it as a draft or publish it."
    : "Add the message and schedule, then save it as a draft or publish it."}
</p>
```

Keep the footer order: Cancel, Preview, Save as draft, Publish.

- [ ] **Step 4: Run focused status tests**

Run:

```bash
node --test features/dashboard/status-publication-actions.test.mjs features/dashboard/status-manager.test.mjs features/dashboard/status-integration.test.mjs
```

Expected: all tests PASS.

---

### Task 3: Exercise Both Modal Variants and Complete Verification

**Files:**
- Verify: `features/dashboard/status-manager.tsx`
- Verify: `worker.js:267-286`

**Interfaces:**
- Consumes: The completed shared editor and existing dashboard announcement endpoints.
- Produces: Runtime evidence that both creation variants expose only action-owned publication state and retain responsive layout.

- [ ] **Step 1: Launch the project with its existing development command**

Use the project run skill to launch the app. Do not alter production data or deploy the Worker.

Expected: the admin dashboard loads locally without a compilation error.

- [ ] **Step 2: Exercise the homepage announcement modal**

Open **New home announcement** and verify:

- No Status or Enabled checkbox appears.
- Homepage message type spans the available content width.
- Title and message span the content width.
- Starts at and Ends at are paired on desktop and stack at a narrow viewport.
- Footer actions appear in the approved order.

- [ ] **Step 3: Exercise the post notification modal**

Open **New post notification** and verify:

- No Status or Enabled checkbox appears.
- The read-only Post notification type is shown.
- Post selection, title, message, and schedule fields remain usable.
- Save as draft and Publish remain available.

- [ ] **Step 4: Run the final lint check once**

Run:

```bash
npm run lint -- --quiet
```

Expected: exit code 0. If lint reports pre-existing failures, report the exact output without masking it.

- [ ] **Step 5: Inspect the final focused diff**

Run:

```bash
git diff -- features/dashboard/status-manager.tsx features/dashboard/status-publication-actions.test.mjs docs/superpowers/specs/2026-07-11-announcement-editor-publication-actions-design.md docs/superpowers/plans/2026-07-11-announcement-editor-publication-actions.md
```

Expected: only the approved editor behavior/layout, regression coverage, and planning documents are included. Do not commit.

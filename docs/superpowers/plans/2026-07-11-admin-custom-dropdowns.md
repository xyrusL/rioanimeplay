# Admin Custom Dropdowns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace native admin appearance selects with aligned, accessible custom dropdowns.

**Architecture:** Extend the existing shared `CustomSelect` with named form values, keyboard interaction, focus management, customizable classes, and viewport-aware placement. Integrate it into `AdminAppearanceSettings` without changing the existing appearance state or server-action contract.

**Tech Stack:** React 19, TypeScript, Motion, Tailwind CSS, Node built-in test runner.

## Global Constraints

- Preserve all existing appearance values and server-action field names.
- Use no native `<select>` or `<option>` in appearance settings.
- Open above only when below is insufficient and above has more room.
- Preserve pointer, keyboard, focus, and listbox accessibility.
- Match existing admin theme variables and alignment.

---

### Task 1: Placement logic

**Files:**
- Create: `shared/ui/custom-select-placement.mjs`
- Create: `shared/ui/custom-select-placement.test.mjs`

**Interfaces:**
- Produces: `chooseMenuPlacement({ spaceAbove, spaceBelow, menuHeight }): "top" | "bottom"`.

- [ ] Write tests for default-bottom, insufficient-below/open-top, and constrained-both/open-larger-side cases.
- [ ] Run `node --test shared/ui/custom-select-placement.test.mjs` and confirm RED.
- [ ] Implement the pure placement function and rerun to GREEN.

### Task 2: Shared custom listbox

**Files:**
- Modify: `shared/ui/custom-select.tsx`

**Interfaces:**
- Consumes: `chooseMenuPlacement`.
- Produces: optional `name`, `buttonClassName`, and option panel class APIs while preserving existing callers.

- [ ] Add a source-level regression test for hidden named input and required ARIA/keyboard keys.
- [ ] Run it to confirm RED.
- [ ] Implement named hidden input, IDs, active option state, Arrow/Home/End/Enter/Space/Escape handling, focus restoration, option refs, selected check, and automatic placement.
- [ ] Preserve existing `className` and `menuClassName` behavior.
- [ ] Run regression and placement tests to GREEN.

### Task 3: Appearance integration

**Files:**
- Modify: `features/dashboard/admin-appearance-settings.tsx`
- Create: `features/dashboard/admin-appearance-settings.test.mjs`

**Interfaces:**
- Consumes: enhanced `CustomSelect`.
- Preserves: `fontSize`, `fontFamily`, `theme`, and `accent` form fields and live `onChange` updates.

- [ ] Write a regression test requiring four `CustomSelect` uses and no native `<select>`.
- [ ] Run it to confirm RED.
- [ ] Replace `Picker` native select with typed custom option mappings and aligned admin trigger/menu classes.
- [ ] Run tests to GREEN.

### Task 4: Verification

**Files:**
- Verify: all files above.

- [ ] Run all focused Node tests.
- [ ] Run `npm run lint -- --quiet`.
- [ ] Run `npx tsc --noEmit`.
- [ ] Exercise Settings in the app and verify custom rendering, alignment, automatic placement, keyboard navigation, live preview, and save submission.

# Admin Custom Dropdowns Design

## Goal

Replace the four native appearance selects with aligned, project-styled dropdowns whose option panels, interaction, placement, and accessibility are controlled by the application rather than the browser.

## Architecture

Enhance `shared/ui/custom-select.tsx` as the reusable listbox primitive. It owns open state, active option, focus, keyboard interaction, click-away dismissal, and viewport-aware placement. Appearance settings consume it with admin-specific classes and a named hidden input so the existing server action receives unchanged form values.

## Appearance

All four controls retain the current four-column responsive grid. Labels use one consistent line box; triggers share the same height, padding, typography, border, and chevron position. The option panel matches the admin surface and border tokens, aligns to the trigger width, uses a selected check mark, and opens above or below based on available viewport space.

## Interaction and accessibility

The trigger exposes `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, and an accessible label. Opening highlights the selected option. Arrow Up/Down, Home, and End move the active option; Enter or Space selects it; Escape closes it and restores trigger focus. Pointer selection and outside-click dismissal remain supported. Options use `role="option"` and `aria-selected`.

## Data flow

`AdminAppearanceSettings` maps each existing value constant to `{ value, label }`, passes the current value to `CustomSelect`, and calls the existing `onChange` callback for live preview. `CustomSelect` renders `<input type="hidden" name={name} value={value}>`, preserving the current server-action payload.

## Placement

On open, the component compares the trigger rectangle, estimated menu height, and viewport height. It opens upward only when the space below is insufficient and the space above is greater. The menu remains absolutely positioned and trigger-width aligned.

## Testing

Unit-test the pure placement decision and appearance option mappings. Add source-level regression coverage ensuring appearance settings no longer render native `<select>` elements and that all four named form values use `CustomSelect`. Run lint and TypeScript/build checks, then exercise the Settings tab to verify alignment, custom rendering, keyboard behavior, live preview, and form submission.

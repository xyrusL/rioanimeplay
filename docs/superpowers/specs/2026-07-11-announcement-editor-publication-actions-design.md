# Announcement Editor Publication Actions Design

## Goal

Remove the duplicate publication-state control from both announcement creation modal variants. The action used to submit the form will be the sole authority for whether an announcement is displayed to visitors.

## Scope

This change applies to the shared announcement editor used for:

- New homepage announcements and homepage popups.
- New post notifications.
- Editing either announcement type through the same editor.

The announcement-list Enable/Disable action remains unchanged so publication state can still be changed after saving.

## Behavior

The editor will no longer display a Status or Enabled checkbox.

Submission behavior will be explicit:

- **Save as draft** submits `enabled: false`. The announcement is stored but hidden from visitors.
- **Publish** submits `enabled: true`. The announcement is eligible for display immediately or within its configured start/end schedule.

When editing an existing announcement, choosing either action intentionally replaces its previous publication state. Closing or previewing the editor does not save changes.

Existing validation remains in place:

- Title and message are required.
- Post notifications require a selected post.
- An end time must be later than the start time.

## Data Flow

The form submit handler reads the clicked submit button's `intent` value. `draft` maps to `enabled: false`; `publish` maps to `enabled: true`. That resolved value is included in the existing POST or PATCH payload.

The Worker and public announcement query remain unchanged. Public reads already return only enabled announcements whose schedule is active.

## Layout

The modal will retain the existing RioAnime admin visual system and responsive behavior while removing the empty column created by the deleted status field.

- The main form uses a single vertical content flow.
- Homepage message type occupies the available row width.
- Post notification retains its read-only message-type indicator, followed by the post selector.
- Title and message occupy the full content width.
- Start and end schedule fields remain paired on wider screens and stack on narrow screens.
- Footer actions remain grouped in this order: Cancel, Preview, Save as draft, Publish.
- Header guidance will describe draft and publish actions rather than an editable publication-status field.

## Testing

Focused regression tests will verify that:

- The shared editor contains no Status label, Enabled label, or checkbox.
- Both Save as draft and Publish provide distinct form intents.
- The submit handler maps draft to disabled and publish to enabled.
- The adjusted layout uses a single content flow with paired schedule fields.

After implementation, run the focused status-manager tests, exercise both modal variants in the running app, and run `npm run lint -- --quiet` once as the final code check.

## Non-goals

- Changing announcement storage or database schema.
- Changing public cache behavior or scheduling semantics.
- Removing list-level Enable/Disable controls.
- Redesigning unrelated dashboard surfaces.

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboard = await readFile(new URL("./admin-dashboard.tsx", import.meta.url), "utf8");
const manager = await readFile(new URL("./status-manager.tsx", import.meta.url), "utf8").catch(() => "");
const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");

test("dashboard exposes a retained Status panel", () => {
  assert.match(dashboard, /id: "status", label: "Status"/);
  assert.match(dashboard, /visitedTabs\.has\("status"\)/);
  assert.match(dashboard, /<StatusManager/);
});

test("status manager supports custom notification lifecycle and recurrence", () => {
  for (const value of ["Create notification", "Save as draft", "Publish", "Recurring", "type=\"time\"", "Rename or edit", "Stop", "Delete"]) {
    assert.ok(manager.includes(value), `missing ${value}`);
  }
  assert.match(manager, /weekdays/);
  assert.match(manager, /\/api\/dashboard\/announcements/);
});

test("anime search results keep and render cover artwork with a readable title", () => {
  assert.match(manager, /type Anime = \{[^}]*imageUrl: string \| null/);
  assert.match(manager, /anime\.imageUrl/);
  assert.match(manager, /alt=\{`\$\{anime\.title\} cover`\}/);
  assert.match(manager, /line-clamp-2/);
});

test("notification editor follows the three-column reference layout", () => {
  for (const heading of ["Basic information", "Display location", "Schedule"]) {
    assert.ok(manager.includes(heading), `missing ${heading} section`);
  }
  assert.match(manager, /max-w-6xl/);
  assert.match(manager, /lg:grid-cols-3/);
  assert.match(manager, /sticky top-0/);
  assert.match(manager, /sticky bottom-0/);
  assert.match(manager, /Recurring/);
  assert.match(manager, /Save as draft/);
  assert.match(manager, /1\. Basic information/);
  assert.match(manager, /2\. Display location/);
  assert.match(manager, /3\. Schedule/);
  assert.match(manager, /Search and select posts/);
  assert.match(manager, /3 - draft\.anime\.length/);
  assert.match(manager, /No posts selected yet/);
  assert.match(manager, /draft\.anime\.length >= 3/);
  assert.match(manager, /draft\.location\s*!==\s*"selected_posts"/);
  assert.match(manager, /location:"homepage",anime:\[\]/);
  assert.match(manager, /setQuery\(""\)/);
  assert.match(manager, /setResults\(\[\]\)/);
  assert.match(manager, /Click again to show all locations/);
});

test("status overview follows the announcement and notification dashboard reference", () => {
  for (const copy of [
    "Always active",
    "This announcement is always visible on the homepage.",
    "Edit announcement",
    "Save changes",
    "Announcement title",
    "Announcement message",
    "Currently live",
    "Upcoming",
    "Saved as draft",
    "Manually stopped",
    "Last updated",
    "View all notifications"
  ]) {
    assert.ok(manager.includes(copy), `missing ${copy}`);
  }
  assert.match(manager, /grid-cols-4/);
  assert.match(manager, /announcementEditing/);
  assert.match(manager, /siteAnnouncement\.title\.length} \/ 120 characters/);
  assert.match(manager, /siteAnnouncement\.message\.length} \/ 5000 characters/);
  assert.match(manager, /<table/);
  assert.match(manager, /items\.filter\(\(item\)=>item\.status===status\)\.length/);
});

test("worker defaults new announcements to disabled and enforces active schedule", () => {
  assert.match(worker, /item\.publish/);
  assert.match(worker, /n\.status IN \('Scheduled','Active'\)/);
  assert.match(worker, /n\.starts_at IS NULL/);
  assert.match(worker, /n\.ends_at IS NULL/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");
const manager = await readFile(new URL("./status-manager.tsx", import.meta.url), "utf8");
const migration = await readFile(new URL("../../migrations/0013_announcement_placements.sql", import.meta.url), "utf8").catch(() => "");
const seedMigration = await readFile(new URL("../../migrations/0016_restore_home_announcement.sql", import.meta.url), "utf8").catch(() => "");
const customMigration = await readFile(new URL("../../migrations/0018_custom_notifications.sql", import.meta.url), "utf8");

test("announcement migration seeds the existing homepage notice in D1", () => {
  assert.match(seedMigration, /Welcome to RioAnimePlay/);
  assert.match(seedMigration, /home_inline/);
  assert.match(migration, /ALTER TABLE announcements ADD COLUMN placement/);
});

test("announcement API separates home inline, home modal, and post modal", () => {
  for (const placement of ["home_inline", "home_modal", "post_modal"]) assert.ok(worker.includes(placement));
  assert.match(worker, /searchParams\.get\("placement"\)/);
});

test("custom notifications use separate storage and multiple post targets", () => {
  assert.match(customMigration, /CREATE TABLE IF NOT EXISTS custom_notifications/);
  assert.match(customMigration, /CREATE TABLE IF NOT EXISTS custom_notification_anime/);
  for (const copy of ["Site announcement", "Custom notifications", "Selected posts", "Search anime title"]) {
    assert.ok(manager.includes(copy), `missing ${copy}`);
  }
  assert.match(worker, /NOTIFICATION_CONFLICT/);
  assert.match(worker, /LIMIT 1/);
});

test("notification conflicts are scoped by destination and selected post", () => {
  assert.match(worker, /async function customNotificationConflict/);
  assert.match(worker, /n\.location = 'selected_posts'/);
  assert.match(worker, /j\.anime_id IN/);
  assert.match(worker, /n\.location = \?2/);
  assert.match(worker, /n\.id <> \?1/);
  assert.match(worker, /already targets/);
});

test("specific post notifications override the all-posts notification", () => {
  assert.match(worker, /CASE WHEN n\.location = 'selected_posts' THEN 0 ELSE 1 END/);
  assert.match(worker, /n\.location = 'all_posts' OR/);
});

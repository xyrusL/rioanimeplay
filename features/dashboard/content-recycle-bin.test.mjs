import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const content = await readFile(new URL("./content-manager.tsx", import.meta.url), "utf8");
const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");
const wrangler = await readFile(new URL("../../wrangler.jsonc", import.meta.url), "utf8");

test("deleted content exposes 30-day retention and destructive controls", () => {
  for (const copy of ["Posts remain recoverable for 30 days", "Delete all permanently", "Restore as draft", "Delete permanently", "Recycle bin is empty", "Deletes today", "days remaining"]) {
    assert.ok(content.includes(copy), `missing ${copy}`);
  }
  assert.match(content, /\/api\/dashboard\/content\/.*\/permanent/);
  assert.match(content, /\/api\/dashboard\/content\/deleted/);
});

test("worker keeps soft-delete idempotent and protects permanent deletion", () => {
  assert.match(worker, /WHERE anime_id = \?2 AND deleted_at IS NULL/);
  assert.match(worker, /Only deleted content can be restored/);
  assert.match(worker, /Move content to the recycle bin before deleting it permanently/);
  assert.match(worker, /deleted_at <= datetime\('now', '-30 days'\)/);
  assert.match(worker, /content_status = \?14/);
  assert.match(worker, /const restoredStatus = restoring \? "draft"/);
});

test("worker registers a daily scheduled purge", () => {
  assert.match(worker, /async scheduled/);
  assert.match(worker, /purgeExpiredContent/);
  assert.match(wrangler, /"17 3 \* \* \*"/);
});

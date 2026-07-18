import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");

test("admin content exposes public URL slugs without changing anime_id", () => {
  assert.match(worker, /urlSlug: row\.url_slug \?\? row\.anime_id/);
  assert.match(worker, /postPath: `\/watch\/\$\{encodeURIComponent\(row\.url_slug \?\? row\.anime_id\)\}`/);
  assert.doesNotMatch(worker, /UPDATE anime SET anime_id\s*=/);
});

test("admin updates validate unique custom slugs", () => {
  assert.match(worker, /INVALID_URL_SLUG/);
  assert.match(worker, /URL_SLUG_CONFLICT/);
  assert.match(worker, /SELECT 1 FROM anime WHERE \(url_slug = \?1 OR anime_id = \?1\) AND anime_id <> \?2 LIMIT 1/);
});

test("public lookup stops accepting anime_id once a custom slug exists", () => {
  assert.match(worker, /url_slug = \?1 OR \(url_slug IS NULL AND anime_id = \?1\)/);
});

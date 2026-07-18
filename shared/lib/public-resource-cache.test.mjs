import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cache = await readFile(new URL("./public-resource-cache.ts", import.meta.url), "utf8");
const search = await readFile(new URL("../../features/search/sections/search-autocomplete.tsx", import.meta.url), "utf8");
const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");

test("public cache validates and repairs incompatible browser records", () => {
  assert.match(cache, /checksum\(stored\.data\) !== stored\.checksum/);
  assert.match(cache, /stored\.resourceSchemaVersion !== definition\.schemaVersion/);
  assert.match(cache, /definition\.migrate/);
  assert.match(cache, /await removeEntry\(definition\.key\)/);
  assert.match(cache, /repairDatabase/);
});

test("public cache performs one manifest request and keeps offline data usable", () => {
  assert.match(cache, /let manifestPromise/);
  assert.match(cache, /fetch\("\/api\/public\/manifest", \{ cache: "no-store" \}\)/);
  assert.match(cache, /const fallback = cached \?\? await readCachedResource/);
  assert.match(cache, /publishStatus\(true\)/);
});

test("autocomplete searches the cached index instead of requesting each query", () => {
  assert.match(search, /rankBrowserSearchItems\(index, trimmedQuery\)/);
  assert.doesNotMatch(search, /fetch\(`\/api\/search\?q=/);
});

test("worker exposes resource revisions and invalidates announcement changes", () => {
  assert.match(worker, /\/v1\/cache-manifest/);
  assert.match(worker, /catalog_revision/);
  assert.match(worker, /episodes_revision/);
  assert.match(worker, /announcement_revision/);
  assert.match(worker, /incrementAnnouncementRevision\(env\)/);
});

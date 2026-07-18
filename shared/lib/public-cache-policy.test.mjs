import assert from "node:assert/strict";
import test from "node:test";

import { cacheTtlBeforeBoundary, etagMatches, shouldSampleSuccess } from "./public-cache-policy.mjs";

test("etag matching supports standard If-None-Match values", () => {
  assert.equal(etagMatches('"anime-42"', '"anime-42"'), true);
  assert.equal(etagMatches('W/"anime-42", "other"', '"anime-42"'), true);
  assert.equal(etagMatches('"old"', '"anime-42"'), false);
});

test("announcement TTL does not cross the next schedule boundary", () => {
  assert.equal(cacheTtlBeforeBoundary(30, "2026-07-11T00:00:12Z", "2026-07-11T00:00:00Z"), 12);
  assert.equal(cacheTtlBeforeBoundary(30, null, "2026-07-11T00:00:00Z"), 30);
  assert.equal(cacheTtlBeforeBoundary(30, "2026-07-10T23:00:00Z", "2026-07-11T00:00:00Z"), 1);
});

test("successful metric sampling is deterministic", () => {
  assert.equal(shouldSampleSuccess("same-request", 0.02), shouldSampleSuccess("same-request", 0.02));
  assert.equal(shouldSampleSuccess("request", 0), false);
  assert.equal(shouldSampleSuccess("request", 1), true);
});

import assert from "node:assert/strict";
import test from "node:test";

import { CONTENT_RETENTION_DAYS, contentRetention } from "./content-retention.mjs";

test("uses a 30 day retention period", () => {
  assert.equal(CONTENT_RETENTION_DAYS, 30);
  assert.deepEqual(contentRetention("2026-07-01T00:00:00.000Z", "2026-07-01T00:00:00.000Z"), {
    expiresAt: "2026-07-31T00:00:00.000Z", daysRemaining: 30, expired: false
  });
});

test("rounds any positive partial day up", () => {
  assert.equal(contentRetention("2026-07-01T00:00:00Z", "2026-07-30T12:00:00Z").daysRemaining, 1);
});

test("marks the exact expiry boundary expired", () => {
  assert.deepEqual(contentRetention("2026-07-01T00:00:00Z", "2026-07-31T00:00:00Z"), {
    expiresAt: "2026-07-31T00:00:00.000Z", daysRemaining: 0, expired: true
  });
});

test("returns null metadata for invalid or missing timestamps", () => {
  assert.deepEqual(contentRetention(null), { expiresAt: null, daysRemaining: null, expired: false });
  assert.deepEqual(contentRetention("invalid"), { expiresAt: null, daysRemaining: null, expired: false });
});

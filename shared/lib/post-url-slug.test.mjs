import assert from "node:assert/strict";
import test from "node:test";

import { isValidPostUrlSlug, normalizePostUrlSlug } from "./post-url-slug.mjs";

test("normalizePostUrlSlug creates lowercase hyphenated URL segments", () => {
  assert.equal(normalizePostUrlSlug("  Koe no Katachi  "), "koe-no-katachi");
  assert.equal(normalizePostUrlSlug("One___Piece---Film"), "one-piece-film");
});

test("isValidPostUrlSlug accepts safe segments and rejects empty or malformed values", () => {
  assert.equal(isValidPostUrlSlug("koe-no-katachi"), true);
  assert.equal(isValidPostUrlSlug("a"), true);
  assert.equal(isValidPostUrlSlug(""), false);
  assert.equal(isValidPostUrlSlug("-bad"), false);
  assert.equal(isValidPostUrlSlug("bad--slug"), false);
  assert.equal(isValidPostUrlSlug("A-title"), false);
  assert.equal(isValidPostUrlSlug("a".repeat(101)), false);
});

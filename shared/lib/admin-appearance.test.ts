import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_ADMIN_APPEARANCE, normalizeAdminAppearance } from "./admin-appearance.ts";

test("uses defaults for missing admin appearance", () => {
  assert.deepEqual(normalizeAdminAppearance(undefined), DEFAULT_ADMIN_APPEARANCE);
});

test("preserves valid admin appearance", () => {
  const appearance = { fontSize: "large", fontFamily: "sora", theme: "slate", accent: "cyan" } as const;
  assert.deepEqual(normalizeAdminAppearance(appearance), appearance);
});

test("defaults invalid fields without discarding valid siblings", () => {
  assert.deepEqual(normalizeAdminAppearance({ fontSize: "huge", fontFamily: "lexend", theme: "light", accent: "rose" }), {
    ...DEFAULT_ADMIN_APPEARANCE,
    fontFamily: "lexend",
    accent: "rose"
  });
});

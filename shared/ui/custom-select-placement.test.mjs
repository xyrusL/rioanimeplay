import assert from "node:assert/strict";
import test from "node:test";

import { chooseMenuPlacement } from "./custom-select-placement.mjs";

test("opens below when the menu fits below", () => {
  assert.equal(chooseMenuPlacement({ spaceAbove: 300, spaceBelow: 260, menuHeight: 220 }), "bottom");
});

test("opens above when below is insufficient and above has more room", () => {
  assert.equal(chooseMenuPlacement({ spaceAbove: 300, spaceBelow: 120, menuHeight: 220 }), "top");
});

test("stays below when both sides are constrained and below has at least as much room", () => {
  assert.equal(chooseMenuPlacement({ spaceAbove: 100, spaceBelow: 120, menuHeight: 220 }), "bottom");
});

test("uses the nearest scroll boundary when it is tighter than the viewport", () => {
  assert.equal(chooseMenuPlacement({ spaceAbove: 180, spaceBelow: 40, menuHeight: 100 }), "top");
});

test("caps the menu height to the available space on its chosen side", async () => {
  const { getMenuLayout } = await import("./custom-select-placement.mjs");
  assert.deepEqual(getMenuLayout({ spaceAbove: 180, spaceBelow: 40, menuHeight: 220, gap: 8 }), {
    placement: "top",
    maxHeight: 172
  });
});

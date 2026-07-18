import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./custom-select.tsx", import.meta.url), "utf8");

test("custom select preserves named form values and accessible keyboard listbox behavior", () => {
  assert.match(source, /type="hidden"/);
  assert.match(source, /name=\{name\}/);
  assert.match(source, /aria-controls/);
  assert.match(source, /aria-activedescendant/);
  for (const key of ["ArrowDown", "ArrowUp", "Home", "End", "Enter", " ", "Escape"]) {
    assert.ok(source.includes(`"${key}"`), `missing keyboard handling for ${key}`);
  }
});

test("custom select portals its menu below the trigger above modal clipping", () => {
  assert.match(source, /createPortal/);
  assert.match(source, /const top = rect\.bottom \+ 8/);
  assert.match(source, /className=\{`fixed z-\[500\]/);
  assert.doesNotMatch(source, /placement === "top"/);
});

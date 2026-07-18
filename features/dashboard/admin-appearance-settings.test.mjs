import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./admin-appearance-settings.tsx", import.meta.url), "utf8");

test("appearance settings use four named custom dropdowns instead of native selects", () => {
  assert.equal((source.match(/<Picker /g) ?? []).length, 4);
  assert.match(source, /<CustomSelect/);
  assert.doesNotMatch(source, /<select\b|<option\b/);
  for (const name of ["fontSize", "fontFamily", "theme", "accent"]) {
    assert.match(source, new RegExp(`name="${name}"`));
  }
});

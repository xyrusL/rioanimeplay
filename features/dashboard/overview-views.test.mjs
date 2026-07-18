import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./overview-analytics.tsx", import.meta.url), "utf8");

test("overview presents lifetime views and selected-period viewer records clearly", () => {
  assert.match(source, /label="Views" value=\{compact\.format\(data\.summary\.lifetimeViews\)\}/);
  assert.match(source, /viewer-title records · \$\{periodLabel\}/);
  assert.match(source, /name="Viewer records"/);
  assert.doesNotMatch(source, /label="Audience records"/);
});

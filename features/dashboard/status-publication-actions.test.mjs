import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./status-manager.tsx", import.meta.url), "utf8");
const modal = source.slice(source.indexOf("<AnimatedModal isOpen={open}"));

test("announcement editor has no duplicate enabled control", () => {
  assert.doesNotMatch(modal, />Status</);
  assert.doesNotMatch(modal, />Enabled</);
});

test("draft and publish submit actions own publication state", () => {
  assert.match(modal, /name="intent" value="draft"/);
  assert.match(modal, /name="intent" value="publish"/);
  assert.match(source, /getAttribute\("value"\)===\"publish\"/);
});

test("editor uses a comfortable content layout without one-time date fields", () => {
  assert.match(modal, /max-w-6xl/);
  assert.match(modal, /lg:grid-cols-3/);
  assert.doesNotMatch(modal, /datetime-local/);
  assert.match(modal, /Search anime title/);
});

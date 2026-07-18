import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./status-manager.tsx", import.meta.url), "utf8");

test("edit opens every notification status and owns the move-to-draft flow", () => {
  assert.doesNotMatch(source, /if \(item\.status !== "Draft"\) return/);
  assert.doesNotMatch(source, /function moveToDraft/);
  assert.doesNotMatch(source, /Move .* to draft/);
  assert.match(source, /onClick=\{\(\)=>edit\(item\)\}/);
  assert.match(source, /value="draft"/);
});

test("active and scheduled notifications retain the immediate Stop action", () => {
  assert.match(source, /item\.status==="Active"\|\|item\.status==="Scheduled"/);
  assert.match(source, /setConfirmation\(\{action:"stop",item\}\)/);
});

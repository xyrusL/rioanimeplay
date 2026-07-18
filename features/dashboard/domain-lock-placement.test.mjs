import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboard = await readFile(new URL("./admin-dashboard.tsx", import.meta.url), "utf8");
const apiKeys = await readFile(new URL("./api-key-manager.tsx", import.meta.url), "utf8");

test("domain lock is managed inside the API tab", () => {
  assert.doesNotMatch(dashboard, /DomainLockSettings/);
  assert.match(apiKeys, /import \{ DomainLockSettings \}/);
  assert.match(apiKeys, /<DomainLockSettings \/>/);
});

test("site-key Domain lock action reveals the editor in place", () => {
  assert.doesNotMatch(apiKeys, /href="\/admin\?tab=setting#domain-lock"/);
  assert.match(apiKeys, /document\.getElementById\("domain-lock"\)\?\.scrollIntoView/);
  assert.match(apiKeys, />Domain lock<\/button>/);
});

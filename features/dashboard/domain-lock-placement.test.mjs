import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboard = await readFile(new URL("./admin-dashboard.tsx", import.meta.url), "utf8");
const apiKeys = await readFile(new URL("./api-key-manager.tsx", import.meta.url), "utf8");
const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");
const migration = await readFile(new URL("../../migrations/0024_per_api_key_domain_lock.sql", import.meta.url), "utf8");

test("domain lock is managed inside the API tab", () => {
  assert.doesNotMatch(dashboard, /DomainLockSettings/);
  assert.match(apiKeys, /import \{ DomainLockDialog \}/);
  assert.match(apiKeys, /<DomainLockDialog /);
});

test("every API key Domain lock action opens its own modal", () => {
  assert.doesNotMatch(apiKeys, /href="\/admin\?tab=setting#domain-lock"/);
  assert.match(apiKeys, /setDomainLockKey\(\{ \.\.\.key, domainLock:/);
  assert.doesNotMatch(apiKeys, /key\.isSiteKey \? <button[^>]+Domain lock/);
  assert.match(apiKeys, />Domain lock<\/button>/);
});

test("domain policies and origins are stored and enforced by API key", () => {
  assert.match(migration, /api_key_domain_settings/);
  assert.match(migration, /PRIMARY KEY \(key_id, origin\)/);
  assert.match(worker, /isAllowedOrigin\(env, authenticatedKey\.id, origin\)/);
  assert.match(worker, /api_key_allowed_domains WHERE key_id = \?1 AND origin = \?2/);
});

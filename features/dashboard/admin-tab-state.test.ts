import assert from "node:assert/strict";
import test from "node:test";

import { addVisitedTab, resolveAdminTab, tabNeedsDashboardData } from "./admin-tab-state.ts";

test("resolveAdminTab preserves valid tabs and rejects unknown values", () => {
  assert.equal(resolveAdminTab("content"), "content");
  assert.equal(resolveAdminTab("member"), "member");
  assert.equal(resolveAdminTab("report"), "report");
  assert.equal(resolveAdminTab("unknown"), "overview");
  assert.equal(resolveAdminTab(null), "overview");
});

test("addVisitedTab retains previously visited panels", () => {
  const visited = addVisitedTab(new Set(["overview"]), "content");
  const revisited = addVisitedTab(visited, "member");

  assert.deepEqual([...revisited], ["overview", "content", "member"]);
  assert.equal(addVisitedTab(revisited, "content"), revisited);
});

test("tabNeedsDashboardData only selects panels backed by the shared dashboard response", () => {
  for (const tab of ["overview", "member", "activity"] as const) {
    assert.equal(tabNeedsDashboardData(tab), true, `${tab} should load dashboard data`);
  }

  for (const tab of ["content", "api", "status", "report", "setting"] as const) {
    assert.equal(tabNeedsDashboardData(tab), false, `${tab} should skip dashboard data`);
  }
});

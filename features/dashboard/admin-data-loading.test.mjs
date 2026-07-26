import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const accountSettingsSource = await readFile(new URL("./account-settings.tsx", import.meta.url), "utf8");
const adminPageSource = await readFile(new URL("../../app/admin/page.tsx", import.meta.url), "utf8");
const authSource = await readFile(new URL("../../auth.ts", import.meta.url), "utf8");
const dashboardSource = await readFile(new URL("./admin-dashboard.tsx", import.meta.url), "utf8");
const workerSource = await readFile(new URL("../../worker.js", import.meta.url), "utf8");

test("account settings only fetches the profile when the server did not provide it", () => {
  assert.match(accountSettingsSource, /if \(initialProfile\) return;/);
  assert.match(accountSettingsSource, /fetch\("\/api\/dashboard\/profile", \{ cache: "no-store", signal: controller\.signal \}\)/);
  assert.match(accountSettingsSource, /method: "PATCH"/);
});

test("the admin page skips shared data and profile requests for tabs that do not use them", () => {
  assert.match(adminPageSource, /tabNeedsDashboardData\(activeTab\)/);
  assert.match(adminPageSource, /fetchDashboardData\(\)\.catch\(\(\) => null\)/);
  assert.match(adminPageSource, /activeTab === "setting" \? fetchAdminProfile\(\)\.catch\(\(\) => null\) : null/);
});

test("the dashboard lazily loads shared data when a later tab needs it", () => {
  assert.match(dashboardSource, /fetch\("\/api\/dashboard", \{ cache: "no-store", signal: controller\.signal \}\)/);
  assert.match(dashboardSource, /tabNeedsDashboardData\(activeTab\)/);
});

test("Google sign-in selects an account before enforcing D1 membership", () => {
  assert.match(authSource, /prompt: "select_account"/);
  assert.match(authSource, /catch \(cause\) \{[\s\S]*return false;/);
  assert.match(workerSource, /ACCOUNT_NOT_REGISTERED/);
  assert.doesNotMatch(workerSource, /INSERT INTO accounts[\s\S]*oauth:google/);
});

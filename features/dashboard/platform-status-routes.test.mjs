import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerModule = await import("../../worker.js");
const platformStatusSource = await readFile(new URL("./platform-status.tsx", import.meta.url), "utf8");
const dashboardSource = await readFile(new URL("./admin-dashboard.tsx", import.meta.url), "utf8");
const workerSource = await readFile(new URL("../../worker.js", import.meta.url), "utf8");

test("dashboard route metrics include every configured route even without recent traffic", () => {
  assert.equal(typeof workerModule.mergeTrackedRouteMetrics, "function");
  assert.ok(workerModule.TRACKED_API_ROUTES.length > 0);

  const metrics = workerModule.mergeTrackedRouteMetrics([]);

  assert.deepEqual(metrics.map((metric) => metric.route), workerModule.TRACKED_API_ROUTES);
  assert.ok(metrics.every((metric) => metric.requests === 0 && metric.errors === 0));
});

test("platform status lives in overview and renders route metrics as a chart", () => {
  const settingsPanel = dashboardSource.slice(
    dashboardSource.indexOf("function SettingsPanel"),
    dashboardSource.indexOf("function RetainedPanel")
  );

  assert.doesNotMatch(settingsPanel, /Platform status/);
  const overviewPanel = dashboardSource.slice(
    dashboardSource.indexOf("function Overview"),
    dashboardSource.indexOf("function RecentContent")
  );

  assert.match(overviewPanel, /<PlatformStatus data=\{data\}/);
  assert.doesNotMatch(dashboardSource, /activeTab === "status"[^\n]*PlatformStatus/);
  assert.match(platformStatusSource, /<BarChart/);
  assert.match(platformStatusSource, /routeMetrics/);
  assert.match(platformStatusSource, /metric\.route/);
  assert.match(platformStatusSource, /metric\.requests/);
});

test("API metrics include successful and cached responses", () => {
  assert.doesNotMatch(workerSource, /shouldSampleSuccess/);
  assert.doesNotMatch(workerSource, /const cacheHit = response\.headers\.get\("X-RioAnime-Cache"\)/);
  assert.match(workerSource, /recordRequestMetric\(env, path, response\.status, duration\)/);
  assert.match(workerSource, /recordApiKeyPolicyUsage\(env, authenticatedKey\.id, response\)/);
});

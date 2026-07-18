import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workerModule = await import("../../worker.js");
const dashboardSource = await readFile(new URL("./admin-dashboard.tsx", import.meta.url), "utf8");

test("dashboard route metrics include every configured route even without recent traffic", () => {
  assert.equal(typeof workerModule.mergeTrackedRouteMetrics, "function");
  assert.ok(workerModule.TRACKED_API_ROUTES.length > 0);

  const metrics = workerModule.mergeTrackedRouteMetrics([]);

  assert.deepEqual(metrics.map((metric) => metric.route), workerModule.TRACKED_API_ROUTES);
  assert.ok(metrics.every((metric) => metric.requests === 0 && metric.errors === 0));
});

test("platform status renders the tracked route list", () => {
  const settingsPanel = dashboardSource.slice(
    dashboardSource.indexOf("function SettingsPanel"),
    dashboardSource.indexOf("function RetainedPanel")
  );

  assert.match(settingsPanel, /routeMetrics\.map/);
  assert.match(settingsPanel, /metric\.route/);
  assert.match(settingsPanel, /metric\.requests/);
});
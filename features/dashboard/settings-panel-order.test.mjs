import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const dashboardSource = await readFile(new URL("./admin-dashboard.tsx", import.meta.url), "utf8");

test("settings prioritize account before appearance and platform status", () => {
  const settingsPanel = dashboardSource.slice(
    dashboardSource.indexOf("function SettingsPanel"),
    dashboardSource.indexOf("function RetainedPanel")
  );

  const account = settingsPanel.indexOf("<AccountSettings initialProfile={initialProfile} />");
  const appearance = settingsPanel.indexOf("<AdminAppearanceSettings");
  const platformStatus = settingsPanel.indexOf("Platform status");

  assert.ok(account >= 0 && appearance >= 0 && platformStatus >= 0);
  assert.ok(account < appearance, "Account settings should be the first settings group");
  assert.ok(appearance < platformStatus, "Appearance should precede platform status");
});

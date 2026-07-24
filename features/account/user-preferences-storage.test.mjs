import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const preferencesSource = await readFile(
  new URL("../../shared/lib/user-preferences.ts", import.meta.url),
  "utf8"
);
const accountSource = await readFile(
  new URL("./sections/account-settings-content.tsx", import.meta.url),
  "utf8"
);

test("account appearance preferences persist in browser storage", () => {
  assert.match(preferencesSource, /USER_PREFERENCES_KEY = "rioanime:user-preferences"/);
  assert.match(preferencesSource, /window\.localStorage\.setItem\(USER_PREFERENCES_KEY/);
  assert.match(preferencesSource, /window\.localStorage\.getItem\(USER_PREFERENCES_KEY\)/);
  assert.match(accountSource, /saveUserPreferences\(nextPreferences\)/);
  assert.match(accountSource, /Saved to this browser/);
});

test("account controls refresh when preferences change in another tab", () => {
  assert.match(accountSource, /window\.addEventListener\("storage", refreshPreferences\)/);
  assert.match(accountSource, /window\.removeEventListener\("storage", refreshPreferences\)/);
});

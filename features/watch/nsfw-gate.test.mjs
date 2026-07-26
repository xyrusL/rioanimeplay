import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");
const types = await readFile(new URL("../../entities/anime/model/types.ts", import.meta.url), "utf8");
const mappers = await readFile(new URL("../../entities/anime/lib/mappers.ts", import.meta.url), "utf8");
const dialog = await readFile(new URL("../../shared/ui/age-warning-dialog.tsx", import.meta.url), "utf8");
const provider = await readFile(new URL("../../shared/ui/age-gate-provider.tsx", import.meta.url), "utf8");
const desktopWatch = await readFile(new URL("./sections/watch-screen.tsx", import.meta.url), "utf8");
const mobileWatch = await readFile(new URL("./sections/mobile-watch-screen.tsx", import.meta.url), "utf8");

test("public API predicate requires published, public, and not deleted", () => {
  assert.match(worker, /content_status = 'published'/);
  assert.match(worker, /visibility = 'public'/);
  assert.match(worker, /deleted_at IS NULL/);
  for (const handler of ["handleHome", "handleBrowse", "handleAlphabeticalCatalog", "getAnimeRecord", "handleEpisodes"]) {
    const start = worker.indexOf(`function ${handler}`) >= 0 ? worker.indexOf(`function ${handler}`) : worker.indexOf(`async function ${handler}`);
    assert.ok(start >= 0, `missing ${handler}`);
    assert.ok(worker.slice(start, start + 2500).includes("PUBLIC_ANIME_PREDICATE"), `${handler} must use the public predicate`);
  }
});

test("NSFW state propagates into home and watch view models", () => {
  assert.ok((types.match(/isNsfw: boolean/g) ?? []).length >= 3);
  assert.ok((mappers.match(/isNsfw: media\.isNsfw/g) ?? []).length >= 2);
});


test("NSFW warning dialog preserves the age-gate contract", () => {
  assert.match(dialog, /title: string;\s*artwork\?: string \| null/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby="age-warning-title"/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /event\.key !== "Tab"/);
  assert.match(dialog, /I understand, continue/);
  assert.match(dialog, /NSFW/);
  assert.match(provider, /sessionStorage\.getItem\(SESSION_KEY\)/);
  assert.match(provider, /sessionStorage\.setItem\(SESSION_KEY, "1"\)/);
  assert.match(desktopWatch, /artwork=\{anime\.bannerImage \?\? anime\.coverImage\}/);
  assert.match(mobileWatch, /artwork=\{anime\.bannerImage \?\? anime\.coverImage\}/);
});

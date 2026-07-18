import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./content-manager.tsx", import.meta.url), "utf8");
const editor = source.slice(source.indexOf("function Editor"), source.indexOf("export function ContentManager"));

test("content editor changes the public URL slug without editing anime_id", () => {
  assert.match(source, /urlSlug: string/);
  assert.match(source, /normalizePostUrlSlug/);
  assert.match(editor, />\/watch\/<\/span>/);
  assert.match(editor, /value=\{draft\.urlSlug\}/);
  assert.match(editor, /Anime ID/);
  assert.match(source, /urlSlug: item\.urlSlug/);
  assert.doesNotMatch(editor, /field\("animeId"/);
});

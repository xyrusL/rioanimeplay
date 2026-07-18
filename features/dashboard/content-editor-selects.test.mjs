import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("./content-manager.tsx", import.meta.url), "utf8");
const editor = source.slice(source.indexOf("function Editor"), source.indexOf("export function ContentManager"));

test("content editor uses custom option menus for publishing controls", () => {
  assert.match(source, /import \{ CustomSelect \} from "@\/shared\/ui\/custom-select"/);
  assert.doesNotMatch(editor, /<select/);
  assert.match(editor, /label="Status"/);
  assert.match(editor, /label="Visibility"/);
  assert.match(editor, /contentStatusOptions/);
  assert.match(editor, /visibilityOptions/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const worker = await readFile(new URL("../../worker.js", import.meta.url), "utf8");
const manager = await readFile(new URL("./content-notice-manager.tsx", import.meta.url), "utf8");
const status = await readFile(new URL("./status-manager.tsx", import.meta.url), "utf8");
const content = await readFile(new URL("./content-manager.tsx", import.meta.url), "utf8");
const modal = await readFile(new URL("../../shared/ui/scheduled-announcement-modal.tsx", import.meta.url), "utf8");
const animatedModal = await readFile(new URL("../../shared/ui/animated-modal.tsx", import.meta.url), "utf8");
const migration = await readFile(new URL("../../migrations/0023_content_notice_templates.sql", import.meta.url), "utf8");
const noticeRoute = await readFile(new URL("../../app/api/dashboard/content-notices/route.ts", import.meta.url), "utf8");
const noticeKeyRoute = await readFile(new URL("../../app/api/dashboard/content-notices/[key]/route.ts", import.meta.url), "utf8");

test("Status tab exposes fixed NSFW and video-ad templates", () => {
  assert.match(status, /<ContentNoticeManager/);
  assert.match(manager, /Content notices/);
  assert.match(manager, /Fixed warning templates/);
  assert.match(manager, /NSFW/);
  assert.match(manager, /Video has ads/);
  assert.match(manager, /animeIds: selected\.map/);
});

test("fixed cards remain visible while membership loads or fails", () => {
  assert.match(manager, /const FIXED_TEMPLATES/);
  assert.ok(manager.indexOf('key: "nsfw"') < manager.indexOf('key: "video_ads"'));
  assert.match(manager, /emptyTemplates/);
  assert.match(manager, /Template groups could not be refreshed/);
  assert.match(manager, />Retry</);
  assert.match(manager, /Loading group/);
  assert.match(manager, /No matching anime found/);
});

test("fixed templates inherit the configured admin appearance", () => {
  assert.match(animatedModal, /querySelector<HTMLElement>\("\.admin-shell"\)/);
  assert.match(manager, /bg-\[var\(--admin-accent-soft\)\]/);
  assert.match(manager, /panelClassName="admin-card/);
  assert.doesNotMatch(manager, /template\.tone|template\.accent|editing\.tone/);
});

test("template manager keeps both columns compact", () => {
  assert.match(manager, /limit: "5"/);
  assert.match(manager, /lg:grid-cols-\[minmax\(0,1\.4fr\)_minmax\(17rem,0\.6fr\)\]/);
  assert.equal(manager.match(/max-h-\[min\(26rem,calc\(100dvh-23rem\)\)\]/g)?.length, 2);
  assert.match(manager, /block truncate text-xs/);
  assert.match(manager, /Manage \{editing\.label\} warning/);
  assert.match(manager, /title=\{anime\.title\}/);
});

test("both templates support adding and removing anime as one saved group", () => {
  assert.match(manager, /function toggle\(anime: Anime\)/);
  assert.match(manager, /current\.filter\(\(item\) => item\.animeId !== anime\.animeId\)/);
  assert.match(manager, /animeIds: selected\.map/);
  assert.match(manager, /Saving replaces the current/);
  assert.match(manager, /setSaveError/);
});

test("NSFW and video-ad groups persist on canonical anime flags", () => {
  assert.match(migration, /ADD COLUMN has_video_ads/);
  assert.match(worker, /column: "is_nsfw"/);
  assert.match(worker, /column: "has_video_ads"/);
  assert.match(worker, /handleAdminContentNotices/);
  assert.match(worker, /content_notice_updated/);
  assert.match(content, /rioanime:content-change/);
  assert.match(manager, /dispatchEvent\(new CustomEvent\("rioanime:content-change"\)\)/);
  assert.doesNotMatch(content, /hasVideoAds|has_video_ads|Video has ads/);
});

test("content notice relays expose failures and refresh public content", () => {
  assert.match(noticeRoute, /status: 502/);
  assert.match(noticeRoute, /Content notice templates could not be loaded/);
  assert.match(noticeKeyRoute, /status: 502/);
  assert.match(noticeKeyRoute, /response\?\.ok/);
  assert.match(noticeKeyRoute, /revalidatePath\("\/watch\/\[slug\]", "page"\)/);
});

test("video-ad template queues before custom notifications", () => {
  const handler = worker.slice(worker.indexOf("async function handlePublicAnnouncements"), worker.indexOf("function contentNoticeTemplateItem"));
  assert.ok(handler.indexOf("template-video-ads") < handler.indexOf("items.push(item)"));
  assert.match(modal, /setQueue/);
  assert.match(modal, /current\.slice\(1\)/);
  assert.match(modal, /repeat !== "always"/);
  assert.match(modal, /waitForAdultConfirmation/);
});

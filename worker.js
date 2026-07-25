import { contentRetention } from "./shared/lib/content-retention.mjs";
import { normalizePostUrlSlug, isValidPostUrlSlug } from "./shared/lib/post-url-slug.mjs";
import { etagMatches } from "./shared/lib/public-cache-policy.mjs";

const FALLBACK_ALLOWED_ORIGINS = new Set([
  "http://localhost:3000",
  "https://rioanime.deze.me",
  "https://rioanimeplay.deze.me"
]);

const MEDIA_COLUMNS = `
  anime_id, url_slug, source, source_id, title, title_english, title_native, title_user_preferred,
  image_url, banner_url, color, score, mean_score, genres, episodes, status, type,
  synopsis, year, season, popularity, studio, next_episode, created_at, updated_at,
  content_status, visibility, is_nsfw
`;

const PUBLIC_ANIME_PREDICATE = `
  source_id IS NOT NULL AND title IS NOT NULL AND content_status = 'published'
  AND visibility = 'public' AND deleted_at IS NULL
`;

const CONTENT_NOTICE_TEMPLATES = {
  nsfw: {
    title: "Mature content warning",
    message: "This anime may contain adult themes, nudity, or other sensitive material.",
    column: "is_nsfw"
  },
  video_ads: {
    title: "Video contains advertising",
    message: "The video player for this anime may show third-party advertising.",
    column: "has_video_ads"
  }
};

export const TRACKED_API_ROUTES = [
  "/v1/health",
  "/v1/dashboard",
  "/v1/home",
  "/v1/browse",
  "/v1/anime/a-z",
  "/v1/search",
  "/v1/cache-manifest",
  "/v1/announcements",
  "/v1/auth/admin-login",
  "/v1/user/sync",
  "/v1/user/library",
  "/v1/anime/:id",
  "/v1/anime/:id/episodes"
];

function normalizeOrigin(origin) {
  if (!origin) return null;
  try {
    const url = new URL(origin);
    if (!/^https?:$/.test(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

async function isAllowedOrigin(env, keyId, origin) {
  if (!origin) return true;
  const normalized = normalizeOrigin(origin);
  if (!normalized) return false;
  try {
    const setting = await env.DB.prepare("SELECT enabled FROM api_key_domain_settings WHERE key_id = ?1").bind(keyId).first();
    if (!setting || Number(setting.enabled) === 0) return true;
    const allowed = await env.DB.prepare("SELECT 1 AS allowed FROM api_key_allowed_domains WHERE key_id = ?1 AND origin = ?2 LIMIT 1").bind(keyId, normalized).first();
    return Boolean(allowed);
  } catch (cause) {
    console.error("RioAnime domain lock lookup failed", cause);
    return keyId === "site-deployment-key" && FALLBACK_ALLOWED_ORIGINS.has(normalized);
  }
}

function isValidAnimeId(value) {
  return typeof value === "string" && /^[a-z0-9][a-z0-9()?-]{0,199}$/i.test(value);
}

async function keysMatch(provided, expected) {
  if (!provided || !expected) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(provided)),
    crypto.subtle.digest("SHA-256", encoder.encode(expected))
  ]);
  const leftBytes = new Uint8Array(left);
  const rightBytes = new Uint8Array(right);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < leftBytes.length; index += 1) {
    difference |= leftBytes[index] ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
}

async function verifyPassword(password, encodedHash) {
  const [algorithm, iterationsValue, saltHex, expectedHex] = String(encodedHash ?? "").split("$");
  const iterations = Number.parseInt(iterationsValue, 10);
  if (algorithm !== "pbkdf2_sha256" || !iterations || !saltHex || !expectedHex) return false;
  if (!/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(expectedHex)) return false;

  const fromHex = (value) => new Uint8Array(value.match(/.{2}/g).map((byte) => Number.parseInt(byte, 16)));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: fromHex(saltHex), iterations },
    key,
    expectedHex.length * 4
  ));
  const expected = fromHex(expectedHex);
  let difference = derived.length ^ expected.length;
  for (let index = 0; index < derived.length; index += 1) {
    difference |= derived[index] ^ (expected[index] ?? 0);
  }
  return difference === 0;
}

async function hashPassword(password) {
  const iterations = 100000;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derived = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  ));
  const toHex = (value) => Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `pbkdf2_sha256$${iterations}$${toHex(salt)}$${toHex(derived)}`;
}

async function hashKey(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function createApiKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const secret = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `rio_live_${secret}`;
}

function createId() {
  return crypto.randomUUID();
}

function keyHint(key) {
  return `${key.slice(0, 13)}••••••••${key.slice(-4)}`;
}

function responseHeaders(origin, cacheControl = "no-store") {
  const headers = new Headers({
    "Cache-Control": cacheControl,
    "Content-Type": "application/json; charset=utf-8",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY"
  });

  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  return headers;
}

function json(data, status, origin, cacheControl) {
  const body = JSON.stringify(data);
  const headers = responseHeaders(origin, cacheControl);
  headers.set("Content-Length", String(new TextEncoder().encode(body).byteLength));
  return new Response(body, {
    status,
    headers
  });
}

function error(code, message, status, origin) {
  return json({ error: { code, message } }, status, origin);
}

function publicEtag(cacheUrl, cacheVersion, body) {
  let hash = 2166136261;
  const value = `${cacheUrl.pathname}?${cacheUrl.searchParams}:${cacheVersion}:${body}`;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `"rio-${(hash >>> 0).toString(36)}"`;
}

async function cachedJson(request, origin, ctx, ttl, loader, cacheVersion = "2") {
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.set("__cacheVersion", cacheVersion);
  const cacheKey = new Request(cacheUrl, { method: "GET" });
  const cached = await caches.default.match(cacheKey);

  if (cached) {
    const headers = new Headers(cached.headers);
    headers.set("X-RioAnime-Cache", "HIT");
    if (origin) headers.set("Access-Control-Allow-Origin", origin);
    const etag = headers.get("ETag");
    if (etagMatches(request.headers.get("If-None-Match"), etag)) return new Response(null, { status: 304, headers });
    return new Response(cached.body, { status: cached.status, headers });
  }

  const data = await loader();
  const body = JSON.stringify(data);
  const etag = publicEtag(cacheUrl, cacheVersion, body);
  const responseHeadersValue = responseHeaders(origin, `private, max-age=${Math.min(ttl, 60)}, stale-while-revalidate=300`);
  responseHeadersValue.set("ETag", etag);
  responseHeadersValue.set("X-RioAnime-Cache", "MISS");
  const cacheHeaders = responseHeaders(null, `public, max-age=${ttl}, stale-while-revalidate=${Math.max(ttl * 5, 60)}`);
  cacheHeaders.set("ETag", etag);
  const cacheResponse = new Response(body, { status: 200, headers: cacheHeaders });
  ctx.waitUntil(caches.default.put(cacheKey, cacheResponse));
  if (etagMatches(request.headers.get("If-None-Match"), etag)) return new Response(null, { status: 304, headers: responseHeadersValue });
  return new Response(body, { status: 200, headers: responseHeadersValue });
}

function parseGenres(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((genre) => typeof genre === "string") : [];
  } catch {
    return value.split(",").map((genre) => genre.trim()).filter(Boolean);
  }
}

function announcementItem(row) {
  return {
    id: row.id,
    scope: row.scope,
    animeId: row.anime_id,
    animeTitle: row.anime_title ?? null,
    placement: row.placement,
    title: row.title,
    message: row.message,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    scheduleType: row.schedule_type ?? "once",
    dailyStartsAt: row.daily_starts_at ?? null,
    dailyEndsAt: row.daily_ends_at ?? null,
    timezoneOffset: row.timezone_offset ?? null,
    enabled: Boolean(row.enabled),
    views: Number(row.view_count ?? 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function customNotificationItem(row) {
  const status = ["Scheduled", "Active"].includes(row.status) && row.ends_at && Date.parse(row.ends_at) <= Date.now() ? "Completed" : row.status;
  return { id: row.id, name: row.name, title: row.title, message: row.message, status, location: row.location,
    recurrence: row.recurrence, weekdays: row.weekdays ? row.weekdays.split(",").map(Number) : [], displayTime: row.display_time,
    startsAt: row.starts_at, endsAt: row.ends_at, timezoneOffset: row.timezone_offset,
    animeIds: row.anime_ids ? row.anime_ids.split("|") : [], animeTitles: row.anime_titles ? row.anime_titles.split("|") : [], createdAt: row.created_at, updatedAt: row.updated_at };
}

const notificationSelect = `SELECT n.*,
  (SELECT group_concat(anime_id, '|') FROM custom_notification_anime WHERE notification_id = n.id) AS anime_ids,
  (SELECT group_concat(a.title, '|') FROM custom_notification_anime j JOIN anime a ON a.anime_id = j.anime_id WHERE j.notification_id = n.id) AS anime_titles
  FROM custom_notifications n`;

async function customNotificationConflict(env, item, excludeId, origin) {
  const eligible = "n.status IN ('Scheduled','Active') AND (n.ends_at IS NULL OR datetime(n.ends_at) > datetime('now')) AND n.id <> ?1";

  if (item.location === "selected_posts") {
    const placeholders = item.animeIds.map((_, index) => `?${index + 2}`).join(",");
    const conflict = await env.DB.prepare(
      `SELECT n.name, a.title FROM custom_notifications n
       JOIN custom_notification_anime j ON j.notification_id = n.id
       JOIN anime a ON a.anime_id = j.anime_id
       WHERE n.location = 'selected_posts' AND ${eligible} AND j.anime_id IN (${placeholders})
       LIMIT 1`
    ).bind(excludeId ?? "", ...item.animeIds).first();
    return conflict
      ? error("NOTIFICATION_CONFLICT", `Cannot publish: '${conflict.name}' already targets '${conflict.title}'`, 409, origin)
      : null;
  }

  const conflict = await env.DB.prepare(
    `SELECT n.name FROM custom_notifications n
     WHERE n.location = ?2 AND ${eligible}
     LIMIT 1`
  ).bind(excludeId ?? "", item.location).first();
  if (!conflict) return null;

  const destination = item.location === "homepage" ? "the homepage" : "all posts";
  return error("NOTIFICATION_CONFLICT", `Cannot publish: '${conflict.name}' is already active or scheduled for ${destination}`, 409, origin);
}

async function parseCustomNotificationInput(request, env, origin) {
  const parsed = await parseJsonBody(request, origin); if (parsed.response) return parsed;
  const body = parsed.data ?? {}; const title = String(body.title ?? "").trim(); const message = String(body.message ?? "").trim(); const name = String(body.name ?? title).trim();
  const location = body.location; const recurrence = body.recurrence === "weekly" ? "weekly" : "none";
  const weekdays = [...new Set(Array.isArray(body.weekdays) ? body.weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6) : [])];
  const displayTime = /^([01]\d|2[0-3]):[0-5]\d$/.test(body.displayTime ?? "") ? body.displayTime : null;
  const startsAt = normalizeAnnouncementDate(body.startsAt); const endsAt = normalizeAnnouncementDate(body.endsAt);
  const animeIds = [...new Set(Array.isArray(body.animeIds) ? body.animeIds.map(String).filter(isValidAnimeId) : [])];
  if (!name || name.length > 120 || !title || title.length > 120 || !message || message.length > 5000 || !["homepage", "all_posts", "selected_posts"].includes(location)) return { response: error("INVALID_NOTIFICATION", "Name, title, message, or location is invalid", 400, origin) };
  if (startsAt === undefined || endsAt === undefined || (startsAt && endsAt && endsAt <= startsAt) || (recurrence === "weekly" && (!weekdays.length || !displayTime)) || (location === "selected_posts" && !animeIds.length)) return { response: error("INVALID_SCHEDULE", "Schedule and selected posts are required", 400, origin) };
  if (animeIds.length) { const marks = animeIds.map((_, index) => `?${index + 1}`).join(","); const found = await env.DB.prepare(`SELECT COUNT(*) total FROM anime WHERE anime_id IN (${marks})`).bind(...animeIds).first(); if (Number(found.total) !== animeIds.length) return { response: error("ANIME_NOT_FOUND", "A selected anime does not exist", 404, origin) }; }
  return { data: { name, title, message, location, recurrence, weekdays, displayTime, startsAt, endsAt, animeIds, timezoneOffset: Number.isInteger(body.timezoneOffset) ? Math.max(-840, Math.min(840, body.timezoneOffset)) : 0, publish: body.publish === true } };
}

function normalizeAnnouncementDate(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}

async function parseAnnouncementInput(request, env, origin) {
  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed;
  const body = parsed.data ?? {};
  const placement = body.placement;
  const scope = placement === "post_modal" ? "anime" : "global";
  const animeId = scope === "anime" ? String(body.animeId ?? "").trim() : null;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const startsAt = placement === "home_inline" ? null : normalizeAnnouncementDate(body.startsAt);
  const endsAt = placement === "home_inline" ? null : normalizeAnnouncementDate(body.endsAt);
  const scheduleType = body.scheduleType === "daily" ? "daily" : "once";
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const dailyStartsAt = scheduleType === "daily" && timePattern.test(body.dailyStartsAt ?? "") ? body.dailyStartsAt : null;
  const dailyEndsAt = scheduleType === "daily" && timePattern.test(body.dailyEndsAt ?? "") ? body.dailyEndsAt : null;
  const timezoneOffset = Number.isInteger(body.timezoneOffset) ? Math.max(-840, Math.min(840, body.timezoneOffset)) : 0;
  if (!["home_inline", "home_modal", "post_modal"].includes(placement) || !title || title.length > 120 || !message || message.length > 5000) {
    return { response: error("INVALID_ANNOUNCEMENT", "Scope, title, or message is invalid", 400, origin) };
  }
  if (startsAt === undefined || endsAt === undefined || (startsAt && endsAt && endsAt <= startsAt)) {
    return { response: error("INVALID_SCHEDULE", "Enter a valid schedule with the end after the start", 400, origin) };
  }
  if (scheduleType === "daily" && dailyStartsAt && dailyEndsAt && dailyEndsAt <= dailyStartsAt) return { response: error("INVALID_SCHEDULE", "Daily end time must be after the start", 400, origin) };
  if (scope === "anime") {
    if (!isValidAnimeId(animeId)) return { response: error("INVALID_ANIME_ID", "Select a valid anime", 400, origin) };
    const anime = await env.DB.prepare("SELECT 1 FROM anime WHERE anime_id = ?1 LIMIT 1").bind(animeId).first();
    if (!anime) return { response: error("ANIME_NOT_FOUND", "The selected anime does not exist", 404, origin) };
  }
  return { data: { scope, placement, animeId, title, message, startsAt, endsAt, scheduleType, dailyStartsAt, dailyEndsAt, timezoneOffset, enabled: body.enabled === true } };
}

async function handlePublicAnnouncements(request, env, origin, ctx) {
  const searchParams = new URL(request.url).searchParams;
  const animeId = searchParams.get("animeId");
  const placement = searchParams.get("placement") ?? (animeId ? "post_modal" : "home_modal");
  if (animeId && !isValidAnimeId(animeId)) return error("INVALID_ANIME_ID", "Invalid anime identifier", 400, origin);
  if (!["home_inline", "home_modal", "post_modal"].includes(placement)) return error("INVALID_PLACEMENT", "Invalid announcement placement", 400, origin);
  if (placement !== "home_inline") {
    const target = animeId ? `(n.location = 'all_posts' OR (n.location = 'selected_posts' AND EXISTS (SELECT 1 FROM custom_notification_anime j WHERE j.notification_id = n.id AND j.anime_id = ?1)))` : `n.location = 'homepage'`;
    const localNow = `datetime('now', printf('%+d minutes', -n.timezone_offset))`;
    const eligible = `n.status IN ('Scheduled','Active') AND (n.starts_at IS NULL OR datetime(n.starts_at) <= datetime('now')) AND (n.ends_at IS NULL OR datetime(n.ends_at) > datetime('now')) AND (n.recurrence = 'none' OR (instr(',' || n.weekdays || ',', ',' || strftime('%w', ${localNow}) || ',') > 0 AND time(${localNow}) >= n.display_time))`;
    const order = animeId ? "CASE WHEN n.location = 'selected_posts' THEN 0 ELSE 1 END, n.updated_at DESC" : "n.updated_at DESC";
    return cachedJson(request, origin, ctx, 30, async () => {
      const row = animeId ? await env.DB.prepare(`${notificationSelect} WHERE ${target} AND ${eligible} ORDER BY ${order} LIMIT 1`).bind(animeId).first() : await env.DB.prepare(`${notificationSelect} WHERE ${target} AND ${eligible} ORDER BY ${order} LIMIT 1`).first();
      const items = [];
      if (animeId) {
        const anime = await env.DB.prepare("SELECT has_video_ads FROM anime WHERE anime_id = ?1 AND deleted_at IS NULL LIMIT 1").bind(animeId).first();
        if (anime?.has_video_ads) items.push({ id: "template-video-ads", kind: "video_ads", repeat: "always", title: CONTENT_NOTICE_TEMPLATES.video_ads.title, message: CONTENT_NOTICE_TEMPLATES.video_ads.message });
      }
      if (row) {
        const item = customNotificationItem(row);
        const local = new Date(Date.now() - item.timezoneOffset * 60000);
        item.occurrence = item.recurrence === "weekly" ? `${local.toISOString().slice(0, 10)}T${item.displayTime}` : (item.startsAt ?? item.createdAt);
        items.push(item);
      }
      return { items };
    }, `custom-notification:${animeId ?? "homepage"}`);
  }
  const postPlacement = placement === "post_modal";
  if (postPlacement && !animeId) return json({ items: [] }, 200, origin, "private, max-age=30");
  const scopeClause = postPlacement ? "n.anime_id = ?1" : "n.anime_id IS NULL";
  const statement = env.DB.prepare(
    `SELECT n.*, a.title AS anime_title FROM announcements n LEFT JOIN anime a ON a.anime_id = n.anime_id
     WHERE n.enabled = 1 AND n.placement = ?${postPlacement ? 2 : 1} AND ${scopeClause}
       AND ((n.schedule_type = 'daily' AND (n.daily_starts_at IS NULL OR time(datetime('now', printf('%+d minutes', -n.timezone_offset))) >= n.daily_starts_at) AND (n.daily_ends_at IS NULL OR time(datetime('now', printf('%+d minutes', -n.timezone_offset))) < n.daily_ends_at)) OR (n.schedule_type = 'once' AND (n.starts_at IS NULL OR datetime(n.starts_at) <= datetime('now')) AND (n.ends_at IS NULL OR datetime(n.ends_at) > datetime('now'))))
     ORDER BY n.updated_at DESC LIMIT 1`
  );
  return cachedJson(request, origin, ctx, 30, async () => {
    const rows = postPlacement ? await statement.bind(animeId, placement).all() : await statement.bind(placement).all();
    return { items: rows.results.map(announcementItem) };
  }, `announcement:${placement}:${animeId ?? "global"}`);
}

function contentNoticeTemplateItem(key, rows) {
  const template = CONTENT_NOTICE_TEMPLATES[key];
  return {
    key,
    title: template.title,
    message: template.message,
    anime: rows.map((row) => ({ animeId: row.anime_id, title: row.title, imageUrl: row.image_url }))
  };
}

async function handleAdminContentNotices(request, env, origin, accountId, path) {
  const key = path.startsWith("/v1/admin/content-notices/") ? decodeURIComponent(path.slice("/v1/admin/content-notices/".length)) : null;
  if (request.method === "GET" && !key) {
    const [nsfw, videoAds] = await env.DB.batch([
      env.DB.prepare("SELECT anime_id, title, image_url FROM anime WHERE is_nsfw = 1 AND deleted_at IS NULL ORDER BY title COLLATE NOCASE"),
      env.DB.prepare("SELECT anime_id, title, image_url FROM anime WHERE has_video_ads = 1 AND deleted_at IS NULL ORDER BY title COLLATE NOCASE")
    ]);
    return json({ templates: [contentNoticeTemplateItem("nsfw", nsfw.results), contentNoticeTemplateItem("video_ads", videoAds.results)] }, 200, origin);
  }
  if (request.method !== "PATCH" || !key) return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const template = CONTENT_NOTICE_TEMPLATES[key];
  if (!template) return error("INVALID_CONTENT_NOTICE", "Unknown content notice template", 404, origin);
  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const animeIds = [...new Set(Array.isArray(parsed.data?.animeIds) ? parsed.data.animeIds.map(String).filter(isValidAnimeId) : [])];
  if (animeIds.length > 500) return error("TOO_MANY_ANIME", "Select no more than 500 anime", 400, origin);
  if (animeIds.length) {
    const placeholders = animeIds.map((_, index) => `?${index + 1}`).join(",");
    const found = await env.DB.prepare(`SELECT COUNT(*) AS total FROM anime WHERE anime_id IN (${placeholders}) AND deleted_at IS NULL`).bind(...animeIds).first();
    if (Number(found?.total ?? 0) !== animeIds.length) return error("ANIME_NOT_FOUND", "A selected anime does not exist", 404, origin);
  }
  await env.DB.batch([
    env.DB.prepare(`UPDATE anime SET ${template.column} = 0, edited_at = datetime('now'), edited_by = ?1, updated_at = datetime('now') WHERE deleted_at IS NULL AND ${template.column} <> 0`).bind(accountId),
    ...animeIds.map((animeId) => env.DB.prepare(`UPDATE anime SET ${template.column} = 1, edited_at = datetime('now'), edited_by = ?1, updated_at = datetime('now') WHERE anime_id = ?2 AND deleted_at IS NULL`).bind(accountId, animeId))
  ]);
  await Promise.all([
    incrementCatalogRevision(env),
    incrementAnnouncementRevision(env),
    writeContentActivity(env, "content_notice_updated", accountId, key, `${key} content notice updated for ${animeIds.length} anime`)
  ]);
  return json({ key, animeIds }, 200, origin);
}

async function handleAdminAnnouncements(request, env, origin, accountId, path) {
  const id = path.startsWith("/v1/admin/announcements/") ? decodeURIComponent(path.slice("/v1/admin/announcements/".length)) : null;
  if (request.method === "GET" && !id) {
    const siteAnnouncement = await env.DB.prepare("SELECT * FROM announcements WHERE id = 'legacy-homepage-announcement'").first();
    const rows = await env.DB.prepare(`${notificationSelect} ORDER BY n.updated_at DESC`).all();
    return json({ siteAnnouncement: siteAnnouncement ? announcementItem(siteAnnouncement) : null, items: rows.results.map(customNotificationItem) }, 200, origin);
  }
  if (request.method === "POST" && !id) {
    const parsed = await parseCustomNotificationInput(request, env, origin);
    if (parsed.response) return parsed.response;
    const item = parsed.data;
    const newId = createId();
    if (item.publish) { const conflict = await customNotificationConflict(env, item, null, origin); if (conflict) return conflict; }
    await env.DB.prepare(`INSERT INTO custom_notifications (id,name,title,message,status,location,recurrence,weekdays,display_time,starts_at,ends_at,timezone_offset,created_by,updated_by) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?13)`).bind(newId,item.name,item.title,item.message,item.publish?(item.startsAt&&item.startsAt>new Date().toISOString()?"Scheduled":"Active"):"Draft",item.location,item.recurrence,item.weekdays.join(","),item.displayTime,item.startsAt,item.endsAt,item.timezoneOffset,accountId).run();
    if (item.animeIds.length) await env.DB.batch(item.animeIds.map((animeId) => env.DB.prepare("INSERT INTO custom_notification_anime (notification_id, anime_id) VALUES (?1, ?2)").bind(newId, animeId)));
    await incrementAnnouncementRevision(env);
    return json({ id: newId }, 201, origin);
  }
  if (request.method === "PATCH" && id) {
    if (id === "legacy-homepage-announcement") { const body = (await parseJsonBody(request, origin)); if (body.response) return body.response; const title=String(body.data?.title??"").trim(), message=String(body.data?.message??"").trim(); if(!title||!message) return error("INVALID_ANNOUNCEMENT","Title and message are required",400,origin); await env.DB.prepare("UPDATE announcements SET title=?1,message=?2,updated_by=?3,updated_at=datetime('now') WHERE id='legacy-homepage-announcement'").bind(title,message,accountId).run(); await incrementAnnouncementRevision(env); return json({id},200,origin); }
    if (request.headers.get("X-Notification-Action") === "stop") { const result = await env.DB.prepare("UPDATE custom_notifications SET status='Stopped',updated_by=?1,updated_at=datetime('now') WHERE id=?2 AND status IN ('Scheduled','Active')").bind(accountId,id).run(); if(!result.meta.changes)return error("INVALID_STATUS","Only scheduled or active notifications can be stopped",409,origin); await incrementAnnouncementRevision(env); return json({id},200,origin); }
    if (request.headers.get("X-Notification-Action") === "draft") { const result = await env.DB.prepare("UPDATE custom_notifications SET status='Draft',updated_by=?1,updated_at=datetime('now') WHERE id=?2").bind(accountId,id).run(); if(!result.meta.changes)return error("NOT_FOUND","Notification not found",404,origin); await incrementAnnouncementRevision(env); return json({id},200,origin); }
    const parsed = await parseCustomNotificationInput(request, env, origin);
    if (parsed.response) return parsed.response;
    const item = parsed.data;
    const existing = await env.DB.prepare("SELECT status FROM custom_notifications WHERE id=?1").bind(id).first(); if(!existing) return error("NOT_FOUND","Notification not found",404,origin);
    if(item.publish){const conflict=await customNotificationConflict(env,item,id,origin);if(conflict)return conflict;}
    const result=await env.DB.prepare("UPDATE custom_notifications SET name=?1,title=?2,message=?3,status=?4,location=?5,recurrence=?6,weekdays=?7,display_time=?8,starts_at=?9,ends_at=?10,timezone_offset=?11,updated_by=?12,updated_at=datetime('now') WHERE id=?13").bind(item.name,item.title,item.message,item.publish?(item.startsAt&&item.startsAt>new Date().toISOString()?"Scheduled":"Active"):"Draft",item.location,item.recurrence,item.weekdays.join(','),item.displayTime,item.startsAt,item.endsAt,item.timezoneOffset,accountId,id).run();
    await env.DB.prepare("DELETE FROM custom_notification_anime WHERE notification_id=?1").bind(id).run(); if(item.animeIds.length) await env.DB.batch(item.animeIds.map((animeId)=>env.DB.prepare("INSERT INTO custom_notification_anime(notification_id,anime_id) VALUES(?1,?2)").bind(id,animeId)));
    if (!result.meta.changes) return error("NOT_FOUND", "Announcement not found", 404, origin);
    await incrementAnnouncementRevision(env);
    return json({ id }, 200, origin);
  }
  if (request.method === "DELETE" && id) {
    if(id==='legacy-homepage-announcement') return error("PERMANENT_ANNOUNCEMENT","The site announcement cannot be deleted",400,origin);
    await env.DB.prepare("DELETE FROM custom_notification_anime WHERE notification_id=?1").bind(id).run(); await env.DB.prepare("DELETE FROM custom_notifications WHERE id = ?1").bind(id).run();
    await incrementAnnouncementRevision(env);
    return new Response(null, { status: 204, headers: responseHeaders(origin) });
  }
  return error("METHOD_NOT_ALLOWED", "Unsupported announcement operation", 405, origin);
}

async function getResourceRevision(env, key) {
  const row = await env.DB.prepare("SELECT value FROM metadata WHERE key = ?1").bind(key).first();
  return String(row?.value ?? "0");
}

async function incrementResourceRevision(env, key) {
  await env.DB.prepare(
    `INSERT INTO metadata (key, value, updated_at) VALUES (?1, '1', datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       value = CAST(CAST(value AS INTEGER) + 1 AS TEXT), updated_at = datetime('now')`
  ).bind(key).run();
}

function getCatalogRevision(env) {
  return getResourceRevision(env, "catalog_revision");
}

function incrementCatalogRevision(env) {
  return incrementResourceRevision(env, "catalog_revision");
}

function incrementAnnouncementRevision(env) {
  return incrementResourceRevision(env, "announcement_revision");
}

async function handleCacheManifest(env, origin) {
  const rows = await env.DB.prepare(
    "SELECT key, value FROM metadata WHERE key IN ('catalog_revision', 'episodes_revision', 'announcement_revision')"
  ).all();
  const revisions = Object.fromEntries(rows.results.map((row) => [row.key, String(row.value ?? "0")]));
  return json({
    cacheProtocolVersion: 2,
    resources: {
      catalog: { schemaVersion: 1, revision: revisions.catalog_revision ?? "0" },
      episodes: { schemaVersion: 1, revision: revisions.episodes_revision ?? "0" },
      announcements: { schemaVersion: 1, revision: revisions.announcement_revision ?? "0" }
    }
  }, 200, origin, "private, no-store");
}

function toMedia(row) {
  return {
    id: row.source_id,
    libraryId: row.anime_id,
    urlSlug: row.url_slug ?? row.anime_id,
    title: {
      romaji: row.title,
      english: row.title_english,
      native: row.title_native,
      userPreferred: row.title_user_preferred ?? row.title
    },
    description: row.synopsis,
    bannerImage: row.banner_url,
    coverImage: row.image_url
      ? {
          extraLarge: row.image_url,
          large: row.image_url,
          medium: row.image_url,
          color: row.color
        }
      : null,
    averageScore: row.score,
    meanScore: row.mean_score,
    episodes: row.episodes,
    format: row.type,
    season: row.season,
    seasonYear: row.year,
    genres: parseGenres(row.genres),
    popularity: row.popularity,
    status: row.status,
    studios: row.studio ? { nodes: [{ name: row.studio }] } : { nodes: [] },
    nextAiringEpisode: row.next_episode ? { episode: row.next_episode } : null,
    isNsfw: Boolean(row.is_nsfw),
    isFeatured: row.featured_position !== null && row.featured_position !== undefined,
    featuredPosition: row.featured_position ?? null
  };
}

function uniqueMedia(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row.source_id || seen.has(row.source_id)) return false;
    seen.add(row.source_id);
    return true;
  }).map(toMedia);
}

function normalizeMetricRoute(path) {
  if (/^\/v1\/anime\/[^/]+\/episodes$/.test(path)) return "/v1/anime/:id/episodes";
  if (/^\/v1\/anime\/[^/]+$/.test(path)) return "/v1/anime/:id";
  if (TRACKED_API_ROUTES.includes(path)) return path;
  return "/v1/unknown";
}

export function mergeTrackedRouteMetrics(rows) {
  const metricsByRoute = new Map(rows.map((row) => [row.route, row]));
  return TRACKED_API_ROUTES.map((route) => {
    const metric = metricsByRoute.get(route);
    return {
      route,
      requests: Number(metric?.requests ?? 0),
      errors: Number(metric?.errors ?? 0),
      duration_ms: Number(metric?.duration_ms ?? 0),
      max_duration_ms: Number(metric?.max_duration_ms ?? 0)
    };
  });
}

async function recordRequestMetric(env, path, status, duration) {
  const bucket = new Date().toISOString().slice(0, 13) + ":00:00Z";
  await env.DB.prepare(
    `INSERT INTO request_metrics_hourly
      (bucket_at, route, request_count, error_count, total_duration_ms, max_duration_ms)
     VALUES (?1, ?2, 1, ?3, ?4, ?4)
     ON CONFLICT(bucket_at, route) DO UPDATE SET
       request_count = request_count + 1,
       error_count = error_count + excluded.error_count,
       total_duration_ms = total_duration_ms + excluded.total_duration_ms,
       max_duration_ms = MAX(max_duration_ms, excluded.max_duration_ms)`
  ).bind(bucket, normalizeMetricRoute(path), status >= 400 ? 1 : 0, duration).run();
}

async function recordApiKeyMetric(env, keyId, path, status, duration) {
  if (!keyId) return;
  const bucket = new Date().toISOString().slice(0, 13) + ":00:00Z";
  await env.DB.prepare(
    `INSERT INTO api_key_metrics_hourly
      (key_id, bucket_at, route, request_count, error_count, total_duration_ms, max_duration_ms)
     VALUES (?1, ?2, ?3, 1, ?4, ?5, ?5)
     ON CONFLICT(key_id, bucket_at, route) DO UPDATE SET
       request_count = request_count + 1,
       error_count = error_count + excluded.error_count,
       total_duration_ms = total_duration_ms + excluded.total_duration_ms,
       max_duration_ms = MAX(max_duration_ms, excluded.max_duration_ms)`
  ).bind(keyId, bucket, normalizeMetricRoute(path), status >= 400 ? 1 : 0, duration).run();
}

async function authenticateApiKey(env, provided) {
  if (!provided) return null;
  if (await keysMatch(provided, env.API_KEY)) {
    const policy = await env.DB.prepare(
      `SELECT status, rate_limit_per_minute, daily_request_limit, daily_bandwidth_limit_bytes
       FROM system_api_key_policy WHERE id = 'site-deployment-key'`
    ).first();
    if (policy?.status === "paused") return null;
    return { id: "site-deployment-key", metricsId: null, isMaster: true, ...policy };
  }

  const hash = await hashKey(provided);
  const key = await env.DB.prepare(
    `SELECT id, status, rate_limit_per_minute, daily_request_limit, daily_bandwidth_limit_bytes
     FROM api_keys WHERE key_hash = ?1 LIMIT 1`
  ).bind(hash).first();
  if (!key || key.status !== "active") return null;
  return { ...key, metricsId: key.id, isMaster: false };
}

async function enforceApiKeyPolicy(env, key, origin) {
  const rateLimit = Number(key.rate_limit_per_minute ?? 0);
  const dailyLimit = Number(key.daily_request_limit ?? 0);
  const bandwidthLimit = Number(key.daily_bandwidth_limit_bytes ?? 0);
  if (!rateLimit && !dailyLimit && !bandwidthLimit) return null;

  const [minuteUsage, dailyUsage] = await env.DB.batch([
    env.DB.prepare(
      `SELECT COALESCE(SUM(request_count), 0) AS requests
       FROM api_key_usage_minute WHERE key_id = ?1 AND bucket_at >= strftime('%Y-%m-%dT%H:%M:00Z', 'now', '-1 minute')`
    ).bind(key.id),
    env.DB.prepare(
      `SELECT COALESCE(SUM(request_count), 0) AS requests, COALESCE(SUM(response_bytes), 0) AS bytes
       FROM api_key_usage_minute WHERE key_id = ?1 AND bucket_at >= strftime('%Y-%m-%dT00:00:00Z', 'now')`
    ).bind(key.id)
  ]);
  const minuteRequests = Number(minuteUsage.results[0]?.requests ?? 0);
  const dailyRequests = Number(dailyUsage.results[0]?.requests ?? 0);
  const dailyBytes = Number(dailyUsage.results[0]?.bytes ?? 0);
  if (rateLimit && minuteRequests >= rateLimit) return error("RATE_LIMIT_EXCEEDED", "Per-minute API rate limit exceeded", 429, origin);
  if (dailyLimit && dailyRequests >= dailyLimit) return error("DAILY_LIMIT_EXCEEDED", "Daily API request limit exceeded", 429, origin);
  if (bandwidthLimit && dailyBytes >= bandwidthLimit) return error("BANDWIDTH_LIMIT_EXCEEDED", "Daily API bandwidth limit exceeded", 429, origin);
  return null;
}

async function recordApiKeyPolicyUsage(env, keyId, response) {
  const bucket = new Date().toISOString().slice(0, 16) + ":00Z";
  const bytes = Number.parseInt(response.headers.get("Content-Length") ?? "0", 10) || 0;
  await env.DB.prepare(
    `INSERT INTO api_key_usage_minute (key_id, bucket_at, request_count, response_bytes)
     VALUES (?1, ?2, 1, ?3)
     ON CONFLICT(key_id, bucket_at) DO UPDATE SET
       request_count = request_count + 1,
       response_bytes = response_bytes + excluded.response_bytes`
  ).bind(keyId, bucket, bytes).run();
}

function cleanKeyName(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function parseOptionalLimit(value, maximum) {
  if (value === null || value === undefined || value === "") return { value: null };
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) return { error: true };
  return { value: parsed };
}

async function parseJsonBody(request, origin) {
  try {
    return { data: await request.json() };
  } catch {
    return { response: error("INVALID_JSON", "Request body must be valid JSON", 400, origin) };
  }
}

async function writeKeyActivity(env, eventType, keyId, summary) {
  await env.DB.prepare(
    `INSERT INTO activity_events (event_type, actor_id, entity_type, entity_id, summary)
     VALUES (?1, 'dashboard', 'api_key', ?2, ?3)`
  ).bind(eventType, keyId, summary).run();
}

async function listApiKeys(env, origin) {
  const [rows, siteMetrics, systemPolicy, siteDomainPolicy] = await env.DB.batch([
    env.DB.prepare(
      `SELECT k.id, k.name, k.key_prefix, k.key_hint, k.status, k.created_at, k.updated_at, k.last_used_at,
               k.rate_limit_per_minute, k.daily_request_limit, k.daily_bandwidth_limit_bytes,
               COALESCE((SELECT enabled FROM api_key_domain_settings d WHERE d.key_id = k.id), 0) AS domain_lock_enabled,
               (SELECT group_concat(origin, '|') FROM api_key_allowed_domains a WHERE a.key_id = k.id) AS domain_origins,
               COALESCE(SUM(m.request_count), 0) AS request_count,
              COALESCE(SUM(m.error_count), 0) AS error_count,
              COALESCE(SUM(m.total_duration_ms), 0) AS total_duration_ms,
              COALESCE(MAX(m.max_duration_ms), 0) AS max_duration_ms
       FROM api_keys k
       LEFT JOIN api_key_metrics_hourly m
         ON m.key_id = k.id AND m.bucket_at >= datetime('now', '-30 days')
       GROUP BY k.id
       ORDER BY k.created_at DESC`
    ),
    env.DB.prepare(
      `SELECT COALESCE(SUM(request_count), 0) AS request_count,
              COALESCE(SUM(error_count), 0) AS error_count,
              COALESCE(SUM(total_duration_ms), 0) AS total_duration_ms,
              COALESCE(MAX(max_duration_ms), 0) AS max_duration_ms
       FROM request_metrics_hourly WHERE bucket_at >= strftime('%Y-%m-%dT%H:00:00Z', 'now', '-30 days')`
    ),
    env.DB.prepare("SELECT name, status, rate_limit_per_minute, daily_request_limit, daily_bandwidth_limit_bytes, updated_at FROM system_api_key_policy WHERE id = 'site-deployment-key'"),
    env.DB.prepare("SELECT enabled, (SELECT group_concat(origin, '|') FROM api_key_allowed_domains WHERE key_id = 'site-deployment-key') AS origins FROM api_key_domain_settings WHERE key_id = 'site-deployment-key'")
  ]);

  const keys = rows.results.map((row) => {
    const requests = Number(row.request_count ?? 0);
    const errors = Number(row.error_count ?? 0);
    return {
      id: row.id,
      name: row.name,
      keyPrefix: row.key_prefix,
      keyHint: row.key_hint,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastUsedAt: row.last_used_at,
      isSiteKey: false,
      managed: true,
      domainLock: {
        enabled: Boolean(row.domain_lock_enabled),
        origins: typeof row.domain_origins === "string" && row.domain_origins ? row.domain_origins.split("|") : []
      },
      policy: {
        rateLimitPerMinute: row.rate_limit_per_minute === null ? null : Number(row.rate_limit_per_minute),
        dailyRequestLimit: row.daily_request_limit === null ? null : Number(row.daily_request_limit),
        dailyBandwidthLimitBytes: row.daily_bandwidth_limit_bytes === null ? null : Number(row.daily_bandwidth_limit_bytes)
      },
      usage: {
        requests,
        errors,
        successfulRequests: Math.max(requests - errors, 0),
        errorRate: requests ? Math.round((errors / requests) * 10000) / 100 : 0,
        averageResponseMs: requests ? Math.round(Number(row.total_duration_ms ?? 0) / requests) : null,
        maxResponseMs: requests ? Number(row.max_duration_ms ?? 0) : null
      }
    };
  });
  const site = siteMetrics.results[0] ?? {};
  const sitePolicy = systemPolicy.results[0] ?? {};
  const domainLock = siteDomainPolicy.results[0] ?? {};
  const siteRequests = Number(site.request_count ?? 0);
  const siteErrors = Number(site.error_count ?? 0);
  keys.unshift({
    id: "site-deployment-key",
    name: sitePolicy.name ?? "RioAnime site key",
    keyPrefix: String(env.API_KEY).slice(0, 8),
    keyHint: keyHint(String(env.API_KEY)),
    status: sitePolicy.status ?? "active",
    createdAt: null,
    updatedAt: sitePolicy.updated_at ?? null,
    lastUsedAt: null,
    isSiteKey: true,
    managed: false,
    domainLock: {
      enabled: Boolean(domainLock.enabled),
      origins: typeof domainLock.origins === "string" && domainLock.origins ? domainLock.origins.split("|") : []
    },
    policy: {
      rateLimitPerMinute: sitePolicy.rate_limit_per_minute === null || sitePolicy.rate_limit_per_minute === undefined ? null : Number(sitePolicy.rate_limit_per_minute),
      dailyRequestLimit: sitePolicy.daily_request_limit === null || sitePolicy.daily_request_limit === undefined ? null : Number(sitePolicy.daily_request_limit),
      dailyBandwidthLimitBytes: sitePolicy.daily_bandwidth_limit_bytes === null || sitePolicy.daily_bandwidth_limit_bytes === undefined ? null : Number(sitePolicy.daily_bandwidth_limit_bytes)
    },
    usage: {
      requests: siteRequests,
      errors: siteErrors,
      successfulRequests: Math.max(siteRequests - siteErrors, 0),
      errorRate: siteRequests ? Math.round((siteErrors / siteRequests) * 10000) / 100 : 0,
      averageResponseMs: siteRequests ? Math.round(Number(site.total_duration_ms ?? 0) / siteRequests) : null,
      maxResponseMs: siteRequests ? Number(site.max_duration_ms ?? 0) : null
    }
  });
  return json({ keys, periodDays: 30 }, 200, origin);
}

async function createManagedApiKey(request, env, origin) {
  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const name = cleanKeyName(parsed.data?.name);
  if (name.length < 2 || name.length > 60) {
    return error("INVALID_NAME", "Name must contain between 2 and 60 characters", 400, origin);
  }

  const id = createId();
  const key = createApiKey();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO api_keys (id, name, key_prefix, key_hint, key_hash)
       VALUES (?1, ?2, ?3, ?4, ?5)`
    ).bind(id, name, key.slice(0, 13), keyHint(key), await hashKey(key)),
    env.DB.prepare("INSERT INTO api_key_domain_settings (key_id, enabled) VALUES (?1, 0)").bind(id)
  ]);
  await writeKeyActivity(env, "api_key.created", id, `API key created: ${name}`);
  return json({ id, name, key, keyHint: keyHint(key), status: "active" }, 201, origin);
}

async function updateManagedApiKey(request, env, origin, id) {
  const isSiteKey = id === "site-deployment-key";
  const existing = isSiteKey
    ? await env.DB.prepare("SELECT id, name FROM system_api_key_policy WHERE id = ?1").bind(id).first()
    : await env.DB.prepare("SELECT id, name FROM api_keys WHERE id = ?1").bind(id).first();
  if (!existing) return error("NOT_FOUND", "API key not found", 404, origin);
  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const action = parsed.data?.action;

  if (action === "rename") {
    const name = cleanKeyName(parsed.data?.name);
    if (name.length < 2 || name.length > 60) {
      return error("INVALID_NAME", "Name must contain between 2 and 60 characters", 400, origin);
    }
    const table = isSiteKey ? "system_api_key_policy" : "api_keys";
    await env.DB.prepare(`UPDATE ${table} SET name = ?1, updated_at = datetime('now') WHERE id = ?2`).bind(name, id).run();
    await writeKeyActivity(env, "api_key.renamed", id, `API key renamed to: ${name}`);
    return json({ id, name }, 200, origin);
  }

  if (action === "pause" || action === "resume") {
    const status = action === "pause" ? "paused" : "active";
    const table = isSiteKey ? "system_api_key_policy" : "api_keys";
    await env.DB.prepare(`UPDATE ${table} SET status = ?1, updated_at = datetime('now') WHERE id = ?2`).bind(status, id).run();
    await writeKeyActivity(env, `api_key.${action}d`, id, `API key ${action}d: ${existing.name}`);
    return json({ id, status }, 200, origin);
  }

  if (action === "regenerate") {
    if (isSiteKey) return error("DEPLOYMENT_KEY", "Replace the site deployment secret through Cloudflare before revoking it", 409, origin);
    const key = createApiKey();
    await env.DB.prepare(
      `UPDATE api_keys SET key_prefix = ?1, key_hint = ?2, key_hash = ?3,
       status = 'active', updated_at = datetime('now') WHERE id = ?4`
    ).bind(key.slice(0, 13), keyHint(key), await hashKey(key), id).run();
    await writeKeyActivity(env, "api_key.regenerated", id, `API key regenerated: ${existing.name}`);
    return json({ id, key, keyHint: keyHint(key), status: "active" }, 200, origin);
  }

  if (action === "policy") {
    const rate = parseOptionalLimit(parsed.data?.rateLimitPerMinute, 10000);
    const daily = parseOptionalLimit(parsed.data?.dailyRequestLimit, 100000000);
    const bandwidth = parseOptionalLimit(parsed.data?.dailyBandwidthLimitBytes, 1099511627776);
    if (rate.error || daily.error || bandwidth.error) {
      return error("INVALID_POLICY", "Limits must be positive whole numbers within the supported range", 400, origin);
    }
    const table = isSiteKey ? "system_api_key_policy" : "api_keys";
    await env.DB.prepare(
      `UPDATE ${table} SET rate_limit_per_minute = ?1, daily_request_limit = ?2,
       daily_bandwidth_limit_bytes = ?3, updated_at = datetime('now') WHERE id = ?4`
    ).bind(rate.value, daily.value, bandwidth.value, id).run();
    await writeKeyActivity(env, "api_key.policy_updated", id, `API limits updated: ${existing.name}`);
    return json({ id, policy: { rateLimitPerMinute: rate.value, dailyRequestLimit: daily.value, dailyBandwidthLimitBytes: bandwidth.value } }, 200, origin);
  }

  return error("INVALID_ACTION", "Action must be rename, pause, resume, regenerate, or policy", 400, origin);
}

async function deleteManagedApiKey(env, origin, id) {
  if (id === "site-deployment-key") {
    const existing = await env.DB.prepare("SELECT name FROM system_api_key_policy WHERE id = ?1").bind(id).first();
    await env.DB.prepare("UPDATE system_api_key_policy SET status = 'paused', updated_at = datetime('now') WHERE id = ?1").bind(id).run();
    await writeKeyActivity(env, "api_key.revoked", id, `Site API access revoked: ${existing?.name ?? "Site key"}`);
    return new Response(null, { status: 204, headers: responseHeaders(origin) });
  }
  const existing = await env.DB.prepare("SELECT name FROM api_keys WHERE id = ?1").bind(id).first();
  if (!existing) return error("NOT_FOUND", "API key not found", 404, origin);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM api_key_metrics_hourly WHERE key_id = ?1").bind(id),
    env.DB.prepare("DELETE FROM api_key_allowed_domains WHERE key_id = ?1").bind(id),
    env.DB.prepare("DELETE FROM api_key_domain_settings WHERE key_id = ?1").bind(id),
    env.DB.prepare("DELETE FROM api_keys WHERE id = ?1").bind(id)
  ]);
  await writeKeyActivity(env, "api_key.deleted", id, `API key deleted: ${existing.name}`);
  return new Response(null, { status: 204, headers: responseHeaders(origin) });
}

async function handleApiKeyDomainLock(request, env, origin, id) {
  const exists = id === "site-deployment-key"
    ? await env.DB.prepare("SELECT id FROM system_api_key_policy WHERE id = ?1").bind(id).first()
    : await env.DB.prepare("SELECT id FROM api_keys WHERE id = ?1").bind(id).first();
  if (!exists) return error("NOT_FOUND", "API key not found", 404, origin);

  if (request.method === "GET") {
    const [setting, domains] = await env.DB.batch([
      env.DB.prepare("SELECT enabled, updated_at FROM api_key_domain_settings WHERE key_id = ?1").bind(id),
      env.DB.prepare("SELECT origin, created_at FROM api_key_allowed_domains WHERE key_id = ?1 ORDER BY origin ASC").bind(id)
    ]);
    return json({
      enabled: Boolean(setting.results[0]?.enabled),
      updatedAt: setting.results[0]?.updated_at ?? null,
      domains: domains.results.map((row) => ({ origin: row.origin, createdAt: row.created_at }))
    }, 200, origin);
  }
  if (request.method !== "PATCH") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);

  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const enabled = parsed.data?.enabled === true;
  if (!Array.isArray(parsed.data?.domains) || parsed.data.domains.length > 20) {
    return error("INVALID_DOMAINS", "Provide no more than 20 allowed domains", 400, origin);
  }
  const domains = [...new Set(parsed.data.domains.map(normalizeOrigin))];
  if (domains.includes(null) || (enabled && domains.length === 0)) {
    return error("INVALID_DOMAINS", "Each domain must be a valid HTTP or HTTPS origin", 400, origin);
  }

  await env.DB.batch([
    env.DB.prepare("DELETE FROM api_key_allowed_domains WHERE key_id = ?1").bind(id),
    ...domains.map((domain) => env.DB.prepare("INSERT INTO api_key_allowed_domains (key_id, origin) VALUES (?1, ?2)").bind(id, domain)),
    env.DB.prepare(
      `INSERT INTO api_key_domain_settings (key_id, enabled, updated_at) VALUES (?1, ?2, datetime('now'))
       ON CONFLICT(key_id) DO UPDATE SET enabled = excluded.enabled, updated_at = excluded.updated_at`
    ).bind(id, enabled ? 1 : 0)
  ]);
  await writeKeyActivity(env, "api_key.domain_lock_updated", id, `Domain lock ${enabled ? "enabled" : "disabled"} with ${domains.length} allowed origins`);
  return json({ enabled, domains: domains.map((domain) => ({ origin: domain })) }, 200, origin);
}

async function routeApiKeyManagement(request, env, origin, path) {
  if (path === "/v1/api-keys") {
    if (request.method === "GET") return listApiKeys(env, origin);
    if (request.method === "POST") return createManagedApiKey(request, env, origin);
    return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  }
  const domainLockMatch = path.match(/^\/v1\/api-keys\/([a-z0-9-]+)\/domain-lock$/i);
  if (domainLockMatch) return handleApiKeyDomainLock(request, env, origin, domainLockMatch[1]);
  const match = path.match(/^\/v1\/api-keys\/([a-z0-9-]+)$/i);
  if (!match) return error("NOT_FOUND", "Route not found", 404, origin);
  if (request.method === "PATCH") return updateManagedApiKey(request, env, origin, match[1]);
  if (request.method === "DELETE") return deleteManagedApiKey(env, origin, match[1]);
  return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
}

function percentageChange(current, previous) {
  if (!previous) return current ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function handleDashboard(env, origin) {
  const startedAt = Date.now();
  const [summary, recentContent, dailyTraffic, routeMetrics, activities] = await env.DB.batch([
    env.DB.prepare(
      `SELECT
        (SELECT COUNT(*) FROM anime WHERE deleted_at IS NULL) AS total_content,
        (SELECT COUNT(*) FROM episodes) AS total_episodes,
        (SELECT COUNT(*) FROM accounts WHERE role = 'member' AND status = 'active') AS enabled_members,
        (SELECT COUNT(*) FROM accounts WHERE role = 'member' AND status = 'pending') AS pending_members,
        (SELECT COUNT(*) FROM anime WHERE deleted_at IS NULL AND created_at >= datetime('now', '-30 days')) AS content_current,
        (SELECT COUNT(*) FROM anime WHERE deleted_at IS NULL AND created_at >= datetime('now', '-60 days') AND created_at < datetime('now', '-30 days')) AS content_previous,
        (SELECT COUNT(*) FROM accounts WHERE role = 'member' AND created_at >= datetime('now', '-30 days')) AS members_current,
        (SELECT COUNT(*) FROM accounts WHERE role = 'member' AND created_at >= datetime('now', '-60 days') AND created_at < datetime('now', '-30 days')) AS members_previous,
        (SELECT COALESCE(SUM(request_count), 0) FROM request_metrics_hourly WHERE bucket_at >= strftime('%Y-%m-%dT%H:00:00Z', 'now', '-30 days')) AS requests_current,
        (SELECT COALESCE(SUM(request_count), 0) FROM request_metrics_hourly WHERE bucket_at >= strftime('%Y-%m-%dT%H:00:00Z', 'now', '-60 days') AND bucket_at < strftime('%Y-%m-%dT%H:00:00Z', 'now', '-30 days')) AS requests_previous,
        (SELECT COALESCE(SUM(total_duration_ms), 0) FROM request_metrics_hourly WHERE bucket_at >= strftime('%Y-%m-%dT%H:00:00Z', 'now', '-30 days')) AS duration_current,
        (SELECT COALESCE(SUM(error_count), 0) FROM request_metrics_hourly WHERE bucket_at >= strftime('%Y-%m-%dT%H:00:00Z', 'now', '-30 days')) AS errors_current`
    ),
    env.DB.prepare(
      `SELECT anime_id, title, type, episodes, status, created_at, updated_at
       FROM anime WHERE title IS NOT NULL AND deleted_at IS NULL
       ORDER BY COALESCE(updated_at, created_at) DESC LIMIT 6`
    ),
    env.DB.prepare(
      `SELECT date(bucket_at) AS day, SUM(request_count) AS requests
       FROM request_metrics_hourly
       WHERE bucket_at >= strftime('%Y-%m-%dT%H:00:00Z', 'now', '-13 days')
       GROUP BY date(bucket_at) ORDER BY day ASC`
    ),
    env.DB.prepare(
      `SELECT route, SUM(request_count) AS requests, SUM(error_count) AS errors,
              SUM(total_duration_ms) AS duration_ms, MAX(max_duration_ms) AS max_duration_ms
        FROM request_metrics_hourly WHERE bucket_at >= strftime('%Y-%m-%dT%H:00:00Z', 'now', '-24 hours')
       GROUP BY route ORDER BY requests DESC`
    ),
    env.DB.prepare(
      `SELECT event_type, actor_id, entity_type, entity_id, summary, detail_json, created_at
       FROM activity_events ORDER BY created_at DESC LIMIT 8`
    )
  ]);

  const totals = summary.results[0] ?? {};
  const requests = Number(totals.requests_current ?? 0);
  const duration = Number(totals.duration_current ?? 0);
  return json({
    generatedAt: new Date().toISOString(),
    summary: {
      totalContent: Number(totals.total_content ?? 0),
      totalEpisodes: Number(totals.total_episodes ?? 0),
      enabledMembers: Number(totals.enabled_members ?? 0),
      pendingMembers: Number(totals.pending_members ?? 0),
      apiRequests: requests,
      averageResponseMs: requests ? Math.round(duration / requests) : null,
      errorRate: requests ? Math.round((Number(totals.errors_current ?? 0) / requests) * 10000) / 100 : 0,
      changes: {
        content: percentageChange(Number(totals.content_current ?? 0), Number(totals.content_previous ?? 0)),
        members: percentageChange(Number(totals.members_current ?? 0), Number(totals.members_previous ?? 0)),
        requests: percentageChange(requests, Number(totals.requests_previous ?? 0))
      }
    },
    recentContent: recentContent.results,
    dailyTraffic: dailyTraffic.results,
    routeMetrics: mergeTrackedRouteMetrics(routeMetrics.results),
    activities: activities.results,
    health: { api: "operational", database: "operational", queryDurationMs: Date.now() - startedAt }
  }, 200, origin);
}

async function handleAdminLogin(request, env, origin) {
  const contentLength = Number.parseInt(request.headers.get("Content-Length") ?? "0", 10);
  if (contentLength > 4096) return error("PAYLOAD_TOO_LARGE", "Request body is too large", 413, origin);

  let body;
  try {
    body = await request.json();
  } catch {
    return error("INVALID_BODY", "A valid JSON body is required", 400, origin);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password || email.length > 254 || password.length > 200) {
    return error("INVALID_CREDENTIALS", "Email or password is incorrect", 401, origin);
  }

  const account = await env.DB.prepare(
    `SELECT id, email, username, role, status, password_hash
     FROM accounts WHERE email = ?1 COLLATE NOCASE LIMIT 1`
  ).bind(email).first();
  const valid = account?.role === "admin" && account.status === "active" &&
    await verifyPassword(password, account.password_hash);
  if (!valid) return error("INVALID_CREDENTIALS", "Email or password is incorrect", 401, origin);

  await env.DB.batch([
    env.DB.prepare("UPDATE accounts SET last_login_at = datetime('now'), updated_at = datetime('now') WHERE id = ?1").bind(account.id),
    env.DB.prepare(
      `INSERT INTO activity_events (event_type, actor_id, entity_type, entity_id, summary)
       VALUES ('admin_login', ?1, 'account', ?1, 'Administrator signed in')`
    ).bind(account.id)
  ]);
  return json({ account: { id: account.id, email: account.email, username: account.username, role: account.role } }, 200, origin);
}

async function handleAdminIdentity(request, env, origin) {
  if (request.method !== "POST") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const email = decodeIdentityHeader(request, "X-RioAnime-User-Email").trim().toLowerCase();
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return error("INVALID_ACCOUNT", "A valid account is required", 401, origin);
  }

  const account = await env.DB.prepare(
    `SELECT id, email, username, role, status
     FROM accounts WHERE email = ?1 COLLATE NOCASE LIMIT 1`
  ).bind(email).first();
  if (account?.role !== "admin" || account.status !== "active") {
    return error("INVALID_ACCOUNT", "This account does not have administrator access", 403, origin);
  }
  return json({ account: { id: account.id, email: account.email, username: account.username, role: account.role } }, 200, origin);
}

async function getAdminAccount(env, accountId) {
  if (!accountId) return null;
  return env.DB.prepare(
    `SELECT id, email, username, role, status, password_hash, created_at, updated_at, last_login_at
     FROM accounts WHERE id = ?1 AND role = 'admin' AND status = 'active' LIMIT 1`
  ).bind(accountId).first();
}

function publicAccount(account) {
  return {
    id: account.id,
    email: account.email,
    username: account.username,
    role: account.role,
    createdAt: account.created_at,
    updatedAt: account.updated_at,
    lastLoginAt: account.last_login_at
  };
}

async function handleAdminProfile(request, env, origin, accountId) {
  const account = await getAdminAccount(env, accountId);
  if (!account) return error("UNAUTHORIZED", "Administrator session is no longer valid", 401, origin);
  if (request.method === "GET") return json({ account: publicAccount(account) }, 200, origin);
  if (request.method !== "PATCH") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);

  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const currentPassword = typeof parsed.data?.currentPassword === "string" ? parsed.data.currentPassword : "";
  if (!(await verifyPassword(currentPassword, account.password_hash))) {
    return error("INVALID_PASSWORD", "Current password is incorrect", 401, origin);
  }

  const email = typeof parsed.data?.email === "string" ? parsed.data.email.trim().toLowerCase() : account.email;
  const username = cleanKeyName(parsed.data?.username ?? account.username);
  const newPassword = typeof parsed.data?.newPassword === "string" ? parsed.data.newPassword : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return error("INVALID_EMAIL", "Enter a valid email address", 400, origin);
  }
  if (username.length < 2 || username.length > 50) {
    return error("INVALID_USERNAME", "Username must contain between 2 and 50 characters", 400, origin);
  }
  if (newPassword && (newPassword.length < 8 || newPassword.length > 200)) {
    return error("INVALID_PASSWORD", "New password must contain between 8 and 200 characters", 400, origin);
  }

  try {
    const passwordHash = newPassword ? await hashPassword(newPassword) : account.password_hash;
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE accounts SET email = ?1, username = ?2, password_hash = ?3,
         email_verified_at = CASE WHEN email = ?1 THEN email_verified_at ELSE NULL END,
         updated_at = datetime('now') WHERE id = ?4`
      ).bind(email, username, passwordHash, account.id),
      env.DB.prepare(
        `INSERT INTO activity_events (event_type, actor_id, entity_type, entity_id, summary)
         VALUES (?1, ?2, 'account', ?2, ?3)`
      ).bind(newPassword ? "admin_profile_password_updated" : "admin_profile_updated", account.id, newPassword ? "Administrator profile and password updated" : "Administrator profile updated")
    ]);
  } catch (cause) {
    if (String(cause).includes("UNIQUE constraint failed")) {
      return error("ACCOUNT_CONFLICT", "That email address or username is already in use", 409, origin);
    }
    throw cause;
  }
  const updated = await getAdminAccount(env, account.id);
  return json({ account: publicAccount(updated), passwordChanged: Boolean(newPassword) }, 200, origin);
}

function memberAccountType(account) {
  if (account.role === "admin") return "admin";
  return account.membership_tier === "paid" ? "paid" : "member";
}

async function handleAdminMemberDetail(request, env, origin, memberId) {
  if (request.method !== "GET") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const [account, activity, watchedAnime, bookmarkCount] = await env.DB.batch([
    env.DB.prepare(
      `SELECT id, email, username, role, membership_tier, status, email_verified_at,
              last_login_at, created_at, updated_at
       FROM accounts WHERE id = ?1 LIMIT 1`
    ).bind(memberId),
    env.DB.prepare(
      `SELECT COUNT(*) AS anime_watched, COALESCE(SUM(view_count), 0) AS watch_activity,
              MIN(first_viewed_at) AS first_watched_at, MAX(last_viewed_at) AS last_watched_at
       FROM account_episode_progress WHERE account_id = ?1`
    ).bind(memberId),
    env.DB.prepare(
      `SELECT a.anime_id, a.title, a.image_url, a.type, p.view_count, p.first_viewed_at, p.last_viewed_at
       FROM account_episode_progress p
       JOIN anime a ON a.anime_id = p.anime_id
       WHERE p.account_id = ?1
       ORDER BY p.last_viewed_at DESC LIMIT 12`
    ).bind(memberId),
    env.DB.prepare("SELECT COUNT(*) AS total FROM account_bookmarks WHERE account_id = ?1").bind(memberId)
  ]);
  const member = account.results[0];
  if (!member) return error("MEMBER_NOT_FOUND", "Account was not found", 404, origin);
  const summary = activity.results[0] ?? {};
  return json({
    member: {
      id: member.id,
      email: member.email,
      username: member.username,
      role: member.role,
      membershipTier: member.membership_tier,
      accountType: memberAccountType(member),
      status: member.status,
      emailVerifiedAt: member.email_verified_at,
      lastLoginAt: member.last_login_at,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    },
    activity: {
      animeWatched: Number(summary.anime_watched ?? 0),
      watchActivity: Number(summary.watch_activity ?? 0),
      bookmarks: Number(bookmarkCount.results[0]?.total ?? 0),
      firstWatchedAt: summary.first_watched_at ?? null,
      lastWatchedAt: summary.last_watched_at ?? null
    },
    watchedAnime: watchedAnime.results.map((anime) => ({
      animeId: anime.anime_id,
      title: anime.title,
      imageUrl: anime.image_url,
      type: anime.type,
      watchActivity: Number(anime.view_count ?? 0),
      firstWatchedAt: anime.first_viewed_at,
      lastWatchedAt: anime.last_viewed_at
    }))
  }, 200, origin);
}

async function handleAdminMembers(request, env, origin) {
  if (request.method !== "GET") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const url = new URL(request.url);
  const page = Math.max(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "25", 10) || 25, 1), 100);
  const offset = (page - 1) * limit;
  const [rows, count] = await env.DB.batch([
    env.DB.prepare(
      `SELECT a.id, a.email, a.username, a.role, a.membership_tier, a.status, a.email_verified_at,
              a.last_login_at, a.created_at, a.updated_at,
              (SELECT COUNT(*) FROM account_episode_progress p WHERE p.account_id = a.id) AS anime_watched
       FROM accounts a
       ORDER BY created_at DESC, id DESC LIMIT ?1 OFFSET ?2`
    ).bind(limit, offset),
    env.DB.prepare("SELECT COUNT(*) AS total FROM accounts")
  ]);
  const total = Number(count.results[0]?.total ?? 0);
  return json({
    members: rows.results.map((member) => ({
      id: member.id,
      email: member.email,
      username: member.username,
      role: member.role,
      membershipTier: member.membership_tier,
      accountType: memberAccountType(member),
      status: member.status,
      emailVerifiedAt: member.email_verified_at,
      lastLoginAt: member.last_login_at,
      createdAt: member.created_at,
      updatedAt: member.updated_at,
      animeWatched: Number(member.anime_watched ?? 0)
    })),
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1), hasMore: offset + rows.results.length < total }
  }, 200, origin);
}

function optionalText(value, fallback, maxLength) {
  if (value === undefined) return { value: fallback };
  if (value === null) return { value: null };
  if (typeof value !== "string") return { error: true };
  const result = value.trim();
  return result.length <= maxLength ? { value: result || null } : { error: true };
}

function validHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function adminContentItem(row) {
  const retention = contentRetention(row.deleted_at);
  return {
    animeId: row.anime_id,
    urlSlug: row.url_slug ?? row.anime_id,
    title: row.title,
    titleEnglish: row.title_english,
    titleNative: row.title_native,
    titleUserPreferred: row.title_user_preferred,
    synopsis: row.synopsis,
    imageUrl: row.image_url,
    bannerUrl: row.banner_url,
    type: row.type,
    episodes: row.episodes,
    year: row.year,
    season: row.season,
    genres: parseGenres(row.genres),
    studio: row.studio,
    sourceStatus: row.status,
    contentStatus: row.content_status,
    visibility: row.visibility,
    isNsfw: Boolean(row.is_nsfw),
    featuredPosition: row.featured_position ?? null,
    views: Number(row.views ?? 0),
    postPath: `/watch/${encodeURIComponent(row.url_slug ?? row.anime_id)}`,
    createdAt: row.created_at,
    updatedAt: row.edited_at ?? row.updated_at,
    publishedAt: row.published_at,
    deletedAt: row.deleted_at,
    expiresAt: retention.expiresAt,
    daysRemaining: retention.daysRemaining
  };
}

async function handleAdminContentList(request, env, origin) {
  if (request.method !== "GET") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const url = new URL(request.url);
  const page = Math.max(Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 50);
  const search = (url.searchParams.get("q") ?? "").trim().slice(0, 100);
  const filter = url.searchParams.get("filter") ?? "all";
  const filterConditions = {
    all: "1 = 1",
    published: "a.content_status = 'published' AND a.deleted_at IS NULL",
    draft: "a.content_status = 'draft' AND a.deleted_at IS NULL",
    private: "a.visibility = 'private' AND a.deleted_at IS NULL",
    nsfw: "a.is_nsfw = 1 AND a.deleted_at IS NULL",
    deleted: "a.deleted_at IS NOT NULL"
  };
  const condition = filterConditions[filter] ?? filterConditions.all;
  const pattern = `%${search}%`;
  const where = `${condition} AND (?1 = '' OR a.title LIKE ?2 COLLATE NOCASE OR a.title_english LIKE ?2 COLLATE NOCASE OR a.anime_id LIKE ?2 COLLATE NOCASE)`;
  const offset = (page - 1) * limit;
  const [rows, count, summary] = await env.DB.batch([
    env.DB.prepare(
      `WITH view_totals AS (
         SELECT anime_id, SUM(view_count) AS views FROM anime_view_history GROUP BY anime_id
       )
       SELECT a.*, f.position AS featured_position, COALESCE(v.views, 0) AS views
       FROM anime a LEFT JOIN view_totals v ON v.anime_id = a.anime_id
       LEFT JOIN featured_posts f ON f.anime_id = a.anime_id
       WHERE ${where}
       ORDER BY COALESCE(a.edited_at, a.updated_at, a.created_at) DESC, a.anime_id
       LIMIT ?3 OFFSET ?4`
    ).bind(search, pattern, limit, offset),
    env.DB.prepare(`SELECT COUNT(*) AS total FROM anime a WHERE ${where}`).bind(search, pattern),
    env.DB.prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN content_status = 'published' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS published,
              SUM(CASE WHEN content_status = 'draft' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS draft,
              SUM(CASE WHEN visibility = 'private' AND deleted_at IS NULL THEN 1 ELSE 0 END) AS private_count,
              SUM(CASE WHEN is_nsfw = 1 AND deleted_at IS NULL THEN 1 ELSE 0 END) AS nsfw,
              SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deleted,
              (SELECT COALESCE(SUM(view_count), 0) FROM anime_view_history) AS views
       FROM anime`
    )
  ]);
  const total = Number(count.results[0]?.total ?? 0);
  const totals = summary.results[0] ?? {};
  return json({
    items: rows.results.map(adminContentItem),
    summary: {
      total: Number(totals.total ?? 0),
      published: Number(totals.published ?? 0),
      draft: Number(totals.draft ?? 0),
      private: Number(totals.private_count ?? 0),
      nsfw: Number(totals.nsfw ?? 0),
      deleted: Number(totals.deleted ?? 0),
      views: Number(totals.views ?? 0)
    },
    pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1), hasMore: offset + rows.results.length < total }
  }, 200, origin);
}

async function handleFeaturedContent(request, env, origin, accountId) {
  if (request.method === "GET") {
    const rows = await env.DB.prepare(
      `SELECT a.*, f.position AS featured_position, 0 AS views
       FROM featured_posts f JOIN anime a ON a.anime_id = f.anime_id
       WHERE a.content_status = 'published' AND a.visibility = 'public' AND a.deleted_at IS NULL
       ORDER BY f.position`
    ).all();
    return json({ items: rows.results.map(adminContentItem) }, 200, origin);
  }
  if (request.method !== "PUT") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const animeIds = parsed.data?.animeIds;
  if (!Array.isArray(animeIds) || animeIds.length > 10 || new Set(animeIds).size !== animeIds.length || animeIds.some((id) => !isValidAnimeId(id))) {
    return error("INVALID_FEATURED_POSTS", "Choose up to 10 unique posts", 400, origin);
  }
  if (animeIds.length) {
    const marks = animeIds.map((_, index) => `?${index + 1}`).join(",");
    const found = await env.DB.prepare(
      `SELECT COUNT(*) AS total FROM anime WHERE anime_id IN (${marks}) AND content_status = 'published' AND visibility = 'public' AND deleted_at IS NULL`
    ).bind(...animeIds).first();
    if (Number(found?.total) !== animeIds.length) return error("FEATURED_POST_UNAVAILABLE", "A selected post is not public and published", 409, origin);
  }
  await env.DB.batch([
    env.DB.prepare("DELETE FROM featured_posts"),
    ...animeIds.map((animeId, index) => env.DB.prepare(
      "INSERT INTO featured_posts (anime_id, position, updated_by) VALUES (?1, ?2, ?3)"
    ).bind(animeId, index + 1, accountId))
  ]);
  await Promise.all([
    incrementCatalogRevision(env),
    writeContentActivity(env, "featured_posts_updated", accountId, "featured", `${animeIds.length} featured posts selected`)
  ]);
  return json({ animeIds }, 200, origin);
}

async function writeContentActivity(env, eventType, accountId, animeId, summary) {
  await env.DB.prepare(
    `INSERT INTO activity_events (event_type, actor_id, entity_type, entity_id, summary)
     VALUES (?1, ?2, 'anime', ?3, ?4)`
  ).bind(eventType, accountId, animeId, summary).run();
}

async function updateAdminContent(request, env, origin, accountId, animeId) {
  if (!isValidAnimeId(animeId)) return error("INVALID_ANIME_ID", "Invalid anime identifier", 400, origin);
  const existing = await env.DB.prepare("SELECT * FROM anime WHERE anime_id = ?1 LIMIT 1").bind(animeId).first();
  if (!existing) return error("NOT_FOUND", "Content record not found", 404, origin);
  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const body = parsed.data ?? {};
  const urlSlug = body.urlSlug === undefined ? (existing.url_slug ?? existing.anime_id) : normalizePostUrlSlug(body.urlSlug);
  if (!isValidPostUrlSlug(urlSlug)) {
    return error("INVALID_URL_SLUG", "URL slug must use lowercase letters, numbers, and single hyphens", 400, origin);
  }
  const conflictingSlug = await env.DB.prepare(
    "SELECT 1 FROM anime WHERE (url_slug = ?1 OR anime_id = ?1) AND anime_id <> ?2 LIMIT 1"
  ).bind(urlSlug, animeId).first();
  if (conflictingSlug) return error("URL_SLUG_CONFLICT", "That post URL is already in use", 409, origin);

  const title = optionalText(body.title, existing.title, 200);
  const titleEnglish = optionalText(body.titleEnglish, existing.title_english, 200);
  const titleNative = optionalText(body.titleNative, existing.title_native, 200);
  const titlePreferred = optionalText(body.titleUserPreferred, existing.title_user_preferred, 200);
  const synopsis = optionalText(body.synopsis, existing.synopsis, 10000);
  const imageUrl = optionalText(body.imageUrl, existing.image_url, 2000);
  const bannerUrl = optionalText(body.bannerUrl, existing.banner_url, 2000);
  const type = optionalText(body.type, existing.type, 40);
  const season = optionalText(body.season, existing.season, 20);
  const studio = optionalText(body.studio, existing.studio, 200);
  if ([title, titleEnglish, titleNative, titlePreferred, synopsis, imageUrl, bannerUrl, type, season, studio].some((field) => field.error) || !title.value) {
    return error("INVALID_METADATA", "One or more text fields are invalid or too long", 400, origin);
  }
  if (!validHttpUrl(imageUrl.value) || !validHttpUrl(bannerUrl.value)) {
    return error("INVALID_URL", "Image and banner URLs must use http or https", 400, origin);
  }

  const contentStatus = body.contentStatus ?? existing.content_status;
  const visibility = body.visibility ?? existing.visibility;
  const isNsfw = body.isNsfw === undefined ? Boolean(existing.is_nsfw) : body.isNsfw;
  if (!["published", "draft"].includes(contentStatus) || !["public", "private"].includes(visibility) || typeof isNsfw !== "boolean") {
    return error("INVALID_EDITORIAL_STATE", "Invalid publication, visibility, or NSFW value", 400, origin);
  }

  const numberField = (value, fallback, minimum, maximum) => {
    if (value === undefined || value === null || value === "") return value === null || value === "" ? null : fallback;
    return Number.isInteger(value) && value >= minimum && value <= maximum ? value : Number.NaN;
  };
  const episodes = numberField(body.episodes, existing.episodes, 0, 100000);
  const year = numberField(body.year, existing.year, 1900, 2200);
  if (Number.isNaN(episodes) || Number.isNaN(year)) return error("INVALID_NUMBER", "Episodes or year is invalid", 400, origin);

  let genres = existing.genres;
  if (body.genres !== undefined) {
    if (!Array.isArray(body.genres) || body.genres.length > 30 || body.genres.some((genre) => typeof genre !== "string" || !genre.trim() || genre.trim().length > 50)) {
      return error("INVALID_GENRES", "Genres must be a list of up to 30 short names", 400, origin);
    }
    genres = JSON.stringify([...new Set(body.genres.map((genre) => genre.trim()))]);
  }
  const restoring = body.action === "restore";
  if (restoring && !existing.deleted_at) return error("NOT_DELETED", "Only deleted content can be restored", 409, origin);
  const restoredStatus = restoring ? "draft" : contentStatus;
  await env.DB.prepare(
    `UPDATE anime SET url_slug = ?1, title = ?2, title_english = ?3, title_native = ?4, title_user_preferred = ?5,
       synopsis = ?6, image_url = ?7, banner_url = ?8, type = ?9, episodes = ?10, year = ?11,
       season = ?12, genres = ?13, studio = ?14, content_status = ?15, visibility = ?16,
       is_nsfw = ?17, published_at = CASE WHEN ?15 = 'published' THEN COALESCE(published_at, datetime('now')) ELSE published_at END,
       deleted_at = CASE WHEN ?18 = 1 THEN NULL ELSE deleted_at END,
       deleted_by = CASE WHEN ?18 = 1 THEN NULL ELSE deleted_by END,
       edited_at = datetime('now'), edited_by = ?19, updated_at = datetime('now') WHERE anime_id = ?20`
  ).bind(urlSlug, title.value, titleEnglish.value, titleNative.value, titlePreferred.value, synopsis.value, imageUrl.value, bannerUrl.value, type.value, episodes, year, season.value, genres, studio.value, restoredStatus, visibility, isNsfw ? 1 : 0, restoring ? 1 : 0, accountId, animeId).run();
  await Promise.all([
    incrementCatalogRevision(env),
    writeContentActivity(env, restoring ? "content_restored" : "content_updated", accountId, animeId, restoring ? `Content restored: ${title.value}` : `Content updated: ${title.value}`)
  ]);
  const updated = await env.DB.prepare(
    `SELECT a.*, COALESCE((SELECT SUM(view_count) FROM anime_view_history WHERE anime_id = a.anime_id), 0) AS views
     FROM anime a WHERE anime_id = ?1`
  ).bind(animeId).first();
  return json({ item: adminContentItem(updated) }, 200, origin);
}

async function deleteAdminContent(env, origin, accountId, animeId) {
  const existing = await env.DB.prepare("SELECT title, deleted_at FROM anime WHERE anime_id = ?1 LIMIT 1").bind(animeId).first();
  if (!existing) return error("NOT_FOUND", "Content record not found", 404, origin);
  if (existing.deleted_at) return new Response(null, { status: 204, headers: responseHeaders(origin) });
  await env.DB.prepare(
    `UPDATE anime SET deleted_at = datetime('now'), deleted_by = ?1, edited_at = datetime('now'),
     edited_by = ?1, updated_at = datetime('now') WHERE anime_id = ?2 AND deleted_at IS NULL`
  ).bind(accountId, animeId).run();
  await Promise.all([
    incrementCatalogRevision(env),
    writeContentActivity(env, "content_deleted", accountId, animeId, `Content moved to recycle bin: ${existing.title}`)
  ]);
  return new Response(null, { status: 204, headers: responseHeaders(origin) });
}

function permanentDeleteStatements(env, animeIds) {
  if (!animeIds.length) return [];
  const placeholders = animeIds.map((_, index) => `?${index + 1}`).join(", ");
  return [
    env.DB.prepare(`DELETE FROM anime_reactions WHERE anime_id IN (${placeholders})`).bind(...animeIds),
    env.DB.prepare(`DELETE FROM anime_view_history WHERE anime_id IN (${placeholders})`).bind(...animeIds),
    env.DB.prepare(`DELETE FROM episodes WHERE anime_id IN (${placeholders})`).bind(...animeIds),
    env.DB.prepare(`DELETE FROM anime WHERE anime_id IN (${placeholders}) AND deleted_at IS NOT NULL`).bind(...animeIds)
  ];
}

async function permanentlyDeleteContent(env, origin, accountId, animeId) {
  if (!isValidAnimeId(animeId)) return error("INVALID_ANIME_ID", "Invalid anime identifier", 400, origin);
  const existing = await env.DB.prepare("SELECT title, deleted_at FROM anime WHERE anime_id = ?1 LIMIT 1").bind(animeId).first();
  if (!existing) return error("NOT_FOUND", "Content record not found", 404, origin);
  if (!existing.deleted_at) return error("NOT_DELETED", "Move content to the recycle bin before deleting it permanently", 409, origin);
  await env.DB.batch(permanentDeleteStatements(env, [animeId]));
  await Promise.all([
    incrementCatalogRevision(env),
    writeContentActivity(env, "content_permanently_deleted", accountId, animeId, `Content permanently deleted: ${existing.title}`)
  ]);
  return new Response(null, { status: 204, headers: responseHeaders(origin) });
}

async function permanentlyDeleteWhere(env, predicate) {
  const count = await env.DB.prepare(`SELECT COUNT(*) AS total FROM anime WHERE ${predicate}`).first();
  const total = Number(count?.total ?? 0);
  if (!total) return 0;
  await env.DB.batch([
    env.DB.prepare(`DELETE FROM anime_reactions WHERE anime_id IN (SELECT anime_id FROM anime WHERE ${predicate})`),
    env.DB.prepare(`DELETE FROM anime_view_history WHERE anime_id IN (SELECT anime_id FROM anime WHERE ${predicate})`),
    env.DB.prepare(`DELETE FROM episodes WHERE anime_id IN (SELECT anime_id FROM anime WHERE ${predicate})`),
    env.DB.prepare(`DELETE FROM anime WHERE ${predicate}`)
  ]);
  return total;
}

async function permanentlyDeleteAllContent(env, origin, accountId) {
  const deleted = await permanentlyDeleteWhere(env, "deleted_at IS NOT NULL");
  if (deleted) {
    await Promise.all([
      incrementCatalogRevision(env),
      writeContentActivity(env, "content_recycle_bin_emptied", accountId, "deleted", `${deleted} deleted content records permanently removed`)
    ]);
  }
  return json({ deleted }, 200, origin);
}

async function purgeExpiredContent(env) {
  const deleted = await permanentlyDeleteWhere(env, "deleted_at <= datetime('now', '-30 days')");
  if (!deleted) return 0;
  await Promise.all([
    incrementCatalogRevision(env),
    writeContentActivity(env, "content_retention_purge", "system", "deleted", `${deleted} expired content records permanently removed`)
  ]);
  return deleted;
}

async function handleAdminContent(request, env, origin, accountId, path) {
  if (path === "/v1/admin/content/featured") return handleFeaturedContent(request, env, origin, accountId);
  if (path === "/v1/admin/content") return handleAdminContentList(request, env, origin);
  if (path === "/v1/admin/content/deleted") {
    return request.method === "DELETE" ? permanentlyDeleteAllContent(env, origin, accountId) : error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  }
  const permanentMatch = path.match(/^\/v1\/admin\/content\/(.+)\/permanent$/);
  if (permanentMatch) {
    const animeId = decodeURIComponent(permanentMatch[1]);
    return request.method === "DELETE" ? permanentlyDeleteContent(env, origin, accountId, animeId) : error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  }
  const match = path.match(/^\/v1\/admin\/content\/(.+)$/);
  if (!match) return error("NOT_FOUND", "Route not found", 404, origin);
  const animeId = decodeURIComponent(match[1]);
  if (request.method === "PATCH") return updateAdminContent(request, env, origin, accountId, animeId);
  if (request.method === "DELETE") return deleteAdminContent(env, origin, accountId, animeId);
  return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
}

async function handleAdminDomainLock(request, env, origin, accountId) {
  if (request.method === "GET") {
    const [setting, domains] = await env.DB.batch([
      env.DB.prepare("SELECT enabled, updated_at FROM domain_lock_settings WHERE id = 1"),
      env.DB.prepare("SELECT origin, created_at FROM allowed_domains ORDER BY origin ASC")
    ]);
    return json({
      enabled: Boolean(setting.results[0]?.enabled),
      updatedAt: setting.results[0]?.updated_at ?? null,
      domains: domains.results.map((row) => ({ origin: row.origin, createdAt: row.created_at }))
    }, 200, origin);
  }
  if (request.method !== "PATCH") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const parsed = await parseJsonBody(request, origin);
  if (parsed.response) return parsed.response;
  const enabled = parsed.data?.enabled !== false;
  if (!Array.isArray(parsed.data?.domains) || parsed.data.domains.length > 20) {
    return error("INVALID_DOMAINS", "Provide no more than 20 allowed domains", 400, origin);
  }
  const domains = [...new Set(parsed.data.domains.map(normalizeOrigin))];
  if (domains.includes(null) || (enabled && domains.length === 0)) {
    return error("INVALID_DOMAINS", "Each domain must be a valid HTTP or HTTPS origin", 400, origin);
  }
  const statements = [
    env.DB.prepare("DELETE FROM allowed_domains"),
    ...domains.map((domain) => env.DB.prepare("INSERT INTO allowed_domains (origin) VALUES (?1)").bind(domain)),
    env.DB.prepare("UPDATE domain_lock_settings SET enabled = ?1, updated_at = datetime('now') WHERE id = 1").bind(enabled ? 1 : 0),
    env.DB.prepare(
      `INSERT INTO activity_events (event_type, actor_id, entity_type, entity_id, summary)
       VALUES ('domain_lock_updated', ?1, 'domain_lock', '1', ?2)`
    ).bind(accountId, `Domain lock ${enabled ? "enabled" : "disabled"} with ${domains.length} allowed origins`)
  ];
  await env.DB.batch(statements);
  return json({ enabled, domains: domains.map((domain) => ({ origin: domain })) }, 200, origin);
}

function analyticsConfig(value) {
  if (value === "24h") return { id: "24h", count: 24, hourly: true };
  if (value === "7d") return { id: "7d", count: 7, hourly: false };
  return { id: "30d", count: 30, hourly: false };
}

function createAnalyticsPoints(config) {
  const end = new Date();
  if (config.hourly) end.setUTCMinutes(0, 0, 0);
  else end.setUTCHours(0, 0, 0, 0);
  return Array.from({ length: config.count }, (_, index) => {
    const value = new Date(end);
    const distance = config.count - index - 1;
    if (config.hourly) value.setUTCHours(value.getUTCHours() - distance);
    else value.setUTCDate(value.getUTCDate() - distance);
    return {
      bucket: config.hourly ? value.toISOString().slice(0, 13) : value.toISOString().slice(0, 10),
      timestamp: value.toISOString(), requests: 0, errors: 0, responseBytes: 0,
      posts: 0, newViewers: 0, activeViewers: 0, reactions: 0
    };
  });
}

async function handleAdminAnalytics(request, env, origin) {
  if (request.method !== "GET") return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  const config = analyticsConfig(new URL(request.url).searchParams.get("range"));
  const series = createAnalyticsPoints(config);
  const start = new Date(series[0].timestamp);
  const isoStart = config.hourly ? `${start.toISOString().slice(0, 13)}:00:00Z` : `${start.toISOString().slice(0, 10)}T00:00:00Z`;
  const d1Start = start.toISOString().slice(0, 19).replace("T", " ");
  const isoBucket = config.hourly ? "substr(bucket_at, 1, 13)" : "substr(bucket_at, 1, 10)";
  const d1Bucket = (column) => config.hourly ? `strftime('%Y-%m-%dT%H', ${column})` : `date(${column})`;
  const [requests, usage, posts, newViewers, activeViewers, reactions, routes, totals, topPosts, formats] = await env.DB.batch([
    env.DB.prepare(
      `SELECT ${isoBucket} AS bucket, SUM(request_count) AS requests, SUM(error_count) AS errors,
              SUM(total_duration_ms) AS duration_ms, MAX(max_duration_ms) AS max_duration_ms
       FROM request_metrics_hourly WHERE bucket_at >= ?1 GROUP BY bucket ORDER BY bucket`
    ).bind(isoStart),
    env.DB.prepare(
      `SELECT ${isoBucket} AS bucket, SUM(response_bytes) AS response_bytes
       FROM api_key_usage_minute WHERE bucket_at >= ?1 GROUP BY bucket ORDER BY bucket`
    ).bind(isoStart),
    env.DB.prepare(`SELECT ${d1Bucket("created_at")} AS bucket, COUNT(*) AS value FROM anime WHERE created_at >= ?1 GROUP BY bucket`).bind(d1Start),
    env.DB.prepare(`SELECT ${d1Bucket("first_viewed_at")} AS bucket, COUNT(*) AS value FROM anime_view_history WHERE first_viewed_at >= ?1 GROUP BY bucket`).bind(d1Start),
    env.DB.prepare(`SELECT ${d1Bucket("last_viewed_at")} AS bucket, COUNT(*) AS value FROM anime_view_history WHERE last_viewed_at >= ?1 GROUP BY bucket`).bind(d1Start),
    env.DB.prepare(`SELECT ${d1Bucket("created_at")} AS bucket, COUNT(*) AS value FROM anime_reactions WHERE created_at >= ?1 GROUP BY bucket`).bind(d1Start),
    env.DB.prepare(
      `SELECT route, SUM(request_count) AS requests, SUM(error_count) AS errors, SUM(total_duration_ms) AS duration_ms
       FROM request_metrics_hourly WHERE bucket_at >= ?1 GROUP BY route ORDER BY requests DESC LIMIT 8`
    ).bind(isoStart),
    env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM anime WHERE deleted_at IS NULL) AS anime,
         (SELECT COUNT(*) FROM anime WHERE content_status = 'published' AND deleted_at IS NULL) AS published,
         (SELECT COUNT(*) FROM anime WHERE content_status = 'draft' AND deleted_at IS NULL) AS drafts,
         (SELECT COUNT(*) FROM episodes) AS episodes,
         (SELECT COUNT(*) FROM accounts WHERE role = 'member' AND status = 'active') AS members,
         (SELECT COUNT(*) FROM api_keys WHERE status = 'active') + (SELECT COUNT(*) FROM system_api_key_policy WHERE status = 'active') AS active_api_keys,
         (SELECT COALESCE(SUM(view_count), 0) FROM anime_view_history) AS lifetime_views,
         (SELECT COUNT(*) FROM anime_reactions) AS lifetime_reactions`
    ),
    env.DB.prepare(
      `SELECT a.anime_id, a.url_slug, a.title, COALESCE(v.views, 0) AS views, COALESCE(r.reactions, 0) AS reactions
       FROM anime a
       LEFT JOIN (SELECT anime_id, SUM(view_count) AS views FROM anime_view_history GROUP BY anime_id) v ON v.anime_id = a.anime_id
       LEFT JOIN (SELECT anime_id, COUNT(*) AS reactions FROM anime_reactions GROUP BY anime_id) r ON r.anime_id = a.anime_id
       WHERE a.deleted_at IS NULL ORDER BY views DESC, reactions DESC, a.title LIMIT 6`
    ),
    env.DB.prepare(
      `SELECT COALESCE(NULLIF(upper(type), ''), 'UNKNOWN') AS name, COUNT(*) AS value
       FROM anime WHERE deleted_at IS NULL GROUP BY name ORDER BY value DESC LIMIT 8`
    )
  ]);
  const points = new Map(series.map((point) => [point.bucket, point]));
  for (const row of requests.results) {
    const point = points.get(row.bucket);
    if (point) { point.requests = Number(row.requests ?? 0); point.errors = Number(row.errors ?? 0); }
  }
  for (const row of usage.results) {
    const point = points.get(row.bucket);
    if (point) point.responseBytes = Number(row.response_bytes ?? 0);
  }
  for (const [result, field] of [[posts, "posts"], [newViewers, "newViewers"], [activeViewers, "activeViewers"], [reactions, "reactions"]]) {
    for (const row of result.results) {
      const point = points.get(row.bucket);
      if (point) point[field] = Number(row.value ?? 0);
    }
  }
  const requestSummary = requests.results.reduce((sum, row) => ({
    requests: sum.requests + Number(row.requests ?? 0), errors: sum.errors + Number(row.errors ?? 0),
    duration: sum.duration + Number(row.duration_ms ?? 0), max: Math.max(sum.max, Number(row.max_duration_ms ?? 0))
  }), { requests: 0, errors: 0, duration: 0, max: 0 });
  const period = series.reduce((sum, point) => ({
    responseBytes: sum.responseBytes + point.responseBytes, posts: sum.posts + point.posts,
    newViewers: sum.newViewers + point.newViewers, activeViewers: sum.activeViewers + point.activeViewers,
    reactions: sum.reactions + point.reactions
  }), { responseBytes: 0, posts: 0, newViewers: 0, activeViewers: 0, reactions: 0 });
  const total = totals.results[0] ?? {};
  return json({
    range: config.id, generatedAt: new Date().toISOString(),
    summary: {
      requests: requestSummary.requests, errors: requestSummary.errors,
      errorRate: requestSummary.requests ? Math.round(requestSummary.errors / requestSummary.requests * 10000) / 100 : 0,
      averageResponseMs: requestSummary.requests ? Math.round(requestSummary.duration / requestSummary.requests) : null,
      maxResponseMs: requestSummary.requests ? requestSummary.max : null,
      responseBytes: period.responseBytes, postsCreated: period.posts, newViewers: period.newViewers,
      activeViewers: period.activeViewers, reactions: period.reactions,
      anime: Number(total.anime ?? 0), published: Number(total.published ?? 0), drafts: Number(total.drafts ?? 0),
      episodes: Number(total.episodes ?? 0), members: Number(total.members ?? 0), activeApiKeys: Number(total.active_api_keys ?? 0),
      lifetimeViews: Number(total.lifetime_views ?? 0), lifetimeReactions: Number(total.lifetime_reactions ?? 0)
    },
    series,
    routes: routes.results.map((row) => ({
      route: row.route, requests: Number(row.requests ?? 0), errors: Number(row.errors ?? 0),
      averageResponseMs: Number(row.requests ?? 0) ? Math.round(Number(row.duration_ms ?? 0) / Number(row.requests)) : null
    })),
    topPosts: topPosts.results.map((row) => ({ animeId: row.anime_id, urlSlug: row.url_slug ?? row.anime_id, title: row.title, views: Number(row.views ?? 0), reactions: Number(row.reactions ?? 0) })),
    formats: formats.results.map((row) => ({ name: row.name, value: Number(row.value ?? 0) }))
  }, 200, origin);
}

async function routeAdminManagement(request, env, origin, path) {
  const accountId = request.headers.get("X-RioAnime-Admin-Id");
  if (path === "/v1/admin/profile") return handleAdminProfile(request, env, origin, accountId);
  if (path === "/v1/admin/members" || path.startsWith("/v1/admin/members/") || path === "/v1/admin/analytics" || path === "/v1/admin/domain-lock" || path === "/v1/admin/content" || path.startsWith("/v1/admin/content/") || path === "/v1/admin/content-notices" || path.startsWith("/v1/admin/content-notices/") || path === "/v1/admin/announcements" || path.startsWith("/v1/admin/announcements/")) {
    if (!(await getAdminAccount(env, accountId))) return error("UNAUTHORIZED", "Administrator session is no longer valid", 401, origin);
    if (path === "/v1/admin/members") return handleAdminMembers(request, env, origin);
    if (path.startsWith("/v1/admin/members/")) return handleAdminMemberDetail(request, env, origin, decodeURIComponent(path.slice("/v1/admin/members/".length)));
    if (path === "/v1/admin/analytics") return handleAdminAnalytics(request, env, origin);
    if (path === "/v1/admin/domain-lock") return handleAdminDomainLock(request, env, origin, accountId);
    if (path === "/v1/admin/content-notices" || path.startsWith("/v1/admin/content-notices/")) return handleAdminContentNotices(request, env, origin, accountId, path);
    if (path === "/v1/admin/announcements" || path.startsWith("/v1/admin/announcements/")) return handleAdminAnnouncements(request, env, origin, accountId, path);
    return handleAdminContent(request, env, origin, accountId, path);
  }
  return error("NOT_FOUND", "Route not found", 404, origin);
}

async function handleHome(request, env, ctx, origin) {
  const revision = await getCatalogRevision(env);
  return cachedJson(request, origin, ctx, 900, async () => {
    const [anime, movies] = await env.DB.batch([
      env.DB.prepare(
        `SELECT ${MEDIA_COLUMNS}, (SELECT position FROM featured_posts WHERE anime_id = anime.anime_id) AS featured_position FROM anime WHERE ${PUBLIC_ANIME_PREDICATE} ORDER BY CASE WHEN featured_position IS NULL THEN 1 ELSE 0 END, featured_position, popularity DESC, score DESC LIMIT 80`
      ),
      env.DB.prepare(
        `SELECT ${MEDIA_COLUMNS} FROM anime WHERE ${PUBLIC_ANIME_PREDICATE} AND upper(type) = 'MOVIE' ORDER BY popularity DESC, score DESC LIMIT 36`
      )
    ]);
    return { anime: uniqueMedia(anime.results), movies: uniqueMedia(movies.results) };
  }, revision);
}

async function handleBrowse(request, env, ctx, origin) {
  const revision = await getCatalogRevision(env);
  return cachedJson(request, origin, ctx, 900, async () => {
    const rows = await env.DB.prepare(
      `SELECT ${MEDIA_COLUMNS} FROM anime WHERE ${PUBLIC_ANIME_PREDICATE} ORDER BY title COLLATE NOCASE ASC`
    ).all();
    const media = uniqueMedia(rows.results);
    return { anime: media, movies: media.filter((item) => item.format === "MOVIE") };
  }, revision);
}

async function handleAlphabeticalCatalog(request, env, ctx, origin) {
  const revision = await getCatalogRevision(env);
  return cachedJson(request, origin, ctx, 900, async () => {
    const rows = await env.DB.prepare(
      `SELECT ${MEDIA_COLUMNS} FROM anime WHERE ${PUBLIC_ANIME_PREDICATE} AND trim(title) != '' ORDER BY title COLLATE NOCASE ASC`
    ).all();
    return { anime: rows.results.map(toMedia) };
  }, revision);
}

async function handleSearch(request, env, ctx, origin) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim();
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "20", 10) || 20, 1), 20);
  if (query.length < 1 || query.length > 100) {
    return error("INVALID_QUERY", "q must contain between 1 and 100 characters", 400, origin);
  }

  const revision = await getCatalogRevision(env);
  return cachedJson(request, origin, ctx, 300, async () => {
    const pattern = `%${query}%`;
    const rows = await env.DB.prepare(
      `SELECT ${MEDIA_COLUMNS} FROM anime
       WHERE (title LIKE ?1 COLLATE NOCASE OR title_english LIKE ?1 COLLATE NOCASE OR title_native LIKE ?1 COLLATE NOCASE)
         AND ${PUBLIC_ANIME_PREDICATE}
       ORDER BY CASE WHEN title = ?2 COLLATE NOCASE OR title_english = ?2 COLLATE NOCASE THEN 0 ELSE 1 END,
                 popularity DESC, score DESC
       LIMIT ?3`
    ).bind(pattern, query, limit).all();
    return { media: uniqueMedia(rows.results) };
  }, revision);
}

async function getAnimeRecord(env, slug) {
  return env.DB.prepare(
    `SELECT ${MEDIA_COLUMNS} FROM anime
     WHERE (url_slug = ?1 OR (url_slug IS NULL AND anime_id = ?1)) AND ${PUBLIC_ANIME_PREDICATE} LIMIT 1`
  ).bind(slug).first();
}

async function handleAnimeDetail(env, slug, origin) {
  if (!isValidPostUrlSlug(slug) && !isValidAnimeId(slug)) {
    return error("INVALID_ANIME_ID", "Invalid anime identifier", 400, origin);
  }
  const record = await getAnimeRecord(env, slug);
  if (!record) return error("NOT_FOUND", "Anime not found", 404, origin);
  return json({ anime: toMedia(record), library: { animeId: record.anime_id, source: record.source } }, 200, origin, "private, max-age=60");
}

async function handleEpisodes(request, env, slug, origin) {
  if (!isValidAnimeId(slug)) {
    return error("INVALID_ANIME_ID", "Invalid anime identifier", 400, origin);
  }
  const url = new URL(request.url);
  const episodeNumber = Number.parseInt(url.searchParams.get("episode") ?? "", 10);
  const numbersOnly = url.searchParams.get("numbersOnly") === "1";
  const offset = Math.max(Number.parseInt(url.searchParams.get("offset") ?? "0", 10) || 0, 0);
  const limit = Math.min(Math.max(Number.parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
  const record = await env.DB.prepare(
    `SELECT anime_id FROM anime WHERE anime_id = ?1 AND ${PUBLIC_ANIME_PREDICATE} LIMIT 1`
  ).bind(slug).first();
  if (!record) return error("NOT_FOUND", "Anime not found", 404, origin);

  if (Number.isInteger(episodeNumber) && episodeNumber > 0) {
    const episode = await env.DB.prepare(
      "SELECT episode_num, video_url FROM episodes WHERE anime_id = ?1 AND episode_num = ?2 LIMIT 1"
    ).bind(slug, episodeNumber).first();
    if (!episode) return error("EPISODE_NOT_FOUND", "Episode not found", 404, origin);
    return json({
      animeId: slug,
      item: { episodeNumber: episode.episode_num, videoUrl: episode.video_url }
    }, 200, origin);
  }

  if (numbersOnly) {
    const episodes = await env.DB.prepare(
      "SELECT episode_num FROM episodes WHERE anime_id = ?1 ORDER BY episode_num ASC"
    ).bind(slug).all();
    return json({
      animeId: slug,
      episodeNumbers: episodes.results.map((episode) => episode.episode_num)
    }, 200, origin, "private, max-age=300");
  }

  const [episodes, count] = await env.DB.batch([
    env.DB.prepare(
      "SELECT episode_num, video_url FROM episodes WHERE anime_id = ?1 ORDER BY episode_num ASC LIMIT ?2 OFFSET ?3"
    ).bind(slug, limit, offset),
    env.DB.prepare("SELECT COUNT(*) AS total FROM episodes WHERE anime_id = ?1").bind(slug)
  ]);
  const total = count.results[0]?.total ?? 0;
  return json({
    animeId: slug,
    items: episodes.results,
    pageInfo: { offset, limit, total, hasMore: offset + episodes.results.length < total }
  }, 200, origin);
}

function decodeIdentityHeader(request, name) {
  const value = request.headers.get(name);
  if (!value) return "";
  try {
    return decodeURIComponent(value).trim();
  } catch {
    return "";
  }
}

function normalizeSourceId(value) {
  return Number.isSafeInteger(value) && value > 0 && value <= 2147483647 ? value : null;
}

function normalizeEpisodeNumber(value) {
  return Number.isSafeInteger(value) && value > 0 && value <= 100000 ? value : null;
}

function parseWatchedEpisodes(value) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed)
      ? [...new Set(parsed.map(normalizeEpisodeNumber).filter(Boolean))].sort((left, right) => left - right)
      : [];
  } catch {
    return [];
  }
}

async function getOrCreateGoogleAccount(request, env, origin) {
  const email = decodeIdentityHeader(request, "X-RioAnime-User-Email").toLowerCase();
  const displayName = decodeIdentityHeader(request, "X-RioAnime-User-Name");
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { response: error("INVALID_USER", "A valid signed-in user is required", 400, origin) };
  }

  const usernameBase = (displayName || email.split("@")[0])
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
    .toLowerCase() || "member";
  const username = `${usernameBase}_${(await hashKey(email)).slice(0, 8)}`;

  await env.DB.prepare(
    `INSERT INTO accounts
       (id, email, username, password_hash, role, status, email_verified_at, last_login_at)
     VALUES (?1, ?2, ?3, 'oauth:google', 'member', 'active', datetime('now'), datetime('now'))
     ON CONFLICT(email) DO UPDATE SET
       last_login_at = datetime('now'), updated_at = datetime('now')`
  ).bind(createId(), email, username).run();

  const account = await env.DB.prepare(
    "SELECT id, email, username, role, status FROM accounts WHERE email = ?1 COLLATE NOCASE LIMIT 1"
  ).bind(email).first();
  if (!account || account.status !== "active") {
    return { response: error("ACCOUNT_UNAVAILABLE", "This account is not active", 403, origin) };
  }

  return { account };
}

async function readUserLibrary(env, accountId) {
  const [bookmarks, progress] = await env.DB.batch([
    env.DB.prepare(
      `SELECT a.source_id AS anime_id
       FROM account_bookmarks b
       JOIN anime a ON a.anime_id = b.anime_id
       WHERE b.account_id = ?1 AND a.source_id IS NOT NULL
       ORDER BY b.position ASC, b.created_at ASC`
    ).bind(accountId),
    env.DB.prepare(
      `SELECT a.source_id AS anime_id, p.last_episode_num, p.watched_episodes,
              p.view_count, p.last_viewed_at
       FROM account_episode_progress p
       JOIN anime a ON a.anime_id = p.anime_id
       WHERE p.account_id = ?1 AND a.source_id IS NOT NULL
       ORDER BY p.last_viewed_at DESC`
    ).bind(accountId)
  ]);

  const recentWatchIds = progress.results.map((row) => Number(row.anime_id)).filter(Boolean);

  return {
    accountId,
    bookmarks: bookmarks.results.map((row) => Number(row.anime_id)).filter(Boolean),
    recentWatchIds,
    progress: progress.results.map((row) => ({
      animeId: Number(row.anime_id),
      lastEpisode: Number(row.last_episode_num),
      watchedEpisodes: parseWatchedEpisodes(row.watched_episodes),
      viewCount: Number(row.view_count),
      lastViewedAt: row.last_viewed_at
    }))
  };
}

export function normalizeLibraryPayload(payload) {
  const bookmarkValues = Array.isArray(payload?.bookmarks) ? payload.bookmarks : [];
  const progressValues = Array.isArray(payload?.progress) ? payload.progress : [];
  const bookmarks = [...new Set(bookmarkValues.map(normalizeSourceId).filter(Boolean))].slice(0, 500);
  const progress = [];
  const seenProgress = new Set();

  for (const value of progressValues.slice(0, 400)) {
    const animeId = normalizeSourceId(value?.animeId);
    const lastEpisode = normalizeEpisodeNumber(value?.lastEpisode);
    if (!animeId || !lastEpisode || seenProgress.has(animeId)) continue;
    seenProgress.add(animeId);
    const watchedEpisodes = [...new Set([
      ...(Array.isArray(value.watchedEpisodes) ? value.watchedEpisodes : []),
      lastEpisode
    ].map(normalizeEpisodeNumber).filter(Boolean))].sort((left, right) => left - right).slice(0, 10000);
    progress.push({ animeId, lastEpisode, watchedEpisodes });
  }

  return { bookmarks, progress };
}

async function writeUserLibrary(request, env, accountId) {
  const payload = normalizeLibraryPayload(await request.json());
  const sourceIds = [...new Set([
    ...payload.bookmarks,
    ...payload.progress.map((entry) => entry.animeId)
  ])];
  const animeBySourceId = new Map();

  for (let offset = 0; offset < sourceIds.length; offset += 80) {
    const sourceIdChunk = sourceIds.slice(offset, offset + 80);
    const placeholders = sourceIdChunk.map((_, index) => `?${index + 1}`).join(", ");
    const rows = await env.DB.prepare(
      `SELECT anime_id, source_id FROM anime WHERE source_id IN (${placeholders})`
    ).bind(...sourceIdChunk).all();
    for (const row of rows.results) animeBySourceId.set(Number(row.source_id), row.anime_id);
  }

  const existingProgress = await env.DB.prepare(
    "SELECT anime_id, last_episode_num, watched_episodes, view_count FROM account_episode_progress WHERE account_id = ?1"
  ).bind(accountId).all();
  const progressByAnimeId = new Map(existingProgress.results.map((row) => [row.anime_id, row]));
  const viewerKeyHash = await hashKey(`account:${accountId}`);
  const statements = [
    env.DB.prepare("DELETE FROM account_bookmarks WHERE account_id = ?1").bind(accountId)
  ];

  const resolvedBookmarks = payload.bookmarks
    .map((sourceId, position) => ({ animeId: animeBySourceId.get(sourceId), position }))
    .filter((entry) => entry.animeId);
  for (let offset = 0; offset < resolvedBookmarks.length; offset += 30) {
    const chunk = resolvedBookmarks.slice(offset, offset + 30);
    const values = [];
    const placeholders = chunk.map((entry, index) => {
      const parameter = index * 3;
      values.push(accountId, entry.animeId, entry.position);
      return `(?${parameter + 1}, ?${parameter + 2}, ?${parameter + 3})`;
    }).join(", ");
    statements.push(env.DB.prepare(
      `INSERT INTO account_bookmarks (account_id, anime_id, position) VALUES ${placeholders}`
    ).bind(...values));
  }

  for (const entry of payload.progress) {
    const animeId = animeBySourceId.get(entry.animeId);
    if (!animeId) continue;
    const existing = progressByAnimeId.get(animeId);
    const previousWatched = new Set(parseWatchedEpisodes(existing?.watched_episodes));
    const changed = !existing
      || Number(existing.last_episode_num) !== entry.lastEpisode
      || entry.watchedEpisodes.some((episode) => !previousWatched.has(episode));
    const viewCount = existing ? Number(existing.view_count) + (changed ? 1 : 0) : 1;
    const watchedJson = JSON.stringify(entry.watchedEpisodes);

    statements.push(env.DB.prepare(
      `INSERT INTO account_episode_progress
         (account_id, anime_id, last_episode_num, watched_episodes, view_count)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(account_id, anime_id) DO UPDATE SET
         last_episode_num = excluded.last_episode_num,
         watched_episodes = excluded.watched_episodes,
         view_count = excluded.view_count,
         last_viewed_at = CASE WHEN ?6 = 1 THEN datetime('now') ELSE account_episode_progress.last_viewed_at END`
    ).bind(accountId, animeId, entry.lastEpisode, watchedJson, viewCount, changed ? 1 : 0));
    statements.push(env.DB.prepare(
      `INSERT INTO anime_view_history
         (anime_id, account_id, viewer_key_hash, identity_type, view_count, last_episode_num)
       VALUES (?1, ?2, ?3, 'account', ?4, ?5)
       ON CONFLICT(anime_id, viewer_key_hash) DO UPDATE SET
         account_id = excluded.account_id,
         identity_type = 'account',
         view_count = MAX(anime_view_history.view_count, excluded.view_count),
         last_episode_num = excluded.last_episode_num,
         last_viewed_at = CASE WHEN ?6 = 1 THEN datetime('now') ELSE anime_view_history.last_viewed_at END`
    ).bind(animeId, accountId, viewerKeyHash, viewCount, entry.lastEpisode, changed ? 1 : 0));
  }

  await env.DB.batch(statements);
  return readUserLibrary(env, accountId);
}

async function handleUserSync(request, env, origin) {
  if (request.method !== "POST") {
    return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  }

  const identity = await getOrCreateGoogleAccount(request, env, origin);
  if (identity.response) return identity.response;
  return json({ account: identity.account }, 200, origin);
}

async function handleUserLibrary(request, env, origin) {
  const identity = await getOrCreateGoogleAccount(request, env, origin);
  if (identity.response) return identity.response;
  if (request.method === "GET") {
    return json(await readUserLibrary(env, identity.account.id), 200, origin);
  }
  if (request.method !== "PUT") {
    return error("METHOD_NOT_ALLOWED", "Method not allowed", 405, origin);
  }

  try {
    return json(await writeUserLibrary(request, env, identity.account.id), 200, origin);
  } catch (cause) {
    if (cause instanceof SyntaxError) return error("INVALID_JSON", "The library payload is invalid", 400, origin);
    throw cause;
  }
}

async function routeRequest(request, env, ctx, origin) {
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  if (path === "/v1/auth/admin-login" && request.method === "POST") {
    return handleAdminLogin(request, env, origin);
  }
  if (path === "/v1/auth/admin-identity" && request.method === "POST") {
    return handleAdminIdentity(request, env, origin);
  }
  if (request.method !== "GET") {
    return error("METHOD_NOT_ALLOWED", "Only GET requests are supported", 405, origin);
  }
  if (path === "/v1/health") {
    await env.DB.prepare("SELECT 1").first();
    return json({ status: "ok" }, 200, origin);
  }
  if (path === "/v1/dashboard") return handleDashboard(env, origin);
  if (path === "/v1/cache-manifest") return handleCacheManifest(env, origin);
  if (path === "/v1/home") return handleHome(request, env, ctx, origin);
  if (path === "/v1/browse") return handleBrowse(request, env, ctx, origin);
  if (path === "/v1/anime/a-z") return handleAlphabeticalCatalog(request, env, ctx, origin);
  if (path === "/v1/search") return handleSearch(request, env, ctx, origin);
  if (path === "/v1/announcements") return handlePublicAnnouncements(request, env, origin, ctx);

  const episodeMatch = path.match(/^\/v1\/anime\/([^/]+)\/episodes$/);
  if (episodeMatch) return handleEpisodes(request, env, decodeURIComponent(episodeMatch[1]), origin);
  const detailMatch = path.match(/^\/v1\/anime\/([^/]+)$/);
  if (detailMatch) return handleAnimeDetail(env, decodeURIComponent(detailMatch[1]), origin);
  return error("NOT_FOUND", "Route not found", 404, origin);
}

const worker = {
  async scheduled(_controller, env, ctx) {
    ctx.waitUntil(purgeExpiredContent(env));
  },

  async fetch(request, env, ctx) {
    const origin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      if (!normalizeOrigin(origin)) return new Response(null, { status: 404 });
      const headers = responseHeaders(origin);
      headers.set("Access-Control-Allow-Headers", "Content-Type, X-RioAnime-Key");
      headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
      headers.set("Access-Control-Max-Age", "86400");
      return new Response(null, { status: 204, headers });
    }

    const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
    const providedKey = request.headers.get("X-RioAnime-Key");
    if (path === "/v1/user/sync" || path === "/v1/user/library") {
      if (!(await keysMatch(providedKey, env.API_KEY))) return new Response(null, { status: 404 });
      if (!(await isAllowedOrigin(env, "site-deployment-key", origin))) return new Response(null, { status: 404 });
      try {
        return path === "/v1/user/sync"
          ? await handleUserSync(request, env, origin)
          : await handleUserLibrary(request, env, origin);
      } catch (cause) {
        console.error("RioAnime user account request failed", cause);
        return error("INTERNAL_ERROR", "The account request could not be completed", 500, origin);
      }
    }
    if (path === "/v1/api-keys" || path.startsWith("/v1/api-keys/") || path.startsWith("/v1/admin/")) {
      if (!(await keysMatch(providedKey, env.API_KEY))) return new Response(null, { status: 404 });
      if (!(await isAllowedOrigin(env, "site-deployment-key", origin))) return new Response(null, { status: 404 });
      try {
        return path.startsWith("/v1/admin/")
          ? await routeAdminManagement(request, env, origin, path)
          : await routeApiKeyManagement(request, env, origin, path);
      } catch (cause) {
        console.error("RioAnime API key management failed", cause);
        return error("INTERNAL_ERROR", "The request could not be completed", 500, origin);
      }
    }

    const authenticatedKey = await authenticateApiKey(env, providedKey);
    if (!authenticatedKey) {
      return new Response(null, { status: 404 });
    }
    if (!(await isAllowedOrigin(env, authenticatedKey.id, origin))) return new Response(null, { status: 404 });

    const policyResponse = await enforceApiKeyPolicy(env, authenticatedKey, origin);
    if (policyResponse) return policyResponse;

    const startedAt = Date.now();
    if (authenticatedKey.metricsId) {
      ctx.waitUntil(
        env.DB.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?1")
          .bind(authenticatedKey.metricsId).run()
          .catch((cause) => console.error("RioAnime API key last-used update failed", cause))
      );
    }
    try {
      const response = await routeRequest(request, env, ctx, origin);
      const duration = Date.now() - startedAt;
      // Keep dashboard totals and API-key limits accurate, including cached responses.
      ctx.waitUntil(
        Promise.all([
          recordRequestMetric(env, path, response.status, duration),
          recordApiKeyMetric(env, authenticatedKey.metricsId, path, response.status, duration),
          recordApiKeyPolicyUsage(env, authenticatedKey.id, response)
        ]).catch((cause) => console.error("RioAnime API metric recording failed", cause))
      );
      return response;
    } catch (cause) {
      console.error("RioAnime API request failed", cause);
      ctx.waitUntil(
        Promise.all([
          recordRequestMetric(env, path, 500, Date.now() - startedAt),
          recordApiKeyMetric(env, authenticatedKey.metricsId, path, 500, Date.now() - startedAt)
        ]).catch((metricCause) => console.error("RioAnime API metric recording failed", metricCause))
      );
      return error("INTERNAL_ERROR", "The request could not be completed", 500, origin);
    }
  }
};

export default worker;

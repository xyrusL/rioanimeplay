import { spawnSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const DATABASE = "rioanime-db";
const ANILIST_URL = "https://graphql.anilist.co";
const MEDIA_QUERY = `
  query SyncRioAnime($ids: [Int]) {
    Page(page: 1, perPage: 50) {
      media(id_in: $ids, type: ANIME) {
        id
        title { romaji english native userPreferred }
        description(asHtml: false)
        bannerImage
        coverImage { extraLarge large medium color }
        averageScore
        meanScore
        episodes
        format
        season
        seasonYear
        genres
        popularity
        status
        studios(isMain: true) { nodes { name } }
        nextAiringEpisode { episode }
      }
    }
  }
`;

function runWrangler(args) {
  const wrangler = resolve("node_modules/wrangler/bin/wrangler.js");
  const result = spawnSync(process.execPath, [wrangler, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false
  });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}

function sql(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return Number.isFinite(value) ? `${value}` : "NULL";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function preserve(column, value, empty = false) {
  const condition = empty
    ? `${column} IS NULL OR trim(${column}) = ''`
    : `${column} IS NULL`;
  return `${column} = CASE WHEN ${condition} THEN ${sql(value)} ELSE ${column} END`;
}

function toUpdate(media) {
  const cover = media.coverImage?.extraLarge ?? media.coverImage?.large ?? media.coverImage?.medium;
  const updates = [
    preserve("title", media.title.romaji ?? media.title.userPreferred, true),
    preserve("title_english", media.title.english),
    preserve("title_native", media.title.native),
    preserve("title_user_preferred", media.title.userPreferred),
    preserve("image_url", cover, true),
    preserve("banner_url", media.bannerImage),
    preserve("color", media.coverImage?.color),
    `score = CASE WHEN score IS NULL OR score = 0 THEN ${sql(media.averageScore)} ELSE score END`,
    preserve("mean_score", media.meanScore),
    preserve("genres", JSON.stringify(media.genres ?? []), true),
    preserve("episodes", media.episodes),
    preserve("status", media.status, true),
    preserve("type", media.format, true),
    preserve("synopsis", media.description, true),
    preserve("year", media.seasonYear),
    preserve("season", media.season),
    `popularity = CASE WHEN popularity IS NULL OR popularity = 0 THEN ${sql(media.popularity ?? 0)} ELSE popularity END`,
    preserve("studio", media.studios?.nodes?.[0]?.name),
    preserve("next_episode", media.nextAiringEpisode?.episode),
    "updated_at = datetime('now')"
  ];
  return `UPDATE anime SET ${updates.join(", ")} WHERE source = 'anilist' AND source_id = ${sql(media.id)};`;
}

function titleFromSlug(slug) {
  return slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function toTvMazeUpdate(record, show) {
  const updates = [
    preserve("title", titleFromSlug(record.anime_id), true),
    preserve("title_english", show.name),
    preserve("title_user_preferred", show.name),
    preserve("image_url", show.image?.original ?? show.image?.medium, true),
    `score = CASE WHEN score IS NULL OR score = 0 THEN ${sql(show.rating?.average ? show.rating.average * 10 : null)} ELSE score END`,
    preserve("genres", JSON.stringify(show.genres ?? []), true),
    preserve("episodes", show._embedded?.episodes?.length),
    preserve("status", show.status?.toUpperCase(), true),
    preserve("type", "TV", true),
    preserve("synopsis", show.summary, true),
    preserve("year", show.premiered ? Number.parseInt(show.premiered.slice(0, 4), 10) : null),
    "updated_at = datetime('now')"
  ];
  return `UPDATE anime SET ${updates.join(", ")} WHERE anime_id = ${sql(record.anime_id)};`;
}

const raw = runWrangler([
  "d1", "execute", DATABASE, "--remote", "--json", "--command",
  "SELECT DISTINCT source_id FROM anime WHERE source = 'anilist' AND source_id IS NOT NULL ORDER BY source_id"
]);
const ids = JSON.parse(raw)[0].results.map((row) => row.source_id);
const media = [];

for (let index = 0; index < ids.length; index += 50) {
  const response = await fetch(ANILIST_URL, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ query: MEDIA_QUERY, variables: { ids: ids.slice(index, index + 50) } })
  });
  if (!response.ok) throw new Error(`AniList returned ${response.status}`);
  const payload = await response.json();
  if (payload.errors?.length || !payload.data) throw new Error(payload.errors?.[0]?.message ?? "AniList returned no data");
  media.push(...payload.data.Page.media);
}

const tvMazeRaw = runWrangler([
  "d1", "execute", DATABASE, "--remote", "--json", "--command",
  "SELECT anime_id, source_id FROM anime WHERE source = 'tvmaze' AND source_id IS NOT NULL ORDER BY anime_id"
]);
const tvMazeRecords = JSON.parse(tvMazeRaw)[0].results;
const tvMazeShows = new Map();

for (const record of tvMazeRecords) {
  if (tvMazeShows.has(record.source_id)) continue;
  const response = await fetch(`https://api.tvmaze.com/shows/${record.source_id}?embed=episodes`);
  if (!response.ok) throw new Error(`TVMaze returned ${response.status} for ${record.source_id}`);
  tvMazeShows.set(record.source_id, await response.json());
}

const syncFile = join(tmpdir(), `rioanime-sync-${Date.now()}.sql`);
try {
  const updates = [
    ...media.map(toUpdate),
    ...tvMazeRecords.map((record) => toTvMazeUpdate(record, tvMazeShows.get(record.source_id))),
    `INSERT INTO metadata (key, value, updated_at) VALUES ('catalog_revision', '1', datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT), updated_at = datetime('now');`
  ];
  writeFileSync(syncFile, updates.join("\n"), "utf8");
  runWrangler(["d1", "execute", DATABASE, "--remote", "--file", syncFile]);
} finally {
  rmSync(syncFile, { force: true });
}

console.log(`Synced ${media.length} AniList and ${tvMazeRecords.length} TVMaze records without replacing populated values.`);

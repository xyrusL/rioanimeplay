const BOOKMARKS_KEY = "rioanime:bookmarks";
const EPISODES_KEY = "rioanime:episodes";

function readJson<TValue>(key: string, fallback: TValue) {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const rawValue = window.localStorage.getItem(key);

    if (!rawValue) {
      return fallback;
    }

    return JSON.parse(rawValue) as TValue;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getBookmarkedAnimeIds() {
  return readJson<number[]>(BOOKMARKS_KEY, []);
}

export function isAnimeBookmarked(animeId: number) {
  return getBookmarkedAnimeIds().includes(animeId);
}

export function toggleAnimeBookmark(animeId: number) {
  const currentIds = getBookmarkedAnimeIds();
  const nextIds = currentIds.includes(animeId)
    ? currentIds.filter((id) => id !== animeId)
    : [...currentIds, animeId];

  writeJson(BOOKMARKS_KEY, nextIds);
  return nextIds;
}

export function getSavedEpisode(animeId: number) {
  const progressMap = readJson<Record<string, number>>(EPISODES_KEY, {});
  return progressMap[String(animeId)] ?? 1;
}

export function saveEpisodeProgress(animeId: number, episodeNumber: number) {
  const progressMap = readJson<Record<string, number>>(EPISODES_KEY, {});
  progressMap[String(animeId)] = episodeNumber;
  writeJson(EPISODES_KEY, progressMap);
}

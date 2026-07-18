export const BOOKMARKS_STORAGE_KEY = "rioanime:bookmarks";
export const EPISODES_STORAGE_KEY = "rioanime:episodes";
export const RECENT_WATCH_STORAGE_KEY = "rioanime:recent-watch";
export const LIBRARY_CHANGE_EVENT = "rioanime:library-change";

const LIBRARY_SYNC_KEY = "rioanime:library-sync";

type EpisodeProgressMap = Record<string, number | number[]>;

export type AnimeProgress = {
  lastEpisode: number;
  watchedEpisodes: number[];
};

export type UserLibrarySnapshot = {
  bookmarks: number[];
  progress: Record<string, AnimeProgress>;
  recentWatchIds: number[];
};

type LibrarySyncMetadata = {
  accountId: string | null;
  dirty: boolean;
};

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
    return false;
  }

  const nextValue = JSON.stringify(value);
  if (window.localStorage.getItem(key) === nextValue) {
    return false;
  }

  window.localStorage.setItem(key, nextValue);
  return true;
}

function notifyLibraryChanged() {
  window.dispatchEvent(new CustomEvent(LIBRARY_CHANGE_EVENT));
}

function markLibraryDirty() {
  const metadata = getLibrarySyncMetadata();
  writeJson(LIBRARY_SYNC_KEY, { ...metadata, dirty: true });
}

export function getLibrarySyncMetadata(): LibrarySyncMetadata {
  return readJson<LibrarySyncMetadata>(LIBRARY_SYNC_KEY, {
    accountId: null,
    dirty: false
  });
}

export function markLibrarySynced(accountId: string) {
  writeJson(LIBRARY_SYNC_KEY, { accountId, dirty: false });
}

export function getBookmarkedAnimeIds() {
  return readJson<number[]>(BOOKMARKS_STORAGE_KEY, []).filter(
    (animeId) => Number.isSafeInteger(animeId) && animeId > 0
  );
}

export function isAnimeBookmarked(animeId: number) {
  return getBookmarkedAnimeIds().includes(animeId);
}

export function toggleAnimeBookmark(animeId: number) {
  const currentIds = getBookmarkedAnimeIds();
  const nextIds = currentIds.includes(animeId)
    ? currentIds.filter((id) => id !== animeId)
    : [...currentIds, animeId];

  if (writeJson(BOOKMARKS_STORAGE_KEY, nextIds)) {
    markLibraryDirty();
    notifyLibraryChanged();
  }
  return nextIds;
}

function watchedEpisodesKey(animeId: number) {
  return `${animeId}:watched`;
}

export function getSavedEpisode(animeId: number) {
  const progressMap = readJson<EpisodeProgressMap>(EPISODES_STORAGE_KEY, {});
  const savedEpisode = progressMap[String(animeId)];
  return typeof savedEpisode === "number" ? savedEpisode : 1;
}

export function getWatchedEpisodes(animeId: number) {
  const progressMap = readJson<EpisodeProgressMap>(EPISODES_STORAGE_KEY, {});
  const watchedEpisodes = progressMap[watchedEpisodesKey(animeId)];
  return Array.isArray(watchedEpisodes) ? watchedEpisodes : [];
}

export function getRecentWatchAnimeIds() {
  return readJson<number[]>(RECENT_WATCH_STORAGE_KEY, []).filter(
    (animeId) => Number.isSafeInteger(animeId) && animeId > 0
  );
}

export function saveRecentWatch(animeId: number) {
  const recentIds = getRecentWatchAnimeIds();
  const nextIds = [animeId, ...recentIds.filter((id) => id !== animeId)].slice(0, 100);

  if (writeJson(RECENT_WATCH_STORAGE_KEY, nextIds)) {
    markLibraryDirty();
    notifyLibraryChanged();
  }
  return nextIds;
}

export function saveEpisodeProgress(animeId: number, episodeNumber: number) {
  const progressMap = readJson<EpisodeProgressMap>(EPISODES_STORAGE_KEY, {});
  const watchedKey = watchedEpisodesKey(animeId);
  const watchedEpisodes = progressMap[watchedKey];

  progressMap[String(animeId)] = episodeNumber;
  progressMap[watchedKey] = Array.isArray(watchedEpisodes)
    ? [...new Set([...watchedEpisodes, episodeNumber])]
    : [episodeNumber];
  if (writeJson(EPISODES_STORAGE_KEY, progressMap)) {
    markLibraryDirty();
    notifyLibraryChanged();
  }
}

export function getUserLibrarySnapshot(): UserLibrarySnapshot {
  const progressMap = readJson<EpisodeProgressMap>(EPISODES_STORAGE_KEY, {});
  const progress: Record<string, AnimeProgress> = {};

  for (const [key, value] of Object.entries(progressMap)) {
    if (key.endsWith(":watched") || typeof value !== "number") continue;
    const animeId = Number.parseInt(key, 10);
    if (!Number.isSafeInteger(animeId) || animeId <= 0 || value < 1) continue;

    const watched = progressMap[watchedEpisodesKey(animeId)];
    progress[key] = {
      lastEpisode: value,
      watchedEpisodes: Array.isArray(watched)
        ? [...new Set(watched.filter((episode) => Number.isSafeInteger(episode) && episode > 0))]
        : [value]
    };
  }

  return {
    bookmarks: getBookmarkedAnimeIds(),
    progress,
    recentWatchIds: getRecentWatchAnimeIds()
  };
}

export function replaceUserLibrarySnapshot(snapshot: UserLibrarySnapshot) {
  const progressMap: EpisodeProgressMap = {};

  for (const [animeId, progress] of Object.entries(snapshot.progress)) {
    const numericAnimeId = Number.parseInt(animeId, 10);
    if (!Number.isSafeInteger(numericAnimeId) || numericAnimeId <= 0) continue;
    progressMap[animeId] = progress.lastEpisode;
    progressMap[watchedEpisodesKey(numericAnimeId)] = progress.watchedEpisodes;
  }

  const bookmarksChanged = writeJson(BOOKMARKS_STORAGE_KEY, snapshot.bookmarks);
  const progressChanged = writeJson(EPISODES_STORAGE_KEY, progressMap);
  const recentWatchChanged = writeJson(RECENT_WATCH_STORAGE_KEY, snapshot.recentWatchIds);
  if (bookmarksChanged || progressChanged || recentWatchChanged) notifyLibraryChanged();
}

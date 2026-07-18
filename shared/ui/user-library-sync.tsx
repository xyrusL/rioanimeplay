"use client";

import { useEffect } from "react";

import {
  BOOKMARKS_STORAGE_KEY,
  EPISODES_STORAGE_KEY,
  getLibrarySyncMetadata,
  getUserLibrarySnapshot,
  LIBRARY_CHANGE_EVENT,
  markLibrarySynced,
  RECENT_WATCH_STORAGE_KEY,
  replaceUserLibrarySnapshot,
  type AnimeProgress,
  type UserLibrarySnapshot
} from "@/shared/lib/watch-storage";

type ServerProgress = AnimeProgress & {
  animeId: number;
  lastViewedAt: string;
  viewCount: number;
};

type LibraryResponse = {
  accountId: string;
  bookmarks: number[];
  progress: ServerProgress[];
};

function serverSnapshot(library: LibraryResponse): UserLibrarySnapshot {
  return {
    bookmarks: library.bookmarks,
    progress: Object.fromEntries(
      library.progress.map(({ animeId, lastEpisode, watchedEpisodes }) => [
        String(animeId),
        { lastEpisode, watchedEpisodes }
      ])
    ),
    recentWatchIds: library.progress.map(({ animeId }) => animeId)
  };
}

function mergeFirstSignIn(local: UserLibrarySnapshot, remote: UserLibrarySnapshot) {
  const progress = { ...local.progress };

  for (const [animeId, remoteProgress] of Object.entries(remote.progress)) {
    const localProgress = progress[animeId];
    progress[animeId] = localProgress
      ? {
          lastEpisode: remoteProgress.lastEpisode,
          watchedEpisodes: [...new Set([
            ...remoteProgress.watchedEpisodes,
            ...localProgress.watchedEpisodes
          ])].sort((left, right) => left - right)
        }
      : remoteProgress;
  }

  return {
    bookmarks: [...new Set([...remote.bookmarks, ...local.bookmarks])],
    progress,
    recentWatchIds: [...new Set([...remote.recentWatchIds, ...local.recentWatchIds])]
  };
}

function requestBody(snapshot: UserLibrarySnapshot) {
  return JSON.stringify({
    bookmarks: snapshot.bookmarks,
    recentWatchIds: snapshot.recentWatchIds,
    progress: Object.entries(snapshot.progress).map(([animeId, progress]) => ({
      animeId: Number(animeId),
      ...progress
    }))
  });
}

export function UserLibrarySync() {
  useEffect(() => {
    let stopped = false;
    let accountId: string | null = null;
    let ready = false;
    let saving = false;
    let pendingSave = false;
    let saveTimer: ReturnType<typeof setTimeout> | null = null;

    async function saveLibrary() {
      if (!accountId || saving || stopped) return;
      saving = true;

      try {
        while (pendingSave && !stopped) {
          pendingSave = false;
          const response = await fetch("/api/library", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: requestBody(getUserLibrarySnapshot()),
            keepalive: true
          });

          if (!response.ok) {
            pendingSave = true;
            break;
          }

          if (!pendingSave) markLibrarySynced(accountId);
        }
      } catch {
        pendingSave = true;
      } finally {
        saving = false;
      }
    }

    function scheduleSave(delay = 350) {
      if (!ready || !accountId) return;
      pendingSave = true;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => void saveLibrary(), delay);
    }

    async function hydrate() {
      try {
        const response = await fetch("/api/library", { cache: "no-store" });
        if (!response.ok || stopped) return;

        const library = (await response.json()) as LibraryResponse;
        const local = getUserLibrarySnapshot();
        const remote = serverSnapshot(library);
        const metadata = getLibrarySyncMetadata();
        accountId = library.accountId;

        if (metadata.accountId === accountId && metadata.dirty) {
          ready = true;
          scheduleSave(0);
          return;
        }

        if (metadata.accountId === accountId) {
          replaceUserLibrarySnapshot(remote);
          markLibrarySynced(accountId);
          ready = true;
          return;
        }

        replaceUserLibrarySnapshot(mergeFirstSignIn(local, remote));
        ready = true;
        scheduleSave(0);
      } catch {
        // Local storage remains usable while the account service is unavailable.
      }
    }

    function handleChange() {
      scheduleSave();
    }

    function handleStorage(event: StorageEvent) {
      if (
        event.key === BOOKMARKS_STORAGE_KEY
        || event.key === EPISODES_STORAGE_KEY
        || event.key === RECENT_WATCH_STORAGE_KEY
      ) {
        scheduleSave();
      }
    }

    function handleOnline() {
      if (ready && accountId) scheduleSave(0);
      else void hydrate();
    }

    window.addEventListener(LIBRARY_CHANGE_EVENT, handleChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("online", handleOnline);
    void hydrate();

    return () => {
      stopped = true;
      if (saveTimer) clearTimeout(saveTimer);
      window.removeEventListener(LIBRARY_CHANGE_EVENT, handleChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return null;
}

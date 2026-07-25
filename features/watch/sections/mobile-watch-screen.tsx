"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { formatDecimalScore } from "@/entities/anime/lib/formatters";
import type { WatchAnimeItem } from "@/entities/anime/model/types";
import { useWatchDocumentTitle } from "@/features/watch/lib/use-watch-document-title";
import { SmartVideoPlayer } from "@/features/watch/sections/smart-video-player";
import {
  getSavedEpisode,
  getWatchedEpisodes,
  isAnimeBookmarked,
  LIBRARY_CHANGE_EVENT,
  saveEpisodeProgress,
  saveRecentWatch,
  toggleAnimeBookmark
} from "@/shared/lib/watch-storage";
import { AgeWarningDialog } from "@/shared/ui/age-warning-dialog";
import { useAgeGate } from "@/shared/ui/age-gate-provider";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type MobileWatchScreenProps = {
  anime: WatchAnimeItem;
};

type LockableScreenOrientation = ScreenOrientation & {
  lock(orientation: "landscape"): Promise<void>;
};

export function MobileWatchScreen({ anime }: MobileWatchScreenProps) {
  const { ready: ageGateReady, confirmed: adultConfirmed } = useAgeGate();
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const playerSectionRef = useRef<HTMLElement>(null);
  const episodeNumbers = anime.episodeNumbers;

  useWatchDocumentTitle(anime.title, selectedEpisode);

  useEffect(() => {
    function refreshLibraryState() {
      const savedEpisode = getSavedEpisode(anime.id);
      setSelectedEpisode(
        anime.episodeNumbers.includes(savedEpisode) ? savedEpisode : (anime.episodeNumbers[0] ?? 1)
      );
      setWatchedEpisodes(getWatchedEpisodes(anime.id));
      setIsBookmarked(isAnimeBookmarked(anime.id));
    }

    refreshLibraryState();
    window.addEventListener(LIBRARY_CHANGE_EVENT, refreshLibraryState);
    return () => window.removeEventListener(LIBRARY_CHANGE_EVENT, refreshLibraryState);
  }, [anime.episodeNumbers, anime.id]);

  useEffect(() => {
    if (anime.episodeNumbers.includes(selectedEpisode)) {
      saveEpisodeProgress(anime.id, selectedEpisode);
      saveRecentWatch(anime.id);
      setWatchedEpisodes(getWatchedEpisodes(anime.id));
    }
  }, [anime.episodeNumbers, anime.id, selectedEpisode]);

  function handleBookmarkToggle() {
    const nextIds = toggleAnimeBookmark(anime.id);
    setIsBookmarked(nextIds.includes(anime.id));
  }

  async function openLandscapePlayer() {
    const playerSection = playerSectionRef.current;
    if (!playerSection) return;

    try {
      if (playerSection.requestFullscreen) {
        await playerSection.requestFullscreen();
        try {
          await (screen.orientation as LockableScreenOrientation).lock("landscape");
        } catch {
          // Fullscreen still gives the user the browser's orientation control.
        }
        return;
      }

      const video = playerSection.querySelector("video") as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      video?.webkitEnterFullscreen?.();
    } catch {
      const video = playerSection.querySelector("video") as HTMLVideoElement & {
        webkitEnterFullscreen?: () => void;
      };
      video?.webkitEnterFullscreen?.();
    }
  }

  if (anime.isNsfw && (!ageGateReady || !adultConfirmed)) {
    return (
      <AgeWarningDialog
        title={anime.title}
        artwork={anime.bannerImage ?? anime.coverImage}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#071019_0%,#0d171f_28%,#111215_100%)] text-[var(--text-primary)]">
      <div className="mx-auto min-h-screen w-full max-w-[440px] px-4 pb-8 pt-4">
        <div className="space-y-5">
          <header className="rounded-[30px] border border-[rgba(255,255,255,0.07)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  aria-label="Back to home"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.54)] text-white backdrop-blur-sm"
                >
                  <MaterialIcon className="text-[20px]" name="arrow_back" />
                </Link>
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[rgba(157,216,255,0.72)]">
                    Now watching
                  </p>
                  <p className="text-sm text-[rgba(222,230,238,0.68)]">Episode {selectedEpisode}</p>
                </div>
              </div>

              <button
                type="button"
                aria-label={isBookmarked ? `Remove bookmark for ${anime.title}` : `Bookmark ${anime.title}`}
                onClick={handleBookmarkToggle}
                className={`flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-[background-color,border-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
                  isBookmarked
                    ? "border-[rgba(255,209,102,0.34)] bg-[rgba(255,209,102,0.16)] text-[#ffd166]"
                    : "border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.54)] text-white"
                }`}
              >
                <MaterialIcon
                  className="text-[20px]"
                  filled={isBookmarked}
                  name={isBookmarked ? "bookmark" : "bookmark_add"}
                />
              </button>
            </div>
          </header>

          <section ref={playerSectionRef} className="overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.07)] bg-[rgba(11,16,22,0.72)] shadow-[0_30px_64px_rgba(0,0,0,0.34)] fullscreen:flex fullscreen:h-screen fullscreen:w-screen fullscreen:flex-col fullscreen:justify-center fullscreen:rounded-none fullscreen:border-0 fullscreen:bg-black">
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.07)] px-4 py-3 fullscreen:hidden">
              <span className="inline-flex items-center gap-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(157,216,255,0.9)]">
                <MaterialIcon className="text-[15px]" name="play_circle" />
                Episode {selectedEpisode}
              </span>
              <button
                type="button"
                aria-label="Maximize video player in landscape"
                title="Maximize video player in landscape"
                onClick={() => void openLandscapePlayer()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[rgba(157,216,255,0.9)] transition-colors hover:bg-white/5 hover:text-white"
              >
                <MaterialIcon className="text-[21px]" name="fullscreen" />
              </button>
            </div>
            <SmartVideoPlayer
              animeId={anime.libraryId}
              episodeNumber={selectedEpisode}
              poster={anime.bannerImage ?? anime.coverImage}
              title={anime.title}
              compactControls
            />
          </section>

          <section className="rounded-[30px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] p-4 shadow-[0_18px_44px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[rgba(157,216,255,0.72)]">
                  Episode list
                </p>
                <p className="text-sm text-[rgba(222,230,238,0.68)]">Total {anime.episodeCount} episodes</p>
              </div>
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-[rgba(42,170,255,0.16)] px-3 text-sm font-semibold text-[#9dd8ff]">
                {selectedEpisode}
              </span>
            </div>

            <div className="mt-4 max-h-[216px] overflow-y-auto pr-1">
              <div className="grid grid-cols-4 gap-2">
                {episodeNumbers.map((episodeNumber) => (
                  <button
                    key={episodeNumber}
                    type="button"
                    onClick={() => setSelectedEpisode(episodeNumber)}
                    className={`inline-flex h-12 items-center justify-center rounded-[16px] border text-sm font-semibold tabular-nums transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
                      selectedEpisode === episodeNumber
                        ? "border-[rgba(42,170,255,0.28)] bg-[rgba(42,170,255,0.16)] text-[#9dd8ff]"
                        : watchedEpisodes.includes(episodeNumber)
                          ? "border-white/10 bg-white/10 text-white/55"
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.42)] text-[rgba(222,230,238,0.72)]"
                    }`}
                  >
                    {episodeNumber}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[30px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.03)] shadow-[0_18px_44px_rgba(0,0,0,0.2)]">
            <div className="relative h-[170px]">
              <Image
                fill
                alt={anime.title}
                className="object-cover opacity-40"
                sizes="440px"
                src={anime.coverImage}
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,14,19,0.2),rgba(8,14,19,0.92))]" />
              <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-4">
                <div className="relative h-[122px] w-[86px] shrink-0 overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.1)] shadow-[0_16px_34px_rgba(0,0,0,0.28)]">
                  <Image fill alt={anime.title} className="object-cover" sizes="86px" src={anime.coverImage} />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[rgba(157,216,255,0.72)]">
                    Anime details
                  </p>
                  <h2 className="mt-2 line-clamp-2 text-[1.25rem] font-semibold text-white">
                    {anime.title}
                  </h2>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-[rgba(222,230,238,0.68)]">
                    <MaterialIcon className="text-[14px] text-[#ffd166]" filled name="star" />
                    <span className="font-semibold text-[#ffd166]">{formatDecimalScore(anime.score)}</span>
                    <span>• {anime.seasonLabel}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex flex-wrap gap-2">
                {anime.genres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/filter?genres=${encodeURIComponent(genre)}`}
                    className="inline-flex items-center gap-1 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.42)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.16em] text-[rgba(222,230,238,0.72)]"
                  >
                    <MaterialIcon className="text-[14px]" name="sell" />
                    {genre}
                  </Link>
                ))}
              </div>

              <p className={`text-sm leading-7 text-[rgba(222,230,238,0.72)] ${isExpanded ? "" : "line-clamp-4"}`}>
                {anime.description}
              </p>

              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.42)] px-3 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[rgba(222,230,238,0.72)]"
              >
                <MaterialIcon className="text-[16px]" name={isExpanded ? "expand_less" : "expand_more"} />
                {isExpanded ? "Show less" : "Read more"}
              </button>

              <div className="grid grid-cols-2 gap-3 border-t border-[rgba(255,255,255,0.07)] pt-4 text-sm">
                <div className="rounded-[18px] bg-[rgba(8,14,19,0.42)] p-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(157,216,255,0.72)]">Status</p>
                  <p className="mt-1 text-[rgba(222,230,238,0.82)]">{anime.statusLabel}</p>
                </div>
                <div className="rounded-[18px] bg-[rgba(8,14,19,0.42)] p-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(157,216,255,0.72)]">Studio</p>
                  <p className="mt-1 text-[rgba(222,230,238,0.82)]">{anime.studioLabel}</p>
                </div>
                <div className="rounded-[18px] bg-[rgba(8,14,19,0.42)] p-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(157,216,255,0.72)]">Format</p>
                  <p className="mt-1 text-[rgba(222,230,238,0.82)]">{anime.formatLabel}</p>
                </div>
                <div className="rounded-[18px] bg-[rgba(8,14,19,0.42)] p-3">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(157,216,255,0.72)]">Episodes</p>
                  <p className="mt-1 text-[rgba(222,230,238,0.82)]">{anime.episodesLabel}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

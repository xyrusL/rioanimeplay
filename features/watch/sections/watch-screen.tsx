"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { formatDecimalScore } from "@/entities/anime/lib/formatters";
import type { WatchAnimeItem } from "@/entities/anime/model/types";
import { SearchAutocomplete } from "@/features/search/sections/search-autocomplete";
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

type WatchScreenProps = {
  anime: WatchAnimeItem;
};

export function WatchScreen({ anime }: WatchScreenProps) {
  const { ready: ageGateReady, confirmed: adultConfirmed } = useAgeGate();
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [watchedEpisodes, setWatchedEpisodes] = useState<number[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLightsOff, setIsLightsOff] = useState(false);
  const [isPlayerExpanded, setIsPlayerExpanded] = useState(false);
  const [playerReloadToken, setPlayerReloadToken] = useState(0);
  const episodeNumbers = anime.episodeNumbers;
  const selectedEpisodeIndex = episodeNumbers.indexOf(selectedEpisode);
  const nextEpisode = episodeNumbers[selectedEpisodeIndex + 1] ?? null;

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

  useEffect(() => {
    if (!isPlayerExpanded) return;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsPlayerExpanded(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlayerExpanded]);

  function handleBookmarkToggle() {
    const nextIds = toggleAnimeBookmark(anime.id);
    setIsBookmarked(nextIds.includes(anime.id));
  }

  if (anime.isNsfw && (!ageGateReady || !adultConfirmed)) {
    return (
      <AgeWarningDialog
        title={anime.title}
        artwork={anime.bannerImage ?? anime.coverImage}
      />
    );
  }

  if (isPlayerExpanded) {
    return (
      <main className="fixed inset-0 z-[100] flex items-center justify-center bg-black text-[var(--text-primary)]">
        <button
          type="button"
          aria-label="Restore watch page"
          title="Restore watch page (Esc)"
          onClick={() => setIsPlayerExpanded(false)}
          className="absolute top-5 right-5 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/65 text-white shadow-[0_12px_30px_rgba(0,0,0,0.4)] backdrop-blur-md transition-colors hover:bg-white/10"
        >
          <MaterialIcon className="text-[24px]" name="fullscreen_exit" />
        </button>
        <SmartVideoPlayer
          animeId={anime.libraryId}
          episodeNumber={selectedEpisode}
          poster={anime.bannerImage ?? anime.coverImage}
          title={anime.title}
          className="!aspect-video !h-auto !max-h-[100dvh] !w-[min(100dvw,177.7778dvh)]"
          reloadToken={playerReloadToken}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {isLightsOff ? (
        <button
          type="button"
          aria-label="Turn cinema lights on"
          onClick={() => setIsLightsOff(false)}
          className="fixed inset-0 z-40 cursor-pointer bg-black/95"
        />
      ) : null}
      <div className="site-shell desktop-shell--watch mx-auto flex min-h-screen w-full flex-col px-4 pb-10 pt-4 sm:px-6 xl:px-24 2xl:px-28">
        <header className="mb-5 flex flex-wrap items-center gap-3 rounded-[24px] border border-[var(--line-soft)] bg-[var(--watch-topbar-surface)] px-4 py-3 shadow-[var(--soft-shadow)]">
          <div className="flex items-center gap-2 text-[var(--text-secondary)]">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] transition-[border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              <MaterialIcon className="text-[18px]" name="chevron_left" />
            </Link>
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] transition-[border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              <MaterialIcon className="text-[18px]" filled name="home" />
            </Link>
          </div>

          <Link
            href="/"
            className="max-w-[18rem] cursor-pointer truncate font-display text-[1.2rem] uppercase tracking-[0.16em] text-[var(--text-primary)] transition-opacity duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:opacity-90 sm:max-w-[24rem] lg:max-w-[30rem]"
          >
            RioAnimePlay
          </Link>

          <div className="ml-auto flex flex-1 flex-wrap items-center justify-end gap-3">
            <SearchAutocomplete className="flex-1 sm:max-w-[440px]" />
            <Link
              href="/random"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3.5 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              <MaterialIcon className="text-[16px]" name="casino" />
              Random
            </Link>
            <Link
              href="/anime/a-z"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3.5 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              <MaterialIcon className="text-[16px]" name="format_list_bulleted" />
              A-Z List
            </Link>
          </div>
        </header>

        <section className={`relative overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--watch-panel-surface)] shadow-[var(--hero-shadow)] ${isLightsOff ? "z-50" : ""}`}>
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--watch-panel-header)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Ep {selectedEpisode}
              </span>
              <span>Episode selection</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Refresh episode player"
                title="Refresh episode player"
                onClick={() => setPlayerReloadToken((value) => value + 1)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-[color,background-color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:rotate-12 hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[18px]" name="sync" />
              </button>
              <button
                type="button"
                aria-label={isLightsOff ? "Turn cinema lights on" : "Turn cinema lights off"}
                title={isLightsOff ? "Turn cinema lights on" : "Turn cinema lights off"}
                aria-pressed={isLightsOff}
                onClick={() => setIsLightsOff((value) => !value)}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-[color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] ${isLightsOff ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}`}
              >
                <MaterialIcon className="text-[18px]" filled={isLightsOff} name="lightbulb" />
              </button>
              <button
                type="button"
                disabled={nextEpisode === null}
                aria-label={nextEpisode === null ? "No next episode" : `Play episode ${nextEpisode}`}
                title={nextEpisode === null ? "No next episode" : `Next episode: ${nextEpisode}`}
                onClick={() => {
                  if (nextEpisode !== null) setSelectedEpisode(nextEpisode);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-[color,background-color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:translate-x-0.5 hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:translate-x-0 disabled:hover:bg-transparent"
              >
                <MaterialIcon className="text-[18px]" name="fast_forward" />
              </button>
              <button
                type="button"
                aria-label="Maximize video player"
                title="Maximize video player"
                onClick={() => {
                  setIsLightsOff(false);
                  setIsPlayerExpanded(true);
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-[color,background-color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:scale-105 hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[21px]" name="fullscreen" />
              </button>
            </div>
          </div>

          <SmartVideoPlayer
            animeId={anime.libraryId}
            episodeNumber={selectedEpisode}
            poster={anime.bannerImage ?? anime.coverImage}
            title={anime.title}
            className="min-h-[320px] sm:min-h-[460px]"
            reloadToken={playerReloadToken}
          />
        </section>

        <section className="mt-5 overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--watch-panel-surface)] shadow-[var(--soft-shadow)]">
          <div className="px-4 py-4 sm:px-5">
            <div className="relative">
              <div className="min-w-0 flex-1 space-y-2 pr-10 sm:pr-12">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-1 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                    <MaterialIcon className="text-[15px]" name="movie" />
                    {anime.formatLabel} • {anime.seasonLabel}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--badge-dark)] px-3 py-1 text-[0.72rem] font-semibold text-[var(--gold)]">
                    <MaterialIcon className="text-[15px]" filled name="star" />
                    {formatDecimalScore(anime.score)}
                  </span>
                </div>
                <h1 className="line-clamp-2 w-full text-[1.45rem] leading-[1.08] font-semibold text-[var(--text-primary)] sm:text-[1.85rem]">
                  {anime.title}
                </h1>
              </div>

              <button
                type="button"
                aria-label={isBookmarked ? `Remove bookmark for ${anime.title}` : `Bookmark ${anime.title}`}
                onClick={handleBookmarkToggle}
                className={`absolute top-0 right-0 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-[border-color,color,transform,background-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 ${
                  isBookmarked
                    ? "border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_10px_24px_rgba(0,0,0,0.16)] hover:bg-[rgba(141,114,255,0.22)]"
                    : "border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
                }`}
              >
                <MaterialIcon
                  className="text-[18px]"
                  filled={isBookmarked}
                  name={isBookmarked ? "bookmark" : "bookmark_add"}
                />
              </button>
            </div>

            <div className="mt-4 space-y-3 border-t border-[var(--line-soft)] pt-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Episode List
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Pick an episode from the available list.
                  </p>
                </div>
                <div className="text-sm text-[var(--text-secondary)]">
                  Ep total : {anime.episodeCount}
                </div>
              </div>

              <div className="max-h-[214px] overflow-y-auto px-1 pt-1 pr-2">
                <div className="flex flex-wrap gap-2 pb-1">
                  {episodeNumbers.map((episodeNumber) => (
                    <button
                      key={episodeNumber}
                      type="button"
                      onClick={() => setSelectedEpisode(episodeNumber)}
                      className={`inline-flex h-12 w-14 items-center justify-center rounded-[14px] border px-0 py-2 text-sm font-semibold tabular-nums transition-[transform,border-color,color,background-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 ${
                        selectedEpisode === episodeNumber
                          ? "border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_10px_28px_rgba(0,0,0,0.2)]"
                          : watchedEpisodes.includes(episodeNumber)
                            ? "border-white/10 bg-white/10 text-white/55"
                            : "border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {episodeNumber}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--line-soft)] pt-4">
              {anime.genres.map((genre) => (
                <Link
                  key={genre}
                  href={`/filter?genres=${encodeURIComponent(genre)}`}
                  className="inline-flex items-center gap-0.5 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-0.75 text-[0.56rem] uppercase tracking-[0.14em] text-[var(--text-muted)]"
                >
                  <MaterialIcon className="leading-none" name="sell" style={{ fontSize: "15px" }} />
                  {genre}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--watch-panel-surface)] shadow-[var(--soft-shadow)]">
          <div className="grid overflow-hidden lg:grid-cols-[230px_minmax(0,1fr)]">
            <div className="relative min-h-[250px] border-b border-[var(--line-soft)] lg:border-r lg:border-b-0">
              <div className="absolute inset-0">
                <Image
                  fill
                  alt={anime.title}
                  className="scale-[1.04] object-cover blur-[3px] opacity-45 saturate-[0.9]"
                  sizes="230px"
                  src={anime.coverImage}
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,16,21,0.22),rgba(15,16,21,0.44))]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02),transparent_58%)]" />
              </div>
              <div className="relative flex h-full items-center justify-center px-6 py-7">
                <div className="relative h-[188px] w-[132px] overflow-hidden rounded-[22px] border border-[rgba(255,255,255,0.12)] shadow-[0_20px_44px_rgba(0,0,0,0.34)]">
                  <Image
                    fill
                    alt={anime.title}
                    className="object-cover"
                    sizes="132px"
                    src={anime.coverImage}
                  />
                </div>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-6">
              <div className="min-w-0 space-y-4">
                <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Anime Details
                </p>

                <p className="line-clamp-4 max-w-[68rem] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.98rem]">
                  {anime.description}
                </p>

                <div className="grid gap-x-10 gap-y-3 border-t border-[var(--line-soft)] pt-4 text-sm leading-7 text-[var(--text-secondary)] sm:grid-cols-2">
                  <p>
                    <span className="text-[var(--text-muted)]">Format:</span> {anime.formatLabel}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Status:</span> {anime.statusLabel}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Premiere:</span> {anime.seasonLabel}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Episodes:</span>{" "}
                    {anime.episodesLabel}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Studio:</span> {anime.studioLabel}
                  </p>
                  <p>
                    <span className="text-[var(--text-muted)]">Rating:</span>{" "}
                    {formatDecimalScore(anime.score)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-5 rounded-[24px] border border-[var(--line-soft)] bg-[var(--watch-comments-surface)] px-4 py-5 text-center shadow-[var(--soft-shadow)]">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-[16px] border border-[var(--line-strong)] bg-[var(--accent-soft)] px-5 py-3 text-sm font-semibold text-[var(--accent-strong)] shadow-[0_12px_28px_rgba(0,0,0,0.16)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:bg-[var(--accent-panel)] hover:text-[var(--text-primary)]"
          >
            Show Comments
          </button>
        </div>
      </div>
    </main>
  );
}

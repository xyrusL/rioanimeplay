"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatDecimalScore } from "@/entities/anime/lib/formatters";
import type { WatchAnimeItem } from "@/entities/anime/model/types";
import { SearchAutocomplete } from "@/features/search/sections/search-autocomplete";
import {
  getSavedEpisode,
  isAnimeBookmarked,
  saveEpisodeProgress,
  toggleAnimeBookmark
} from "@/shared/lib/watch-storage";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type WatchScreenProps = {
  anime: WatchAnimeItem;
};

export function WatchScreen({ anime }: WatchScreenProps) {
  const [selectedEpisode, setSelectedEpisode] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const episodeNumbers = useMemo(
    () => Array.from({ length: anime.episodeCount }, (_, index) => index + 1),
    [anime.episodeCount]
  );

  useEffect(() => {
    const savedEpisode = Math.min(Math.max(getSavedEpisode(anime.id), 1), anime.episodeCount);
    setSelectedEpisode(savedEpisode);
    setIsBookmarked(isAnimeBookmarked(anime.id));
  }, [anime.episodeCount, anime.id]);

  useEffect(() => {
    saveEpisodeProgress(anime.id, selectedEpisode);
  }, [anime.id, selectedEpisode]);

  function handleBookmarkToggle() {
    const nextIds = toggleAnimeBookmark(anime.id);
    setIsBookmarked(nextIds.includes(anime.id));
  }

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="site-shell mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 pb-10 pt-4 sm:px-6 xl:px-8">
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

        <section className="overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--watch-panel-surface)] shadow-[var(--hero-shadow)]">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--watch-panel-header)] px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
              <span className="rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Ep {selectedEpisode}
              </span>
              <span>Demo Player Placeholder</span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { name: "sync", label: "Refresh player" },
                { name: "lightbulb", label: "Tips" },
                { name: "bolt", label: "Quick action" },
                { name: "fast_forward", label: "Next source" }
              ].map((action) => (
                <button
                  key={action.name}
                  type="button"
                  aria-label={action.label}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-[color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
                >
                  <MaterialIcon className="text-[18px]" name={action.name} />
                </button>
              ))}
            </div>
          </div>

          <div className="relative isolate overflow-hidden">
            <div className="absolute inset-0">
              <Image
                fill
                alt={anime.title}
                className="object-cover opacity-22"
                sizes="100vw"
                src={anime.bannerImage ?? anime.coverImage}
              />
              <div className="absolute inset-0 bg-[var(--watch-player-overlay)]" />
            </div>

            <div className="relative flex aspect-video min-h-[320px] items-center justify-center px-6 py-10 sm:min-h-[460px]">
              <div className="max-w-xl space-y-4 text-center">
                <button
                  type="button"
                  aria-label={`Play episode ${selectedEpisode}`}
                  className="mx-auto flex h-18 w-18 items-center justify-center rounded-[22px] border border-[var(--line-strong)] bg-[var(--watch-player-chip)] text-[var(--accent-strong)] shadow-[0_18px_48px_rgba(0,0,0,0.32)] transition-[transform,border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--accent-strong)] hover:bg-[rgba(31,28,43,0.98)]"
                >
                  <MaterialIcon className="text-[42px]" filled name="play_arrow" />
                </button>
                <div className="space-y-2">
                  <p className="font-display text-[1.05rem] uppercase tracking-[0.18em] text-[var(--text-primary)]">
                    Episode {selectedEpisode} is not streaming yet
                  </p>
                  <p className="text-sm leading-6 text-[var(--text-secondary)] sm:text-[0.96rem]">
                    This watch page is ready, but video playback has not been connected yet. Use
                    the episode buttons below to preview the layout.
                  </p>
                </div>
              </div>
            </div>

          </div>
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
                    Pick an episode to preview the watch state.
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
                  className="scale-102 object-cover blur-lg opacity-72 saturate-[1.01]"
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

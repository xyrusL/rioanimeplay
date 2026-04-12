"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { formatDecimalScore } from "@/entities/anime/lib/formatters";
import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { MobileAppShell } from "@/features/mobile/shared/mobile-app-shell";
import {
  getBookmarkedAnimeIds,
  getSavedEpisode,
  toggleAnimeBookmark
} from "@/shared/lib/watch-storage";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type MobileBookmarksScreenProps = {
  catalog: HomeAnimeItem[];
};

type SavedCardProps = {
  item: HomeAnimeItem;
  savedEpisode: number;
  onRemove: (animeId: number) => void;
};

function SavedAnimeCard({ item, savedEpisode, onRemove }: SavedCardProps) {
  const href = `/watch/${toAnimeSlug(item.title)}`;

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] shadow-[0_20px_44px_rgba(0,0,0,0.24)]">
      <Link href={href} className="block">
        <div className="relative aspect-[11/16] overflow-hidden">
          <Image
            fill
            alt={item.title}
            className="object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
            sizes="(max-width: 440px) 50vw, 180px"
            src={item.coverImage}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,25,0.02),rgba(7,16,25,0.2)_35%,rgba(7,16,25,0.96))]" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-[rgba(9,14,19,0.78)] px-2.5 py-1 text-[0.64rem] font-semibold text-[#ffd166] backdrop-blur-sm">
              <MaterialIcon className="text-[14px]" filled name="star" />
              {formatDecimalScore(item.score)}
            </span>
            <span className="rounded-full bg-[rgba(9,14,19,0.78)] px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              {item.episodesLabel} EP
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.6)] p-2.5 backdrop-blur-md">
              <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[rgba(157,216,255,0.76)]">
                Continue from
              </p>
              <p className="mt-1 text-sm font-semibold text-white">Episode {savedEpisode}</p>
            </div>
          </div>
        </div>
      </Link>

      <div className="space-y-2 px-3.5 py-3.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link href={href} className="block">
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-white">
                {item.title}
              </h3>
            </Link>
            <p className="mt-1 line-clamp-1 text-[0.66rem] uppercase tracking-[0.16em] text-[rgba(222,230,238,0.58)]">
              {item.formatLabel} • {item.seasonLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.title} from bookmarks`}
            onClick={() => onRemove(item.id)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] text-[#ffd166]"
          >
            <MaterialIcon className="text-[18px]" filled name="favorite" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function MobileBookmarksScreen({ catalog }: MobileBookmarksScreenProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeType, setActiveType] = useState("All");

  useEffect(() => {
    setBookmarkedIds(getBookmarkedAnimeIds());

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "rioanime:bookmarks") {
        return;
      }

      setBookmarkedIds(getBookmarkedAnimeIds());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function handleRemoveBookmark(animeId: number) {
    setBookmarkedIds(toggleAnimeBookmark(animeId));
  }

  const savedItems = useMemo(() => {
    const itemMap = new Map(catalog.map((item) => [item.id, item]));

    return [...bookmarkedIds]
      .reverse()
      .map((animeId) => itemMap.get(animeId))
      .filter((item): item is HomeAnimeItem => Boolean(item));
  }, [bookmarkedIds, catalog]);

  const typeChips = useMemo(() => {
    const liveTypes = [...new Set(savedItems.map((item) => item.formatLabel).filter(Boolean))];
    return ["All", ...liveTypes];
  }, [savedItems]);

  useEffect(() => {
    if (!typeChips.includes(activeType)) {
      setActiveType("All");
    }
  }, [activeType, typeChips]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return savedItems.filter((item) => {
      const matchesType = activeType === "All" ? true : item.formatLabel === activeType;
      const matchesQuery = normalizedQuery
        ? `${item.title} ${item.alternateTitles.join(" ")}`.toLowerCase().includes(normalizedQuery)
        : true;

      return matchesType && matchesQuery;
    });
  }, [activeType, savedItems, searchQuery]);

  const spotlightItem = filteredItems[0] ?? savedItems[0] ?? null;
  const savedMovieCount = savedItems.filter((item) => item.formatLabel === "Movie").length;
  const savedSeriesCount = savedItems.filter((item) => item.formatLabel !== "Movie").length;

  return (
    <MobileAppShell>
      <div className="space-y-6">
        <header className="space-y-4 rounded-[34px] border border-[rgba(255,255,255,0.07)] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_48px_rgba(0,0,0,0.22)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,#ffd166,#ff8f6b)] text-lg font-semibold text-[#1d1004] shadow-[0_14px_28px_rgba(255,179,102,0.22)]">
                <MaterialIcon className="text-[26px]" filled name="favorite" />
              </div>
              <div>
                <p className="text-sm text-[rgba(222,230,238,0.72)]">Your saved shelf</p>
                <h1 className="text-xl font-semibold text-white">Bookmarks</h1>
              </div>
            </div>
            <div className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.54)] px-3 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[rgba(255,255,255,0.78)]">
              {savedItems.length} saved
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[rgba(8,14,19,0.42)] p-3">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[rgba(222,230,238,0.48)]">
                Total
              </p>
              <p className="mt-2 text-[1.45rem] font-semibold text-white">{savedItems.length}</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[rgba(8,14,19,0.42)] p-3">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[rgba(222,230,238,0.48)]">
                Series
              </p>
              <p className="mt-2 text-[1.45rem] font-semibold text-white">{savedSeriesCount}</p>
            </div>
            <div className="rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[rgba(8,14,19,0.42)] p-3">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[rgba(222,230,238,0.48)]">
                Movies
              </p>
              <p className="mt-2 text-[1.45rem] font-semibold text-white">{savedMovieCount}</p>
            </div>
          </div>

          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[rgba(222,230,238,0.46)]">
              <MaterialIcon className="text-[18px]" name="search" />
            </span>
            <input
              value={searchQuery}
              placeholder="Search saved anime"
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] pl-10 pr-10 text-sm text-white outline-none placeholder:text-[rgba(222,230,238,0.42)] focus:border-[rgba(255,209,102,0.4)] focus:bg-[rgba(255,255,255,0.06)]"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                aria-label="Clear bookmark search"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3 inline-flex items-center text-[rgba(222,230,238,0.56)]"
              >
                <MaterialIcon className="text-[18px]" name="close" />
              </button>
            ) : null}
          </label>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {typeChips.map((chip) => {
              const active = chip === activeType;

              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setActiveType(chip)}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm ${
                    active
                      ? "bg-[linear-gradient(135deg,#ffd166,#ff8f6b)] font-semibold text-[#1d1004]"
                      : "border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.5)] text-[rgba(222,230,238,0.8)]"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </header>

        {savedItems.length === 0 ? (
          <section className="rounded-[32px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-5 py-10 text-center shadow-[0_20px_44px_rgba(0,0,0,0.24)]">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,209,102,0.16)] text-[#ffd166]">
              <MaterialIcon className="text-[30px]" filled name="favorite" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-white">No bookmarks yet</h2>
            <p className="mt-2 text-sm leading-6 text-[rgba(222,230,238,0.68)]">
              Save a few titles from home or watch pages and your personal shelf starts here.
            </p>
            <Link
              href="/filter"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#2aa9ff,#2bd6c4)] px-5 py-3 text-sm font-semibold text-[#04131d] shadow-[0_16px_30px_rgba(41,167,255,0.22)]"
            >
              <MaterialIcon className="text-[18px]" name="tune" />
              Browse anime
            </Link>
          </section>
        ) : (
          <>
            {spotlightItem ? (
              <section className="space-y-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[rgba(157,216,255,0.74)]">
                      Continue watching
                    </p>
                    <h2 className="mt-1 text-[1.3rem] font-semibold text-white">Saved spotlight</h2>
                  </div>
                </div>

                <article className="relative overflow-hidden rounded-[34px] border border-[rgba(255,255,255,0.07)] bg-[rgba(11,16,22,0.72)] shadow-[0_30px_64px_rgba(0,0,0,0.34)]">
                  <Image
                    fill
                    alt={spotlightItem.title}
                    className="object-cover"
                    sizes="(max-width: 1023px) 100vw, 420px"
                    src={spotlightItem.bannerImage ?? spotlightItem.coverImage}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,15,0.2),rgba(5,10,15,0.68)_48%,rgba(5,10,15,0.96))]" />
                  <div
                    className="absolute inset-x-[-20%] bottom-[-10%] h-[55%] rounded-full blur-3xl"
                    style={{ background: `${spotlightItem.accent}55` }}
                  />

                  <div className="relative flex min-h-[380px] flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[rgba(8,14,19,0.62)] px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[#ffd166] backdrop-blur-md">
                        <MaterialIcon className="text-[16px]" filled name="favorite" />
                        Saved
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${spotlightItem.title} from bookmarks`}
                        onClick={() => handleRemoveBookmark(spotlightItem.id)}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[rgba(255,209,102,0.34)] bg-[rgba(255,209,102,0.16)] text-[#ffd166] backdrop-blur-md"
                      >
                        <MaterialIcon className="text-[22px]" filled name="favorite" />
                      </button>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {spotlightItem.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-[rgba(255,255,255,0.1)] bg-[rgba(8,14,19,0.5)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[rgba(222,230,238,0.76)] backdrop-blur-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[rgba(255,209,102,0.82)]">
                          {spotlightItem.formatLabel} • {spotlightItem.seasonLabel}
                        </p>
                        <h2 className="mt-2 max-w-[12ch] text-[2.1rem] leading-[1.02] font-semibold text-white">
                          {spotlightItem.title}
                        </h2>
                      </div>

                      <p className="line-clamp-2 max-w-[32ch] text-sm leading-6 text-[rgba(222,230,238,0.74)]">
                        {spotlightItem.description}
                      </p>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/watch/${toAnimeSlug(spotlightItem.title)}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#ffd166,#ff8f6b)] px-5 py-3 text-sm font-semibold text-[#1d1004] shadow-[0_18px_34px_rgba(255,179,102,0.24)]"
                        >
                          <MaterialIcon className="text-[20px]" filled name="play_arrow" />
                          Continue
                        </Link>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(8,14,19,0.58)] px-4 py-3 text-sm text-white backdrop-blur-sm">
                          <MaterialIcon className="text-[18px] text-[#ffd166]" filled name="star" />
                          {formatDecimalScore(spotlightItem.score)}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[rgba(8,14,19,0.58)] px-4 py-3 text-sm text-white backdrop-blur-sm">
                          <MaterialIcon className="text-[18px] text-[#9dd8ff]" name="live_tv" />
                          Ep {getSavedEpisode(spotlightItem.id)}
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              </section>
            ) : null}

            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[rgba(157,216,255,0.74)]">
                    Your picks
                  </p>
                  <h2 className="mt-1 text-[1.3rem] font-semibold text-white">
                    {filteredItems.length} saved title{filteredItems.length === 1 ? "" : "s"}
                  </h2>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="rounded-[30px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] px-5 py-10 text-center shadow-[0_20px_44px_rgba(0,0,0,0.24)]">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(42,170,255,0.16)] text-[#9dd8ff]">
                    <MaterialIcon className="text-[28px]" name="search_off" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">Nothing matched that search</h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(222,230,238,0.68)]">
                    Try another title or switch the saved type chip.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pb-4">
                  {filteredItems.map((item) => (
                    <SavedAnimeCard
                      key={item.id}
                      item={item}
                      savedEpisode={getSavedEpisode(item.id)}
                      onRemove={handleRemoveBookmark}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </MobileAppShell>
  );
}

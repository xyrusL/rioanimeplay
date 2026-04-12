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
  toggleAnimeBookmark
} from "@/shared/lib/watch-storage";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type MobileBookmarksScreenProps = {
  catalog: HomeAnimeItem[];
};

type SavedCardProps = {
  item: HomeAnimeItem;
  onRemove: (animeId: number) => void;
};

function SavedAnimeCard({ item, onRemove }: SavedCardProps) {
  const href = `/watch/${toAnimeSlug(item.title)}`;

  return (
    <article className="group relative overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--bg-card)] shadow-[var(--soft-shadow)]">
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
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--badge-dark)] px-2.5 py-1 text-[0.64rem] font-semibold text-[var(--gold)] backdrop-blur-sm">
              <MaterialIcon className="text-[14px]" filled name="star" />
              {formatDecimalScore(item.score)}
            </span>
            <span className="rounded-full bg-[var(--badge-dark)] px-2.5 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] backdrop-blur-sm">
              {item.episodesLabel} EP
            </span>
          </div>
        </div>
      </Link>

      <div className="space-y-2 px-3.5 py-3.5">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link href={href} className="block">
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-[var(--text-primary)]">
                {item.title}
              </h3>
            </Link>
            <p className="mt-1 line-clamp-1 text-[0.66rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {item.formatLabel} • {item.seasonLabel}
            </p>
          </div>
          <button
            type="button"
            aria-label={`Remove ${item.title} from bookmarks`}
            onClick={() => onRemove(item.id)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] text-[var(--gold)]"
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
        <header className="space-y-4 rounded-[34px] border border-[var(--line-soft)] bg-[var(--panel-surface)] p-4 shadow-[var(--panel-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-lg font-semibold text-[var(--bg-base)] shadow-[0_14px_28px_var(--accent-soft)]">
                <MaterialIcon className="text-[26px]" filled name="favorite" />
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Your saved shelf</p>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Bookmarks</h1>
              </div>
            </div>
            <div className="rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] px-3 py-2 text-[0.76rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]">
              {savedItems.length} saved
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-3">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Total
              </p>
              <p className="mt-2 text-[1.45rem] font-semibold text-[var(--text-primary)]">{savedItems.length}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-3">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Series
              </p>
              <p className="mt-2 text-[1.45rem] font-semibold text-[var(--text-primary)]">{savedSeriesCount}</p>
            </div>
            <div className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-3">
              <p className="text-[0.66rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Movies
              </p>
              <p className="mt-2 text-[1.45rem] font-semibold text-[var(--text-primary)]">{savedMovieCount}</p>
            </div>
          </div>

          <label className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
              <MaterialIcon className="text-[18px]" name="search" />
            </span>
            <input
              value={searchQuery}
              placeholder="Search saved anime"
              onChange={(event) => setSearchQuery(event.target.value)}
              className="h-11 w-full rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] pl-10 pr-10 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:bg-[var(--bg-card-soft)]"
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                aria-label="Clear bookmark search"
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-3 inline-flex items-center text-[var(--text-muted)]"
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
                      ? "bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] font-semibold text-[var(--bg-base)]"
                      : "border border-[var(--line-soft)] bg-[var(--bg-card)] text-[var(--text-secondary)]"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </header>

        {savedItems.length === 0 ? (
          <section className="rounded-[32px] border border-[var(--line-soft)] bg-[var(--bg-card)] px-5 py-10 text-center shadow-[var(--soft-shadow)]">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <MaterialIcon className="text-[30px]" filled name="favorite" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">No bookmarks yet</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
              Save a few titles from home or watch pages and your personal shelf starts here.
            </p>
            <Link
              href="/filter"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] px-5 py-3 text-sm font-semibold text-[var(--bg-base)] shadow-[0_16px_30px_var(--accent-soft)]"
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
                    <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                      Continue watching
                    </p>
                    <h2 className="mt-1 text-[1.3rem] font-semibold text-[var(--text-primary)]">Saved spotlight</h2>
                  </div>
                </div>

                <article className="relative overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[var(--bg-card-strong)] shadow-[0_30px_64px_rgba(0,0,0,0.34)]">
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
                      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--badge-dark)] px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)] backdrop-blur-md">
                        <MaterialIcon className="text-[16px]" filled name="favorite" />
                        Saved
                      </div>
                      <button
                        type="button"
                        aria-label={`Remove ${spotlightItem.title} from bookmarks`}
                        onClick={() => handleRemoveBookmark(spotlightItem.id)}
                        className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)] backdrop-blur-md"
                      >
                        <MaterialIcon className="text-[22px]" filled name="favorite" />
                      </button>
                    </div>

                    <div className="mt-auto space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {spotlightItem.genres.slice(0, 3).map((genre) => (
                          <span
                            key={genre}
                            className="rounded-full border border-[var(--line-soft)] bg-[var(--badge-dark)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-secondary)] backdrop-blur-sm"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>

                      <div>
                        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                          {spotlightItem.formatLabel} • {spotlightItem.seasonLabel}
                        </p>
                        <h2 className="mt-2 max-w-[12ch] text-[2.1rem] leading-[1.02] font-semibold text-[var(--text-primary)]">
                          {spotlightItem.title}
                        </h2>
                      </div>

                      <p className="line-clamp-2 max-w-[32ch] text-sm leading-6 text-[var(--text-secondary)]">
                        {spotlightItem.description}
                      </p>

                      <div className="flex items-center gap-3">
                        <Link
                          href={`/watch/${toAnimeSlug(spotlightItem.title)}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] px-5 py-3 text-sm font-semibold text-[var(--bg-base)] shadow-[0_18px_34px_var(--accent-soft)]"
                        >
                          <MaterialIcon className="text-[20px]" filled name="play_arrow" />
                          Continue
                        </Link>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--badge-dark)] px-4 py-3 text-sm text-[var(--text-primary)] backdrop-blur-sm">
                          <MaterialIcon className="text-[18px] text-[var(--gold)]" filled name="star" />
                          {formatDecimalScore(spotlightItem.score)}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--badge-dark)] px-4 py-3 text-sm text-[var(--text-primary)] backdrop-blur-sm">
                          <MaterialIcon className="text-[18px] text-[var(--accent-strong)]" name="live_tv" />
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
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                    Your picks
                  </p>
                  <h2 className="mt-1 text-[1.3rem] font-semibold text-[var(--text-primary)]">
                    {filteredItems.length} saved title{filteredItems.length === 1 ? "" : "s"}
                  </h2>
                </div>
              </div>

              {filteredItems.length === 0 ? (
                <div className="rounded-[30px] border border-[var(--line-soft)] bg-[var(--bg-card)] px-5 py-10 text-center shadow-[var(--soft-shadow)]">
                  <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
                    <MaterialIcon className="text-[28px]" name="search_off" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Nothing matched that search</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                    Try another title or switch the saved type chip.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 pb-4">
                  {filteredItems.map((item) => (
                    <SavedAnimeCard
                      key={item.id}
                      item={item}
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

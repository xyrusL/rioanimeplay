"use client";

import { useEffect, useMemo, useState } from "react";

import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { AnimeCard } from "@/features/home/sections/anime-card";
import { FILTER_PAGE_SIZE } from "@/features/browse/model/filter-utils";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type FilterResultsPanelProps = {
  initialPage: number;
  items: HomeAnimeItem[];
  query: string;
  seasonLabel: string;
  typeLabel: string;
  year: string;
  selectedGenres: string[];
};

export function FilterResultsPanel({
  initialPage,
  items,
  query,
  seasonLabel,
  typeLabel,
  year,
  selectedGenres
}: FilterResultsPanelProps) {
  const totalPages = Math.max(1, Math.ceil(items.length / FILTER_PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(Math.min(initialPage, totalPages));

  useEffect(() => {
    setCurrentPage(Math.min(initialPage, totalPages));
  }, [initialPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * FILTER_PAGE_SIZE;
    return items.slice(start, start + FILTER_PAGE_SIZE);
  }, [currentPage, items]);

  function updatePage(nextPage: number) {
    const clampedPage = Math.min(Math.max(1, nextPage), totalPages);
    setCurrentPage(clampedPage);

    const url = new URL(window.location.href);

    if (clampedPage > 1) {
      url.searchParams.set("page", String(clampedPage));
    } else {
      url.searchParams.delete("page");
    }

    window.history.replaceState({}, "", url.toString());
  }

  return (
    <>
      <div className="border-b border-[var(--line-soft)] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
            <MaterialIcon className="text-[16px]" name="filter_alt" />
            {seasonLabel}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {year}
          </span>
          {query ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              “{query}”
            </span>
          ) : null}
          {typeLabel ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
              {typeLabel}
            </span>
          ) : null}
          {selectedGenres.map((genre) => (
            <span
              key={genre}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-1.5 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]"
            >
              {genre}
            </span>
          ))}
          <span className="text-sm text-[var(--text-secondary)]">
            {items.length} result{items.length === 1 ? "" : "s"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => updatePage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Show previous page"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-40 disabled:hover:border-[var(--line-soft)] disabled:hover:text-[var(--text-secondary)] disabled:hover:translate-y-0"
            >
              <MaterialIcon className="text-[18px]" name="chevron_left" />
            </button>
            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-3 text-[0.68rem] font-semibold text-[var(--accent-strong)] shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
              {currentPage}
            </span>
            <button
              type="button"
              onClick={() => updatePage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              aria-label="Show next page"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-40 disabled:hover:border-[var(--line-soft)] disabled:hover:text-[var(--text-secondary)] disabled:hover:translate-y-0"
            >
              <MaterialIcon className="text-[18px]" name="chevron_right" />
            </button>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="font-display text-[1rem] uppercase tracking-[0.18em] text-[var(--text-primary)]">
            Nothing Matched This Filter
          </p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            This combo came up empty. Try a different title, switch the type, change the year, or loosen one of the genre tags.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-3 lg:grid-cols-5">
          {pageItems.map((item) => (
            <AnimeCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </>
  );
}

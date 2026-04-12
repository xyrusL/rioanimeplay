"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { HomeAnimeItem } from "@/entities/anime/model/types";
import {
  buildFilterHref,
  FILTER_ALL_TYPES,
  FILTER_ALL_YEARS,
  FILTER_DEFAULT_SEASON,
  getFilterYearOptions
} from "@/features/browse/model/filter-utils";
import { MobilePosterCard } from "@/features/mobile/shared/mobile-anime-card";
import { MobileAppShell } from "@/features/mobile/shared/mobile-app-shell";
import { ROUTE_PROGRESS_START_EVENT } from "@/shared/ui/route-progress";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type MobileFilterScreenProps = {
  initialPage: number;
  items: HomeAnimeItem[];
  initialQuery: string;
  initialType: string;
  initialSeason: string;
  initialYear: string;
  initialGenres: string[];
  genres: string[];
  types: string[];
};

type FilterChipConfig = {
  id: string;
  label: string;
  onRemove: () => void;
};

const MOBILE_FILTER_PAGE_SIZE = 12;

function MobileFilterSelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
        {label}
      </span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-12 w-full appearance-none rounded-[18px] border border-[var(--line-soft)] bg-[var(--bg-card)] px-4 pr-11 text-sm font-medium text-[var(--text-primary)] outline-none transition-[border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] focus:border-[var(--line-strong)] focus:bg-[var(--bg-card-soft)]"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-[var(--bg-panel)] text-[var(--text-primary)]">
              {option.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[var(--text-muted)]">
          <MaterialIcon className="text-[20px]" name="expand_more" />
        </span>
      </span>
    </label>
  );
}

export function MobileFilterScreen({
  initialPage,
  items,
  initialQuery,
  initialType,
  initialSeason,
  initialYear,
  initialGenres,
  genres,
  types
}: MobileFilterScreenProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentYear = String(new Date().getFullYear());
  const totalPages = Math.max(1, Math.ceil(items.length / MOBILE_FILTER_PAGE_SIZE));
  const [currentPage, setCurrentPage] = useState(Math.min(initialPage, totalPages));
  const [searchValue, setSearchValue] = useState(initialQuery);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [draftType, setDraftType] = useState(initialType);
  const [draftSeason, setDraftSeason] = useState(initialSeason);
  const [draftYear, setDraftYear] = useState(initialYear);
  const [draftGenres, setDraftGenres] = useState<string[]>(initialGenres);
  const [genreQuery, setGenreQuery] = useState("");

  useEffect(() => {
    setCurrentPage(Math.min(initialPage, totalPages));
  }, [initialPage, totalPages]);

  useEffect(() => {
    setSearchValue(initialQuery);
    setDraftType(initialType);
    setDraftSeason(initialSeason);
    setDraftYear(initialYear);
    setDraftGenres(initialGenres);
  }, [initialGenres, initialQuery, initialSeason, initialType, initialYear]);

  useEffect(() => {
    if (!isSheetOpen) {
      setGenreQuery("");
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isSheetOpen]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * MOBILE_FILTER_PAGE_SIZE;
    return items.slice(start, start + MOBILE_FILTER_PAGE_SIZE);
  }, [currentPage, items]);

  const filteredGenres = useMemo(() => {
    const normalizedQuery = genreQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return genres;
    }

    return genres.filter((genre) => genre.toLowerCase().includes(normalizedQuery));
  }, [genreQuery, genres]);

  const typeOptions = useMemo(
    () =>
      types.map((type) => ({
        label: type === FILTER_ALL_TYPES ? "All Types" : type,
        value: type
      })),
    [types]
  );
  const seasonOptions = useMemo(
    () => [
      { label: "All Seasons", value: FILTER_DEFAULT_SEASON },
      { label: "Winter", value: "Winter" },
      { label: "Spring", value: "Spring" },
      { label: "Summer", value: "Summer" },
      { label: "Fall", value: "Fall" }
    ],
    []
  );
  const yearOptions = useMemo(
    () =>
      getFilterYearOptions().map((year) => ({
        label: year === FILTER_ALL_YEARS ? "All Years" : year,
        value: year
      })),
    []
  );

  function replaceRoute(href: string) {
    if (typeof window !== "undefined") {
      const currentHref = `${pathname}${window.location.search}`;

      if (href === currentHref) {
        return;
      }

      window.dispatchEvent(new Event(ROUTE_PROGRESS_START_EVENT));
    }

    router.replace(href);
  }

  function commitRoute(next: {
    query?: string;
    type?: string;
    season?: string;
    year?: string;
    genres?: string[];
  }) {
    replaceRoute(
      buildFilterHref({
        query: next.query,
        type: next.type,
        season: next.season,
        year: next.year,
        genres: next.genres
      })
    );
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    commitRoute({
      query: searchValue,
      type: initialType,
      season: initialSeason,
      year: initialYear,
      genres: initialGenres
    });
  }

  function clearSearch() {
    setSearchValue("");
    commitRoute({
      query: "",
      type: initialType,
      season: initialSeason,
      year: initialYear,
      genres: initialGenres
    });
  }

  function openSheet() {
    setDraftType(initialType);
    setDraftSeason(initialSeason);
    setDraftYear(initialYear);
    setDraftGenres(initialGenres);
    setGenreQuery("");
    setIsSheetOpen(true);
  }

  function closeSheet() {
    setDraftType(initialType);
    setDraftSeason(initialSeason);
    setDraftYear(initialYear);
    setDraftGenres(initialGenres);
    setGenreQuery("");
    setIsSheetOpen(false);
  }

  function resetDraftFilters() {
    setDraftType(FILTER_ALL_TYPES);
    setDraftSeason(FILTER_DEFAULT_SEASON);
    setDraftYear(currentYear);
    setDraftGenres([]);
    setGenreQuery("");
  }

  function applyDraftFilters() {
    setIsSheetOpen(false);
    commitRoute({
      query: searchValue,
      type: draftType,
      season: draftSeason,
      year: draftYear,
      genres: draftGenres
    });
  }

  function toggleDraftGenre(genre: string) {
    setDraftGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    );
  }

  function updatePage(nextPage: number) {
    const clampedPage = Math.min(Math.max(1, nextPage), totalPages);
    setCurrentPage(clampedPage);

    const href = buildFilterHref({
      query: initialQuery,
      type: initialType,
      season: initialSeason,
      year: initialYear,
      genres: initialGenres,
      page: clampedPage
    });

    window.history.replaceState({}, "", href);
  }

  const advancedFilterCount =
    (initialType !== FILTER_ALL_TYPES ? 1 : 0) +
    (initialSeason !== FILTER_DEFAULT_SEASON ? 1 : 0) +
    (initialYear !== currentYear ? 1 : 0) +
    initialGenres.length;

  const summaryChips: FilterChipConfig[] = [
    ...(initialQuery
      ? [
          {
            id: "query",
            label: `Search: ${initialQuery}`,
            onRemove: () =>
              commitRoute({
                query: "",
                type: initialType,
                season: initialSeason,
                year: initialYear,
                genres: initialGenres
              })
          }
        ]
      : []),
    ...(initialType !== FILTER_ALL_TYPES
      ? [
          {
            id: "type",
            label: initialType,
            onRemove: () =>
              commitRoute({
                query: initialQuery,
                type: FILTER_ALL_TYPES,
                season: initialSeason,
                year: initialYear,
                genres: initialGenres
              })
          }
        ]
      : []),
    ...(initialSeason !== FILTER_DEFAULT_SEASON
      ? [
          {
            id: "season",
            label: initialSeason,
            onRemove: () =>
              commitRoute({
                query: initialQuery,
                type: initialType,
                season: FILTER_DEFAULT_SEASON,
                year: initialYear,
                genres: initialGenres
              })
          }
        ]
      : []),
    ...(initialYear !== currentYear
      ? [
          {
            id: "year",
            label: initialYear === FILTER_ALL_YEARS ? "All Years" : initialYear,
            onRemove: () =>
              commitRoute({
                query: initialQuery,
                type: initialType,
                season: initialSeason,
                year: currentYear,
                genres: initialGenres
              })
          }
        ]
      : []),
    ...initialGenres.map((genre) => ({
      id: `genre-${genre}`,
      label: genre,
      onRemove: () =>
        commitRoute({
          query: initialQuery,
          type: initialType,
          season: initialSeason,
          year: initialYear,
          genres: initialGenres.filter((item) => item !== genre)
        })
    }))
  ];

  return (
    <MobileAppShell hideBottomNav={isSheetOpen}>
      <div className="space-y-4">
        <header className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--panel-surface)] px-4 py-4 shadow-[var(--panel-shadow)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  aria-label="Back to home"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] text-[var(--text-primary)]"
                >
                  <MaterialIcon className="text-[20px]" name="arrow_back" />
                </Link>
                <div>
                  <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                    Mobile Browse
                  </p>
                  <h1 className="text-[1.4rem] font-semibold text-[var(--text-primary)]">Filter anime</h1>
                </div>
              </div>
              <p className="pl-12 text-sm text-[var(--text-secondary)]">
                {items.length} result{items.length === 1 ? "" : "s"} ready
              </p>
            </div>
            <button
              type="button"
              onClick={openSheet}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]"
            >
              <MaterialIcon className="text-[20px]" name="tune" />
              Filter
              {advancedFilterCount > 0 ? (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--bg-card-soft)] px-1.5 text-[0.74rem] text-[var(--text-primary)]">
                  {advancedFilterCount}
                </span>
              ) : null}
            </button>
          </div>

          <form className="mt-4 flex items-center gap-2" onSubmit={submitSearch}>
            <label className="relative min-w-0 flex-1">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
                <MaterialIcon className="text-[19px]" name="search" />
              </span>
              <input
                value={searchValue}
                placeholder="Search title"
                onChange={(event) => setSearchValue(event.target.value)}
                className="h-12 w-full rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] pl-10 pr-10 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:bg-[var(--bg-card-soft)]"
              />
              {searchValue.trim() ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-3 inline-flex items-center text-[var(--text-muted)]"
                >
                  <MaterialIcon className="text-[18px]" name="close" />
                </button>
              ) : null}
            </label>
            <button
              type="submit"
              className="flex h-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] px-4 text-sm font-semibold text-[var(--bg-base)] shadow-[0_16px_30px_var(--accent-soft)]"
            >
              Search
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
              Applied filters
            </p>
            <span className="text-[0.76rem] text-[var(--text-secondary)]">
              Page {currentPage} of {totalPages}
            </span>
          </div>

          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {summaryChips.length > 0 ? (
              summaryChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onRemove}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] px-3 py-2 text-[0.75rem] font-medium text-[var(--text-primary)]"
                >
                  <span>{chip.label}</span>
                  <MaterialIcon className="text-[16px] text-[var(--text-muted)]" name="close" />
                </button>
              ))
            ) : (
              <div className="rounded-full border border-dashed border-[var(--line-soft)] bg-[var(--bg-card)] px-3 py-2 text-[0.78rem] text-[var(--text-secondary)]">
                Search by title or open the sheet to refine results.
              </div>
            )}
          </div>
        </header>

        {items.length === 0 ? (
          <section className="rounded-[30px] border border-[var(--line-soft)] bg-[var(--bg-card)] px-5 py-12 text-center shadow-[var(--soft-shadow)]">
            <p className="text-[0.76rem] uppercase tracking-[0.28em] text-[var(--accent-strong)]">
              No Match
            </p>
            <h2 className="mt-3 text-[1.45rem] font-semibold text-[var(--text-primary)]">
              Nothing matched this filter set
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">
              Try a broader title, switch the year, or remove one of the genre tags.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {pageItems.map((item) => (
                <MobilePosterCard key={item.id} item={item} className="min-h-0 w-full shrink" />
              ))}
            </div>

            <div className="rounded-[28px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-3.5 shadow-[var(--soft-shadow)]">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => updatePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-primary)] disabled:opacity-40"
                >
                  <MaterialIcon className="text-[18px]" name="chevron_left" />
                  Prev
                </button>
                <div className="text-center">
                  <p className="mt-1 text-base font-semibold text-[var(--text-primary)]">{currentPage}</p>
                </div>
                <button
                  type="button"
                  onClick={() => updatePage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] px-4 text-sm font-medium text-[var(--text-primary)] disabled:opacity-40"
                >
                  Next
                  <MaterialIcon className="text-[18px]" name="chevron_right" />
                </button>
              </div>
            </div>
          </section>
        )}
      </div>

      {isSheetOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end bg-[var(--mobile-sheet-overlay)] px-3 pb-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] pt-10 backdrop-blur-[3px]">
          <button
            type="button"
            aria-label="Close filter sheet"
            onClick={closeSheet}
            className="absolute inset-0"
          />
          <section
            aria-labelledby="mobile-filter-sheet-title"
            className="relative mx-auto flex max-h-[88vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[30px] border border-[var(--line-strong)] bg-[var(--mobile-sheet-surface)] shadow-[var(--mobile-sheet-shadow)]"
          >
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[linear-gradient(90deg,var(--accent-soft),transparent_56%)] px-5 py-4">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                  Refine Results
                </p>
                <h2 id="mobile-filter-sheet-title" className="mt-1 text-[1.2rem] font-semibold text-[var(--text-primary)]">
                  Tune the catalog
                </h2>
              </div>
              <button
                type="button"
                onClick={closeSheet}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card-muted)] text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[20px]" name="close" />
              </button>
            </div>

            <div className="space-y-5 overflow-y-auto px-5 py-5">
              <div className="rounded-[24px] border border-[var(--line-strong)] bg-[var(--mobile-sheet-section-surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                      Live result set
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                      Applied filters currently show {items.length} anime. Use Apply when this draft feels right.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetDraftFilters}
                    className="shrink-0 rounded-full border border-[var(--line-soft)] bg-[var(--bg-card-muted)] px-3 py-2 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)]"
                  >
                    Reset all
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <MobileFilterSelect
                  label="Type"
                  value={draftType}
                  options={typeOptions}
                  onChange={setDraftType}
                />
                <MobileFilterSelect
                  label="Season"
                  value={draftSeason}
                  options={seasonOptions}
                  onChange={setDraftSeason}
                />
                <MobileFilterSelect
                  label="Year"
                  value={draftYear}
                  options={yearOptions}
                  onChange={setDraftYear}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.7rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                      Genres
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      Multiple genres must all match.
                    </p>
                  </div>
                  {draftGenres.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setDraftGenres([])}
                      className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>

                <label className="relative block">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
                    <MaterialIcon className="text-[18px]" name="search" />
                  </span>
                  <input
                    value={genreQuery}
                    placeholder="Find genre"
                    onChange={(event) => setGenreQuery(event.target.value)}
                    className="h-11 w-full rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] pl-10 pr-4 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)]"
                  />
                </label>

                <div className="max-h-[280px] overflow-y-auto rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-3">
                  <div className="flex flex-wrap gap-2">
                    {filteredGenres.map((genre) => {
                      const selected = draftGenres.includes(genre);

                      return (
                        <button
                          key={genre}
                          type="button"
                          onClick={() => toggleDraftGenre(genre)}
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[0.76rem] font-medium transition-[border-color,background-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
                            selected
                              ? "border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                              : "border-[var(--line-soft)] bg-[var(--bg-card-soft)] text-[var(--text-secondary)]"
                          }`}
                        >
                          <span
                            className={`flex h-4 w-4 items-center justify-center rounded-full ${
                              selected ? "bg-[var(--bg-card-soft)]" : "bg-[var(--bg-card)]"
                            }`}
                          >
                            <MaterialIcon className="text-[12px]" name={selected ? "done" : "add"} />
                          </span>
                          {genre}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-[var(--line-soft)] bg-[var(--bg-card-muted)] px-5 py-4">
              <button
                type="button"
                onClick={closeSheet}
                className="flex h-12 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] text-sm font-semibold text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyDraftFilters}
                className="flex h-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-sm font-semibold text-[var(--bg-base)] shadow-[0_16px_30px_var(--accent-soft)]"
              >
                Apply filters
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </MobileAppShell>
  );
}

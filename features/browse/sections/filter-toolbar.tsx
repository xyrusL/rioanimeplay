"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  buildFilterHref,
  FILTER_ALL_TYPES,
  FILTER_ALL_YEARS,
  FILTER_SEASONS,
  getFilterYearOptions,
} from "@/features/browse/model/filter-utils";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { CustomSelect } from "@/shared/ui/custom-select";
import { ROUTE_PROGRESS_START_EVENT } from "@/shared/ui/route-progress";

type FilterToolbarProps = {
  initialQuery: string;
  initialType: string;
  initialSeason: string;
  initialYear: string;
  initialGenres?: string[];
  genres: string[];
  types: string[];
};

export function FilterToolbar({
  initialQuery,
  initialType,
  initialSeason,
  initialYear,
  initialGenres,
  genres,
  types
}: FilterToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hasMountedRef = useRef(false);
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState(initialType);
  const [selectedSeason, setSelectedSeason] = useState(initialSeason);
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres ?? []);

  const seasonOptions = FILTER_SEASONS.map((season) => ({
    label: season,
    value: season
  }));
  const yearOptions = getFilterYearOptions().map((year) => ({
    label: year === FILTER_ALL_YEARS ? "All Years" : year,
    value: year
  }));
  const typeOptions = types.map((type) => ({
    label: type === FILTER_ALL_TYPES ? "All Types" : type,
    value: type
  }));

  const buildTargetHref = useCallback(() => {
    return buildFilterHref({
      query: debouncedQuery,
      type: selectedType,
      season: selectedSeason,
      year: selectedYear,
      genres: selectedGenres
    });
  }, [debouncedQuery, selectedGenres, selectedSeason, selectedType, selectedYear]);

  function toggleGenre(genre: string) {
    setSelectedGenres((current) =>
      current.includes(genre)
        ? current.filter((item) => item !== genre)
        : [...current, genre]
    );
  }

  useEffect(() => {
    setQuery(initialQuery);
    setDebouncedQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setSelectedType(initialType);
  }, [initialType]);

  useEffect(() => {
    setSelectedSeason(initialSeason);
  }, [initialSeason]);

  useEffect(() => {
    setSelectedYear(initialYear);
  }, [initialYear]);

  useEffect(() => {
    setSelectedGenres(initialGenres ?? []);
  }, [initialGenres]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [query]);

  useEffect(() => {
    const nextHref = buildTargetHref();
    const currentHref = `${pathname}${window.location.search}`;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    if (currentHref !== nextHref) {
      window.dispatchEvent(new Event(ROUTE_PROGRESS_START_EVENT));
      router.replace(nextHref);
    }
  }, [buildTargetHref, pathname, router]);

  return (
    <div className="space-y-3 border-b border-[var(--line-soft)] bg-[rgba(255,255,255,0.02)] px-4 py-3 sm:px-5">
      <div className="space-y-1">
        <p className="font-display text-[0.74rem] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
          Refine Results
        </p>
        <p className="max-w-3xl text-[0.8rem] leading-5 text-[var(--text-secondary)]">
          Search again, narrow by type, then layer season, year, and genre without leaving this page.
        </p>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_repeat(3,minmax(0,0.8fr))]">
        <label className="space-y-1.5">
          <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Search
          </span>
          <span className="relative block">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
              <MaterialIcon className="text-[16px]" name="search" />
            </span>
            <input
              value={query}
              placeholder="Search title"
              onChange={(event) => setQuery(event.target.value)}
              className="h-10 w-full rounded-xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] pl-10 pr-10 text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] transition-[border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] focus:border-[var(--line-strong)] focus:bg-[rgba(255,255,255,0.05)]"
            />
            {query.trim().length > 0 ? (
              <button
                type="button"
                aria-label="Clear search query"
                onClick={() => setQuery("")}
                className="absolute inset-y-0 right-3 inline-flex cursor-pointer items-center text-[var(--text-muted)] transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[16px]" name="close" />
              </button>
            ) : null}
          </span>
        </label>
        <CustomSelect
          label="Type"
          value={selectedType}
          options={typeOptions}
          onChange={setSelectedType}
        />
        <CustomSelect
          label="Season"
          value={selectedSeason}
          options={seasonOptions}
          onChange={setSelectedSeason}
        />
        <CustomSelect
          label="Year"
          value={selectedYear}
          options={yearOptions}
          onChange={setSelectedYear}
        />
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.64rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Genres
          </p>
          <button
            type="button"
            onClick={() => setSelectedGenres([])}
            className="text-[0.64rem] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--text-primary)]"
          >
            Clear Genres
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto rounded-[16px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.02)] p-2.5">
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const isSelected = selectedGenres.includes(genre);

              return (
                <button
                  key={genre}
                  type="button"
                  onClick={() => toggleGenre(genre)}
                  className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.08em] transition-[border-color,background-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 ${
                    isSelected
                      ? "border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                      : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border ${
                      isSelected
                        ? "border-[var(--accent-strong)] bg-[rgba(141,114,255,0.16)] text-[var(--accent-strong)]"
                        : "border-[rgba(255,255,255,0.12)] text-transparent"
                    }`}
                  >
                    <MaterialIcon className="text-[10px]" name="done" />
                  </span>
                  {genre}
                </button>
              );
            })}
          </div>
        </div>
        <span className="text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          Results update automatically. Multiple genres require anime to match all selected tags.
        </span>
      </div>
    </div>
  );
}

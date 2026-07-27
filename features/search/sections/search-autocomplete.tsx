"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { buildFilterHref, FILTER_ALL_YEARS } from "@/features/browse/model/filter-utils";
import {
  loadBrowserSearchIndex,
  rankBrowserSearchItems,
  type BrowserSearchItem
} from "@/features/search/model/browser-anime-search";
import { MOTION_VARIANTS } from "@/shared/lib/motion";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type SearchAutocompleteProps = {
  className?: string;
  resultLimit?: number;
};

export function SearchAutocomplete({
  className,
  resultLimit = Number.POSITIVE_INFINITY
}: SearchAutocompleteProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const indexPromiseRef = useRef<Promise<BrowserSearchItem[]> | null>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState<BrowserSearchItem[] | null>(null);
  const [results, setResults] = useState<BrowserSearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function clearSearch() {
    setQuery("");
    setResults([]);
    setIsLoading(false);
    setIsOpen(false);
  }

  function buildResultsHref() {
    return buildFilterHref({
      query,
      year: FILTER_ALL_YEARS
    });
  }

  function ensureIndex() {
    if (index || indexPromiseRef.current) return;
    indexPromiseRef.current = loadBrowserSearchIndex()
      .then(({ data }) => {
        setIndex(data);
        return data;
      })
      .catch(() => {
        setIndex([]);
        return [];
      });
  }

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 1) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    if (!index) {
      setIsLoading(true);
      return;
    }

    setResults(rankBrowserSearchItems(index, trimmedQuery));
    setIsLoading(false);
    setIsOpen(true);
  }, [index, query]);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className ?? ""}`}>
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
        <MaterialIcon className="text-[18px]" name="search" />
      </span>
      <input
        value={query}
        aria-label="Search anime"
        placeholder="Search"
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          if (event.target.value.trim()) ensureIndex();
        }}
        onFocus={() => {
          ensureIndex();
          if (results.length > 0) {
            setIsOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            const trimmedQuery = query.trim();

            if (trimmedQuery) {
              setIsOpen(false);
              router.push(buildResultsHref());
            }
          }
        }}
        className="h-11 w-full rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.04)] pl-10 pr-12 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)] transition-[border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] focus:border-[var(--line-strong)] focus:bg-[rgba(255,255,255,0.05)]"
      />
      {query.length > 0 ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={clearSearch}
          className="absolute inset-y-0 right-3 inline-flex cursor-pointer items-center text-[var(--text-muted)] transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--text-primary)]"
        >
          <MaterialIcon className="text-[18px]" name="close" />
        </button>
      ) : null}

      <AnimatePresence>
        {isOpen && query.trim().length >= 1 ? (
        <motion.div
          initial="initial"
          animate="animate"
          exit="exit"
          variants={MOTION_VARIANTS.dropdown}
          style={{ originY: 0 }}
          className="absolute left-0 right-0 top-[calc(100%+10px)] z-[320] overflow-hidden rounded-[24px] border border-[rgba(141,114,255,0.18)] bg-[var(--search-surface)] shadow-[0_28px_80px_rgba(0,0,0,0.58)]"
        >
          {isLoading ? (
            <div className="min-h-[96px] bg-[var(--search-status-surface)] px-5 py-6 text-sm font-medium text-[var(--text-primary)]">
              Searching anime...
            </div>
          ) : results.length === 0 ? (
            <>
              <div className="min-h-[96px] bg-[var(--search-status-surface)] px-5 py-6 text-sm font-medium text-[var(--text-primary)]">
                No quick match showed up here yet.
              </div>
              <Link
                href={buildResultsHref()}
                onClick={() => setIsOpen(false)}
                className="flex cursor-pointer items-center justify-center border-t border-[rgba(255,255,255,0.05)] bg-[#181820] px-5 py-4 text-center text-[0.95rem] font-semibold text-[var(--text-muted)] transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--text-primary)]"
              >
                Search in filter page
                <span className="ml-1 inline-block align-middle">
                  <MaterialIcon className="text-[18px]" name="arrow_right_alt" />
                </span>
              </Link>
            </>
          ) : (
            <>
              <div className="max-h-[min(360px,calc(100dvh-15rem))] overflow-y-auto bg-[#181820] sm:max-h-[520px]">
                {results.slice(0, resultLimit).map((result) => (
                  <Link
                    key={result.id}
                    href={result.href}
                    onClick={() => setIsOpen(false)}
                    className="flex cursor-pointer items-center gap-2.5 border-b border-[rgba(255,255,255,0.05)] bg-[#181820] px-3 py-2.5 transition-[background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:bg-[#22222c] sm:gap-3 sm:px-5 sm:py-4"
                  >
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-[rgba(255,255,255,0.08)] sm:h-[72px] sm:w-[72px] sm:rounded-[18px]">
                      <Image
                        fill
                        alt={result.title}
                        className="object-cover"
                        sizes="(max-width: 639px) 56px, 72px"
                        src={result.coverImage}
                      />
                    </div>
                    <div className="min-w-0 space-y-1 sm:space-y-2">
                      <div>
                        <p className="line-clamp-1 text-[0.9rem] font-semibold text-[var(--text-primary)] sm:text-[1rem]">
                          {result.title}
                        </p>
                        {result.alternateTitles.length > 0 ? (
                          <p className="line-clamp-1 text-[0.74rem] text-[var(--text-muted)] sm:text-[0.84rem]">
                            {result.alternateTitles.join("; ")}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[0.64rem] text-[var(--text-secondary)] sm:gap-2 sm:text-[0.72rem]">
                        <span className="inline-flex items-center gap-1 rounded-[9px] border border-[rgba(255,122,73,0.34)] bg-[rgba(255,122,73,0.12)] px-1.5 py-0.5 font-semibold text-[#ff8b58]">
                          <MaterialIcon className="text-[12px]" name="movie" />
                          {result.episodesLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[9px] border border-[rgba(123,174,255,0.28)] bg-[rgba(123,174,255,0.12)] px-1.5 py-0.5 font-semibold text-[#9ec5ff]">
                          <MaterialIcon className="text-[12px]" name="calendar_month" />
                          {result.yearLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[9px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.06)] px-1.5 py-0.5 font-semibold text-[var(--text-primary)]">
                          <MaterialIcon className="text-[12px]" name="live_tv" />
                          {result.formatLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[9px] border border-[rgba(255,199,92,0.3)] bg-[rgba(255,199,92,0.14)] px-1.5 py-0.5 font-semibold text-[#ffcf70]">
                          <MaterialIcon className="text-[12px]" filled name="star" />
                          {result.scoreLabel}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href={buildResultsHref()}
                onClick={() => setIsOpen(false)}
                className="flex cursor-pointer items-center justify-center border-t border-[rgba(255,255,255,0.05)] bg-[#181820] px-4 py-3 text-center text-[0.86rem] font-semibold text-[var(--text-muted)] transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--text-primary)] sm:px-5 sm:py-4 sm:text-[0.95rem]"
              >
                View matching results
                <span className="ml-1 inline-block align-middle">
                  <MaterialIcon className="text-[18px]" name="arrow_right_alt" />
                </span>
              </Link>
            </>
          )}
        </motion.div>
      ) : null}
      </AnimatePresence>
    </div>
  );
}

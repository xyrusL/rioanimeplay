"use client";

import { useEffect, useMemo, useState } from "react";

import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { getBookmarkedAnimeIds } from "@/shared/lib/watch-storage";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { Panel } from "@/shared/ui/panel";

import { AnimeCard } from "@/features/home/sections/anime-card";

const CONTENT_TABS = [
  { id: "recent", label: "Recent", icon: "history" },
  { id: "sub", label: "Sub", icon: "subtitles" },
  { id: "dub", label: "Dub", icon: "mic" },
  { id: "followed", label: "Followed", icon: "bookmark" },
  { id: "movie", label: "Movie", icon: "movie" }
] as const;

type ContentTabId = (typeof CONTENT_TABS)[number]["id"];
const PAGE_SIZE = 20;

type AnimeGridProps = {
  items: HomeAnimeItem[];
};

export function AnimeGrid({ items }: AnimeGridProps) {
  const [activeTab, setActiveTab] = useState<ContentTabId>("recent");
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);
  const [pageByTab, setPageByTab] = useState<Record<ContentTabId, number>>({
    recent: 0,
    sub: 0,
    dub: 0,
    followed: 0,
    movie: 0
  });

  useEffect(() => {
    setBookmarkedIds(getBookmarkedAnimeIds());

    function handleStorage(event: StorageEvent) {
      if (event.key && event.key !== "rioanime:bookmarks") {
        return;
      }

      setBookmarkedIds(getBookmarkedAnimeIds());
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case "sub":
        return items.filter((item) => item.hasSub);
      case "dub":
        return items.filter((item) => item.hasDub);
      case "movie":
        return items.filter((item) => item.formatLabel === "Movie");
      case "followed":
        return items.filter((item) => bookmarkedIds.includes(item.id));
      case "recent":
      default:
        return items;
    }
  }, [activeTab, bookmarkedIds, items]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(pageByTab[activeTab] ?? 0, totalPages - 1);
  const pagedItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredItems.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredItems]);

  function handleTabChange(tabId: ContentTabId) {
    setActiveTab(tabId);
    setPageByTab((prev) => ({
      ...prev,
      [tabId]: 0
    }));
  }

  function handlePageChange(selectedPage: number) {
    setPageByTab((prev) => {
      return {
        ...prev,
        [activeTab]: selectedPage
      };
    });
  }

  return (
    <Panel actionLabel="Demo Feed" icon="movie_filter" title="Browse Library">
      <div className="border-b border-[var(--line-soft)] px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {CONTENT_TABS.map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 ${
                  activeTab === tab.id
                    ? "bg-[var(--accent-soft)] text-[var(--accent-strong)]"
                    : "border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:border-[var(--line-strong)]"
                }`}
              >
                <MaterialIcon className="text-[15px]" name={tab.icon} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              aria-label="Show previous page"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-40 disabled:hover:border-[var(--line-soft)] disabled:hover:text-[var(--text-secondary)] disabled:hover:translate-y-0"
            >
              <MaterialIcon className="text-[18px]" name="chevron_left" />
            </button>
            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-3 text-[0.68rem] font-semibold text-[var(--accent-strong)] shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
              {currentPage + 1}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              aria-label="Show next page"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-40 disabled:hover:border-[var(--line-soft)] disabled:hover:text-[var(--text-secondary)] disabled:hover:translate-y-0"
            >
              <MaterialIcon className="text-[18px]" name="chevron_right" />
            </button>
          </div>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex min-h-[260px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <MaterialIcon
              className="text-[28px]"
              name={activeTab === "followed" ? "bookmark" : "movie_filter"}
            />
          </span>
          <div className="space-y-1">
            <p className="font-display text-[1rem] uppercase tracking-[0.18em] text-[var(--text-primary)]">
              {activeTab === "followed" ? "No Followed Anime" : "No Anime Found"}
            </p>
            <p className="max-w-md text-sm leading-6 text-[var(--text-secondary)]">
              {activeTab === "followed"
                ? "Bookmarked anime will appear here once you save them from the watch page."
                : "AniList did not return live anime for this tab right now."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {pagedItems.map((item) => (
            <AnimeCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </Panel>
  );
}

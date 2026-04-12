"use client";

import { useMemo, useState } from "react";

import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { MobilePosterCard } from "@/features/mobile/shared/mobile-anime-card";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

const PAGE_SIZE = 6;

type MobileRecentUpdatesSectionProps = {
  items: HomeAnimeItem[];
};

export function MobileRecentUpdatesSection({
  items
}: MobileRecentUpdatesSectionProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleItems = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [currentPage, items]);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
            Fresh batch
          </p>
          <h2 className="mt-1 text-[1.3rem] font-semibold text-[var(--text-primary)]">Recent Updates</h2>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(0, value - 1))}
            disabled={currentPage === 0}
            aria-label="Show previous page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[var(--line-soft)] disabled:hover:text-[var(--text-secondary)]"
          >
            <MaterialIcon className="text-[18px]" name="chevron_left" />
          </button>
          <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-3 text-[0.72rem] font-semibold text-[var(--accent-strong)] shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
            {currentPage + 1}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}
            disabled={currentPage >= totalPages - 1}
            aria-label="Show next page"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] text-[var(--text-secondary)] transition-[background-color,border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] disabled:cursor-default disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-[var(--line-soft)] disabled:hover:text-[var(--text-secondary)]"
          >
            <MaterialIcon className="text-[18px]" name="chevron_right" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-4">
        {visibleItems.map((item) => (
          <div key={item.id} className="min-w-0">
            <MobilePosterCard className="w-full" item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}

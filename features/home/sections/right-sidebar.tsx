"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import {
  FILTER_SEASONS,
  getFilterYearOptions
} from "@/features/browse/model/filter-utils";
import { CustomSelect } from "@/shared/ui/custom-select";
import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { WeeklyTopEntry } from "@/entities/anime/model/types";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { LockdownAction } from "@/shared/ui/lockdown-action";
import { Panel } from "@/shared/ui/panel";

type RightSidebarProps = {
  authLockdownEnabled: boolean;
  authLockdownMessage: string;
  genres: string[];
  weeklyTop: WeeklyTopEntry[];
};

const VISIBLE_GENRE_COUNT = 8;

export function RightSidebar({
  authLockdownEnabled,
  authLockdownMessage,
  genres,
  weeklyTop
}: RightSidebarProps) {
  const router = useRouter();
  const [isGenresModalOpen, setIsGenresModalOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<(typeof FILTER_SEASONS)[number]>("Winter");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const visibleGenres = useMemo(() => genres.slice(0, VISIBLE_GENRE_COUNT), [genres]);
  const overflowGenres = useMemo(() => genres.slice(VISIBLE_GENRE_COUNT), [genres]);

  function handleBrowseFilter() {
    const params = new URLSearchParams({
      season: selectedSeason,
      year: selectedYear
    });

    router.push(`/filter?${params.toString()}`);
  }

  return (
    <>
      <aside className="space-y-5 xl:sticky xl:top-4 xl:self-start">
        <Panel icon="account_circle" title="Member Access">
          <div className="space-y-4 p-4">
            <label className="space-y-1.5">
              <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Username
              </span>
              <input
                readOnly
                placeholder="Username"
                className="h-10 w-full rounded-xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Password
              </span>
              <input
                readOnly
                placeholder="Password"
                className="h-10 w-full rounded-xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <input type="checkbox" readOnly checked className="accent-[var(--accent)]" />
                Remember me
              </label>
              <LockdownAction
                locked={authLockdownEnabled}
                message={authLockdownMessage}
                className="text-xs uppercase tracking-[0.18em] text-[var(--accent-strong)]"
                href="/account?mode=register"
              >
                Register
              </LockdownAction>
            </div>
            <LockdownAction
              locked={authLockdownEnabled}
              message={authLockdownMessage}
              href="/account?mode=login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--accent),#5f4ed8)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_28px_rgba(95,78,216,0.28)]"
            >
              <MaterialIcon className="text-[18px]" name="login" />
              Login
            </LockdownAction>
          </div>
        </Panel>

        <Panel allowOverflow icon="tune" title="Browse Filters">
          <div className="space-y-4 p-4">
            <div className="grid grid-cols-2 gap-3">
              <CustomSelect
                label="Season"
                value={selectedSeason}
                options={FILTER_SEASONS.map((season) => ({ label: season, value: season }))}
                onChange={(value) =>
                  setSelectedSeason(value as (typeof FILTER_SEASONS)[number])
                }
              />
              <CustomSelect
                label="Year"
                value={selectedYear}
                options={getFilterYearOptions().map((year) => ({ label: year, value: year }))}
                onChange={setSelectedYear}
              />
            </div>
            <button
              type="button"
              onClick={handleBrowseFilter}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.04)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]"
            >
              <MaterialIcon className="text-[16px]" name="travel_explore" />
              Go
            </button>
          </div>
        </Panel>

        <Panel actionLabel="Top Tags" icon="category" title="Genres">
          {genres.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--text-muted)]">
              No live genres available right now.
            </div>
          ) : (
            <div className="space-y-3 p-4">
              <div className="grid grid-cols-2 gap-2">
                {visibleGenres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/filter?genres=${encodeURIComponent(genre)}`}
                    className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] px-3 py-2 text-xs text-[var(--text-secondary)]"
                  >
                    <MaterialIcon
                      className="leading-none text-[var(--accent-strong)]"
                      name="sell"
                      style={{ fontSize: "15px" }}
                    />
                    <span>{genre}</span>
                  </Link>
                ))}
              </div>
              {overflowGenres.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setIsGenresModalOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
                >
                  <MaterialIcon className="text-[16px]" name="apps" />
                  See More
                </button>
              ) : null}
            </div>
          )}
        </Panel>

        <Panel actionLabel="Top 10" icon="leaderboard" title="Weekly Top">
          {weeklyTop.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--text-muted)]">
              No live weekly ranking available right now.
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {weeklyTop.map((entry) => (
                <Link
                  key={entry.id}
                  href={`/watch/${toAnimeSlug(entry.title)}`}
                  className="flex items-center gap-3 rounded-[18px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] p-3 transition-[border-color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
                >
                  <div className="flex w-6 shrink-0 justify-center font-display text-[0.98rem] text-[var(--gold)]">
                    {entry.rank}
                  </div>
                  <div className="relative h-[68px] w-[48px] shrink-0 overflow-hidden rounded-[10px]">
                    <Image
                      fill
                      alt={entry.title}
                      className="object-cover"
                      sizes="48px"
                      src={entry.image}
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h3 className="line-clamp-2 text-[0.84rem] leading-5 font-semibold text-[var(--text-primary)]">
                      {entry.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                        <MaterialIcon className="leading-none" name="movie" style={{ fontSize: "18px" }} />
                        {entry.meta}
                      </p>
                      <p className="flex items-center gap-0.5 text-[0.65rem] font-semibold text-[var(--accent-strong)]">
                        <MaterialIcon
                          className="leading-none"
                          filled
                          name="star"
                          style={{ fontSize: "18px" }}
                        />
                        {entry.scoreLabel}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </aside>

      {isGenresModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--modal-overlay)] px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="all-genres-title"
          onClick={() => setIsGenresModalOpen(false)}
        >
          <div
            className="flex max-h-[calc(100vh-3rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] border border-[var(--line-strong)] bg-[var(--modal-surface)] shadow-[var(--modal-shadow)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--modal-header-surface)] px-5 py-4">
              <div>
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Extra Genres
                </p>
                <h3
                  id="all-genres-title"
                  className="mt-1 font-display text-[1rem] uppercase tracking-[0.18em] text-[var(--accent-strong)]"
                >
                  More Tags
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close genres modal"
                onClick={() => setIsGenresModalOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.05)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[18px]" name="close" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto bg-transparent p-5">
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Most-selected tags stay on the sidebar. The rest live here so the home layout stays tighter.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {overflowGenres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/filter?genres=${encodeURIComponent(genre)}`}
                    onClick={() => setIsGenresModalOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[var(--modal-section-surface)] px-3 py-2.5 text-sm text-[var(--text-secondary)]"
                  >
                    <MaterialIcon
                      className="leading-none text-[var(--accent-strong)]"
                      name="sell"
                      style={{ fontSize: "15px" }}
                    />
                    <span>{genre}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

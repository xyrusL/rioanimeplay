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
import type { WeeklyTopEntry } from "@/entities/anime/model/types";
import { AnimatedModal } from "@/shared/ui/animated-modal";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { LockdownAction } from "@/shared/ui/lockdown-action";
import { Panel } from "@/shared/ui/panel";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";

type RightSidebarProps = {
  authLockdownEnabled: boolean;
  authLockdownMessage: string;
  genres: string[];
  member: { name: string; email: string; image: string | null } | null;
  weeklyTop: WeeklyTopEntry[];
};

const VISIBLE_GENRE_COUNT = 8;

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
      <path fill="#4285f4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
      <path fill="#34a853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#fbbc05" d="M6.39 13.93A6 6 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.55l3.35-2.62Z" />
      <path fill="#ea4335" d="M12 5.94c1.47 0 2.79.5 3.82 1.5l2.88-2.88A9.66 9.66 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

export function RightSidebar({
  authLockdownEnabled,
  authLockdownMessage,
  genres,
  member,
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
            {member ? (
              <>
                <div className="rounded-[18px] border border-emerald-300/10 bg-[linear-gradient(145deg,rgba(62,210,151,0.08),rgba(128,78,225,0.07))] p-4">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar
                      className="h-11 w-11 rounded-full bg-[linear-gradient(135deg,#e45da9,#765be5)] text-base font-black text-white shadow-[0_10px_24px_rgba(157,72,206,0.2)]"
                      image={member.image}
                      imageSizes="44px"
                      name={member.name}
                    />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 text-[0.64rem] font-bold uppercase tracking-[0.16em] text-emerald-300/80">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                        Signed in
                      </span>
                      <strong className="mt-1 block truncate text-sm text-[var(--text-primary)]">{member.name}</strong>
                    </span>
                  </div>
                  {member.email ? <p className="mt-3 truncate text-xs text-[var(--text-muted)]">{member.email}</p> : null}
                </div>
                <Link href="/account" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(90deg,var(--accent),#5f4ed8)] px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_14px_28px_rgba(95,78,216,0.28)]">
                  <MaterialIcon className="text-[18px]" name="manage_accounts" />
                  Open Account
                </Link>
              </>
            ) : (
              <>
                <div className="rounded-[20px] border border-[rgba(235,120,194,0.1)] bg-[linear-gradient(145deg,rgba(231,82,169,0.06),rgba(128,78,225,0.035)),rgba(7,8,17,0.72)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-[rgba(235,120,194,0.18)] bg-[rgba(255,255,255,0.035)] text-[#ef8bc7] shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
                      <MaterialIcon className="text-[25px]" name="verified_user" />
                    </span>
                    <div className="min-w-0 pt-0.5">
                      <p className="text-base font-semibold tracking-[-0.015em] text-[var(--text-primary)]">One secure sign-in</p>
                      <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
                        Use your Google account to sign in. No separate username or password is needed.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="h-px bg-[linear-gradient(90deg,transparent,rgba(235,120,194,0.2),transparent)]" />
                <div className="rounded-[19px] bg-[linear-gradient(100deg,#ed6daf,#7a5cff)] p-[2px] shadow-[0_14px_32px_rgba(74,42,126,0.2)]">
                  <LockdownAction
                    locked={authLockdownEnabled}
                    message={authLockdownMessage}
                    href="/account"
                    className="group inline-flex min-h-14 w-full items-center rounded-[17px] bg-[var(--panel-surface)] px-4 text-sm font-semibold text-[var(--text-primary)] transition-[transform,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(178,68,166,0.26)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ec76bc]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[0.045]">
                      <GoogleMark />
                    </span>
                    <span className="flex-1 px-3 text-left">Continue with Google</span>
                    <MaterialIcon className="text-[22px] text-[#e56cbe] transition-transform duration-[var(--motion-base)] group-hover:translate-x-1" name="chevron_right" />
                  </LockdownAction>
                </div>
              </>
            )}
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
                  href={`/watch/${encodeURIComponent(entry.urlSlug)}`}
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

      <AnimatedModal
        isOpen={isGenresModalOpen}
        onClose={() => setIsGenresModalOpen(false)}
        labelledBy="all-genres-title"
        backdropClassName="bg-[rgba(4,5,8,0.88)] px-4 backdrop-blur-md"
        panelClassName="flex max-h-[calc(100vh-3rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-[28px] border border-[rgba(255,207,112,0.18)] bg-[linear-gradient(180deg,rgba(10,12,16,0.995),rgba(8,9,13,0.995))] shadow-[0_36px_96px_rgba(0,0,0,0.62)]"
      >
        <>
          <div
            className="flex max-h-[calc(100vh-3rem)] w-full flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] bg-[linear-gradient(90deg,rgba(255,207,112,0.06),rgba(255,255,255,0.01)_42%,transparent)] px-5 py-4">
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[rgba(255,207,112,0.22)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[18px]" name="close" />
              </button>
            </div>
            <div className="space-y-4 overflow-y-auto bg-[linear-gradient(180deg,rgba(9,11,15,0.98),rgba(8,9,13,0.98))] p-5">
              <p className="text-sm leading-6 text-[var(--text-secondary)]">
                Most-selected tags stay on the sidebar. The rest live here so the home layout stays tighter.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {overflowGenres.map((genre) => (
                  <Link
                    key={genre}
                    href={`/filter?genres=${encodeURIComponent(genre)}`}
                    onClick={() => setIsGenresModalOpen(false)}
                    className="flex items-center gap-2 rounded-xl border border-[rgba(255,255,255,0.05)] bg-[rgba(20,22,29,0.92)] px-3 py-2.5 text-sm text-[var(--text-secondary)] transition-[border-color,background-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:border-[rgba(255,207,112,0.16)] hover:bg-[rgba(24,26,34,0.96)] hover:text-[var(--text-primary)]"
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
        </>
      </AnimatedModal>
    </>
  );
}

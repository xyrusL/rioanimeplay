import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getAlphabeticalAnimeGroups } from "@/features/browse/model/browse-page-data";
import { SiteFooter } from "@/features/home/sections/site-footer";
import { SiteHeader } from "@/features/home/sections/site-header";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { ScrollToTopButton } from "@/shared/ui/scroll-to-top-button";

export const metadata: Metadata = {
  title: "Anime A-Z List | RioAnimePlay",
  description: "Browse the complete RioAnimePlay anime catalog alphabetically."
};

export const dynamic = "force-dynamic";

export default async function AnimeAlphabeticalPage() {
  const groups = await getAlphabeticalAnimeGroups();
  const totalTitles = groups.reduce((total, group) => total + group.items.length, 0);

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="site-shell desktop-shell mx-auto flex min-h-screen w-full flex-col px-4 pb-10 pt-4 sm:px-6 xl:px-24 2xl:px-28">
        <SiteHeader />

        <section className="mt-5 overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--hero-surface)] shadow-[var(--hero-shadow)]">
          <div className="border-b border-[var(--line-soft)] bg-[var(--panel-header-surface)] px-5 py-4 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="font-display text-[0.8rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                  Anime Directory
                </p>
                <h1 className="font-display text-[1.5rem] uppercase tracking-[0.08em] text-[var(--text-primary)] sm:text-[2rem]">
                  Browse Anime From A To Z
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-[var(--text-secondary)]">
                  {totalTitles} titles loaded directly from the RioAnime database, grouped
                  alphabetically for fast browsing.
                </p>
              </div>

              <Link
                href="/random"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[16px]" name="shuffle" />
                Random Anime
              </Link>
            </div>
          </div>

          <div className="border-b border-[var(--line-soft)] px-5 py-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {groups.map((group) => (
                <a
                  key={group.letter}
                  href={`#letter-${group.letter}`}
                  className="inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-[border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                >
                  {group.letter}
                </a>
              ))}
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-display text-[1rem] uppercase tracking-[0.18em] text-[var(--text-primary)]">
                No Anime Available
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                The library does not contain any available titles right now.
              </p>
            </div>
          ) : (
            <div className="space-y-8 px-5 py-5 sm:px-6">
              {groups.map((group) => (
                <section key={group.letter} id={`letter-${group.letter}`} className="space-y-4 scroll-mt-24">
                  <div className="sticky top-4 z-10 flex items-center gap-3 rounded-full border border-[var(--line-soft)] bg-[rgba(18,18,23,0.92)] px-4 py-2 backdrop-blur">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-[1rem] uppercase tracking-[0.16em] text-[var(--accent-strong)]">
                      {group.letter}
                    </span>
                    <div>
                      <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                        Titles
                      </p>
                      <p className="text-sm text-[var(--text-secondary)]">
                        {group.items.length} anime
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {group.items.map((item) => (
                      <Link
                        key={item.libraryId}
                        href={`/watch/${encodeURIComponent(item.urlSlug)}`}
                        className="group flex cursor-pointer items-center gap-4 rounded-[24px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] p-3 transition-[border-color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.045)]"
                      >
                        <div className="relative h-[96px] w-[72px] shrink-0 overflow-hidden rounded-[18px] border border-[rgba(255,255,255,0.08)]">
                          <Image
                            fill
                            alt={item.title}
                            className="object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
                            sizes="72px"
                            src={item.coverImage}
                          />
                        </div>

                        <div className="min-w-0 space-y-2">
                          <div className="space-y-1">
                            <p className="line-clamp-2 text-[1rem] font-semibold text-[var(--text-primary)]">
                              {item.title}
                            </p>
                            <p className="line-clamp-1 text-[0.84rem] text-[var(--text-secondary)]">
                              {item.subtitle}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-[10px] border border-[rgba(255,122,73,0.34)] bg-[rgba(255,122,73,0.12)] px-2 py-0.5 text-[0.68rem] font-semibold text-[#ff8b58]">
                              {item.episodesLabel} ep
                            </span>
                            {item.genres.slice(0, 2).map((genre) => (
                              <span
                                key={`${item.id}-${genre}`}
                                className="inline-flex items-center rounded-full border border-[rgba(255,255,255,0.08)] px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-muted)]"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>

        <SiteFooter />
        <ScrollToTopButton />
      </div>
    </main>
  );
}

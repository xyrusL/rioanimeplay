"use client";

import { AnnouncementStrip } from "@/features/home/sections/announcement-strip";
import { MobileFeaturedCarousel } from "@/features/mobile/home/mobile-featured-carousel";
import { MobileRecentUpdatesSection } from "@/features/mobile/home/mobile-recent-updates-section";
import { MobileAppShell } from "@/features/mobile/shared/mobile-app-shell";
import {
  MobilePosterCard,
  MobileWeeklyCard
} from "@/features/mobile/shared/mobile-anime-card";
import type { HomePageData } from "@/entities/anime/model/types";
import { SearchAutocomplete } from "@/features/search/sections/search-autocomplete";
import type { SiteSettings } from "@/shared/lib/site-settings";
import {
  getRecentWatchAnimeIds,
  LIBRARY_CHANGE_EVENT
} from "@/shared/lib/watch-storage";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MobileHomeScreenProps = {
  homePageData: HomePageData;
  member: {
    name: string;
    email: string;
    image: string | null;
  } | null;
  siteSettings: SiteSettings;
};

function SectionHeading({
  actionHref,
  actionLabel,
  eyebrow,
  title
}: {
  actionHref?: string;
  actionLabel?: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-[1.3rem] font-semibold text-[var(--text-primary)]">{title}</h2>
      </div>
      {actionLabel ? actionHref ? (
        <Link
          href={actionHref}
          className="rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] px-3 py-2 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
        >
          {actionLabel}
        </Link>
      ) : (
        <button
          type="button"
          className="rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] px-3 py-2 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function MobileHomeScreen({
  homePageData,
  member
}: MobileHomeScreenProps) {
  const [recentWatchIds, setRecentWatchIds] = useState<number[]>([]);
  const trendingItems = homePageData.grid.slice(0, 8);
  const recentUpdateItems = homePageData.grid.slice(8);
  const catalog = useMemo(
    () => [...homePageData.featured, ...homePageData.grid],
    [homePageData.featured, homePageData.grid]
  );
  const recentWatchItems = useMemo(() => {
    const itemMap = new Map(catalog.map((item) => [item.id, item]));
    return recentWatchIds
      .map((animeId) => itemMap.get(animeId))
      .filter((item): item is (typeof catalog)[number] => Boolean(item));
  }, [catalog, recentWatchIds]);
  const showRecentWatch = Boolean(member) && recentWatchItems.length >= 3;
  const shelfItems = showRecentWatch ? recentWatchItems : trendingItems;

  useEffect(() => {
    function refreshRecentWatch() {
      setRecentWatchIds(getRecentWatchAnimeIds());
    }

    refreshRecentWatch();
    window.addEventListener(LIBRARY_CHANGE_EVENT, refreshRecentWatch);
    return () => window.removeEventListener(LIBRARY_CHANGE_EVENT, refreshRecentWatch);
  }, []);

  return (
    <MobileAppShell>
      <div className="space-y-6">
        <header className="space-y-4 rounded-[34px] border border-[var(--line-soft)] bg-[var(--panel-surface)] p-4 shadow-[var(--panel-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <ProfileAvatar
                className="h-14 w-14 rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-lg font-semibold text-[var(--bg-base)] shadow-[0_14px_28px_var(--accent-soft)]"
                image={member?.image}
                imageSizes="56px"
                name={member?.name ?? "Guest"}
              />
              <div className="min-w-0">
                <p className="text-sm text-[var(--text-secondary)]">Welcome back</p>
                <h1 className="truncate text-xl font-semibold text-[var(--text-primary)]">
                  {member?.name.split(" ")[0] || "Guest"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/filter"
                aria-label="Open filters"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] text-[var(--text-primary)] backdrop-blur-sm transition-[border-color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
              >
                <MaterialIcon className="text-[20px]" name="tune" />
              </Link>
            </div>
          </div>

          <SearchAutocomplete className="w-full" />
        </header>

        <MobileFeaturedCarousel featured={homePageData.featured} />
        <AnnouncementStrip />

        <section className="space-y-4">
          <SectionHeading
            actionHref={showRecentWatch ? "/filter?view=recent-watch" : "/filter"}
            actionLabel="See all"
            eyebrow="For you"
            title={showRecentWatch ? "Recent Watch" : "Latest Update"}
          />
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {shelfItems.map((item) => (
              <MobilePosterCard compact key={item.id} item={item} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeading eyebrow="Live ranking" title="Top this week" />
          <div className="space-y-3">
            {homePageData.weeklyTop.slice(0, 4).map((entry) => (
              <MobileWeeklyCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>

        <MobileRecentUpdatesSection items={recentUpdateItems} />

      </div>
    </MobileAppShell>
  );
}

"use client";

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
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import Link from "next/link";
import { useState } from "react";

type MobileHomeScreenProps = {
  homePageData: HomePageData;
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

function MobileAnnouncementSheet({
  message,
  onClose,
  title
}: {
  message: string;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 z-[420]">
      <button
        type="button"
        aria-label="Close announcement details"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--mobile-sheet-overlay)] backdrop-blur-[3px]"
      />
      <div className="absolute inset-x-0 bottom-[max(1rem,calc(env(safe-area-inset-bottom)+0.75rem))] px-3 sm:px-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-announcement-title"
          className="relative mx-auto max-h-[min(70vh,560px)] max-w-[420px] overflow-hidden rounded-[30px] border border-[var(--line-strong)] bg-[var(--mobile-sheet-surface)] shadow-[var(--mobile-sheet-shadow)]"
        >
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(circle_at_bottom,var(--accent-soft),transparent_72%)] opacity-80" />
          <div className="relative border-b border-[var(--line-soft)] bg-[linear-gradient(90deg,var(--accent-soft),transparent_56%)] px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--bg-card-muted)] px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                  <MaterialIcon className="text-[16px]" name="campaign" />
                  Announcement
                </p>
                <h2
                  id="mobile-announcement-title"
                  className="font-display text-[1.2rem] leading-6 text-[var(--text-primary)]"
                >
                  {title}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Dismiss announcement"
                onClick={onClose}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card-muted)] text-[var(--text-secondary)] transition-[border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[18px]" name="close" />
              </button>
            </div>
          </div>

          <div className="relative max-h-[calc(min(70vh,560px)-88px)] space-y-4 overflow-y-auto px-5 py-5">
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{message}</p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] bg-[linear-gradient(135deg,var(--accent-soft),rgba(0,0,0,0))] px-4 py-3 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--cta-shadow)] transition-[transform,border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5"
            >
              <MaterialIcon className="text-[18px] text-[var(--accent-strong)]" name="done" />
              Close notice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileHomeScreen({
  homePageData,
  siteSettings
}: MobileHomeScreenProps) {
  const trendingItems = homePageData.grid.slice(0, 8);
  const recentUpdateItems = homePageData.grid.slice(8);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  return (
    <MobileAppShell hideBottomNav={isAnnouncementOpen}>
      <div className="space-y-6">
        <header className="space-y-4 rounded-[34px] border border-[var(--line-soft)] bg-[var(--panel-surface)] p-4 shadow-[var(--panel-shadow)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-lg font-semibold text-[var(--bg-base)] shadow-[0_14px_28px_var(--accent-soft)]">
                G
              </div>
              <div>
                <p className="text-sm text-[var(--text-secondary)]">Welcome back</p>
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Guest</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Notifications"
                onClick={() => setIsAnnouncementOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] text-[var(--text-primary)] backdrop-blur-sm transition-[border-color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
              >
                <MaterialIcon className="text-[20px]" name="notifications" />
              </button>
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

        <section className="space-y-4">
          <SectionHeading
            actionHref="/filter"
            actionLabel="See all"
            eyebrow="For you"
            title="Latest Update"
          />
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {trendingItems.map((item) => (
              <MobilePosterCard key={item.id} item={item} />
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

        {isAnnouncementOpen ? (
          <MobileAnnouncementSheet
            message={siteSettings.announcement.message}
            onClose={() => setIsAnnouncementOpen(false)}
            title={siteSettings.announcement.title}
          />
        ) : null}
      </div>
    </MobileAppShell>
  );
}

import { AnnouncementStrip } from "@/features/home/sections/announcement-strip";
import { AnimeGrid } from "@/features/home/sections/anime-grid";
import { FeaturedHero } from "@/features/home/sections/featured-hero";
import { RightSidebar } from "@/features/home/sections/right-sidebar";
import { SiteFooter } from "@/features/home/sections/site-footer";
import { SiteHeader } from "@/features/home/sections/site-header";
import type { HomePageData } from "@/entities/anime/model/types";
import type { SiteSettings } from "@/shared/lib/site-settings";
import { ScrollToTopButton } from "@/shared/ui/scroll-to-top-button";

type DesktopHomeScreenProps = {
  homePageData: HomePageData;
  member: { name: string; email: string; image: string | null } | null;
  siteSettings: SiteSettings;
};

export function DesktopHomeScreen({
  homePageData,
  member,
  siteSettings
}: DesktopHomeScreenProps) {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="site-shell desktop-shell mx-auto flex min-h-screen w-full flex-col px-4 pb-10 pt-4 sm:px-6 xl:px-24 2xl:px-28">
        <SiteHeader />
        <div className="mt-5 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            <FeaturedHero featured={homePageData.featured} />
            <AnnouncementStrip />
            <AnimeGrid items={homePageData.grid} />
          </div>
          <RightSidebar
            authLockdownEnabled={siteSettings.authLockdown.enabled}
            authLockdownMessage={siteSettings.authLockdown.message}
            genres={homePageData.sidebarGenres}
            member={member}
            weeklyTop={homePageData.weeklyTop}
          />
        </div>
        <SiteFooter />
        <ScrollToTopButton />
      </div>
    </main>
  );
}

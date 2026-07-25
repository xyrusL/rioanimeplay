import type { HomePageData } from "@/entities/anime/model/types";
import { IntroArticle } from "@/features/home/sections/intro-article";
import { HomeShowcase } from "@/features/home/sections/home-showcase";
import { MobileHomeScreen } from "@/features/home/sections/mobile-home-screen";
import { SiteFooter } from "@/features/home/sections/site-footer";
import type { SiteSettings } from "@/shared/lib/site-settings";
import { ScrollToTopButton } from "@/shared/ui/scroll-to-top-button";

type IntroHomeScreenProps = {
  homePageData: HomePageData;
  member: { name: string; email: string; image: string | null } | null;
  siteSettings: SiteSettings;
};

export function IntroHomeScreen({
  homePageData,
  member,
  siteSettings
}: IntroHomeScreenProps) {
  return (
    <main className="intro-home min-h-screen overflow-hidden text-[var(--text-primary)]">
      <MobileHomeScreen homePageData={homePageData} />

      <div className="site-shell mx-auto hidden min-h-screen w-full max-w-[1280px] flex-col px-8 pb-8 lg:flex">
        <HomeShowcase
          authLockdown={siteSettings.authLockdown}
          homePageData={homePageData}
          member={member}
        />
        <IntroArticle homePageData={homePageData} />
        <SiteFooter variant="landing" />
        <ScrollToTopButton />
      </div>
    </main>
  );
}

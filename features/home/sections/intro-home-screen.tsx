import { IntroArticle } from "@/features/home/sections/intro-article";
import { HomeShowcase } from "@/features/home/sections/home-showcase";
import { SiteFooter } from "@/features/home/sections/site-footer";
import type { HomePageData } from "@/entities/anime/model/types";
import { ScrollToTopButton } from "@/shared/ui/scroll-to-top-button";

type IntroHomeScreenProps = {
  homePageData: HomePageData;
};

export function IntroHomeScreen({
  homePageData
}: IntroHomeScreenProps) {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="site-shell mx-auto flex min-h-screen w-full max-w-[1180px] flex-col px-4 pb-10 pt-4 sm:px-6 xl:px-8">
        <HomeShowcase homePageData={homePageData} />
        <div className="mt-4">
          <IntroArticle
            featured={homePageData.featured}
          />
        </div>
        <SiteFooter />
        <ScrollToTopButton />
      </div>
    </main>
  );
}

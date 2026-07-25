import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth } from "@/auth";
import { DesktopHomeScreen } from "@/features/home/sections/desktop-home-screen";
import { getHomePageData } from "@/features/home/model/home-page-data";
import { MobileHomeScreen } from "@/features/mobile/home/mobile-home-screen";
import { ResponsiveRender } from "@/features/mobile/shared/responsive-render";
import { isLikelyMobileUserAgent } from "@/shared/lib/mobile-detection";
import { getSiteSettings } from "@/shared/lib/site-settings";
import { ScheduledAnnouncementModal } from "@/shared/ui/scheduled-announcement-modal";

export const metadata: Metadata = {
  title: "Watch Anime Online | RioAnimePlay",
  description: "Discover anime, browse available episodes, and keep your favorite titles close with RioAnimePlay."
};

export const dynamic = "force-dynamic";

export default async function Home() {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const [homePageData, siteSettings, session] = await Promise.all([
    getHomePageData(),
    getSiteSettings(),
    auth()
  ]);
  const member = session?.user
    ? {
        name: session.user.name ?? "RioAnime member",
        email: session.user.email ?? "",
        image: session.user.image ?? null
      }
    : null;

  return (
    <><ResponsiveRender
      initialIsMobile={initialIsMobile}
      mobile={<MobileHomeScreen homePageData={homePageData} member={member} siteSettings={siteSettings} />}
      desktop={<DesktopHomeScreen homePageData={homePageData} siteSettings={siteSettings} member={member} />}
    /><ScheduledAnnouncementModal placement="home_modal" /></>
  );
}

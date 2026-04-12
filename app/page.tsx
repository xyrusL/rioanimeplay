import { headers } from "next/headers";

import { DesktopHomeScreen } from "@/features/home/sections/desktop-home-screen";
import { getHomePageData } from "@/features/home/model/home-page-data";
import { MobileHomeScreen } from "@/features/mobile/home/mobile-home-screen";
import { ResponsiveRender } from "@/features/mobile/shared/responsive-render";
import { isLikelyMobileUserAgent } from "@/shared/lib/mobile-detection";
import { getSiteSettings } from "@/shared/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const [homePageData, siteSettings] = await Promise.all([
    getHomePageData(),
    getSiteSettings()
  ]);

  return (
    <ResponsiveRender
      initialIsMobile={initialIsMobile}
      mobile={<MobileHomeScreen homePageData={homePageData} siteSettings={siteSettings} />}
      desktop={<DesktopHomeScreen homePageData={homePageData} siteSettings={siteSettings} />}
    />
  );
}

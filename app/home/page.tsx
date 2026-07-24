import { IntroHomeScreen } from "@/features/home/sections/intro-home-screen";
import { getHomePageData } from "@/features/home/model/home-page-data";
import { getSiteSettings } from "@/shared/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function IntroHomePage() {
  const [homePageData, siteSettings] = await Promise.all([
    getHomePageData(),
    getSiteSettings()
  ]);

  return <IntroHomeScreen homePageData={homePageData} siteSettings={siteSettings} />;
}

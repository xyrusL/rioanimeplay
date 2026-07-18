import { IntroHomeScreen } from "@/features/home/sections/intro-home-screen";
import { getHomePageData } from "@/features/home/model/home-page-data";

export const dynamic = "force-dynamic";

export default async function IntroHomePage() {
  const homePageData = await getHomePageData();

  return <IntroHomeScreen homePageData={homePageData} />;
}

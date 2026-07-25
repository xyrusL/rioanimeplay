import type { Metadata } from "next";

import { auth } from "@/auth";
import { IntroHomeScreen } from "@/features/home/sections/intro-home-screen";
import { getHomePageData } from "@/features/home/model/home-page-data";
import { getSiteSettings } from "@/shared/lib/site-settings";

export const metadata: Metadata = {
  title: "Discover Anime | RioAnimePlay",
  description: "Start discovering anime with RioAnimePlay."
};

export const dynamic = "force-dynamic";

export default async function IntroHomePage() {
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

  return <IntroHomeScreen homePageData={homePageData} member={member} siteSettings={siteSettings} />;
}

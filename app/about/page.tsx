import type { Metadata } from "next";

import { auth } from "@/auth";
import { AboutScreen } from "@/features/about/sections/about-screen";
import { getHomePageData } from "@/features/home/model/home-page-data";
import { getSiteSettings } from "@/shared/lib/site-settings";

export const metadata: Metadata = {
  title: "About | RioAnimePlay",
  description: "Learn how RioAnimePlay makes anime discovery simpler and connects viewers to available episodes."
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const [homePageData, siteSettings, session] = await Promise.all([getHomePageData(), getSiteSettings(), auth()]);
  const member = session?.user
      ? {
        name: session.user.name ?? "RioAnime member",
        email: session.user.email ?? "",
        image: session.user.image ?? null
      }
    : null;

  return <AboutScreen authLockdown={siteSettings.authLockdown} homePageData={homePageData} member={member} />;
}

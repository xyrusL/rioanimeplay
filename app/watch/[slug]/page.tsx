import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ResponsiveRender } from "@/features/mobile/shared/responsive-render";
import { getWatchPageData } from "@/features/watch/model/watch-page-data";
import { MobileWatchScreen } from "@/features/watch/sections/mobile-watch-screen";
import { MobileWatchUnavailableScreen } from "@/features/watch/sections/mobile-watch-unavailable-screen";
import { WatchScreen } from "@/features/watch/sections/watch-screen";
import { WatchUnavailableScreen } from "@/features/watch/sections/watch-unavailable-screen";
import { isLikelyMobileUserAgent } from "@/shared/lib/mobile-detection";
import { ScheduledAnnouncementModal } from "@/shared/ui/scheduled-announcement-modal";

type WatchPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const getCachedWatchPageData = cache(getWatchPageData);

function decodeSlug(routeSlug: string) {
  try {
    return decodeURIComponent(routeSlug);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: WatchPageProps): Promise<Metadata> {
  const { slug: routeSlug } = await params;
  const slug = decodeSlug(routeSlug);
  if (!slug) return {};

  const result = await getCachedWatchPageData(slug);
  if (result.status === "available") {
    const episodeNumber = result.anime.episodeNumbers[0] ?? 1;
    return { title: `${result.anime.title} - EP ${episodeNumber} | RioAnimePlay` };
  }

  if (result.status === "locked") {
    return { title: `${result.title} | RioAnimePlay` };
  }

  return {};
}

export default async function WatchPage({ params }: WatchPageProps) {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const { slug: routeSlug } = await params;
  const slug = decodeSlug(routeSlug);
  if (!slug) notFound();

  const result = await getCachedWatchPageData(slug);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "locked") {
    return (
      <ResponsiveRender
        initialIsMobile={initialIsMobile}
        mobile={<MobileWatchUnavailableScreen message={result.message} title={result.title} />}
        desktop={<WatchUnavailableScreen message={result.message} title={result.title} />}
      />
    );
  }

  return (
    <><ResponsiveRender
      initialIsMobile={initialIsMobile}
      mobile={<MobileWatchScreen anime={result.anime} />}
      desktop={<WatchScreen anime={result.anime} />}
    /><ScheduledAnnouncementModal placement="post_modal" animeId={result.anime.libraryId} waitForAdultConfirmation={result.anime.isNsfw} /></>
  );
}

import { headers } from "next/headers";
import { notFound } from "next/navigation";

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

export default async function WatchPage({ params }: WatchPageProps) {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const { slug: routeSlug } = await params;
  let slug: string;
  try {
    slug = decodeURIComponent(routeSlug);
  } catch {
    notFound();
  }
  const result = await getWatchPageData(slug);

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

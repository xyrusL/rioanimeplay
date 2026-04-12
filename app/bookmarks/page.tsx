import { getBrowseCatalog } from "@/features/browse/model/browse-page-data";
import { MobileBookmarksScreen } from "@/features/mobile/bookmarks/mobile-bookmarks-screen";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
  const catalog = await getBrowseCatalog();

  return <MobileBookmarksScreen catalog={catalog} />;
}

import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth } from "@/auth";
import {
  FILTER_ALL_TYPES,
  FILTER_ALL_YEARS,
  FILTER_DEFAULT_SEASON,
  filterCatalogItems,
  getAvailableGenres,
  getAvailableTypes,
  normalizePage,
  normalizeQuery,
  parseGenreQuery,
  normalizeSeason,
  normalizeType,
  sortFilteredItems,
  normalizeYear
} from "@/features/browse/model/filter-utils";
import { FilterResultsPanel } from "@/features/browse/sections/filter-results-panel";
import { FilterToolbar } from "@/features/browse/sections/filter-toolbar";
import { getBrowseCatalog } from "@/features/browse/model/browse-page-data";
import { SiteFooter } from "@/features/home/sections/site-footer";
import { SiteHeader } from "@/features/home/sections/site-header";
import { MobileFilterScreen } from "@/features/mobile/filter/mobile-filter-screen";
import { ResponsiveRender } from "@/features/mobile/shared/responsive-render";
import { isLikelyMobileUserAgent } from "@/shared/lib/mobile-detection";
import { ScrollToTopButton } from "@/shared/ui/scroll-to-top-button";

export const metadata: Metadata = {
  title: "Advanced Anime Filter | RioAnimePlay",
  description: "Filter the RioAnimePlay catalog by title, genre, season, year, and format."
};

export const dynamic = "force-dynamic";

type FilterPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: string;
    genres?: string;
    page?: string;
    season?: string;
    year?: string;
    view?: string;
  }>;
};

export default async function FilterPage({ searchParams }: FilterPageProps) {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const [params, session] = await Promise.all([searchParams, auth()]);
  const query = normalizeQuery(params.q);
  const season = normalizeSeason(params.season);
  const year = normalizeYear(params.year);
  const page = normalizePage(params.page);
  const catalog = await getBrowseCatalog();
  const typeOptions = getAvailableTypes(catalog);
  const selectedType = normalizeType(params.type, typeOptions);
  const selectedGenres = parseGenreQuery(params.genres);
  const availableGenres = getAvailableGenres(catalog);
  const filteredItems = sortFilteredItems(
    filterCatalogItems(catalog, {
      query,
      type: selectedType,
      season,
      year,
      genres: selectedGenres
    }),
    { query, season, year }
  );

  return (
    <ResponsiveRender
      initialIsMobile={initialIsMobile}
      mobile={
        <MobileFilterScreen
          catalog={catalog}
          genres={availableGenres}
          initialGenres={selectedGenres}
          initialPage={page}
          initialQuery={query}
          initialSeason={season}
          initialType={selectedType}
          initialYear={year}
          recentWatchView={params.view === "recent-watch"}
          signedIn={Boolean(session?.user)}
          types={typeOptions.length > 0 ? typeOptions : [FILTER_ALL_TYPES]}
        />
      }
      desktop={
        <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
          <div className="site-shell desktop-shell mx-auto flex min-h-screen w-full flex-col px-4 pb-10 pt-4 sm:px-6 xl:px-24 2xl:px-28">
            <SiteHeader />

            <section className="mt-5 overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--hero-surface)] shadow-[var(--hero-shadow)]">
              <FilterToolbar
                genres={availableGenres}
                initialQuery={query}
                initialType={selectedType}
                initialGenres={selectedGenres}
                initialSeason={season}
                initialYear={year}
                types={typeOptions.length > 0 ? typeOptions : [FILTER_ALL_TYPES]}
              />
              <FilterResultsPanel
                initialPage={page}
                items={filteredItems}
                query={query}
                seasonLabel={season === FILTER_DEFAULT_SEASON ? "All Seasons" : season}
                typeLabel={selectedType === FILTER_ALL_TYPES ? "" : selectedType}
                selectedGenres={selectedGenres}
                year={year === FILTER_ALL_YEARS ? "All Years" : year}
              />
            </section>

            <SiteFooter />
            <ScrollToTopButton />
          </div>
        </main>
      }
    />
  );
}

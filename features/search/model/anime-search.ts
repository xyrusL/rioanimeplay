import {
  fetchBrowseCatalogFresh,
  type CatalogMedia
} from "@/entities/anime/api/catalog";
import { formatDecimalScore, pickTitle, titleCase } from "@/entities/anime/lib/formatters";
import { getEpisodeCount } from "@/entities/anime/lib/mappers";
import { filterPrivateAnimeItems, getSiteSettings } from "@/shared/lib/site-settings";

export type SearchAnimeItem = {
  id: number;
  libraryId: string;
  urlSlug: string;
  title: string;
  alternateTitles: string[];
  coverImage: string;
  formatLabel: string;
  yearLabel: string;
  episodesLabel: string;
  scoreLabel: string;
  href: string;
};

function mapMediaToSearchItem(media: CatalogMedia): SearchAnimeItem | null {
  const title = pickTitle(media.title);
  const coverImage =
    media.coverImage?.large ?? media.coverImage?.medium ?? media.coverImage?.extraLarge;

  if (!coverImage) {
    return null;
  }

  const alternateTitles = [
    media.title.english,
    media.title.userPreferred,
    media.title.romaji,
    media.title.native
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, list) => list.indexOf(value) === index && value !== title);

  return {
    id: media.id,
    libraryId: media.libraryId,
    urlSlug: media.urlSlug,
    title,
    alternateTitles,
    coverImage,
    formatLabel: media.format ? titleCase(media.format) : "TV",
    yearLabel: media.seasonYear ? `${media.seasonYear}` : "TBA",
    episodesLabel: `${getEpisodeCount(media)}`,
    scoreLabel: formatDecimalScore(media.averageScore ?? media.meanScore ?? null),
    href: `/watch/${encodeURIComponent(media.urlSlug)}`
  };
}

function mergeUniqueMedia(...collections: CatalogMedia[][]) {
  const seen = new Set<number>();

  return collections.flat().filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

export async function getAnimeSearchCatalog() {
  const [{ anime, movies }, siteSettings] = await Promise.all([
    fetchBrowseCatalogFresh(),
    getSiteSettings()
  ]);
  const catalog = mergeUniqueMedia(anime, movies)
    .map(mapMediaToSearchItem)
    .filter((item): item is SearchAnimeItem => Boolean(item));
  return filterPrivateAnimeItems(catalog, siteSettings);
}

import { fetchTrendingAnimePage, fetchTrendingMoviePage } from "@/entities/anime/api/anilist";
import { mapAniListMediaToHomeItem } from "@/entities/anime/lib/mappers";
import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { filterPrivateAnimeItems, getSiteSettings } from "@/shared/lib/site-settings";

type AlphabeticalAnimeGroup = {
  letter: string;
  items: HomeAnimeItem[];
};

function mergeUniqueItems(...collections: HomeAnimeItem[][]) {
  const seen = new Set<number>();

  return collections.flat().filter((item) => {
    if (seen.has(item.id)) {
      return false;
    }

    seen.add(item.id);
    return true;
  });
}

function sortAlphabetically(items: HomeAnimeItem[]) {
  return [...items].sort((left, right) => left.title.localeCompare(right.title, "en", { sensitivity: "base" }));
}

function getAlphabetBucket(title: string) {
  const firstCharacter = title.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(firstCharacter) ? firstCharacter : "#";
}

export async function getBrowseCatalogRaw(): Promise<HomeAnimeItem[]> {
  try {
    const [pageOne, pageTwo, pageThree, pageFour, movies] = await Promise.all([
      fetchTrendingAnimePage(1, 50),
      fetchTrendingAnimePage(2, 50),
      fetchTrendingAnimePage(3, 50),
      fetchTrendingAnimePage(4, 50),
      fetchTrendingMoviePage(1, 50)
    ]);

    return sortAlphabetically(
      mergeUniqueItems(
        pageOne.map(mapAniListMediaToHomeItem),
        pageTwo.map(mapAniListMediaToHomeItem),
        pageThree.map(mapAniListMediaToHomeItem),
        pageFour.map(mapAniListMediaToHomeItem),
        movies.map(mapAniListMediaToHomeItem)
      )
    );
  } catch {
    return [];
  }
}

export async function getBrowseCatalog(): Promise<HomeAnimeItem[]> {
  const [catalog, siteSettings] = await Promise.all([
    getBrowseCatalogRaw(),
    getSiteSettings()
  ]);

  return filterPrivateAnimeItems(catalog, siteSettings);
}

export async function getAlphabeticalAnimeGroups(): Promise<AlphabeticalAnimeGroup[]> {
  const catalog = await getBrowseCatalog();
  const groups = new Map<string, HomeAnimeItem[]>();

  for (const item of catalog) {
    const letter = getAlphabetBucket(item.title);
    groups.set(letter, [...(groups.get(letter) ?? []), item]);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === "#") {
        return 1;
      }

      if (right === "#") {
        return -1;
      }

      return left.localeCompare(right);
    })
    .map(([letter, items]) => ({
      letter,
      items
    }));
}

export async function getRandomAnimeHref() {
  const catalog = await getBrowseCatalog();

  if (catalog.length === 0) {
    return "/";
  }

  const randomItem = catalog[Math.floor(Math.random() * catalog.length)];
  return `/watch/${toAnimeSlug(randomItem.title)}`;
}

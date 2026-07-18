import Fuse from "fuse.js";

import {
  fetchBrowseCatalog,
  fetchBrowseCatalogFresh,
  searchAnimeByTitle,
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

type RankedSearchItem = {
  item: SearchAnimeItem;
  tier: number;
  score: number;
};

const CACHE_TTL_MS = 1000 * 60 * 15;
const SEARCH_LIMIT = 8;
let cachedCatalog: SearchAnimeItem[] | null = null;
let cachedAt = 0;
let catalogPromise: Promise<SearchAnimeItem[]> | null = null;

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

async function getCatalog(): Promise<SearchAnimeItem[]> {
  const isFresh = cachedCatalog && Date.now() - cachedAt < CACHE_TTL_MS;

  if (isFresh) {
    return cachedCatalog ?? [];
  }

  if (!catalogPromise) {
    catalogPromise = fetchBrowseCatalog()
      .then(({ anime, movies }) => {
        cachedCatalog = mergeUniqueMedia(anime, movies)
          .map(mapMediaToSearchItem)
          .filter((item): item is SearchAnimeItem => Boolean(item));
        cachedAt = Date.now();

        return cachedCatalog ?? [];
      })
      .finally(() => {
        catalogPromise = null;
      });
  }

  return catalogPromise;
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

function getCachedCatalogSnapshot() {
  const isFresh = cachedCatalog && Date.now() - cachedAt < CACHE_TTL_MS;
  return isFresh ? cachedCatalog ?? [] : null;
}

function normalizeSearchText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getNormalizedVariants(item: SearchAnimeItem) {
  return {
    title: normalizeSearchText(item.title),
    alternates: item.alternateTitles.map(normalizeSearchText).filter(Boolean)
  };
}

function scorePrefixMatch(candidate: string, query: string) {
  return candidate.length - query.length;
}

function scoreBoundaryMatch(candidate: string, query: string) {
  if (!candidate || !query) {
    return Number.POSITIVE_INFINITY;
  }

  if (candidate.startsWith(query)) {
    return 0;
  }

  const boundaryIndex = candidate.indexOf(` ${query}`);
  return boundaryIndex === -1 ? Number.POSITIVE_INFINITY : boundaryIndex;
}

function buildFuseRanking(items: SearchAnimeItem[], normalizedQuery: string): RankedSearchItem[] {
  if (items.length === 0) {
    return [];
  }

  if (items.length === 1) {
    return [{ item: items[0], tier: 6, score: 0 }];
  }

  const fuse = new Fuse(items, {
    includeScore: true,
    shouldSort: true,
    threshold: 0.36,
    ignoreLocation: true,
    minMatchCharLength: Math.max(1, Math.min(normalizedQuery.length, 2)),
    keys: [
      { name: "title", weight: 0.7 },
      { name: "alternateTitles", weight: 0.3 }
    ]
  });

  return fuse.search(normalizedQuery, { limit: SEARCH_LIMIT * 3 }).map((entry, index) => ({
    item: entry.item,
    tier: 6,
    score: (entry.score ?? 1) + index / 1000
  }));
}

function rankSearchItems(items: SearchAnimeItem[], query: string) {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery || items.length === 0) {
    return [];
  }

  const rankedItems: RankedSearchItem[] = [];

  for (const item of items) {
    const normalized = getNormalizedVariants(item);

    if (normalized.title === normalizedQuery) {
      rankedItems.push({ item, tier: 0, score: 0 });
      continue;
    }

    if (normalized.alternates.includes(normalizedQuery)) {
      rankedItems.push({ item, tier: 1, score: 0 });
      continue;
    }

    if (normalized.title.startsWith(normalizedQuery)) {
      rankedItems.push({
        item,
        tier: 2,
        score: scorePrefixMatch(normalized.title, normalizedQuery)
      });
      continue;
    }

    const alternatePrefix = normalized.alternates.find((candidate) =>
      candidate.startsWith(normalizedQuery)
    );
    if (alternatePrefix) {
      rankedItems.push({
        item,
        tier: 3,
        score: scorePrefixMatch(alternatePrefix, normalizedQuery)
      });
      continue;
    }

    const titleBoundaryScore = scoreBoundaryMatch(normalized.title, normalizedQuery);
    if (titleBoundaryScore !== Number.POSITIVE_INFINITY) {
      rankedItems.push({ item, tier: 4, score: titleBoundaryScore });
      continue;
    }

    const alternateBoundaryScores = normalized.alternates
      .map((candidate) => scoreBoundaryMatch(candidate, normalizedQuery))
      .filter((score) => score !== Number.POSITIVE_INFINITY);
    if (alternateBoundaryScores.length > 0) {
      rankedItems.push({
        item,
        tier: 5,
        score: Math.min(...alternateBoundaryScores)
      });
    }
  }

  return [...rankedItems, ...buildFuseRanking(items, normalizedQuery)]
    .sort((left, right) => {
      const tierDelta = left.tier - right.tier;
      if (tierDelta !== 0) {
        return tierDelta;
      }

      const scoreDelta = left.score - right.score;
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return left.item.title.localeCompare(right.item.title, "en", {
        sensitivity: "base"
      });
    })
    .filter(
      (entry, index, list) =>
        list.findIndex((candidate) => candidate.item.id === entry.item.id) === index
    )
    .slice(0, SEARCH_LIMIT)
    .map((entry) => entry.item);
}

export async function searchAnimeSuggestions(query: string) {
  const trimmedQuery = query.trim();

  if (trimmedQuery.length < 1) {
    return [];
  }

  const directMatches = await searchAnimeByTitle(trimmedQuery, 20).catch(() => []);
  const directItems = directMatches
    .map(mapMediaToSearchItem)
    .filter((item): item is SearchAnimeItem => Boolean(item));
  const cachedCatalogSnapshot = getCachedCatalogSnapshot();

  if (!cachedCatalogSnapshot) {
    void getCatalog().catch(() => []);
    const siteSettings = await getSiteSettings();
    return rankSearchItems(filterPrivateAnimeItems(directItems, siteSettings), trimmedQuery);
  }

  const mergedItems = [...directItems, ...cachedCatalogSnapshot].filter(
    (item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index
  );

  const siteSettings = await getSiteSettings();
  return rankSearchItems(filterPrivateAnimeItems(mergedItems, siteSettings), trimmedQuery);
}

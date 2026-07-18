import type { HomeAnimeItem } from "@/entities/anime/model/types";

export const FILTER_DEFAULT_SEASON = "Default";
export const FILTER_ALL_TYPES = "All";
export const FILTER_ALL_YEARS = "All";
export const FILTER_SEASONS = [
  FILTER_DEFAULT_SEASON,
  "Winter",
  "Spring",
  "Summer",
  "Fall"
] as const;
export const FILTER_GENRE_OPTIONS = [
  "Action",
  "Adventure",
  "Cars",
  "Comedy",
  "Dementia",
  "Demons",
  "Drama",
  "Ecchi",
  "Fantasy",
  "Game",
  "Harem",
  "Historical",
  "Horror",
  "Isekai",
  "Josei",
  "Kids",
  "Magic",
  "Martial Arts",
  "Mecha",
  "Military",
  "Music",
  "Mystery",
  "Parody",
  "Police",
  "Psychological",
  "Romance",
  "Samurai",
  "School",
  "Sci-Fi",
  "Seinen",
  "Shoujo",
  "Shoujo Ai",
  "Shounen",
  "Shounen Ai",
  "Slice of Life",
  "Space",
  "Sports",
  "Super Power",
  "Supernatural",
  "Thriller",
  "Vampire"
] as const;
export const FILTER_PAGE_SIZE = 20;
export type FilterRouteState = {
  query?: string;
  type?: string;
  season?: string;
  year?: string;
  genres?: string[];
  page?: number;
};
const SEASON_ORDER = new Map([
  ["fall", 4],
  ["summer", 3],
  ["spring", 2],
  ["winter", 1]
]);

export function getFilterYearOptions() {
  const currentYear = new Date().getFullYear();

  return [
    FILTER_ALL_YEARS,
    ...Array.from({ length: currentYear - 2001 + 1 }, (_, index) =>
      String(currentYear - index)
    )
  ];
}

export function getAvailableGenres(items: HomeAnimeItem[]) {
  const liveGenres = [...new Set(items.flatMap((item) => item.genres))].sort((left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base" })
  );
  const extras = liveGenres.filter((genre) => !FILTER_GENRE_OPTIONS.includes(genre as never));

  return [...FILTER_GENRE_OPTIONS, ...extras];
}

export function getAvailableTypes(items: HomeAnimeItem[]) {
  const liveTypes = [...new Set(items.map((item) => item.formatLabel).filter(Boolean))].sort(
    (left, right) => left.localeCompare(right, "en", { sensitivity: "base" })
  );

  return [FILTER_ALL_TYPES, ...liveTypes.filter((type) => type !== FILTER_ALL_TYPES)];
}

export function normalizeSeason(value: string | undefined) {
  return FILTER_SEASONS.includes((value ?? "") as (typeof FILTER_SEASONS)[number])
    ? (value as (typeof FILTER_SEASONS)[number])
    : FILTER_DEFAULT_SEASON;
}

export function normalizeYear(value: string | undefined) {
  if (!value?.trim() || value === FILTER_ALL_YEARS) {
    return FILTER_ALL_YEARS;
  }

  return /^\d{4}$/.test(value) ? value : FILTER_ALL_YEARS;
}

export function normalizeType(value: string | undefined, availableTypes?: string[]) {
  if (!value?.trim()) {
    return FILTER_ALL_TYPES;
  }

  const normalizedValue = decodeURIComponent(value).trim();

  if (!availableTypes || availableTypes.length === 0) {
    return normalizedValue;
  }

  return availableTypes.includes(normalizedValue) ? normalizedValue : FILTER_ALL_TYPES;
}

export function normalizeGenre(value: string | undefined) {
  return value?.trim() ? decodeURIComponent(value).trim() : "";
}

export function normalizeQuery(value: string | undefined) {
  return value?.trim() ? decodeURIComponent(value).trim() : "";
}

export function parseGenreQuery(value: string | undefined) {
  if (!value) {
    return [];
  }

  return [...new Set(value
    .split(",")
    .map((genre) => decodeURIComponent(genre).trim())
    .filter(Boolean))];
}

export function serializeGenreQuery(genres: string[]) {
  return genres.join(",");
}

export function buildFilterHref(state: FilterRouteState) {
  const params = new URLSearchParams();
  const trimmedQuery = state.query?.trim();

  if (trimmedQuery) {
    params.set("q", trimmedQuery);
  }

  if (state.type && state.type !== FILTER_ALL_TYPES) {
    params.set("type", state.type);
  }

  if (state.year && state.year !== FILTER_ALL_YEARS) {
    params.set("year", state.year);
  }

  if (state.season && state.season !== FILTER_DEFAULT_SEASON) {
    params.set("season", state.season);
  }

  if (state.genres && state.genres.length > 0) {
    params.set("genres", serializeGenreQuery(state.genres));
  }

  if (state.page && state.page > 1) {
    params.set("page", String(state.page));
  }

  return `/filter?${params.toString()}`;
}

export function normalizePage(value: string | undefined) {
  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
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

function getQueryMatchRank(text: string, query: string) {
  if (!query) {
    return Number.POSITIVE_INFINITY;
  }

  if (text === query) {
    return 0;
  }

  if (text.startsWith(query)) {
    return 1;
  }

  const words = text.split(" ");

  if (words.some((word) => word === query)) {
    return 2;
  }

  if (words.some((word) => word.startsWith(query))) {
    return 3;
  }

  if (text.includes(query)) {
    return 4;
  }

  return Number.POSITIVE_INFINITY;
}

function getItemQueryScore(item: HomeAnimeItem, query: string) {
  if (!query) {
    return null;
  }

  const primaryTitle = normalizeSearchText(item.title);
  const alternateTitles = item.alternateTitles.map((title) => normalizeSearchText(title));
  const primaryRank = getQueryMatchRank(primaryTitle, query);
  const alternateRank = Math.min(
    ...alternateTitles.map((title) => getQueryMatchRank(title, query)),
    Number.POSITIVE_INFINITY
  );
  const bestRank = Math.min(primaryRank, alternateRank);

  if (!Number.isFinite(bestRank)) {
    return null;
  }

  return {
    titleSourceRank: primaryRank <= alternateRank ? 0 : 1,
    matchRank: bestRank,
    positionRank:
      primaryRank <= alternateRank
        ? primaryTitle.indexOf(query)
        : alternateTitles
            .map((title) => title.indexOf(query))
            .filter((index) => index >= 0)
            .sort((left, right) => left - right)[0] ?? Number.POSITIVE_INFINITY,
    titleLengthRank:
      primaryRank <= alternateRank
        ? primaryTitle.length
        : alternateTitles
            .filter((title) => title.includes(query))
            .sort((left, right) => left.length - right.length)[0]?.length ?? Number.POSITIVE_INFINITY
  };
}

function extractSeasonRank(seasonLabel: string) {
  const normalizedLabel = seasonLabel.toLowerCase();

  for (const [season, rank] of SEASON_ORDER) {
    if (normalizedLabel.includes(season)) {
      return rank;
    }
  }

  return 0;
}

export function filterCatalogItems(
  items: HomeAnimeItem[],
  filters: {
    query?: string;
    type?: string;
    season?: string;
    year?: string;
    genres?: string[];
  }
) {
  const normalizedQuery = normalizeSearchText(filters.query ?? "");
  const normalizedType =
    filters.type && filters.type !== FILTER_ALL_TYPES ? filters.type.toLowerCase() : undefined;
  const normalizedSeason =
    filters.season && filters.season !== FILTER_DEFAULT_SEASON
      ? filters.season.toLowerCase()
      : undefined;
  const normalizedYear =
    filters.year && filters.year !== FILTER_ALL_YEARS ? filters.year : undefined;
  const normalizedGenres = (filters.genres ?? []).map((genre) => genre.toLowerCase());

  return items.filter((item) => {
    const matchesQuery = normalizedQuery
      ? normalizeSearchText(
          `${item.title} ${item.alternateTitles.join(" ")}`
        ).includes(normalizedQuery)
      : true;
    const matchesType = normalizedType
      ? item.formatLabel.toLowerCase() === normalizedType
      : true;
    const matchesSeason = normalizedSeason
      ? item.seasonLabel.toLowerCase().includes(normalizedSeason)
      : true;
    const matchesYear = normalizedYear ? item.seasonLabel.includes(normalizedYear) : true;
    const matchesGenre =
      normalizedGenres.length > 0
        ? normalizedGenres.every((genre) =>
            item.genres.some((itemGenre) => itemGenre.toLowerCase() === genre)
          )
        : true;

    return matchesQuery && matchesType && matchesSeason && matchesYear && matchesGenre;
  });
}

export function sortFilteredItems(
  items: HomeAnimeItem[],
  filters: {
    query?: string;
    season?: string;
    year?: string;
  }
) {
  const normalizedQuery = normalizeSearchText(filters.query ?? "");
  const hasYear = Boolean(filters.year && filters.year !== FILTER_ALL_YEARS);
  const hasSpecificSeason = Boolean(
    filters.season && filters.season !== FILTER_DEFAULT_SEASON
  );

  return [...items].sort((left, right) => {
    if (normalizedQuery) {
      const leftQueryScore = getItemQueryScore(left, normalizedQuery);
      const rightQueryScore = getItemQueryScore(right, normalizedQuery);

      if (leftQueryScore && rightQueryScore) {
        if (leftQueryScore.titleSourceRank !== rightQueryScore.titleSourceRank) {
          return leftQueryScore.titleSourceRank - rightQueryScore.titleSourceRank;
        }

        if (leftQueryScore.matchRank !== rightQueryScore.matchRank) {
          return leftQueryScore.matchRank - rightQueryScore.matchRank;
        }

        if (leftQueryScore.positionRank !== rightQueryScore.positionRank) {
          return leftQueryScore.positionRank - rightQueryScore.positionRank;
        }

        if (leftQueryScore.titleLengthRank !== rightQueryScore.titleLengthRank) {
          return leftQueryScore.titleLengthRank - rightQueryScore.titleLengthRank;
        }
      }

      const popularityDelta = right.popularity - left.popularity;

      if (popularityDelta !== 0) {
        return popularityDelta;
      }
    }

    if (hasYear) {
      const rightSeasonRank = extractSeasonRank(right.seasonLabel);
      const leftSeasonRank = extractSeasonRank(left.seasonLabel);

      if (rightSeasonRank !== leftSeasonRank) {
        return rightSeasonRank - leftSeasonRank;
      }
    }

    if (hasSpecificSeason || hasYear) {
      const popularityDelta = right.popularity - left.popularity;

      if (popularityDelta !== 0) {
        return popularityDelta;
      }
    }

    return left.title.localeCompare(right.title, "en", { sensitivity: "base" });
  });
}

export function paginateItems<T>(items: T[], page: number, pageSize: number = FILTER_PAGE_SIZE) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    totalPages,
    currentPage,
    pageItems: items.slice(start, start + pageSize)
  };
}

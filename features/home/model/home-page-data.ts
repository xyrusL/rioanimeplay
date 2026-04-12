import {
  fetchTrendingAnimePage,
  fetchTrendingMoviePage
} from "@/entities/anime/api/anilist";
import { FILTER_GENRE_OPTIONS } from "@/features/browse/model/filter-utils";
import { formatDecimalScore } from "@/entities/anime/lib/formatters";
import { mapAniListMediaToHomeItem } from "@/entities/anime/lib/mappers";
import type {
  HomeAnimeItem,
  HomePageData,
  WeeklyTopEntry
} from "@/entities/anime/model/types";
import { filterPrivateAnimeItems, getSiteSettings } from "@/shared/lib/site-settings";

const FEATURED_COUNT = 10;
const GRID_COUNT = 60;

function buildWeeklyTop(items: HomeAnimeItem[]): WeeklyTopEntry[] {
  return [...items]
    .sort((left, right) => {
      // Score leads the ranking; popularity only breaks ties.
      const scoreDelta = (right.score ?? 0) - (left.score ?? 0);
      return scoreDelta !== 0 ? scoreDelta : right.popularity - left.popularity;
    })
    .slice(0, 10)
    .map((item, index) => ({
      id: item.id,
      rank: index + 1,
      title: item.title,
      image: item.coverImage,
      scoreLabel: formatDecimalScore(item.score),
      meta: `${item.formatLabel} • ${item.episodesLabel}`
    }));
}

function buildSidebarGenres(items: HomeAnimeItem[]) {
  const liveGenres = [...new Set(items.flatMap((item) => item.genres))].sort((left, right) =>
    left.localeCompare(right, "en", { sensitivity: "base" })
  );
  const missingGenres = FILTER_GENRE_OPTIONS
    .filter((genre) => !liveGenres.includes(genre))
    .sort((left, right) => left.localeCompare(right, "en", { sensitivity: "base" }));

  return [...liveGenres, ...missingGenres];
}

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

function ensureMovieItemsInGrid(
  grid: HomeAnimeItem[],
  featured: HomeAnimeItem[],
  moviePool: HomeAnimeItem[]
) {
  const movieItems = grid.filter((item) => item.formatLabel === "Movie");

  if (movieItems.length >= 4) {
    return grid;
  }

  // Keep a few live movie cards available so the Movie tab is populated from AniList data first.
  const supplementalMovies = moviePool.filter(
    (item) =>
      item.formatLabel === "Movie" &&
      !grid.some((gridItem) => gridItem.id === item.id) &&
      !featured.some((featuredItem) => featuredItem.id === item.id)
  );

  const nonMovieItems = grid.filter((item) => item.formatLabel !== "Movie");
  const guaranteedMovies = [...movieItems, ...supplementalMovies].slice(0, 4);

  return [...guaranteedMovies, ...nonMovieItems].slice(0, GRID_COUNT);
}

export async function getHomePageData(): Promise<HomePageData> {
  let items: HomeAnimeItem[] = [];
  let movieItems: HomeAnimeItem[] = [];

  try {
    const [media, movies] = await Promise.all([
      fetchTrendingAnimePage(1, 90),
      fetchTrendingMoviePage(1, 36)
    ]);

    items = media.map(mapAniListMediaToHomeItem);
    movieItems = movies.map(mapAniListMediaToHomeItem);
    items = mergeUniqueItems(items, movieItems);
  } catch {}

  const siteSettings = await getSiteSettings();
  items = filterPrivateAnimeItems(items, siteSettings);
  movieItems = filterPrivateAnimeItems(movieItems, siteSettings);

  const featured = items.slice(0, FEATURED_COUNT);
  const grid = ensureMovieItemsInGrid(
    items.slice(FEATURED_COUNT, FEATURED_COUNT + GRID_COUNT),
    featured,
    movieItems
  );
  // Spotlight prefers an item with a banner because the hero layout depends on it visually.
  const spotlight = featured.find((item) => item.bannerImage) ?? featured[0] ?? null;

  return {
    spotlight,
    featured,
    grid,
    weeklyTop: buildWeeklyTop(items),
    sidebarGenres: buildSidebarGenres(items)
  };
}

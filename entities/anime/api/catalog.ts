import "server-only";

const RIOANIME_API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.dezely.com";

export type CatalogTitle = {
  romaji: string | null;
  english: string | null;
  native: string | null;
  userPreferred: string | null;
};

export type CatalogMedia = {
  id: number;
  libraryId: string;
  urlSlug: string;
  title: CatalogTitle;
  description: string | null;
  bannerImage: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    medium: string | null;
    color: string | null;
  } | null;
  averageScore: number | null;
  meanScore: number | null;
  episodes: number | null;
  format: string | null;
  season: string | null;
  seasonYear: number | null;
  genres: (string | null)[];
  popularity: number | null;
  status: string | null;
  studios: {
    nodes: { name: string | null }[];
  } | null;
  nextAiringEpisode: {
    episode: number | null;
  } | null;
  isNsfw: boolean;
  isFeatured: boolean;
  featuredPosition: number | null;
};

type CatalogResponse = {
  anime: CatalogMedia[];
  movies: CatalogMedia[];
};

type AlphabeticalCatalogResponse = {
  anime: CatalogMedia[];
};

type SearchResponse = {
  media: CatalogMedia[];
};

type EpisodeNumbersResponse = {
  animeId: string;
  episodeNumbers: number[];
};

type EpisodeSourceResponse = {
  animeId: string;
  item: {
    episodeNumber: number;
    videoUrl: string;
  };
};

type AnimeDetailResponse = {
  anime: CatalogMedia;
  library: {
    animeId: string;
    source: string | null;
  };
};

export type DashboardResponse = {
  generatedAt: string;
  summary: {
    totalContent: number;
    totalEpisodes: number;
    enabledMembers: number;
    pendingMembers: number;
    apiRequests: number;
    averageResponseMs: number | null;
    errorRate: number;
    changes: { content: number; members: number; requests: number };
  };
  recentContent: Array<{
    anime_id: string;
    title: string;
    type: string | null;
    episodes: number | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
  }>;
  dailyTraffic: Array<{ day: string; requests: number }>;
  routeMetrics: Array<{
    route: string;
    requests: number;
    errors: number;
    duration_ms: number;
    max_duration_ms: number;
  }>;
  activities: Array<{
    event_type: string;
    actor_id: string | null;
    entity_type: string | null;
    entity_id: string | null;
    summary: string;
    detail_json: string | null;
    created_at: string;
  }>;
  health: { api: "operational"; database: "operational"; queryDurationMs: number };
};

async function fetchRioAnimeApi<T>(path: string, noStore = false): Promise<T> {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) {
    throw new Error("RIOANIME_API_KEY is not configured");
  }

  const response = await fetch(`${RIOANIME_API_URL}${path}`, {
    signal: AbortSignal.timeout(8_000),
    headers: {
      Accept: "application/json",
      "X-RioAnime-Key": apiKey
    },
    ...(noStore ? { cache: "no-store" as const } : { next: { revalidate: 60 } })
  });

  if (!response.ok) {
    throw new Error(`RioAnime API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export function fetchHomeCatalog() {
  return fetchRioAnimeApi<CatalogResponse>("/v1/home");
}

export function fetchBrowseCatalog() {
  return fetchRioAnimeApi<CatalogResponse>("/v1/browse");
}

export function fetchBrowseCatalogFresh() {
  return fetchRioAnimeApi<CatalogResponse>("/v1/browse", true);
}

export async function fetchAlphabeticalCatalog() {
  const result = await fetchRioAnimeApi<AlphabeticalCatalogResponse>("/v1/anime/a-z");
  return result.anime;
}

export async function fetchAnimeById(animeId: string) {
  const result = await fetchRioAnimeApi<AnimeDetailResponse>(
    `/v1/anime/${encodeURIComponent(animeId)}`
  );
  return result.anime;
}

export function fetchDashboardData() {
  return fetchRioAnimeApi<DashboardResponse>("/v1/dashboard");
}

export async function searchAnimeByTitle(search: string, perPage = 10) {
  const params = new URLSearchParams({
    q: search,
    limit: `${Math.min(Math.max(perPage, 1), 20)}`
  });
  const result = await fetchRioAnimeApi<SearchResponse>(`/v1/search?${params}`);
  return result.media;
}

export async function fetchAnimeEpisodeNumbers(animeId: string) {
  const result = await fetchRioAnimeApi<EpisodeNumbersResponse>(
    `/v1/anime/${encodeURIComponent(animeId)}/episodes?numbersOnly=1`
  );
  return result.episodeNumbers;
}

export async function fetchAnimeEpisodeSource(animeId: string, episodeNumber: number) {
  const params = new URLSearchParams({ episode: `${episodeNumber}` });
  const result = await fetchRioAnimeApi<EpisodeSourceResponse>(
    `/v1/anime/${encodeURIComponent(animeId)}/episodes?${params}`,
    true
  );
  return result.item;
}

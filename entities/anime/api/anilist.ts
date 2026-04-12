const ANILIST_API_URL = "https://graphql.anilist.co";

type AniListGraphQLError = {
  message: string;
};

type AniListGraphQLResponse<TData> = {
  data?: TData;
  errors?: AniListGraphQLError[];
};

export type AniListTitle = {
  romaji: string | null;
  english: string | null;
  native: string | null;
  userPreferred: string | null;
};

export type AniListMedia = {
  id: number;
  title: AniListTitle;
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
    nodes: {
      name: string | null;
    }[];
  } | null;
  nextAiringEpisode: {
    episode: number | null;
  } | null;
};

type HomePageAnimeResponse = {
  Page: {
    media: AniListMedia[];
  };
};

const MEDIA_FIELDS = `
  id
  title {
    romaji
    english
    native
    userPreferred
  }
  description(asHtml: false)
  bannerImage
  coverImage {
    extraLarge
    large
    medium
    color
  }
  averageScore
  meanScore
  episodes
  format
  season
  seasonYear
  genres
  popularity
  status
  studios(isMain: true) {
    nodes {
      name
    }
  }
  nextAiringEpisode {
    episode
  }
`;

const HOME_PAGE_QUERY = `
  query HomePageAnime($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(type: ANIME, isAdult: false, sort: [TRENDING_DESC, POPULARITY_DESC]) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const MOVIE_QUERY = `
  query HomePageMovies($page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(
        type: ANIME
        format: MOVIE
        isAdult: false
        sort: [TRENDING_DESC, POPULARITY_DESC]
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

const SEARCH_QUERY = `
  query SearchAnime($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(
        type: ANIME
        search: $search
        isAdult: false
        sort: [POPULARITY_DESC, TRENDING_DESC]
      ) {
        ${MEDIA_FIELDS}
      }
    }
  }
`;

async function fetchAniList<TData>(
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  // All AniList reads go through one helper so request and error handling stay consistent.
  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      query,
      variables
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`AniList request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as AniListGraphQLResponse<TData>;

  if (!payload.data || payload.errors?.length) {
    throw new Error(payload.errors?.[0]?.message ?? "AniList returned no data");
  }

  return payload.data;
}

export async function fetchTrendingAnimePage(page = 1, perPage = 36) {
  // The home page currently consumes one trending feed and shapes it downstream.
  const result = await fetchAniList<HomePageAnimeResponse>(HOME_PAGE_QUERY, {
    page,
    perPage
  });

  return result.Page.media;
}

export async function fetchTrendingMoviePage(page = 1, perPage = 24) {
  // Movies are fetched separately so the Movie tab uses live AniList entries instead of placeholders.
  const result = await fetchAniList<HomePageAnimeResponse>(MOVIE_QUERY, {
    page,
    perPage
  });

  return result.Page.media;
}

export async function searchAnimeByTitle(search: string, perPage = 10) {
  // Search powers direct watch-page entry where only the title slug is available.
  const result = await fetchAniList<HomePageAnimeResponse>(SEARCH_QUERY, {
    search,
    perPage
  });

  return result.Page.media;
}

export type HomeAnimeItem = {
  id: number;
  libraryId: string;
  urlSlug: string;
  title: string;
  alternateTitles: string[];
  subtitle: string;
  description: string;
  coverImage: string;
  bannerImage: string | null;
  score: number | null;
  episodesLabel: string;
  formatLabel: string;
  seasonLabel: string;
  genres: string[];
  accent: string;
  popularity: number;
  isNsfw: boolean;
  isFeatured: boolean;
};

export type WeeklyTopEntry = {
  id: number;
  libraryId: string;
  urlSlug: string;
  rank: number;
  title: string;
  image: string;
  scoreLabel: string;
  meta: string;
  isNsfw: boolean;
};

export type WatchAnimeItem = {
  id: number;
  libraryId: string;
  urlSlug: string;
  title: string;
  description: string;
  coverImage: string;
  bannerImage: string | null;
  score: number | null;
  formatLabel: string;
  seasonLabel: string;
  statusLabel: string;
  studioLabel: string;
  genres: string[];
  accent: string;
  episodeCount: number;
  episodeNumbers: number[];
  episodesLabel: string;
  isNsfw: boolean;
};

export type HomePageData = {
  spotlight: HomeAnimeItem | null;
  featured: HomeAnimeItem[];
  grid: HomeAnimeItem[];
  weeklyTop: WeeklyTopEntry[];
  sidebarGenres: string[];
};

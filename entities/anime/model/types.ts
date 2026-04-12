export type HomeAnimeItem = {
  id: number;
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
  hasSub: boolean;
  hasDub: boolean;
  accent: string;
  popularity: number;
};

export type WeeklyTopEntry = {
  id: number;
  rank: number;
  title: string;
  image: string;
  scoreLabel: string;
  meta: string;
};

export type WatchAnimeItem = {
  id: number;
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
  episodesLabel: string;
};

export type HomePageData = {
  spotlight: HomeAnimeItem | null;
  featured: HomeAnimeItem[];
  grid: HomeAnimeItem[];
  weeklyTop: WeeklyTopEntry[];
  sidebarGenres: string[];
};

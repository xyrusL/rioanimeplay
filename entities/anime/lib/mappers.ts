import type { AniListMedia } from "@/entities/anime/api/anilist";
import type { HomeAnimeItem, WatchAnimeItem } from "@/entities/anime/model/types";
import {
  cleanDescription,
  pickTitle,
  titleCase,
  trimText
} from "@/entities/anime/lib/formatters";
import { makePosterPlaceholder } from "@/entities/anime/lib/placeholders";

const ACCENT_PALETTE = [
  "#8d72ff",
  "#7cc7ff",
  "#ff9d8d",
  "#c6ff8a",
  "#f3b9ff",
  "#ffd86e"
];

function getAccent(media: AniListMedia, index: number) {
  return media.coverImage?.color ?? ACCENT_PALETTE[index % ACCENT_PALETTE.length];
}

function getCoverImage(media: AniListMedia, title: string, accent: string) {
  // Use generated artwork when AniList does not provide a usable cover image.
  return (
    media.coverImage?.extraLarge ??
    media.coverImage?.large ??
    media.coverImage?.medium ??
    makePosterPlaceholder(title, accent)
  );
}

export function getEpisodeCount(media: Pick<AniListMedia, "episodes" | "nextAiringEpisode">) {
  // For releasing shows, AniList often omits the final episode total but exposes the next airing episode.
  const currentEpisodeCount =
    media.nextAiringEpisode?.episode && media.nextAiringEpisode.episode > 1
      ? media.nextAiringEpisode.episode - 1
      : null;

  return media.episodes ?? currentEpisodeCount ?? 1;
}

function getSeasonLabel(media: Pick<AniListMedia, "season" | "seasonYear">) {
  return media.season
    ? `${titleCase(media.season)} ${media.seasonYear ?? ""}`.trim()
    : media.seasonYear
      ? `${media.seasonYear}`
      : "Catalog Pick";
}

function getStatusLabel(status: AniListMedia["status"]) {
  return status ? titleCase(status) : "Unknown";
}

function getStudioLabel(studios: AniListMedia["studios"]) {
  const mainStudio = studios?.nodes.find((studio) => studio.name)?.name;
  return mainStudio ?? "Unknown";
}

export function mapAniListMediaToHomeItem(
  media: AniListMedia,
  index: number
): HomeAnimeItem {
  const title = pickTitle(media.title);
  const accent = getAccent(media, index);
  const coverImage = getCoverImage(media, title, accent);
  const formatLabel = media.format ? titleCase(media.format) : "TV";
  const seasonLabel = getSeasonLabel(media);
  const score = media.averageScore ?? media.meanScore ?? null;
  const alternateTitles = [
    media.title.english,
    media.title.userPreferred,
    media.title.romaji,
    media.title.native
  ]
    .filter((value): value is string => Boolean(value))
    .filter((value, itemIndex, list) => list.indexOf(value) === itemIndex && value !== title);
  // AniList does not include sub/dub availability in this feed, so use a stable demo split for filters.
  const hasDub = media.format === "MOVIE" || index % 3 !== 1;
  const episodeCount = getEpisodeCount(media);

  return {
    id: media.id,
    title,
    alternateTitles,
    subtitle: `${formatLabel} • ${seasonLabel}`,
    description: trimText(cleanDescription(media.description), 240),
    coverImage,
    bannerImage: media.bannerImage,
    score,
    episodesLabel: `${episodeCount}`,
    formatLabel,
    seasonLabel,
    genres: media.genres.filter(Boolean) as string[],
    hasSub: true,
    hasDub,
    accent,
    popularity: media.popularity ?? 0
  };
}

export function mapAniListMediaToWatchItem(
  media: AniListMedia,
  index: number
): WatchAnimeItem {
  const title = pickTitle(media.title);
  const accent = getAccent(media, index);
  const episodeCount = getEpisodeCount(media);

  return {
    id: media.id,
    title,
    description: trimText(cleanDescription(media.description), 520),
    coverImage: getCoverImage(media, title, accent),
    bannerImage: media.bannerImage,
    score: media.averageScore ?? media.meanScore ?? null,
    formatLabel: media.format ? titleCase(media.format) : "TV",
    seasonLabel: getSeasonLabel(media),
    statusLabel: getStatusLabel(media.status),
    studioLabel: getStudioLabel(media.studios),
    genres: media.genres.filter(Boolean) as string[],
    accent,
    episodeCount,
    episodesLabel: `${episodeCount}`
  };
}

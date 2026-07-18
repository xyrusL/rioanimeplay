import type { CatalogMedia } from "@/entities/anime/api/catalog";
import type { HomeAnimeItem, WatchAnimeItem } from "@/entities/anime/model/types";
import {
  cleanDescription,
  pickTitle,
  titleCase,
  trimText
} from "@/entities/anime/lib/formatters";
import { toAnimeSlug } from "@/entities/anime/lib/slug";

const ACCENT_PALETTE = [
  "#8d72ff",
  "#7cc7ff",
  "#ff9d8d",
  "#c6ff8a",
  "#f3b9ff",
  "#ffd86e"
];

function getAccent(media: CatalogMedia, index: number) {
  return media.coverImage?.color ?? ACCENT_PALETTE[index % ACCENT_PALETTE.length];
}

function getCoverImage(media: CatalogMedia, title: string, accent: string) {
  const coverImage =
    media.coverImage?.extraLarge ??
    media.coverImage?.large ??
    media.coverImage?.medium;

  if (!coverImage) {
    throw new Error(`Missing catalog artwork for ${title} (${accent})`);
  }

  return coverImage;
}

export function getEpisodeCount(media: Pick<CatalogMedia, "episodes" | "nextAiringEpisode">) {
  // Releasing shows may expose the next episode before a final episode total is available.
  const currentEpisodeCount =
    media.nextAiringEpisode?.episode && media.nextAiringEpisode.episode > 1
      ? media.nextAiringEpisode.episode - 1
      : null;

  return media.episodes ?? currentEpisodeCount ?? 1;
}

function getSeasonLabel(media: Pick<CatalogMedia, "season" | "seasonYear">) {
  return media.season
    ? `${titleCase(media.season)} ${media.seasonYear ?? ""}`.trim()
    : media.seasonYear
      ? `${media.seasonYear}`
      : "Catalog Pick";
}

function getStatusLabel(status: CatalogMedia["status"]) {
  return status ? titleCase(status) : "Unknown";
}

function getStudioLabel(studios: CatalogMedia["studios"]) {
  const mainStudio = studios?.nodes.find((studio) => studio.name)?.name;
  return mainStudio ?? "Unknown";
}

function getLibraryId(media: CatalogMedia) {
  return media.libraryId || `${media.id}`;
}

function getUrlSlug(media: CatalogMedia, title: string) {
  return media.urlSlug || media.libraryId || toAnimeSlug(title);
}

export function mapCatalogMediaToHomeItem(
  media: CatalogMedia,
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
  const episodeCount = getEpisodeCount(media);

  return {
    id: media.id,
    libraryId: getLibraryId(media),
    urlSlug: getUrlSlug(media, title),
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
    accent,
    popularity: media.popularity ?? 0,
    isNsfw: media.isNsfw,
    isFeatured: media.isFeatured
  };
}

export function mapCatalogMediaToWatchItem(
  media: CatalogMedia,
  index: number
): WatchAnimeItem {
  const title = pickTitle(media.title);
  const accent = getAccent(media, index);
  const episodeCount = getEpisodeCount(media);

  return {
    id: media.id,
    libraryId: getLibraryId(media),
    urlSlug: getUrlSlug(media, title),
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
    episodeNumbers: Array.from({ length: episodeCount }, (_, episodeIndex) => episodeIndex + 1),
    episodesLabel: `${episodeCount}`,
    isNsfw: media.isNsfw
  };
}

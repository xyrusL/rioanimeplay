import {
  fetchAnimeById,
  fetchAnimeEpisodeNumbers,
  fetchBrowseCatalog,
  type CatalogMedia
} from "@/entities/anime/api/catalog";
import { mapCatalogMediaToWatchItem } from "@/entities/anime/lib/mappers";
import { matchesAnimeSlug } from "@/entities/anime/lib/slug";
import type { WatchAnimeItem } from "@/entities/anime/model/types";
import { getAnimeRuleBySlug, getAnimeRuleByTitle, getSiteSettings } from "@/shared/lib/site-settings";

export type WatchPageDataResult =
  | { status: "available"; anime: WatchAnimeItem }
  | { status: "locked"; title: string; message: string }
  | { status: "not-found" };

async function resolveWatchMedia(slug: string) {
  try {
    return { media: await fetchAnimeById(slug), index: 0 };
  } catch {
    const catalog = await fetchBrowseCatalog();
    const results = [...catalog.anime, ...catalog.movies].filter(
      (media, index, list) => list.findIndex((item) => item.libraryId === media.libraryId) === index
    );
    const matchedIndex = results.findIndex((media) => matchesAnimeSlug(media.title, slug));
    return matchedIndex === -1
      ? null
      : { media: results[matchedIndex] as CatalogMedia, index: matchedIndex };
  }
}

export async function getWatchPageData(slug: string) {
  const siteSettings = await getSiteSettings();
  const slugRule = getAnimeRuleBySlug(siteSettings, slug);

  if (slugRule?.status === "private") {
    return { status: "not-found" } as const;
  }

  if (slugRule?.status === "locked") {
    return {
      status: "locked",
      title: slugRule.title,
      message:
        slugRule.message?.trim() ||
        "This anime is temporarily unavailable to watch right now. Please wait for a future announcement."
    } as const;
  }

  try {
    const resolved = await resolveWatchMedia(slug);
    if (!resolved) {
      return { status: "not-found" } as const;
    }

    const anime = mapCatalogMediaToWatchItem(resolved.media, resolved.index);
    const episodeNumbers = await fetchAnimeEpisodeNumbers(anime.libraryId).catch(
      () => anime.episodeNumbers
    );
    const playableAnime = {
      ...anime,
      episodeCount: episodeNumbers.length,
      episodeNumbers,
      episodesLabel: `${episodeNumbers.length}`
    };
    const titleRule = getAnimeRuleByTitle(siteSettings, anime.title);

    if (titleRule?.status === "private") {
      return { status: "not-found" } as const;
    }

    if (titleRule?.status === "locked") {
      return {
        status: "locked",
        title: anime.title,
        message:
          titleRule.message?.trim() ||
          "This anime is temporarily unavailable to watch right now. Please wait for a future announcement."
      } as const;
    }

    return { status: "available", anime: playableAnime } as const;
  } catch {
    return { status: "not-found" } as const;
  }
}

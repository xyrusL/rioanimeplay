import { searchAnimeByTitle } from "@/entities/anime/api/anilist";
import { mapAniListMediaToWatchItem } from "@/entities/anime/lib/mappers";
import { matchesAnimeSlug, slugToSearchText } from "@/entities/anime/lib/slug";
import type { WatchAnimeItem } from "@/entities/anime/model/types";
import { getAnimeRuleBySlug, getAnimeRuleByTitle, getSiteSettings } from "@/shared/lib/site-settings";

export type WatchPageDataResult =
  | { status: "available"; anime: WatchAnimeItem }
  | { status: "locked"; title: string; message: string }
  | { status: "not-found" };

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
    const results = await searchAnimeByTitle(slugToSearchText(slug), 10);
    const matchedIndex = results.findIndex((media) => matchesAnimeSlug(media.title, slug));

    if (matchedIndex === -1) {
      return { status: "not-found" } as const;
    }

    const anime = mapAniListMediaToWatchItem(results[matchedIndex], matchedIndex);
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

    return { status: "available", anime } as const;
  } catch {
    return { status: "not-found" } as const;
  }
}

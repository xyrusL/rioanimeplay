import { fetchAnimeEpisodeSource } from "@/entities/anime/api/catalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const animeId = searchParams.get("animeId")?.trim() ?? "";
  const episodeNumber = Number.parseInt(searchParams.get("episode") ?? "", 10);

  if (!/^[a-z0-9][a-z0-9()?-]{0,199}$/i.test(animeId) || !Number.isInteger(episodeNumber) || episodeNumber < 1) {
    return Response.json(
      { error: { code: "INVALID_EPISODE", message: "Invalid anime or episode" } },
      { status: 400 }
    );
  }

  try {
    const episode = await fetchAnimeEpisodeSource(animeId, episodeNumber);
    return Response.json({ episode }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return Response.json(
      { error: { code: "EPISODE_NOT_FOUND", message: "Episode source not found" } },
      { status: 404 }
    );
  }
}

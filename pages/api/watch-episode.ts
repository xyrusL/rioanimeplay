import type { NextApiRequest, NextApiResponse } from "next";

import { fetchAnimeEpisodeSource } from "@/entities/anime/api/catalog";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported" } });
    return;
  }

  const animeId = typeof req.query.animeId === "string" ? req.query.animeId.trim() : "";
  const episodeNumber = Number.parseInt(
    typeof req.query.episode === "string" ? req.query.episode : "",
    10
  );

  if (!/^[a-z0-9][a-z0-9()?-]{0,199}$/i.test(animeId) || !Number.isInteger(episodeNumber) || episodeNumber < 1) {
    res.status(400).json({ error: { code: "INVALID_EPISODE", message: "Invalid anime or episode" } });
    return;
  }

  try {
    const episode = await fetchAnimeEpisodeSource(animeId, episodeNumber);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ episode });
  } catch {
    res.status(404).json({ error: { code: "EPISODE_NOT_FOUND", message: "Episode source not found" } });
  }
}

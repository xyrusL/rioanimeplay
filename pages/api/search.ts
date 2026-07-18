import type { NextApiRequest, NextApiResponse } from "next";

import { searchAnimeSuggestions } from "@/features/search/model/anime-search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({
      error: { code: "METHOD_NOT_ALLOWED", message: "Only GET is supported" }
    });
    return;
  }

  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (query.length < 1) {
    res.status(200).json({ results: [] });
    return;
  }

  if (query.length > 100) {
    res.status(400).json({
      error: { code: "INVALID_QUERY", message: "Search is too long" }
    });
    return;
  }

  try {
    const results = await searchAnimeSuggestions(query);
    res.setHeader("Cache-Control", "private, max-age=30, stale-while-revalidate=120");
    res.status(200).json({ results });
  } catch {
    res.status(502).json({
      error: { code: "UPSTREAM_ERROR", message: "Search is temporarily unavailable" }
    });
  }
}

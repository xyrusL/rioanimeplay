import type { NextApiRequest, NextApiResponse } from "next";

import { searchAnimeSuggestions } from "@/features/search/model/anime-search";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";

  if (query.length < 1) {
    res.status(200).json({ results: [] });
    return;
  }

  const results = await searchAnimeSuggestions(query);
  res.status(200).json({ results });
}

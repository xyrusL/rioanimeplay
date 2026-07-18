import { getAnimeSearchCatalog } from "@/features/search/model/anime-search";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await getAnimeSearchCatalog();
    return Response.json({ results }, {
      headers: { "Cache-Control": "private, max-age=60, stale-while-revalidate=300" }
    });
  } catch {
    return Response.json(
      { error: { code: "UPSTREAM_ERROR", message: "Search index is temporarily unavailable" } },
      { status: 502 }
    );
  }
}

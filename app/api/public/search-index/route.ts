import { getAnimeSearchCatalog } from "@/features/search/model/anime-search";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const results = await getAnimeSearchCatalog();
    return Response.json({ results }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600, stale-if-error=86400" }
    });
  } catch {
    return Response.json(
      { error: { code: "UPSTREAM_ERROR", message: "Search index is temporarily unavailable" } },
      { status: 502 }
    );
  }
}

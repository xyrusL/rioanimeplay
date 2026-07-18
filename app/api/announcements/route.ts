const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.deze.me";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) return Response.json({ items: [] });
  const source = new URL(request.url);
  const params = new URLSearchParams();
  if (source.searchParams.get("animeId")) params.set("animeId", source.searchParams.get("animeId")!);
  if (source.searchParams.get("placement")) params.set("placement", source.searchParams.get("placement")!);
  try {
    const response = await fetch(`${API_URL}/v1/announcements?${params}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(5_000),
      headers: {
        "X-RioAnime-Key": apiKey,
        ...(request.headers.get("If-None-Match") ? { "If-None-Match": request.headers.get("If-None-Match")! } : {})
      }
    });
    if (response.status === 304) return new Response(null, { status: 304, headers: { ETag: response.headers.get("ETag") ?? "" } });
    return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json", ETag: response.headers.get("ETag") ?? "", "Cache-Control": "public, max-age=30, stale-while-revalidate=60" } });
  } catch {
    return Response.json({ items: [] }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}


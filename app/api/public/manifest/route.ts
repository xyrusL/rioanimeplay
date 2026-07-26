const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.dezely.com";

const CACHE_CONTROL = "public, s-maxage=60, stale-while-revalidate=300, stale-if-error=86400";

export async function GET() {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) {
    return Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 });
  }

  try {
    const response = await fetch(`${API_URL}/v1/cache-manifest`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: "application/json", "X-RioAnime-Key": apiKey }
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": response.ok ? CACHE_CONTROL : "private, no-store",
        ETag: response.headers.get("ETag") ?? ""
      }
    });
  } catch {
    return Response.json({ error: { code: "API_UNAVAILABLE" } }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store" }
    });
  }
}

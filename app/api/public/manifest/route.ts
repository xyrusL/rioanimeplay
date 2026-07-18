const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.deze.me";

export const dynamic = "force-dynamic";

export async function GET() {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) {
    return Response.json({ error: { code: "API_UNAVAILABLE" } }, { status: 503 });
  }

  try {
    const response = await fetch(`${API_URL}/v1/cache-manifest`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: "application/json", "X-RioAnime-Key": apiKey }
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "private, no-store" }
    });
  } catch {
    return Response.json({ error: { code: "API_UNAVAILABLE" } }, {
      status: 503,
      headers: { "Cache-Control": "private, no-store" }
    });
  }
}

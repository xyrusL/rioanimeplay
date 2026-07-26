import "server-only";

const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.dezely.com";

export async function requestApiKeyAdmin(path: string, init?: RequestInit) {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) throw new Error("RIOANIME_API_KEY is not configured");

  return fetch(`${API_URL}/v1/api-keys${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-RioAnime-Key": apiKey,
      ...init?.headers
    }
  });
}

export async function relayApiKeyAdminResponse(response: Response) {
  if (response.status === 204) return new Response(null, { status: 204 });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" }
  });
}

export function apiKeyAdminError() {
  return Response.json(
    { error: { code: "API_UNAVAILABLE", message: "API key service is currently unavailable" } },
    { status: 502 }
  );
}

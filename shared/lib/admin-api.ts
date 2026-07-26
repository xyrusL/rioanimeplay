import "server-only";

import { getAdminSession } from "@/shared/lib/admin-auth";

const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.dezely.com";

export async function requestAdminApi(path: string, init?: RequestInit) {
  const [session, apiKey] = await Promise.all([
    getAdminSession(),
    Promise.resolve(process.env.RIOANIME_API_KEY)
  ]);
  if (!session || !apiKey) return null;
  return fetch(`${API_URL}/v1/admin${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-RioAnime-Key": apiKey,
      "X-RioAnime-Admin-Id": session.accountId,
      ...init?.headers
    }
  });
}

export async function fetchAdminProfile() {
  const response = await requestAdminApi("/profile");
  if (!response?.ok) return null;
  const result = await response.json() as { account?: { id: string; username: string; email: string; role: string; lastLoginAt: string | null } };
  return result.account ?? null;
}

export async function relayAdminApiResponse(response: Response | null) {
  if (!response) return Response.json({ error: { message: "Admin authentication required" } }, { status: 401 });
  if (response.status === 204) return new Response(null, { status: 204 });
  return new Response(await response.text(), {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" }
  });
}

import { auth } from "@/auth";

const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.deze.me";

export const dynamic = "force-dynamic";

async function requestLibrary(method: "GET" | "PUT", body?: string) {
  const [session, apiKey] = await Promise.all([
    auth(),
    Promise.resolve(process.env.RIOANIME_API_KEY)
  ]);
  const email = session?.user?.email?.trim().toLowerCase();

  if (!email) {
    return Response.json({ error: { message: "Sign in to sync your library" } }, { status: 401 });
  }
  if (!apiKey) {
    return Response.json({ error: { message: "Library sync is not configured" } }, { status: 503 });
  }

  const response = await fetch(`${API_URL}/v1/user/library`, {
    method,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-RioAnime-Key": apiKey,
      "X-RioAnime-User-Email": encodeURIComponent(email),
      "X-RioAnime-User-Name": encodeURIComponent(session?.user?.name?.trim() || email.split("@")[0])
    },
    ...(body ? { body } : {})
  });

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export async function GET() {
  try {
    return await requestLibrary("GET");
  } catch {
    return Response.json({ error: { message: "Library sync is unavailable" } }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  try {
    return await requestLibrary("PUT", await request.text());
  } catch {
    return Response.json({ error: { message: "Library sync is unavailable" } }, { status: 502 });
  }
}

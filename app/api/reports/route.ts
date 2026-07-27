import { auth } from "@/auth";

const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.dezely.com";
const TURNSTILE_ACTION = "report_issue";

export const dynamic = "force-dynamic";

function clientIp(request: Request) {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Real-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  ).slice(0, 64);
}

async function verifyTurnstile(request: Request, token: unknown) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret || typeof token !== "string" || !token || token.length > 2_048) return false;

  const configuredHostnames = (process.env.TURNSTILE_HOSTNAMES ?? "")
    .split(",")
    .map((hostname) => hostname.trim().toLowerCase())
    .filter(Boolean);
  const requestHostname = new URL(request.url).hostname.toLowerCase();
  const expectedHostnames = new Set(configuredHostnames.length ? configuredHostnames : [requestHostname]);

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret, response: token, remoteip: clientIp(request) })
    });
    if (!response.ok) return false;
    const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
    return result.success === true && result.action === TURNSTILE_ACTION && typeof result.hostname === "string" && expectedHostnames.has(result.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.RIOANIME_API_KEY;
  if (!apiKey) return Response.json({ error: { message: "Reporting is not configured" } }, { status: 503 });
  const contentLength = Number(request.headers.get("Content-Length") ?? 0);
  if (contentLength > 16_384) return Response.json({ error: { message: "Report is too large" } }, { status: 413 });

  try {
    const rawBody = await request.text();
    if (rawBody.length > 16_384) return Response.json({ error: { message: "Report is too large" } }, { status: 413 });
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    if (!(await verifyTurnstile(request, body.turnstileToken))) {
      return Response.json({ error: { message: "Verification failed. Please try again." } }, { status: 403 });
    }
    delete body.turnstileToken;
    const memberEmail = (await auth())?.user?.email?.trim().toLowerCase() ?? "";
    const response = await fetch(`${API_URL}/v1/reports`, {
      method: "POST",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-RioAnime-Key": apiKey,
        "X-RioAnime-Client-IP": clientIp(request),
        "X-RioAnime-Client-Agent": (request.headers.get("User-Agent") ?? "unknown").slice(0, 256),
        ...(memberEmail ? { "X-RioAnime-User-Email": encodeURIComponent(memberEmail) } : {})
      },
      body: JSON.stringify(body)
    });
    return new Response(await response.text(), {
      status: response.status,
      headers: { "Cache-Control": "private, no-store", "Content-Type": "application/json; charset=utf-8" }
    });
  } catch (cause) {
    if (cause instanceof SyntaxError) return Response.json({ error: { message: "Invalid report data" } }, { status: 400 });
    return Response.json({ error: { message: "Reporting is temporarily unavailable" } }, { status: 502 });
  }
}

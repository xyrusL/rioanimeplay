import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const range = new URL(request.url).searchParams.get("range");
    const safeRange = range === "24h" || range === "7d" ? range : "30d";
    return relayAdminApiResponse(await requestAdminApi(`/analytics?range=${safeRange}`));
  } catch {
    return Response.json({ error: { message: "Analytics service is unavailable" } }, { status: 502 });
  }
}

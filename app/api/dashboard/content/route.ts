import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).search;
    return relayAdminApiResponse(await requestAdminApi(`/content${query}`));
  } catch {
    return Response.json({ error: { message: "Content service is unavailable" } }, { status: 502 });
  }
}

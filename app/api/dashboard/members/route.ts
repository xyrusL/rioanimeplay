import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const memberId = url.searchParams.get("id");
    if (memberId) {
      return relayAdminApiResponse(await requestAdminApi(`/members/${encodeURIComponent(memberId)}`));
    }
    const query = url.search;
    return relayAdminApiResponse(await requestAdminApi(`/members${query}`));
  } catch {
    return Response.json({ error: { message: "Member service is unavailable" } }, { status: 502 });
  }
}

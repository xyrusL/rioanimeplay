import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return relayAdminApiResponse(await requestAdminApi("/announcements"));
}

export async function POST(request: Request) {
  return relayAdminApiResponse(await requestAdminApi("/announcements", { method: "POST", body: await request.text() }));
}

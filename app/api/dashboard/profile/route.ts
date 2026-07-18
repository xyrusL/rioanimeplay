import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return relayAdminApiResponse(await requestAdminApi("/profile"));
  } catch {
    return Response.json({ error: { message: "Profile service is unavailable" } }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  try {
    return relayAdminApiResponse(await requestAdminApi("/profile", { method: "PATCH", body: await request.text() }));
  } catch {
    return Response.json({ error: { message: "Profile service is unavailable" } }, { status: 502 });
  }
}

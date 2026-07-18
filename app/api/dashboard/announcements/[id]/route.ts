import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const { id } = await params;
  const action = request.headers.get("X-Notification-Action");
  return relayAdminApiResponse(await requestAdminApi(`/announcements/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: await request.text(),
    headers: action ? { "X-Notification-Action": action } : undefined
  }));
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  return relayAdminApiResponse(await requestAdminApi(`/announcements/${encodeURIComponent(id)}`, { method: "DELETE" }));
}

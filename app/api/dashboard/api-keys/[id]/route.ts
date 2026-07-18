import { isAdminAuthenticated } from "@/shared/lib/admin-auth";
import {
  apiKeyAdminError,
  relayApiKeyAdminResponse,
  requestApiKeyAdmin
} from "@/shared/lib/api-key-admin";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function unauthorized() {
  return Response.json({ error: { message: "Admin authentication required" } }, { status: 401 });
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const { id } = await context.params;
    const body = await request.text();
    return relayApiKeyAdminResponse(
      await requestApiKeyAdmin(`/${encodeURIComponent(id)}`, { method: "PATCH", body })
    );
  } catch {
    return apiKeyAdminError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const { id } = await context.params;
    return relayApiKeyAdminResponse(
      await requestApiKeyAdmin(`/${encodeURIComponent(id)}`, { method: "DELETE" })
    );
  } catch {
    return apiKeyAdminError();
  }
}

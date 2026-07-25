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

export async function GET(_request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const { id } = await context.params;
    return relayApiKeyAdminResponse(
      await requestApiKeyAdmin(`/${encodeURIComponent(id)}/domain-lock`)
    );
  } catch {
    return apiKeyAdminError();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const { id } = await context.params;
    return relayApiKeyAdminResponse(
      await requestApiKeyAdmin(`/${encodeURIComponent(id)}/domain-lock`, { method: "PATCH", body: await request.text() })
    );
  } catch {
    return apiKeyAdminError();
  }
}

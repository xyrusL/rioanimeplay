import { isAdminAuthenticated } from "@/shared/lib/admin-auth";
import {
  apiKeyAdminError,
  relayApiKeyAdminResponse,
  requestApiKeyAdmin
} from "@/shared/lib/api-key-admin";

export const dynamic = "force-dynamic";

function unauthorized() {
  return Response.json({ error: { message: "Admin authentication required" } }, { status: 401 });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    return relayApiKeyAdminResponse(await requestApiKeyAdmin(""));
  } catch {
    return apiKeyAdminError();
  }
}

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return unauthorized();
  try {
    const body = await request.text();
    return relayApiKeyAdminResponse(await requestApiKeyAdmin("", { method: "POST", body }));
  } catch {
    return apiKeyAdminError();
  }
}

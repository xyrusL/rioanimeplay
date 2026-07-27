import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return relayAdminApiResponse(await requestAdminApi("/reports"));
}

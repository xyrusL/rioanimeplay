import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return relayAdminApiResponse(await requestAdminApi("/content-notices"));
  } catch {
    return Response.json(
      { error: { message: "Content notice templates could not be loaded" } },
      { status: 502 }
    );
  }
}

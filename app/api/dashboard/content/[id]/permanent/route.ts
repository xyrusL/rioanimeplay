import { revalidatePath } from "next/cache";

import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const response = await requestAdminApi(`/content/${encodeURIComponent(id)}/permanent`, { method: "DELETE" });
    if (response?.ok) revalidatePath("/", "layout");
    return relayAdminApiResponse(response);
  } catch {
    return Response.json({ error: { message: "Content could not be permanently deleted" } }, { status: 502 });
  }
}

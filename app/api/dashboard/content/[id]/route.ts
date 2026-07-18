import { revalidatePath } from "next/cache";

import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function refreshCatalog() {
  revalidatePath("/", "layout");
  revalidatePath("/filter");
  revalidatePath("/watch/[slug]", "page");
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const response = await requestAdminApi(`/content/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: await request.text()
    });
    if (response?.ok) refreshCatalog();
    return relayAdminApiResponse(response);
  } catch {
    return Response.json({ error: { message: "Content could not be updated" } }, { status: 502 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const response = await requestAdminApi(`/content/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (response?.ok) refreshCatalog();
    return relayAdminApiResponse(response);
  } catch {
    return Response.json({ error: { message: "Content could not be deleted" } }, { status: 502 });
  }
}

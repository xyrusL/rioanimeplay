import { revalidatePath } from "next/cache";

import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function DELETE() {
  try {
    const response = await requestAdminApi("/content/deleted", { method: "DELETE" });
    if (response?.ok) revalidatePath("/", "layout");
    return relayAdminApiResponse(response);
  } catch {
    return Response.json({ error: { message: "The recycle bin could not be emptied" } }, { status: 502 });
  }
}

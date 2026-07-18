import { revalidatePath } from "next/cache";

import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return relayAdminApiResponse(await requestAdminApi("/content/featured"));
  } catch {
    return Response.json({ error: { message: "Featured posts could not be loaded" } }, { status: 502 });
  }
}

export async function PUT(request: Request) {
  try {
    const response = await requestAdminApi("/content/featured", { method: "PUT", body: await request.text() });
    if (response?.ok) revalidatePath("/", "layout");
    return relayAdminApiResponse(response);
  } catch {
    return Response.json({ error: { message: "Featured posts could not be saved" } }, { status: 502 });
  }
}

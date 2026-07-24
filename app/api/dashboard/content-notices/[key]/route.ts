import { revalidatePath } from "next/cache";

import { relayAdminApiResponse, requestAdminApi } from "@/shared/lib/admin-api";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ key: string }> };

function refreshContentNotices() {
  revalidatePath("/", "layout");
  revalidatePath("/filter");
  revalidatePath("/watch/[slug]", "page");
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { key } = await params;
    const response = await requestAdminApi(`/content-notices/${encodeURIComponent(key)}`, {
      method: "PATCH",
      body: await request.text()
    });
    if (response?.ok) refreshContentNotices();
    return relayAdminApiResponse(response);
  } catch {
    return Response.json(
      { error: { message: "Content notice group could not be updated" } },
      { status: 502 }
    );
  }
}

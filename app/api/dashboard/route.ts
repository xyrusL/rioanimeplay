import { fetchDashboardData } from "@/entities/anime/api/catalog";
import { isAdminAuthenticated } from "@/shared/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!await isAdminAuthenticated()) {
    return Response.json({ error: { message: "Admin authentication required" } }, { status: 401 });
  }

  try {
    return Response.json(await fetchDashboardData());
  } catch {
    return Response.json({ error: { message: "Dashboard service is unavailable" } }, { status: 502 });
  }
}

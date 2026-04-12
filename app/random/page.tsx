import { redirect } from "next/navigation";

import { getRandomAnimeHref } from "@/features/browse/model/browse-page-data";

export const dynamic = "force-dynamic";

export default async function RandomAnimePage() {
  redirect(await getRandomAnimeHref());
}

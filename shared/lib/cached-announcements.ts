"use client";

import { loadPublicResource, type CacheDefinition } from "@/shared/lib/public-resource-cache";

export type PublicAnnouncement = {
  id: string;
  title: string;
  message: string;
  occurrence?: string;
  kind?: "video_ads";
  repeat?: "always";
};

function isAnnouncement(value: unknown): value is PublicAnnouncement {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PublicAnnouncement>;
  return typeof item.id === "string"
    && typeof item.title === "string"
    && typeof item.message === "string"
    && (item.occurrence === undefined || typeof item.occurrence === "string")
    && (item.kind === undefined || item.kind === "video_ads")
    && (item.repeat === undefined || item.repeat === "always");
}

export async function loadCachedAnnouncements(params: URLSearchParams) {
  const cacheKey = [...params.entries()].sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`).join("&");
  const definition: CacheDefinition<PublicAnnouncement[]> = {
    key: `announcements:${cacheKey}`,
    resource: "announcements",
    schemaVersion: 1,
    validate: (value): value is PublicAnnouncement[] => Array.isArray(value) && value.every(isAnnouncement),
    priority: 20
  };

  return loadPublicResource(definition, async () => {
    const response = await fetch(`/api/announcements?${params}`);
    if (!response.ok) throw new Error(`Announcement request failed (${response.status})`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("items" in payload)) return [];
    const items = (payload as { items: unknown }).items;
    if (!definition.validate(items)) throw new Error("Announcement response is invalid");
    return items;
  }, 30_000);
}

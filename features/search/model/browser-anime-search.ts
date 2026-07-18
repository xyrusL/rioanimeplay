"use client";

import Fuse from "fuse.js";

import { loadPublicResource, type CacheDefinition } from "@/shared/lib/public-resource-cache";

export type BrowserSearchItem = {
  id: number;
  libraryId: string;
  urlSlug: string;
  title: string;
  alternateTitles: string[];
  coverImage: string;
  formatLabel: string;
  yearLabel: string;
  episodesLabel: string;
  scoreLabel: string;
  href: string;
};

const SEARCH_LIMIT = 8;
const INDEX_TTL_MS = 24 * 60 * 60 * 1000;

function isSearchItem(value: unknown): value is BrowserSearchItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<BrowserSearchItem>;
  return Number.isFinite(item.id)
    && typeof item.libraryId === "string"
    && typeof item.urlSlug === "string"
    && typeof item.title === "string"
    && Array.isArray(item.alternateTitles)
    && item.alternateTitles.every((title) => typeof title === "string")
    && typeof item.coverImage === "string"
    && typeof item.formatLabel === "string"
    && typeof item.yearLabel === "string"
    && typeof item.episodesLabel === "string"
    && typeof item.scoreLabel === "string"
    && typeof item.href === "string";
}

const searchIndexDefinition: CacheDefinition<BrowserSearchItem[]> = {
  key: "catalog:search-index",
  resource: "catalog",
  schemaVersion: 1,
  validate: (value): value is BrowserSearchItem[] => Array.isArray(value) && value.every(isSearchItem),
  normalize: (items) => items.filter((item, index, list) =>
    list.findIndex((candidate) => candidate.id === item.id) === index
  ),
  priority: 100
};

export async function loadBrowserSearchIndex() {
  return loadPublicResource(searchIndexDefinition, async () => {
    const response = await fetch("/api/public/search-index");
    if (!response.ok) throw new Error(`Search index request failed (${response.status})`);
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("results" in payload)) {
      throw new Error("Search index response is invalid");
    }
    const results = (payload as { results: unknown }).results;
    if (!searchIndexDefinition.validate(results)) throw new Error("Search index data is invalid");
    return results;
  }, INDEX_TTL_MS);
}

function normalize(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
}

function boundaryScore(candidate: string, query: string) {
  if (candidate.startsWith(query)) return 0;
  const index = candidate.indexOf(` ${query}`);
  return index === -1 ? Number.POSITIVE_INFINITY : index;
}

export function rankBrowserSearchItems(items: BrowserSearchItem[], query: string) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const ranked = items.flatMap((item) => {
    const title = normalize(item.title);
    const alternates = item.alternateTitles.map(normalize).filter(Boolean);
    if (title === normalizedQuery) return [{ item, tier: 0, score: 0 }];
    if (alternates.includes(normalizedQuery)) return [{ item, tier: 1, score: 0 }];
    if (title.startsWith(normalizedQuery)) return [{ item, tier: 2, score: title.length - normalizedQuery.length }];
    const alternatePrefix = alternates.find((candidate) => candidate.startsWith(normalizedQuery));
    if (alternatePrefix) return [{ item, tier: 3, score: alternatePrefix.length - normalizedQuery.length }];
    const titleBoundary = boundaryScore(title, normalizedQuery);
    if (Number.isFinite(titleBoundary)) return [{ item, tier: 4, score: titleBoundary }];
    const alternateBoundary = Math.min(...alternates.map((candidate) => boundaryScore(candidate, normalizedQuery)));
    return Number.isFinite(alternateBoundary) ? [{ item, tier: 5, score: alternateBoundary }] : [];
  });

  const fuzzy = new Fuse(items, {
    includeScore: true,
    threshold: 0.36,
    ignoreLocation: true,
    minMatchCharLength: Math.max(1, Math.min(normalizedQuery.length, 2)),
    keys: [{ name: "title", weight: 0.7 }, { name: "alternateTitles", weight: 0.3 }]
  }).search(normalizedQuery, { limit: SEARCH_LIMIT * 3 }).map((entry, index) => ({
    item: entry.item,
    tier: 6,
    score: (entry.score ?? 1) + index / 1000
  }));

  return [...ranked, ...fuzzy]
    .sort((left, right) => left.tier - right.tier || left.score - right.score || left.item.title.localeCompare(right.item.title))
    .filter((entry, index, list) => list.findIndex((candidate) => candidate.item.id === entry.item.id) === index)
    .slice(0, SEARCH_LIMIT)
    .map((entry) => entry.item);
}

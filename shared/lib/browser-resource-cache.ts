"use client";

type CacheEntry<T> = { key: string; schemaVersion: number; data: T; checksum: string; etag: string | null; expiresAt: number; lastAccessedAt: number };

const CACHE_SCHEMA_VERSION = 1;

function checksum(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (const character of input) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

const DB_NAME = "rioanime-public-cache";
const STORE_NAME = "resources";
const DB_VERSION = 1;

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const tx = database.transaction(STORE_NAME, mode);
    const request = action(tx.objectStore(STORE_NAME));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => database.close();
  });
}

export async function getCachedResource<T>(key: string): Promise<CacheEntry<T> | null> {
  if (typeof indexedDB === "undefined") return null;
  const entry = await transaction<CacheEntry<T> | undefined>("readonly", (store) => store.get(key)).catch(() => undefined);
  if (!entry) return null;
  if (entry.schemaVersion !== CACHE_SCHEMA_VERSION || entry.checksum !== checksum(entry.data)) {
    await deleteCachedResource(key);
    return null;
  }
  void transaction("readwrite", (store) => store.put({ ...entry, lastAccessedAt: Date.now() }));
  return entry;
}

export async function putCachedResource<T>(key: string, data: T, etag: string | null, ttlMs: number) {
  if (typeof indexedDB === "undefined") return;
  const now = Date.now();
  await transaction("readwrite", (store) => store.put({ key, schemaVersion: CACHE_SCHEMA_VERSION, data, checksum: checksum(data), etag, expiresAt: now + ttlMs, lastAccessedAt: now })).catch(() => undefined);
}

export async function deleteCachedResource(key: string) {
  if (typeof indexedDB === "undefined") return;
  await transaction("readwrite", (store) => store.delete(key)).catch(() => undefined);
}

export async function fetchCachedResource<T>(key: string, url: string, ttlMs: number): Promise<{ data: T; stale: boolean }> {
  const cached = await getCachedResource<T>(key);
  const headers = cached?.etag ? { "If-None-Match": cached.etag } : undefined;
  try {
    const response = await fetch(url, { headers, cache: "no-cache" });
    if (response.status === 304 && cached) return { data: cached.data, stale: false };
    if (response.status === 404) { await deleteCachedResource(key); throw new Error("Resource is no longer public"); }
    if (!response.ok) throw new Error(`Resource request failed (${response.status})`);
    const data = await response.json() as T;
    await putCachedResource(key, data, response.headers.get("ETag"), ttlMs);
    return { data, stale: false };
  } catch (cause) {
    if (cached && cached.expiresAt > Date.now()) return { data: cached.data, stale: true };
    throw cause;
  }
}

"use client";

export type PublicResourceName = "catalog" | "episodes" | "announcements";

export type PublicCacheManifest = {
  cacheProtocolVersion: number;
  resources: Record<PublicResourceName, { schemaVersion: number; revision: string }>;
};

export type CacheDefinition<T> = {
  key: string;
  resource: PublicResourceName;
  schemaVersion: number;
  validate: (value: unknown) => value is T;
  normalize?: (value: T) => T;
  migrate?: (value: unknown, previousSchemaVersion: number) => T | null;
  priority?: number;
};

type CacheEntry<T> = {
  key: string;
  cacheProtocolVersion: number;
  resource: PublicResourceName;
  resourceSchemaVersion: number;
  revision: string;
  data: T;
  checksum: string;
  expiresAt: number;
  lastAccessedAt: number;
  byteSize: number;
  priority: number;
};

const CACHE_PROTOCOL_VERSION = 2;
const CACHE_TARGET_BYTES = 25 * 1024 * 1024;
const DB_NAME = "rioanime-public-cache-v2";
const STORE_NAME = "resources";
const DB_VERSION = 1;
const STATUS_EVENT = "rioanime:public-cache-status";
const CHANNEL_NAME = "rioanime-public-cache";

let manifestPromise: Promise<PublicCacheManifest | null> | null = null;
let repairPromise: Promise<void> | null = null;
let legacyCleanupStarted = false;
let latestStaleStatus = false;

function checksum(value: unknown) {
  const input = JSON.stringify(value);
  let hash = 2166136261;
  for (const character of input) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function byteSize(value: unknown) {
  return new Blob([JSON.stringify(value)]).size;
}

function announceChange(key: string) {
  if (typeof BroadcastChannel === "undefined") return;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  channel.postMessage({ key });
  channel.close();
}

function publishStatus(stale: boolean) {
  latestStaleStatus = stale;
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(STATUS_EVENT, { detail: { stale } }));
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteDatabase() {
  return new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  });
}

async function repairDatabase() {
  if (!repairPromise) {
    repairPromise = deleteDatabase().finally(() => { repairPromise = null; });
  }
  await repairPromise;
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  if (typeof indexedDB === "undefined") throw new Error("IndexedDB is unavailable");

  async function run() {
    const database = await openDatabase();
    return new Promise<T>((resolve, reject) => {
      const tx = database.transaction(STORE_NAME, mode);
      const request = action(tx.objectStore(STORE_NAME));
      let result!: T;
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => { database.close(); resolve(result); };
      tx.onerror = () => { database.close(); reject(tx.error); };
      tx.onabort = () => { database.close(); reject(tx.error); };
    });
  }

  try {
    return await run();
  } catch {
    await repairDatabase();
    return run();
  }
}

function isCacheEntry(value: unknown): value is CacheEntry<unknown> {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<CacheEntry<unknown>>;
  return typeof entry.key === "string"
    && typeof entry.cacheProtocolVersion === "number"
    && typeof entry.resourceSchemaVersion === "number"
    && typeof entry.revision === "string"
    && typeof entry.checksum === "string"
    && typeof entry.expiresAt === "number"
    && typeof entry.lastAccessedAt === "number";
}

async function removeEntry(key: string) {
  await transaction("readwrite", (store) => store.delete(key)).catch(() => undefined);
  announceChange(key);
}

export async function readCachedResource<T>(definition: CacheDefinition<T>, expectedRevision?: string) {
  const stored = await transaction<CacheEntry<unknown> | undefined>("readonly", (store) => store.get(definition.key)).catch(() => undefined);
  if (!isCacheEntry(stored) || stored.cacheProtocolVersion !== CACHE_PROTOCOL_VERSION) {
    if (stored) await removeEntry(definition.key);
    return null;
  }
  if (stored.resource !== definition.resource || (expectedRevision && stored.revision !== expectedRevision)) return null;

  let data = stored.data;
  if (stored.resourceSchemaVersion !== definition.schemaVersion) {
    data = definition.migrate?.(stored.data, stored.resourceSchemaVersion) ?? null;
  }
  if (data === null || checksum(stored.data) !== stored.checksum || !definition.validate(data)) {
    await removeEntry(definition.key);
    return null;
  }

  const normalized = definition.normalize ? definition.normalize(data) : data;
  void transaction("readwrite", (store) => store.put({
    ...stored,
    data: normalized,
    resourceSchemaVersion: definition.schemaVersion,
    checksum: checksum(normalized),
    lastAccessedAt: Date.now()
  })).catch(() => undefined);
  return { data: normalized, expired: stored.expiresAt <= Date.now() };
}

async function enforceCacheBudget() {
  const entries = await transaction<CacheEntry<unknown>[]>("readonly", (store) => store.getAll()).catch(() => []);
  let total = entries.reduce((sum, entry) => sum + (entry.byteSize || byteSize(entry)), 0);
  if (total <= CACHE_TARGET_BYTES) return;
  const evictionOrder = [...entries].sort((left, right) => {
    const priorityDelta = (left.priority ?? 0) - (right.priority ?? 0);
    return priorityDelta || left.lastAccessedAt - right.lastAccessedAt;
  });
  for (const entry of evictionOrder) {
    if (total <= CACHE_TARGET_BYTES) break;
    await removeEntry(entry.key);
    total -= entry.byteSize || byteSize(entry);
  }
}

export async function writeCachedResource<T>(definition: CacheDefinition<T>, data: T, revision: string, ttlMs: number) {
  const normalized = definition.normalize ? definition.normalize(data) : data;
  if (!definition.validate(normalized)) throw new Error(`Invalid ${definition.resource} cache payload`);
  const now = Date.now();
  const entry: CacheEntry<T> = {
    key: definition.key,
    cacheProtocolVersion: CACHE_PROTOCOL_VERSION,
    resource: definition.resource,
    resourceSchemaVersion: definition.schemaVersion,
    revision,
    data: normalized,
    checksum: checksum(normalized),
    expiresAt: now + ttlMs,
    lastAccessedAt: now,
    byteSize: byteSize(normalized),
    priority: definition.priority ?? 0
  };
  await transaction("readwrite", (store) => store.put(entry));
  announceChange(definition.key);
  void enforceCacheBudget();
}

function isManifest(value: unknown): value is PublicCacheManifest {
  if (!value || typeof value !== "object") return false;
  const manifest = value as Partial<PublicCacheManifest>;
  if (manifest.cacheProtocolVersion !== CACHE_PROTOCOL_VERSION || !manifest.resources) return false;
  return (["catalog", "episodes", "announcements"] as const).every((name) => {
    const resource = manifest.resources?.[name];
    return resource && Number.isInteger(resource.schemaVersion) && typeof resource.revision === "string";
  });
}

export function getPublicCacheManifest() {
  if (!legacyCleanupStarted && typeof indexedDB !== "undefined") {
    legacyCleanupStarted = true;
    indexedDB.deleteDatabase("rioanime-public-cache");
  }
  if (!manifestPromise) {
    manifestPromise = fetch("/api/public/manifest", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Manifest request failed (${response.status})`);
        const value: unknown = await response.json();
        if (!isManifest(value)) throw new Error("Manifest response is incompatible");
        publishStatus(false);
        return value;
      })
      .catch(() => { publishStatus(true); return null; });
  }
  return manifestPromise;
}

export async function loadPublicResource<T>(definition: CacheDefinition<T>, loader: () => Promise<T>, ttlMs: number) {
  const manifest = await getPublicCacheManifest();
  const manifestResource = manifest?.resources[definition.resource];
  const schemaMatches = !manifestResource || manifestResource.schemaVersion === definition.schemaVersion;
  const expectedRevision = schemaMatches ? manifestResource?.revision : undefined;
  const cached = schemaMatches ? await readCachedResource(definition, expectedRevision) : null;
  if (cached && !cached.expired) {
    if (!manifest) publishStatus(true);
    return { data: cached.data, stale: !manifest, source: "cache" as const };
  }

  try {
    const data = await loader();
    await writeCachedResource(definition, data, expectedRevision ?? "unverified", ttlMs);
    publishStatus(!manifest);
    return { data, stale: !manifest, source: "network" as const };
  } catch (cause) {
    const fallback = cached ?? await readCachedResource(definition);
    if (fallback) {
      publishStatus(true);
      return { data: fallback.data, stale: true, source: "cache" as const };
    }
    throw cause;
  }
}

export const PUBLIC_CACHE_STATUS_EVENT = STATUS_EVENT;
export function getPublicCacheStaleStatus() { return latestStaleStatus; }

export function etagMatches(header, etag) {
  if (!header || !etag) return false;
  return header.split(",").some((value) => value.trim().replace(/^W\//, "") === etag);
}

export function cacheTtlBeforeBoundary(maxTtl, boundary, now = new Date()) {
  if (!boundary) return maxTtl;
  const seconds = Math.ceil((new Date(boundary).getTime() - new Date(now).getTime()) / 1000);
  return Math.max(1, Math.min(maxTtl, Number.isFinite(seconds) ? seconds : maxTtl));
}

export function shouldSampleSuccess(key, rate = 0.02) {
  if (rate <= 0) return false;
  if (rate >= 1) return true;
  let hash = 2166136261;
  for (const character of String(key)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296 < rate;
}

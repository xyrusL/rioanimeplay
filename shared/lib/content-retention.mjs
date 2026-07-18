export const CONTENT_RETENTION_DAYS = 30;

const DAY_MS = 24 * 60 * 60 * 1000;

export function contentRetention(deletedAt, now = new Date()) {
  if (!deletedAt) return { expiresAt: null, daysRemaining: null, expired: false };
  const deletedTime = new Date(deletedAt).getTime();
  const nowTime = new Date(now).getTime();
  if (!Number.isFinite(deletedTime) || !Number.isFinite(nowTime)) {
    return { expiresAt: null, daysRemaining: null, expired: false };
  }
  const expiresTime = deletedTime + CONTENT_RETENTION_DAYS * DAY_MS;
  const remaining = expiresTime - nowTime;
  return {
    expiresAt: new Date(expiresTime).toISOString(),
    daysRemaining: Math.max(0, Math.ceil(remaining / DAY_MS)),
    expired: remaining <= 0
  };
}

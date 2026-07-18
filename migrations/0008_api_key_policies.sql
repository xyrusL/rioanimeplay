-- Quotas are NULL by default, which explicitly means unlimited.
ALTER TABLE api_keys ADD COLUMN rate_limit_per_minute INTEGER;
ALTER TABLE api_keys ADD COLUMN daily_request_limit INTEGER;
ALTER TABLE api_keys ADD COLUMN daily_bandwidth_limit_bytes INTEGER;

CREATE TABLE IF NOT EXISTS system_api_key_policy (
  id TEXT PRIMARY KEY NOT NULL CHECK (id = 'site-deployment-key'),
  name TEXT NOT NULL DEFAULT 'RioAnime site key',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  rate_limit_per_minute INTEGER,
  daily_request_limit INTEGER,
  daily_bandwidth_limit_bytes INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO system_api_key_policy (id) VALUES ('site-deployment-key');

CREATE TABLE IF NOT EXISTS api_key_usage_minute (
  key_id TEXT NOT NULL,
  bucket_at TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  response_bytes INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (key_id, bucket_at)
);

CREATE INDEX IF NOT EXISTS idx_api_key_usage_minute_key_bucket
  ON api_key_usage_minute(key_id, bucket_at DESC);

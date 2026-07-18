-- Dashboard aggregates and low-volume API observability.
CREATE TABLE IF NOT EXISTS activity_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  actor_id TEXT,
  entity_type TEXT,
  entity_id TEXT,
  summary TEXT NOT NULL,
  detail_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS request_metrics_hourly (
  bucket_at TEXT NOT NULL,
  route TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  max_duration_ms INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket_at, route)
);

CREATE INDEX IF NOT EXISTS idx_activity_events_created_at
  ON activity_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_request_metrics_bucket_at
  ON request_metrics_hourly(bucket_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_created_at
  ON anime(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_updated_at
  ON anime(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_status_created_at
  ON accounts(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accounts_status_last_login_at
  ON accounts(status, last_login_at DESC);

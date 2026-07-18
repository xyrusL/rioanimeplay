-- Schema only: no tracking is enabled and no view records are inserted by this migration.
-- viewer_key_hash must be a one-way keyed hash; never store a raw IP or device identifier.
CREATE TABLE IF NOT EXISTS anime_view_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anime_id TEXT NOT NULL,
  account_id TEXT,
  viewer_key_hash TEXT NOT NULL CHECK (length(viewer_key_hash) >= 32),
  identity_type TEXT NOT NULL CHECK (identity_type IN ('account', 'device', 'ip')),
  first_viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  view_count INTEGER NOT NULL DEFAULT 1 CHECK (view_count >= 1),
  last_episode_num INTEGER CHECK (last_episode_num IS NULL OR last_episode_num >= 1),
  UNIQUE(anime_id, viewer_key_hash),
  FOREIGN KEY (anime_id) REFERENCES anime(anime_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

CREATE INDEX IF NOT EXISTS idx_anime_view_history_anime
  ON anime_view_history(anime_id, last_viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_anime_view_history_account
  ON anime_view_history(account_id, last_viewed_at DESC)
  WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anime_view_history_recent
  ON anime_view_history(last_viewed_at DESC);

CREATE TABLE IF NOT EXISTS user_reports (
  id TEXT PRIMARY KEY NOT NULL,
  anime_id TEXT NOT NULL,
  anime_title TEXT NOT NULL,
  episode_number INTEGER NOT NULL CHECK (episode_number >= 1),
  reporter_name TEXT,
  message TEXT NOT NULL,
  client_fingerprint TEXT NOT NULL,
  account_id TEXT,
  account_email TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_reports_created_at
  ON user_reports(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_anime
  ON user_reports(anime_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_rate_limit
  ON user_reports(client_fingerprint, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_member_cooldown
  ON user_reports(account_id, anime_id, episode_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_reports_guest_cooldown
  ON user_reports(client_fingerprint, anime_id, episode_number, created_at DESC);

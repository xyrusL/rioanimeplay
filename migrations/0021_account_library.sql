CREATE TABLE IF NOT EXISTS account_bookmarks (
  account_id TEXT NOT NULL,
  anime_id TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, anime_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (anime_id) REFERENCES anime(anime_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_bookmarks_recent
  ON account_bookmarks(account_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS account_episode_progress (
  account_id TEXT NOT NULL,
  anime_id TEXT NOT NULL,
  last_episode_num INTEGER NOT NULL DEFAULT 1 CHECK (last_episode_num >= 1),
  watched_episodes TEXT NOT NULL DEFAULT '[]',
  view_count INTEGER NOT NULL DEFAULT 1 CHECK (view_count >= 1),
  first_viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, anime_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY (anime_id) REFERENCES anime(anime_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_account_episode_progress_recent
  ON account_episode_progress(account_id, last_viewed_at DESC);

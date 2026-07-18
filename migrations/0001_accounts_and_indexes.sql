-- Additive migration only. Existing anime, episode, and metadata values are preserved.
CREATE TABLE IF NOT EXISTS anime (
  anime_id TEXT PRIMARY KEY,
  source TEXT,
  source_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  title TEXT,
  image_url TEXT,
  score REAL DEFAULT 0,
  genres TEXT,
  episodes INTEGER,
  status TEXT,
  type TEXT,
  synopsis TEXT,
  year INTEGER
);

CREATE TABLE IF NOT EXISTS episodes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anime_id TEXT NOT NULL,
  episode_num INTEGER NOT NULL,
  video_url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(anime_id, episode_num)
);

CREATE TABLE IF NOT EXISTS metadata (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  username TEXT NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'pending')),
  email_verified_at TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_username ON accounts(username);
CREATE INDEX IF NOT EXISTS idx_anime_source_id ON anime(source, source_id);
CREATE INDEX IF NOT EXISTS idx_episodes_anime_id ON episodes(anime_id);

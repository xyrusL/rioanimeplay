CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY NOT NULL,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'anime')),
  anime_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_by TEXT,
  updated_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK ((scope = 'global' AND anime_id IS NULL) OR (scope = 'anime' AND anime_id IS NOT NULL)),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
  FOREIGN KEY (anime_id) REFERENCES anime(anime_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_announcements_schedule
  ON announcements(enabled, starts_at, ends_at, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_announcements_anime
  ON announcements(anime_id, enabled, starts_at, ends_at);

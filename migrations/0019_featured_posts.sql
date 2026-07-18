CREATE TABLE IF NOT EXISTS featured_posts (
  anime_id TEXT PRIMARY KEY REFERENCES anime(anime_id) ON DELETE CASCADE,
  position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 10),
  updated_by TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_featured_posts_position
  ON featured_posts(position);

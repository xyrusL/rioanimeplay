-- Add catalog metadata without replacing or deleting any existing values.
ALTER TABLE anime ADD COLUMN title_english TEXT;
ALTER TABLE anime ADD COLUMN title_native TEXT;
ALTER TABLE anime ADD COLUMN title_user_preferred TEXT;
ALTER TABLE anime ADD COLUMN banner_url TEXT;
ALTER TABLE anime ADD COLUMN color TEXT;
ALTER TABLE anime ADD COLUMN mean_score REAL;
ALTER TABLE anime ADD COLUMN season TEXT;
ALTER TABLE anime ADD COLUMN popularity INTEGER DEFAULT 0;
ALTER TABLE anime ADD COLUMN studio TEXT;
ALTER TABLE anime ADD COLUMN next_episode INTEGER;
ALTER TABLE anime ADD COLUMN updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_anime_popularity ON anime(popularity DESC, score DESC);
CREATE INDEX IF NOT EXISTS idx_anime_title ON anime(title COLLATE NOCASE);
CREATE INDEX IF NOT EXISTS idx_anime_type ON anime(type);

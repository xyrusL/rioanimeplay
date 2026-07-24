ALTER TABLE anime ADD COLUMN has_video_ads INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_anime_video_ads
  ON anime(has_video_ads, deleted_at);

-- Editorial state is separate from the upstream airing status column.
ALTER TABLE anime ADD COLUMN content_status TEXT NOT NULL DEFAULT 'published'
  CHECK (content_status IN ('published', 'draft'));
ALTER TABLE anime ADD COLUMN visibility TEXT NOT NULL DEFAULT 'public'
  CHECK (visibility IN ('public', 'private'));
ALTER TABLE anime ADD COLUMN is_nsfw INTEGER NOT NULL DEFAULT 0
  CHECK (is_nsfw IN (0, 1));
ALTER TABLE anime ADD COLUMN published_at TEXT;
ALTER TABLE anime ADD COLUMN edited_at TEXT;
ALTER TABLE anime ADD COLUMN edited_by TEXT;
ALTER TABLE anime ADD COLUMN deleted_at TEXT;
ALTER TABLE anime ADD COLUMN deleted_by TEXT;

UPDATE anime SET published_at = COALESCE(created_at, datetime('now'))
WHERE published_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_anime_editorial_state
  ON anime(content_status, visibility, deleted_at, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_anime_nsfw
  ON anime(is_nsfw, deleted_at);

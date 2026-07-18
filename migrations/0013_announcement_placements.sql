ALTER TABLE announcements ADD COLUMN placement TEXT NOT NULL DEFAULT 'home_modal'
  CHECK (placement IN ('home_inline', 'home_modal', 'post_modal'));

UPDATE announcements
SET placement = CASE WHEN scope = 'anime' THEN 'post_modal' ELSE 'home_modal' END;

CREATE INDEX IF NOT EXISTS idx_announcements_placement_schedule
  ON announcements(placement, enabled, starts_at, ends_at, updated_at DESC);

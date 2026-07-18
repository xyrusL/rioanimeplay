CREATE TABLE IF NOT EXISTS custom_notifications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Scheduled', 'Active', 'Completed', 'Stopped')),
  location TEXT NOT NULL CHECK (location IN ('homepage', 'all_posts', 'selected_posts')),
  recurrence TEXT NOT NULL DEFAULT 'none' CHECK (recurrence IN ('none', 'weekly')),
  weekdays TEXT,
  display_time TEXT,
  starts_at TEXT,
  ends_at TEXT,
  timezone_offset INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS custom_notification_anime (
  notification_id TEXT NOT NULL REFERENCES custom_notifications(id) ON DELETE CASCADE,
  anime_id TEXT NOT NULL REFERENCES anime(anime_id) ON DELETE CASCADE,
  PRIMARY KEY (notification_id, anime_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_notifications_public
  ON custom_notifications(status, location, starts_at, ends_at, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_notification_anime_anime
  ON custom_notification_anime(anime_id, notification_id);

ALTER TABLE announcements ADD COLUMN schedule_type TEXT NOT NULL DEFAULT 'once'
  CHECK (schedule_type IN ('once', 'daily'));
ALTER TABLE announcements ADD COLUMN daily_starts_at TEXT;
ALTER TABLE announcements ADD COLUMN daily_ends_at TEXT;
ALTER TABLE announcements ADD COLUMN timezone_offset INTEGER NOT NULL DEFAULT 0;

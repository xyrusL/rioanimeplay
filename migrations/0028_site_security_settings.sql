CREATE TABLE IF NOT EXISTS site_security_settings (
  id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
  anti_inspect INTEGER NOT NULL DEFAULT 0 CHECK (anti_inspect IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO site_security_settings (id, anti_inspect) VALUES (1, 0);

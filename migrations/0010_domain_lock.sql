-- Browser Origin allowlist for the public Worker API.
CREATE TABLE IF NOT EXISTS domain_lock_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS allowed_domains (
  origin TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO domain_lock_settings (id, enabled) VALUES (1, 1);
INSERT OR IGNORE INTO allowed_domains (origin) VALUES
  ('http://localhost:3000'),
  ('https://rioanime.dezely.com');

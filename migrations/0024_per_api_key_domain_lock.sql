-- Store browser Origin restrictions independently for every API credential.
CREATE TABLE IF NOT EXISTS api_key_domain_settings (
  key_id TEXT PRIMARY KEY NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS api_key_allowed_domains (
  key_id TEXT NOT NULL,
  origin TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (key_id, origin)
);

CREATE INDEX IF NOT EXISTS idx_api_key_allowed_domains_origin
  ON api_key_allowed_domains(origin, key_id);

-- Preserve the existing site-key policy when upgrading from the global lock.
INSERT OR IGNORE INTO api_key_domain_settings (key_id, enabled, updated_at)
SELECT 'site-deployment-key', enabled, updated_at FROM domain_lock_settings WHERE id = 1;

INSERT OR IGNORE INTO api_key_allowed_domains (key_id, origin, created_at)
SELECT 'site-deployment-key', origin, created_at FROM allowed_domains;

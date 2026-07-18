-- Resource revisions let browsers refresh only public data that actually changed.
INSERT INTO metadata (key, value, updated_at) VALUES ('catalog_revision', '0', datetime('now'))
ON CONFLICT(key) DO NOTHING;

INSERT INTO metadata (key, value, updated_at) VALUES ('episodes_revision', '0', datetime('now'))
ON CONFLICT(key) DO NOTHING;

INSERT INTO metadata (key, value, updated_at) VALUES ('announcement_revision', '0', datetime('now'))
ON CONFLICT(key) DO NOTHING;

-- Schema only: no reaction tracking is enabled and no reaction records are inserted.
-- viewer_key_hash must be a one-way keyed hash; never store a raw IP or device identifier.
CREATE TABLE IF NOT EXISTS anime_reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anime_id TEXT NOT NULL,
  account_id TEXT,
  viewer_key_hash TEXT NOT NULL CHECK (length(viewer_key_hash) >= 32),
  identity_type TEXT NOT NULL CHECK (identity_type IN ('account', 'device', 'ip')),
  reaction_type TEXT NOT NULL CHECK (
    length(reaction_type) BETWEEN 1 AND 32 AND
    reaction_type = lower(reaction_type)
  ),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(anime_id, viewer_key_hash),
  FOREIGN KEY (anime_id) REFERENCES anime(anime_id),
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Supports fast per-anime totals grouped by reaction_type.
CREATE INDEX IF NOT EXISTS idx_anime_reactions_count
  ON anime_reactions(anime_id, reaction_type);

CREATE INDEX IF NOT EXISTS idx_anime_reactions_account
  ON anime_reactions(account_id, updated_at DESC)
  WHERE account_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_anime_reactions_recent
  ON anime_reactions(updated_at DESC);

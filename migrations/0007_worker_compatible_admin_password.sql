-- Cloudflare Workers supports PBKDF2 iteration counts up to 100,000.
UPDATE accounts
SET password_hash = 'pbkdf2_sha256$100000$8dbe96b6e84348fbcdf1b391c89ab9e1$b727baa797a48393dff7e4d4da6f63e335d781fb3843c7137b963cca4b0a671d',
    updated_at = datetime('now')
WHERE email = 'admin@admin.com' COLLATE NOCASE
  AND role = 'admin';

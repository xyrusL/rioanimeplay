-- Correct the temporary administrator's PBKDF2-SHA256 password hash.
UPDATE accounts
SET password_hash = 'pbkdf2_sha256$210000$775338667ee4ec0ac62cbfae7713314e$1e4bae1b76ddb3a7516b0b7cab3d2771d06423ed3e1275f7cf92689ea10597d5',
    updated_at = datetime('now')
WHERE email = 'admin@admin.com' COLLATE NOCASE
  AND role = 'admin';

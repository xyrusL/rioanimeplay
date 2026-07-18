-- Temporary D1-backed administrator. Replace or disable this account before launch.
INSERT INTO accounts (
  id,
  email,
  username,
  password_hash,
  role,
  status,
  email_verified_at,
  created_at,
  updated_at
)
VALUES (
  'temporary-admin-2026',
  'admin@admin.com',
  'rioanime-temporary-admin',
  'pbkdf2_sha256$210000$79724f1354f735fe42a7249b0bb68736$98dd1358b125f8fad73b891418b56574d41d80c5672d4e155ca7c511bfc34421',
  'admin',
  'active',
  datetime('now'),
  datetime('now'),
  datetime('now')
)
ON CONFLICT(email) DO UPDATE SET
  password_hash = excluded.password_hash,
  role = 'admin',
  status = 'active',
  email_verified_at = COALESCE(accounts.email_verified_at, datetime('now')),
  updated_at = datetime('now');

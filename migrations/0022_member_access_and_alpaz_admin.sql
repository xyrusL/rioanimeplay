ALTER TABLE accounts
  ADD COLUMN membership_tier TEXT NOT NULL DEFAULT 'member'
  CHECK (membership_tier IN ('member', 'paid'));

-- Alpaz uses Google sign-in; admin access is granted by the D1 role.
UPDATE accounts
SET role = 'admin',
    status = 'active',
    updated_at = datetime('now')
WHERE email = 'alpazmorada@gmail.com' COLLATE NOCASE;

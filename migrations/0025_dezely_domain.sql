-- Move existing browser Origin restrictions to the canonical dezely.com site.
INSERT OR IGNORE INTO api_key_allowed_domains (key_id, origin, created_at)
SELECT key_id, 'https://rioanime.dezely.com', created_at
FROM api_key_allowed_domains
WHERE origin IN ('https://rioanime.deze.me', 'https://rioanimeplay.deze.me');

DELETE FROM api_key_allowed_domains
WHERE origin IN ('https://rioanime.deze.me', 'https://rioanimeplay.deze.me');

DELETE FROM allowed_domains
WHERE origin IN ('https://rioanime.deze.me', 'https://rioanimeplay.deze.me');

INSERT OR IGNORE INTO allowed_domains (origin)
VALUES ('https://rioanime.dezely.com');

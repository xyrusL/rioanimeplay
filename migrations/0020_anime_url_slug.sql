-- Public URL customization only. anime_id remains the immutable internal identifier.
ALTER TABLE anime ADD COLUMN url_slug TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_anime_url_slug_unique
  ON anime(url_slug)
  WHERE url_slug IS NOT NULL;

-- anime_id and url_slug share one public URL namespace even though only url_slug is editable.
CREATE TRIGGER IF NOT EXISTS prevent_anime_id_url_slug_collision_on_insert
BEFORE INSERT ON anime
WHEN EXISTS (SELECT 1 FROM anime WHERE url_slug = NEW.anime_id)
BEGIN
  SELECT RAISE(ABORT, 'anime_id conflicts with an existing url_slug');
END;

CREATE TRIGGER IF NOT EXISTS prevent_url_slug_anime_id_collision_on_update
BEFORE UPDATE OF url_slug ON anime
WHEN NEW.url_slug IS NOT NULL
  AND EXISTS (SELECT 1 FROM anime WHERE anime_id = NEW.url_slug AND anime_id <> NEW.anime_id)
BEGIN
  SELECT RAISE(ABORT, 'url_slug conflicts with an existing anime_id');
END;

CREATE TRIGGER IF NOT EXISTS prevent_anime_id_update
BEFORE UPDATE OF anime_id ON anime
WHEN NEW.anime_id <> OLD.anime_id
BEGIN
  SELECT RAISE(ABORT, 'anime_id is immutable');
END;

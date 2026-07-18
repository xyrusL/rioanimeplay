INSERT OR IGNORE INTO announcements (
  id, scope, anime_id, title, message, starts_at, ends_at, enabled,
  created_by, updated_by, created_at, updated_at, placement, view_count
) VALUES (
  'legacy-homepage-announcement',
  'global',
  NULL,
  'Welcome to RioAnimePlay',
  'Browse the RioAnime library, search titles, explore genres, and open available episodes from one place.',
  NULL,
  NULL,
  1,
  'migration',
  'migration',
  datetime('now'),
  datetime('now'),
  'home_inline',
  0
);

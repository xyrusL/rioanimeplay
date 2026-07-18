# Editable Post URLs and View Analytics

## Goal

Allow administrators to safely edit a post's public URL without changing `anime_id`, and make selected-period views clear on the Overview dashboard.

## Editable URL architecture

- Add a nullable, unique `url_slug` column to `anime` through an additive D1 migration.
- Keep `anime_id` as the immutable internal identifier and foreign-key target for episodes, views, reactions, featured posts, and notifications.
- Existing records fall back to `anime_id` until an administrator assigns a custom slug.
- Public responses expose `/watch/{url_slug ?? anime_id}`.
- Public watch/detail resolution matches `url_slug` first and falls back to `anime_id` only for records whose `url_slug` is still null.
- After a custom slug is saved, the previous URL no longer resolves and does not redirect.

## Admin editor

- Add a URL slug field to Edit Post with a `/watch/` prefix and live URL preview.
- Accept lowercase ASCII letters, numbers, and single hyphens only.
- Normalize user input by trimming, lowercasing, replacing separators with hyphens, and removing leading/trailing hyphens.
- Reject empty normalized values, invalid lengths, and slugs already assigned to another post.
- Include `urlSlug` in admin content responses and PATCH requests.
- Return a specific conflict error when a slug is already used.

## Overview views

- Add selected-period `views` to the analytics summary and time series for 24 hours, 7 days, and 30 days.
- A view means recorded `view_count`, including repeated watches, consistent with the existing lifetime total.
- Show period views as the primary Views card value with lifetime views as supporting detail.
- Add Views to the audience trend chart while retaining posts, active viewer records, and reactions.

## Cache and operational behavior

- Increment the catalog revision after a URL change.
- Revalidate watch and catalog pages through the existing content-update path.
- Use an additive local/remote migration; no existing IDs or related records are rewritten.
- Remote migration and deployment require separate explicit approval.

## Verification

- Test slug normalization, validation, uniqueness conflicts, and immutable `anime_id` behavior.
- Test that a custom slug resolves, the previous URL does not, and uncustomized records retain their current URL.
- Test admin responses and editor PATCH payloads include `urlSlug`.
- Test analytics period-view aggregation and Overview rendering.
- Run focused tests, `npm run worker:check`, and final quiet lint. Do not run `npm build`.

# Admin Status Announcements Design

Add a Status navigation tab backed by the existing D1 announcements API. Administrators create disabled-by-default global or anime-specific modal announcements, schedule optional UTC start/end times through local datetime controls, preview them, edit, enable/disable, and delete them.

The screen contains a composer and an announcement list with derived Disabled, Scheduled, Live, and Expired states. Anime scope uses the content search endpoint and stores `animeId`. Preview uses the same modal presentation as the public site without changing enabled state.

Public announcement selection remains server-enforced: enabled, started, and not ended. Anime-specific announcements take precedence on matching watch routes; global announcements apply elsewhere. Dismissal is revision-scoped in session storage. Disabled announcements never display.

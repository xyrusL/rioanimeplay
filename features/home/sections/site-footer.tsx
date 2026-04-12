import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export function SiteFooter() {
  return (
    <footer className="mt-8 rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card-muted)] px-5 py-6 text-center shadow-[var(--soft-shadow)]">
      <p className="inline-flex items-center gap-2 font-display text-[0.92rem] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
        <MaterialIcon className="text-[18px]" name="live_tv" />
        Watch HD Anime for Free @ 2026 RioAnimePlay
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
        Demo homepage only. All media data is temporarily sourced from AniList
        and used here to shape the front-page layout before the rest of the
        site is built.
      </p>
    </footer>
  );
}

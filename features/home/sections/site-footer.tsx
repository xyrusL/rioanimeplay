import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export function SiteFooter() {
  return (
    <footer className="mt-6 rounded-[16px] border border-[var(--line-soft)] bg-[rgba(22,27,35,0.86)] px-5 py-5 text-center shadow-[0_14px_30px_rgba(0,0,0,0.18)]">
      <p className="inline-flex items-center gap-2 font-display text-[0.82rem] uppercase tracking-[0.18em] text-[var(--text-secondary)]">
        <MaterialIcon className="text-[18px]" name="live_tv" />
        Watch HD Anime for Free @ 2026 RioAnimePlay
      </p>
      <p className="mt-2 text-[0.78rem] leading-6 text-[var(--text-muted)]">
        Browse the RioAnimePlay catalog and available episodes.
      </p>
    </footer>
  );
}

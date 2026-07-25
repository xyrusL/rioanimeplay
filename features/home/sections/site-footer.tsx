import Link from "next/link";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { SiteBrand } from "@/shared/ui/site-brand";

type SiteFooterProps = {
  variant?: "compact" | "landing";
};

const FOOTER_GROUPS = [
  {
    title: "Explore",
    links: [
      { label: "A-Z list", href: "/anime/a-z" },
      { label: "Advanced filter", href: "/filter" },
      { label: "Random anime", href: "/random" },
      { label: "Top search", href: "/home#popular-title" }
    ]
  },
  {
    title: "Your anime",
    links: [
      { label: "Bookmarks", href: "/bookmarks" },
      { label: "Account", href: "/account" },
      { label: "Home", href: "/home" }
    ]
  },
  {
    title: "Info",
    links: [
      { label: "About us", href: "/about" },
      { label: "How it works", href: "/about#how-it-works" },
      { label: "Member access", href: "/account" }
    ]
  }
];

export function SiteFooter({ variant = "compact" }: SiteFooterProps) {
  if (variant === "landing") {
    return (
      <footer className="border-t border-[var(--line-soft)] pb-3 pt-7">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_1.5fr_1fr]">
          <div>
            <SiteBrand compact href="/" />
            <p className="mt-4 max-w-[300px] text-xs leading-6 text-[var(--text-secondary)]">
              A simple place to discover anime, save what catches your eye, and move straight into watching.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            {FOOTER_GROUPS.map((group) => (
              <nav key={group.title} aria-label={`${group.title} links`}>
                <h2 className="text-xs font-bold text-white">{group.title}</h2>
                <ul className="mt-3 space-y-2.5">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>

          <aside className="rounded-2xl border border-[var(--line-soft)] bg-[var(--bg-card)] p-5">
            <h2 className="text-sm font-bold text-white">Stay close to the catalog</h2>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              Open your account to keep bookmarks available and revisit titles faster.
            </p>
            <Link
              href="/account"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-2.5 text-xs font-bold text-[var(--accent-strong)] transition-colors hover:bg-[var(--accent-wash)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              Open account
              <MaterialIcon className="text-[17px]" name="arrow_forward" />
            </Link>
          </aside>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[var(--line-subtle)] pt-5 text-[0.68rem] text-[var(--text-secondary)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 RioAnimePlay. All rights reserved.</p>
          <p className="inline-flex items-center gap-1">
            Made for anime lovers <span aria-hidden="true" className="text-[var(--accent)]">♥</span>
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-6 rounded-[16px] border border-[var(--line-soft)] bg-[var(--bg-elevated)] px-5 py-5 text-center shadow-[var(--card-shadow)]">
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

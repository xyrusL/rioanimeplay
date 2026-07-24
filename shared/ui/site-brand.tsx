import Link from "next/link";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type SiteBrandProps = {
  compact?: boolean;
  href?: string;
};

export function SiteBrand({ compact = false, href = "/" }: SiteBrandProps) {
  return (
    <Link
      href={href}
      className={`group flex min-w-0 items-center rounded-lg transition-opacity duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] ${compact ? "gap-3" : "gap-4"}`}
    >
      <span
        className={`flex shrink-0 items-center justify-center bg-[var(--header-logo-surface)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-transform group-hover:-rotate-6 ${compact ? "h-10 w-10 rounded-xl" : "h-11 w-11 rounded-2xl"}`}
      >
        <MaterialIcon className={compact ? "text-[24px]" : "text-[26px]"} filled name="play_circle" />
      </span>
      <span
        className={`font-display leading-none text-[var(--text-primary)] ${compact ? "text-lg font-bold tracking-[-0.04em] sm:text-xl" : "text-[1.6rem] sm:text-[1.95rem]"}`}
      >
        RioAnimePlay
      </span>
    </Link>
  );
}

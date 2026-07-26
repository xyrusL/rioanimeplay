import Link from "next/link";

import type { SiteSettings } from "@/shared/lib/site-settings";
import { LockdownAction } from "@/shared/ui/lockdown-action";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { SiteBrand } from "@/shared/ui/site-brand";

const NAV_ITEMS = [
  { label: "Home", href: "/home" },
  { label: "Filter", href: "/filter" },
  { label: "A-Z List", href: "/anime/a-z" },
  { label: "Random", href: "/random" }
];

type HomeNavigationHeaderProps = {
  authLockdown: SiteSettings["authLockdown"];
  member: { name: string; email: string; image: string | null } | null;
  mobileVariant?: "default" | "about";
};

export function HomeNavigationHeader({ authLockdown, member, mobileVariant = "default" }: HomeNavigationHeaderProps) {
  const accountControl = member ? (
    <Link
      href="/account"
      className="inline-flex w-full max-w-[150px] min-w-0 shrink-0 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--bg-elevated)] py-1.5 pl-1.5 pr-3 text-xs font-semibold text-[var(--text-primary)] shadow-[0_0_0_1px_var(--accent-soft),0_0_18px_var(--accent-wash),inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--accent-strong)] hover:shadow-[0_0_22px_var(--accent-wash)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--accent-strong)]"
      aria-label={`Open ${member.name}'s account`}
    >
      <ProfileAvatar className="h-7 w-7 rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] text-[0.65rem] font-black text-[var(--text-primary)] shadow-[0_0_9px_var(--accent-wash)]" image={member.image} imageSizes="28px" name={member.name} />
      <span className="hidden min-w-0 flex-1 truncate sm:inline">{member.name}</span>
    </Link>
  ) : (
    <LockdownAction
      locked={authLockdown.enabled}
      message={authLockdown.message}
      href="/account"
      className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--bg-elevated)] py-1.5 pl-2 pr-3 text-xs font-semibold text-[var(--text-primary)] shadow-[0_0_0_1px_var(--accent-soft),0_0_18px_var(--accent-wash),inset_0_1px_0_rgba(255,255,255,0.06)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--accent-strong)] hover:shadow-[0_0_22px_var(--accent-wash)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--accent-strong)]"
    >
      <span className="grid h-7 w-7 place-items-center rounded-full border border-[var(--accent)] bg-[var(--accent-soft)] shadow-[0_0_9px_var(--accent-wash)]">
        <MaterialIcon className="text-[16px] text-[var(--accent-strong)]" filled name="person" />
      </span>
      <span className="hidden sm:inline">Sign in</span>
    </LockdownAction>
  );

  return (
    <>
      <header className={`relative z-[230] flex min-h-20 items-center justify-between gap-5 border-b border-[var(--line-soft)] py-4 ${mobileVariant === "about" ? "about-mobile-header" : ""}`}>
        <SiteBrand compact href="/" />

        <nav aria-label="Primary navigation" className="home-primary-nav relative hidden items-stretch self-stretch lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              aria-current={item.href === "/home" ? "page" : undefined}
              className="home-primary-link grid w-24 place-items-center px-3 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)] aria-[current=page]:text-[var(--accent-strong)]"
            >
              {item.label}
            </Link>
          ))}
          <span aria-hidden="true" className="home-primary-indicator absolute bottom-[-1px] left-[18px] h-0.5 w-[60px] bg-[var(--accent)]" />
        </nav>

        <div className="hidden min-w-0 flex-1 justify-end xl:flex">{accountControl}</div>
        <div className={`min-w-0 xl:hidden ${mobileVariant === "about" ? "max-sm:hidden" : ""}`}>{accountControl}</div>
        {mobileVariant === "about" ? (
          <details className="about-mobile-menu relative sm:hidden">
            <summary aria-label="Open navigation" className="grid h-10 w-10 list-none place-items-center rounded-lg text-white [&::-webkit-details-marker]:hidden">
              <MaterialIcon className="text-[27px]" name="menu" />
            </summary>
            <nav aria-label="About page navigation" className="absolute right-0 top-12 grid w-44 overflow-hidden rounded-2xl border border-[var(--line-strong)] bg-[rgba(18,18,23,.98)] p-2 shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl">
              {NAV_ITEMS.map((item) => <Link key={item.label} href={item.href} className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-white">{item.label}</Link>)}
              <Link href="/account" className="rounded-xl px-4 py-3 text-sm font-semibold text-[var(--accent-strong)]">{member ? "Account" : "Sign in"}</Link>
            </nav>
          </details>
        ) : null}
      </header>

      <nav aria-label="Mobile navigation" className={`relative z-[220] -mx-1 gap-1 overflow-x-auto py-3 lg:hidden ${mobileVariant === "about" ? "hidden sm:flex" : "flex"}`}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            aria-current={item.href === "/home" ? "page" : undefined}
            className="shrink-0 rounded-full border border-[var(--line-soft)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] aria-[current=page]:border-[var(--line-strong)] aria-[current=page]:bg-[var(--accent-soft)] aria-[current=page]:text-[var(--accent-strong)]"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

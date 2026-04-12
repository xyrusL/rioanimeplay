"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

const MOBILE_NAV_ITEMS = [
  { href: "/", icon: "home", label: "Home" },
  { href: "/filter", icon: "tune", label: "Filter" },
  { href: "/bookmarks", icon: "favorite", label: "Bookmarks" },
  { href: "/account", icon: "settings", label: "Setting" }
] as const;

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileBottomNav() {
  const pathname = usePathname() ?? "/";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center px-6 pb-[max(1.15rem,calc(env(safe-area-inset-bottom)+0.6rem))]">
      <nav
        aria-label="Primary"
        className="pointer-events-auto flex w-full max-w-[332px] items-center justify-between rounded-[999px] border border-[var(--line-soft)] bg-[var(--bg-elevated)] px-2.5 py-2 shadow-[0_22px_54px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
      >
        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActivePath(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-0 flex-1 items-center justify-center rounded-full px-1.5 py-1.5 transition-[background-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
                active
                  ? "text-white"
                  : "text-[var(--text-muted)] hover:-translate-y-0.5 hover:text-[var(--text-primary)]"
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-[background-color,border-color,box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
                  active
                    ? "border-[var(--line-strong)] bg-[linear-gradient(180deg,var(--accent-strong),var(--accent))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_24px_var(--accent-soft)]"
                    : "border-transparent bg-transparent text-[var(--text-muted)]"
                }`}
              >
                <MaterialIcon
                  className="text-[21px]"
                  filled={active}
                  name={item.icon}
                />
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

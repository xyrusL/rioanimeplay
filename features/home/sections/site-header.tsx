import Link from "next/link";

import { SearchAutocomplete } from "@/features/search/sections/search-autocomplete";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { SiteBrand } from "@/shared/ui/site-brand";

export function SiteHeader() {
  const navItems = [
    { label: "Random", icon: "casino", href: "/random" },
    { label: "A-Z List", icon: "format_list_bulleted", href: "/anime/a-z" },
    { label: "Schedule", icon: "calendar_month", href: "/" }
  ];

  return (
    <header className="relative z-[220] isolate rounded-[26px] border border-[var(--line-soft)] bg-[var(--bg-elevated)] px-4 py-4 shadow-[0_20px_55px_rgba(0,0,0,0.34)] backdrop-blur sm:px-5">
      <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[auto_minmax(320px,1fr)_auto] xl:items-center xl:gap-5">
        <SiteBrand />

        <SearchAutocomplete className="xl:mx-auto xl:w-full xl:max-w-[440px]" />

        <nav className="flex flex-wrap items-center gap-2 xl:justify-end">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3.5 py-2 text-xs uppercase tracking-[0.2em] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
            >
              <MaterialIcon className="text-[16px]" name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

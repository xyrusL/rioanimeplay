import Image from "next/image";
import Link from "next/link";

import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { WeeklyTopEntry } from "@/entities/anime/model/types";
import type { SiteSettings } from "@/shared/lib/site-settings";
import { LockdownAction } from "@/shared/ui/lockdown-action";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type IntroSidebarProps = {
  authLockdown: SiteSettings["authLockdown"];
  weeklyTop: WeeklyTopEntry[];
};

export function IntroSidebar({ authLockdown, weeklyTop }: IntroSidebarProps) {
  return (
    <aside className="space-y-4">
      <section className="overflow-hidden rounded-[18px] border border-[var(--line-soft)] bg-[rgba(22,27,35,0.9)] shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            Member Access
          </p>
          <MaterialIcon className="text-[16px] text-[var(--text-muted)]" name="person" />
        </div>
        <div className="space-y-3 p-4">
          <input
            readOnly
            placeholder="Username"
            className="h-10 w-full rounded-[10px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <input
            readOnly
            placeholder="Password"
            className="h-10 w-full rounded-[10px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 text-sm text-[var(--text-secondary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <div className="flex items-center justify-between gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            <span>Demo access</span>
            <LockdownAction
              locked={authLockdown.enabled}
              message={authLockdown.message}
              href="/account?mode=register"
              className="font-semibold text-[var(--gold)]"
            >
              Register
            </LockdownAction>
          </div>
          <LockdownAction
            locked={authLockdown.enabled}
            message={authLockdown.message}
            href="/account?mode=login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[linear-gradient(90deg,var(--accent),var(--accent-strong))] px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[var(--bg-base)]"
          >
            <MaterialIcon className="text-[16px]" name="login" />
            Login
          </LockdownAction>
        </div>
      </section>

      <section className="overflow-hidden rounded-[18px] border border-[var(--line-soft)] bg-[rgba(22,27,35,0.9)] shadow-[0_16px_34px_rgba(0,0,0,0.22)]">
        <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-4 py-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-[var(--gold)]">
            Weekly Top
          </p>
          <p className="text-[0.62rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">Top 10</p>
        </div>
        <div className="space-y-2 p-3">
          {weeklyTop.map((entry) => (
            <Link
              key={entry.id}
              href={`/watch/${toAnimeSlug(entry.title)}`}
              className="flex items-center gap-3 rounded-[14px] border border-[rgba(255,255,255,0.04)] bg-[rgba(255,255,255,0.02)] px-2.5 py-2 transition-[border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.04)]"
            >
              <div className="flex w-5 shrink-0 justify-center text-[0.75rem] font-semibold text-[var(--gold)]">
                {entry.rank}
              </div>
              <div className="relative h-[48px] w-[36px] shrink-0 overflow-hidden rounded-[8px]">
                <Image fill alt={entry.title} className="object-cover" sizes="36px" src={entry.image} />
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-[0.76rem] leading-4.5 font-semibold text-[var(--text-primary)]">
                  {entry.title}
                </p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.12em] text-[var(--text-muted)]">
                  {entry.meta}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </aside>
  );
}

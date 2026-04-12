import Link from "next/link";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type WatchUnavailableScreenProps = {
  message: string;
  title: string;
};

export function WatchUnavailableScreen({
  message,
  title
}: WatchUnavailableScreenProps) {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="site-shell mx-auto flex min-h-screen w-full max-w-[1180px] items-center justify-center px-4 py-10 sm:px-6 xl:px-8">
        <div className="w-full max-w-[760px] rounded-[32px] border border-[var(--line-strong)] bg-[var(--modal-surface)] p-4 shadow-[var(--modal-shadow)] sm:p-4.5">
          <div className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.02)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
            <div className="flex items-center gap-4 border-b border-[var(--line-soft)] px-5 py-4 sm:px-6">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
                <MaterialIcon className="text-[26px]" name="movie_off" />
              </div>
              <p className="font-display text-[0.82rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                Temporary unavailable
              </p>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <h1 className="truncate text-[1.55rem] leading-[1.08] font-semibold text-[var(--text-primary)] sm:text-[1.95rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-[38rem] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.96rem]">
                {message}
              </p>
              <div className="mt-7 flex justify-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                >
                  <MaterialIcon className="text-[16px]" name="arrow_back" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

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
    <main className="min-h-screen bg-transparent text-[var(--text-primary)]">
      <div className="site-shell desktop-shell--watch mx-auto flex min-h-screen w-full items-center justify-center px-4 py-10 sm:px-6 xl:px-24 2xl:px-28">
        <div className="w-full max-w-[760px] rounded-[32px] border border-[rgba(255,207,112,0.1)] bg-[linear-gradient(180deg,rgba(17,19,25,0.22),rgba(11,12,17,0.14))] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-[2px] sm:p-4.5">
          <div className="rounded-[28px] border border-[rgba(255,255,255,0.05)] bg-[rgba(18,20,27,0.56)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-[6px]">
            <div className="flex items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.05)] px-5 py-4 sm:px-6">
              <div className="flex items-center gap-4">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_14px_30px_rgba(0,0,0,0.16)]">
                <MaterialIcon className="text-[26px]" name="movie_off" />
              </div>
              <p className="font-display text-[0.82rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                Unavailable
              </p>
              </div>
              <Link
                href="/"
                aria-label="Close unavailable message"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.015)] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[rgba(255,207,112,0.18)] hover:bg-[rgba(255,255,255,0.035)] hover:text-[var(--text-primary)]"
              >
                <MaterialIcon className="text-[18px]" name="close" />
              </Link>
            </div>
            <div className="px-5 py-5 sm:px-6 sm:py-6">
              <h1 className="truncate text-[1.55rem] leading-[1.08] font-semibold text-[var(--text-primary)] sm:text-[1.95rem]">
                {title}
              </h1>
              <p className="mt-4 max-w-[38rem] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.96rem]">
                {message}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

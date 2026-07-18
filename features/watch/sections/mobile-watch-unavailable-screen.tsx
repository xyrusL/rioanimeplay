import Link from "next/link";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type MobileWatchUnavailableScreenProps = {
  message: string;
  title: string;
};

export function MobileWatchUnavailableScreen({
  message,
  title
}: MobileWatchUnavailableScreenProps) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#071019_0%,#0d171f_28%,#111215_100%)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[440px] items-center px-4 py-8">
        <section className="w-full rounded-[34px] border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.04)] p-5 text-center shadow-[0_22px_52px_rgba(0,0,0,0.26)]">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(42,170,255,0.16)] text-[#9dd8ff]">
            <MaterialIcon className="text-[30px]" name="movie_off" />
          </span>
          <p className="mt-4 text-[0.72rem] uppercase tracking-[0.24em] text-[rgba(157,216,255,0.72)]">
            Unavailable
          </p>
          <h1 className="mt-2 text-[1.55rem] leading-[1.08] font-semibold text-white">{title}</h1>
          <p className="mt-4 text-sm leading-7 text-[rgba(222,230,238,0.72)]">{message}</p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(8,14,19,0.42)] px-5 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white"
            >
              <MaterialIcon className="text-[16px]" name="arrow_back" />
              Back home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

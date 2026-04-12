import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] px-4 py-10 text-[var(--text-primary)] sm:px-6">
      <div className="site-shell mx-auto flex min-h-[70vh] max-w-[760px] items-center justify-center">
        <div className="w-full rounded-[28px] border border-[var(--line-soft)] bg-[var(--watch-panel-surface)] px-6 py-10 text-center shadow-[var(--hero-shadow)]">
          <p className="font-display text-[0.82rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
            Not Found
          </p>
          <h1 className="mt-4 text-[2rem] font-semibold text-[var(--text-primary)]">
            This anime page does not exist.
          </h1>
          <p className="mx-auto mt-3 max-w-[38rem] text-sm leading-7 text-[var(--text-secondary)]">
            The title you opened could not be matched to a live anime entry right now.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.04)] px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-[border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}

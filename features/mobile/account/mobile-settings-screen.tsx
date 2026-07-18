import Link from "next/link";

import { MobileAppShell } from "@/features/mobile/shared/mobile-app-shell";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type MobileSettingsScreenProps = {
  accountBenefits: ReadonlyArray<{
    icon: string;
    title: string;
    text: string;
    iconClass: string;
  }>;
  authLocked: boolean;
  authLockdownMessage: string;
  errorMessage: string | null;
  member: {
    email: string;
    image: string | null;
    name: string;
  } | null;
  signInAction: () => Promise<void>;
  signOutAction: () => Promise<void>;
};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

export function MobileSettingsScreen({
  accountBenefits,
  authLocked,
  authLockdownMessage,
  errorMessage,
  member,
  signInAction,
  signOutAction
}: MobileSettingsScreenProps) {
  const firstName = member?.name.split(" ")[0] || "member";

  return (
    <MobileAppShell>
      <div className="space-y-4">
        <header className="rounded-[30px] border border-[var(--line-soft)] bg-[var(--panel-surface)] p-4 shadow-[var(--panel-shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-[var(--bg-base)] shadow-[0_12px_24px_var(--accent-soft)]">
              <MaterialIcon className="text-[25px]" filled name="person" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--text-muted)]">RioAnimePlay</p>
              <h1 className="mt-0.5 text-xl font-semibold text-[var(--text-primary)]">Account</h1>
            </div>
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[30px] border border-[var(--line-strong)] bg-[linear-gradient(155deg,var(--panel-surface),var(--bg-card)_58%,var(--bg-panel))] px-5 py-7 text-center shadow-[var(--panel-shadow)]">
          <div aria-hidden="true" className="absolute inset-x-[12%] top-0 h-px bg-[linear-gradient(90deg,transparent,var(--accent-strong),transparent)]" />
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-80px] h-52 w-72 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-3xl" />

          <div className="relative">
            {member ? (
              <>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Signed in</p>
                <ProfileAvatar
                  className="mx-auto mt-4 h-20 w-20 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] text-2xl font-bold text-[var(--text-primary)] shadow-[0_16px_36px_var(--accent-soft)]"
                  image={member.image}
                  imageSizes="80px"
                  name={member.name}
                />
                <h2 className="mt-5 text-[1.65rem] font-bold leading-tight tracking-[-0.035em] text-[var(--text-primary)]">
                  Welcome back, {firstName}
                </h2>
                <p className="mt-2 truncate text-sm text-[var(--text-secondary)]">{member.email}</p>

                <div className="mt-6 space-y-3">
                  <Link
                    href="/"
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[15px] bg-[linear-gradient(105deg,var(--accent-strong),var(--accent))] px-4 text-sm font-semibold text-white shadow-[0_14px_28px_var(--accent-soft)]"
                  >
                    <MaterialIcon className="text-[19px]" filled name="home" />
                    Continue browsing
                  </Link>
                  <form action={signOutAction}>
                    <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[15px] border border-[var(--line-soft)] bg-[var(--bg-card)] px-4 text-sm font-semibold text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]">
                      <MaterialIcon className="text-[19px]" name="logout" />
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <>
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--accent-strong)] shadow-[0_14px_30px_var(--accent-soft)]">
                  <MaterialIcon className="text-[31px]" filled name="play_arrow" />
                </span>
                <p className="mt-5 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">Your anime, remembered</p>
                <h2 className="mt-2 text-[1.7rem] font-bold leading-tight tracking-[-0.04em] text-[var(--text-primary)]">Pick up where you left off</h2>
                <p className="mx-auto mt-3 max-w-[300px] text-sm leading-6 text-[var(--text-secondary)]">
                  Sign in with Google to keep your bookmarks and account close on every visit.
                </p>

                <div className="mt-6">
                  {authLocked ? (
                    <button disabled className="inline-flex h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-[15px] border border-white/60 bg-white/75 px-5 text-sm font-bold text-[#171721] opacity-55">
                      <GoogleMark />
                      Continue with Google
                    </button>
                  ) : (
                    <form action={signInAction}>
                      <button type="submit" className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-[15px] border border-white/80 bg-white px-5 text-sm font-bold text-[#171721] shadow-[0_14px_30px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--accent-soft)]">
                        <GoogleMark />
                        Continue with Google
                      </button>
                    </form>
                  )}
                </div>

                {authLocked ? (
                  <p className="mt-4 rounded-[16px] border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-left text-xs leading-5 text-amber-100/70">
                    {authLockdownMessage}
                  </p>
                ) : null}
                {errorMessage ? (
                  <p className="mt-4 rounded-[16px] border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-left text-xs leading-5 text-red-100/75">
                    {errorMessage}
                  </p>
                ) : null}
              </>
            )}
          </div>
        </section>

        <section aria-label="Account benefits" className="overflow-hidden rounded-[26px] border border-[var(--line-soft)] bg-[var(--bg-card)] shadow-[var(--soft-shadow)]">
          {accountBenefits.map((item, index) => (
            <div key={item.title} className={`flex items-center gap-3 px-4 py-3.5 ${index > 0 ? "border-t border-[var(--line-soft)]" : ""}`}>
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[13px] ring-1 ring-inset ${item.iconClass}`}>
                <MaterialIcon className="text-[21px]" name={item.icon} />
              </span>
              <span className="min-w-0 text-left">
                <strong className="block text-sm font-semibold text-[var(--text-primary)]">{item.title}</strong>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--text-secondary)]">{item.text}</span>
              </span>
            </div>
          ))}
        </section>
      </div>
    </MobileAppShell>
  );
}

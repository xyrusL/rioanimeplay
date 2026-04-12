import { headers } from "next/headers";
import Link from "next/link";

import { SiteFooter } from "@/features/home/sections/site-footer";
import { SiteHeader } from "@/features/home/sections/site-header";
import { MobileSettingsScreen } from "@/features/mobile/account/mobile-settings-screen";
import { ResponsiveRender } from "@/features/mobile/shared/responsive-render";
import { isLikelyMobileUserAgent } from "@/shared/lib/mobile-detection";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { getSiteSettings } from "@/shared/lib/site-settings";
import { LockdownAction } from "@/shared/ui/lockdown-action";
import { Panel } from "@/shared/ui/panel";

type AccountPageProps = {
  searchParams?: Promise<{
    mode?: string;
  }>;
};

const AUTH_TABS = [
  { href: "/account?mode=login", icon: "login", label: "Login", mode: "login" },
  { href: "/account?mode=register", icon: "person_add", label: "Register", mode: "register" }
] as const;

const LOGIN_BENEFITS = [
  {
    icon: "lock_open_right",
    text: "Members get access to extra content and features waiting behind the account area."
  },
  {
    icon: "bookmark_manager",
    text: "Your bookmarks stay saved online, so your list is still there whenever you come back."
  },
  {
    icon: "forum",
    text: "Keep your watchlist tidy, track what you started, and hang out with the community."
  }
] as const;

const AUTH_MODES = {
  login: {
    badge: "Member Sign In",
    eyebrow: "Dedicated access page",
    title: "Log in fast, then get back to your next episode.",
    description:
      "This page keeps sign-in clean and focused, so the homepage can stay quick while your real account access lives here.",
    panelTitle: "Sign In",
    panelIcon: "login",
    formTitle: "Ready to continue",
    formDescription:
      "Enter your account details to open your saved watch list, picks, and continue-watching queue.",
    ctaLabel: "Login",
    helperCopy:
      "Need a new account? Switch to register and create one from the same page.",
    fields: [
      { label: "Username or email", placeholder: "Username or email", type: "text" },
      { label: "Password", placeholder: "Password", type: "password" }
    ]
  },
  register: {
    badge: "New Member Setup",
    eyebrow: "Create your RioAnimePlay account",
    title: "Register once, then keep your watch list close.",
    description:
      "Create the account on a dedicated page, receive a verification code by email, and finish setup without the homepage feeling crowded.",
    panelTitle: "Create Account",
    panelIcon: "person_add",
    formTitle: "Step 02 of 02",
    formDescription:
      "After you enter your email, we send a 6-digit code so the account can be confirmed.",
    ctaLabel: "Register Account",
    helperCopy:
      "Already have an account? Switch to login and use the dedicated sign-in form here.",
    fields: [
      { label: "Username", placeholder: "Choose a username", type: "text" },
      { label: "Email address", placeholder: "name@example.com", type: "email" },
      { label: "Verification code", placeholder: "Enter the 6-digit code", type: "text" }
    ],
    points: [
      {
        icon: "badge",
        title: "Username",
        text: "Pick the name other members will see around the site."
      },
      {
        icon: "alternate_email",
        title: "Email",
        text: "We send a confirmation code to the address you enter."
      },
      {
        icon: "verified_user",
        title: "Code",
        text: "Use the inbox code to complete the account setup."
      }
    ]
  }
} as const;

function getAccountMode(mode?: string) {
  return mode === "register" ? "register" : "login";
}

function AuthModeTabs({ mode }: { mode: "login" | "register" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {AUTH_TABS.map((tab) => (
        <Link
          key={tab.mode}
          href={tab.href}
          aria-current={mode === tab.mode ? "page" : undefined}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 ${
            mode === tab.mode
              ? "border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--text-primary)]"
              : "border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
          }`}
        >
          <MaterialIcon className="text-[16px]" name={tab.icon} />
          {tab.label}
        </Link>
      ))}
    </div>
  );
}

function AuthForm({
  lockdownEnabled,
  lockdownMessage,
  mode
}: {
  lockdownEnabled: boolean;
  lockdownMessage: string;
  mode: "login" | "register";
}) {
  const content = AUTH_MODES[mode];

  return (
    <Panel
      className="relative overflow-hidden border-[var(--line-strong)] bg-[linear-gradient(180deg,rgba(29,29,37,0.98),rgba(17,18,24,0.98))]"
      icon={content.panelIcon}
      title={content.panelTitle}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(141,114,255,0.16),transparent_70%)]" />
      <div className={`relative ${mode === "login" ? "space-y-4 p-4" : "space-y-5 p-4 sm:p-5"}`}>
        <div className={`rounded-[22px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] ${mode === "login" ? "p-3.5" : "p-4"}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                {content.formTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                {content.formDescription}
              </p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <MaterialIcon
                className="text-[20px]"
                name={mode === "login" ? "lock_open" : "mark_email_unread"}
              />
            </span>
          </div>
        </div>

        <form className={mode === "login" ? "space-y-3.5" : "space-y-4"}>
          {content.fields.map((field) => (
            <label key={field.label} className="block space-y-1.5">
              <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                {field.label}
              </span>
              <input
                type={field.type}
                inputMode={field.label === "Verification code" ? "numeric" : undefined}
                placeholder={field.placeholder}
                className="h-12 w-full rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 text-sm text-[var(--text-secondary)] outline-none transition-[border-color,box-shadow,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] placeholder:text-[var(--text-muted)] focus:border-[var(--line-strong)] focus:bg-[rgba(255,255,255,0.05)] focus:shadow-[0_0_0_4px_rgba(141,114,255,0.12)]"
              />
            </label>
          ))}

          {mode === "register" ? (
            <>
              <div className="rounded-[20px] border border-[rgba(141,114,255,0.26)] bg-[rgba(141,114,255,0.09)] px-4 py-3 text-sm leading-6 text-[var(--text-secondary)]">
                We&apos;ll send a verification code to your email after you continue.
              </div>

              <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <span className="inline-flex items-center gap-2">
                  <MaterialIcon className="text-[16px] text-[var(--accent-strong)]" name="schedule" />
                  Code expires after 10 minutes
                </span>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-3 py-2 uppercase tracking-[0.16em] text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
                >
                  <MaterialIcon className="text-[16px]" name="forward_to_inbox" />
                  Send Code
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <input type="checkbox" readOnly checked className="accent-[var(--accent)]" />
                  Remember me
                </label>
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.18em] text-[var(--accent-strong)]"
                >
                  Forgot password
                </button>
              </div>
              <div className="rounded-[18px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] px-3.5 py-3 text-xs leading-6 text-[var(--text-secondary)]">
                Your saved watchlist, bookmarks, and continue queue unlock here once you sign in.
              </div>
            </div>
          )}

          <LockdownAction
            locked={lockdownEnabled}
            message={lockdownMessage}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(90deg,var(--accent),#5f4ed8)] px-4 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-[0_18px_34px_rgba(95,78,216,0.34)] transition-transform duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5"
          >
            <MaterialIcon
              className="text-[18px]"
              name={mode === "login" ? "login" : "how_to_reg"}
            />
            {content.ctaLabel}
          </LockdownAction>
        </form>

        <p className="text-center text-xs leading-6 text-[var(--text-muted)]">
          {content.helperCopy}
        </p>
      </div>
    </Panel>
  );
}

function LoginLayout({
  lockdownEnabled,
  lockdownMessage
}: {
  lockdownEnabled: boolean;
  lockdownMessage: string;
}) {
  const content = AUTH_MODES.login;

  return (
    <div className="relative space-y-5">
      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
        <MaterialIcon className="text-[16px]" name="login" />
        {content.badge}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_260px_390px] xl:items-stretch">
        <div className="flex flex-col justify-between space-y-6 rounded-[30px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-6 xl:min-h-[520px]">
          <div className="space-y-4">
            <AuthModeTabs mode="login" />
            <div className="space-y-4 pt-2">
              <p className="text-[0.74rem] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                {content.eyebrow}
              </p>
              <h1 className="max-w-[11ch] font-display text-[2.8rem] leading-[1.02] text-[var(--text-primary)] sm:text-[3.5rem]">
                {content.title}
              </h1>
              <p className="max-w-[52ch] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.98rem]">
                {content.description}
              </p>
            </div>
          </div>

          <div className="rounded-[26px] border border-[rgba(141,114,255,0.2)] bg-[linear-gradient(135deg,rgba(141,114,255,0.13),rgba(255,255,255,0.03))] p-5 shadow-[0_18px_38px_rgba(0,0,0,0.22)]">
            <div className="flex items-start gap-3.5">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(14,15,20,0.28)] text-[var(--accent-strong)]">
                <MaterialIcon className="text-[20px]" name="hub" />
              </span>
              <div className="space-y-2">
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                  All in one place
                </p>
                <p className="max-w-[50ch] text-sm leading-7 text-[var(--text-primary)]">
                  Keep your saved list, next episode, bookmarks, and account tools in one spot so getting back into a show feels instant instead of scattered across the site.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 xl:min-h-[520px] xl:justify-between">
          <div className="rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[var(--soft-shadow)]">
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Member perks
            </p>
            <div className="mt-4 space-y-3">
              {LOGIN_BENEFITS.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-3 rounded-[20px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                >
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-panel)] text-[var(--accent-strong)]">
                    <MaterialIcon className="text-[16px]" name={item.icon} />
                  </span>
                  <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] px-5 py-4 shadow-[var(--soft-shadow)]">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-panel)] text-[var(--accent-strong)]">
                <MaterialIcon className="text-[18px]" name="waving_hand" />
              </span>
              <div className="space-y-1.5">
                <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[var(--text-muted)]">
                  Welcome back
                </p>
                <p className="text-sm leading-6 text-[var(--text-secondary)]">
                  Your bookmarks, watchlist, and next episode are waiting for you here.
                </p>
              </div>
            </div>
          </div>
        </div>

        <AuthForm
          lockdownEnabled={lockdownEnabled}
          lockdownMessage={lockdownMessage}
          mode="login"
        />
      </div>
    </div>
  );
}

function RegisterLayout({
  lockdownEnabled,
  lockdownMessage
}: {
  lockdownEnabled: boolean;
  lockdownMessage: string;
}) {
  const content = AUTH_MODES.register;

  return (
    <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px] xl:items-stretch">
      <div className="flex h-full flex-col justify-between gap-6">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
            <MaterialIcon className="text-[16px]" name="mark_email_read" />
            {content.badge}
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
            <div className="space-y-4">
              <AuthModeTabs mode="register" />

              <div className="space-y-4">
                <p className="text-[0.74rem] uppercase tracking-[0.28em] text-[var(--text-muted)]">
                  {content.eyebrow}
                </p>
                <h1 className="max-w-[12ch] font-display text-[2.6rem] leading-[1.02] text-[var(--text-primary)] sm:text-[3.35rem]">
                  {content.title}
                </h1>
                <p className="max-w-[60ch] text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.98rem]">
                  {content.description}
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[rgba(255,255,255,0.06)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[var(--soft-shadow)]">
              <p className="text-[0.68rem] uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Why join in
              </p>
              <div className="mt-4 space-y-4">
                {LOGIN_BENEFITS.map((item) => (
                  <div
                    key={item.text}
                    className="flex items-start gap-3 rounded-[20px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] px-4 py-3"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-panel)] text-[var(--accent-strong)]">
                      <MaterialIcon className="text-[16px]" name={item.icon} />
                    </span>
                    <p className="text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {content.points.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.03)] p-4 backdrop-blur"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--accent-panel)] text-[var(--accent-strong)]">
                <MaterialIcon className="text-[19px]" name={item.icon} />
              </span>
              <h2 className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)]">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[rgba(255,255,255,0.05)] px-4 py-2.5 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <MaterialIcon className="text-[16px] text-[var(--accent-strong)]" name="forum" />
          Your account keeps everything in one place
        </div>
      </div>

      <AuthForm
        lockdownEnabled={lockdownEnabled}
        lockdownMessage={lockdownMessage}
        mode="register"
      />
    </div>
  );
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const params = await searchParams;
  const mode = getAccountMode(params?.mode);
  const siteSettings = await getSiteSettings();

  return (
    <ResponsiveRender
      initialIsMobile={initialIsMobile}
      mobile={<MobileSettingsScreen />}
      desktop={
        <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
          <div className="site-shell desktop-shell mx-auto flex min-h-screen w-full flex-col px-4 pb-10 pt-4 sm:px-6 xl:px-24 2xl:px-28">
            <SiteHeader />

            <section className="relative mt-5 overflow-hidden rounded-[32px] border border-[var(--line-soft)] bg-[linear-gradient(135deg,rgba(141,114,255,0.12),rgba(14,15,20,0.92)_34%,rgba(11,12,16,0.98))] px-5 py-6 shadow-[0_30px_70px_rgba(0,0,0,0.34)] sm:px-7 sm:py-8">
              <div className="pointer-events-none absolute left-[-80px] top-[-90px] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(141,114,255,0.18),transparent_68%)]" />
              <div className="pointer-events-none absolute bottom-[-120px] right-[-60px] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(114,194,255,0.12),transparent_72%)]" />

              {mode === "login" ? (
                <LoginLayout
                  lockdownEnabled={siteSettings.authLockdown.enabled}
                  lockdownMessage={siteSettings.authLockdown.message}
                />
              ) : (
                <RegisterLayout
                  lockdownEnabled={siteSettings.authLockdown.enabled}
                  lockdownMessage={siteSettings.authLockdown.message}
                />
              )}
            </section>

            <SiteFooter />
          </div>
        </main>
      }
    />
  );
}

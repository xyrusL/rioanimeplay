import { headers } from "next/headers";
import Link from "next/link";

import { auth, signIn, signOut } from "@/auth";
import { SiteFooter } from "@/features/home/sections/site-footer";
import { SiteHeader } from "@/features/home/sections/site-header";
import { MobileSettingsScreen } from "@/features/mobile/account/mobile-settings-screen";
import { ResponsiveRender } from "@/features/mobile/shared/responsive-render";
import { isLikelyMobileUserAgent } from "@/shared/lib/mobile-detection";
import { getSiteSettings } from "@/shared/lib/site-settings";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";

type AccountPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const ACCOUNT_BENEFITS = [
  {
    icon: "bookmark",
    title: "Keep your watch list",
    text: "Return to saved titles quickly",
    iconClass: "bg-[#ff5fa2]/12 text-[#ff72ad] ring-[#ff72ad]/15"
  },
  {
    icon: "shield",
    title: "Secure and private",
    text: "Google protects your sign-in",
    iconClass: "bg-[#57d8c5]/12 text-[#62dfcd] ring-[#62dfcd]/15"
  },
  {
    icon: "bolt",
    title: "Quick and easy",
    text: "One tap to continue",
    iconClass: "bg-[#ffbd4a]/12 text-[#ffc65c] ring-[#ffc65c]/15"
  }
] as const;

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/account" });
}

async function signOutAccount() {
  "use server";
  await signOut({ redirectTo: "/account" });
}

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

function DecorativeField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(192,82,255,0.12),transparent_28%),radial-gradient(circle_at_18%_70%,rgba(236,82,164,0.07),transparent_27%),radial-gradient(circle_at_82%_66%,rgba(128,93,255,0.08),transparent_29%)]" />
      <div className="absolute left-[-7%] top-[15%] h-[58%] w-[34%] -rotate-6 rounded-[80px] border border-white/[0.025] bg-[linear-gradient(145deg,rgba(255,255,255,0.018),transparent)] opacity-70" />
      <div className="absolute right-[-8%] top-[13%] h-[60%] w-[35%] rotate-6 rounded-[80px] border border-white/[0.025] bg-[linear-gradient(215deg,rgba(255,255,255,0.018),transparent)] opacity-70" />
      <div className="absolute inset-x-[11%] top-[13%] h-px bg-[linear-gradient(90deg,transparent,rgba(232,91,201,0.22),transparent)]" />
    </div>
  );
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const [session, siteSettings, params] = await Promise.all([
    auth(),
    getSiteSettings(),
    searchParams ?? Promise.resolve<{ error?: string }>({})
  ]);
  const errorMessage = params.error
    ? "Google sign-in could not be completed. Please try again."
    : null;
  const memberName = session?.user?.name ?? "RioAnime member";
  const member = session?.user
    ? {
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        name: memberName
      }
    : null;

  return (
    <ResponsiveRender
      initialIsMobile={initialIsMobile}
      mobileViewportFallback
      mobile={
        <MobileSettingsScreen
          accountBenefits={ACCOUNT_BENEFITS}
          authLocked={siteSettings.authLockdown.enabled}
          authLockdownMessage={siteSettings.authLockdown.message}
          errorMessage={errorMessage}
          member={member}
          signInAction={signInWithGoogle}
          signOutAction={signOutAccount}
        />
      }
      desktop={
        <main className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#090a10_0%,#0d0e17_46%,#0a0b11_100%)] text-[var(--text-primary)]">
      <DecorativeField />

      <div className="site-shell desktop-shell relative z-10 mx-auto flex min-h-screen w-full flex-col px-4 pb-4 pt-4 sm:px-6 xl:px-24 2xl:px-28">
        <SiteHeader />

        <section className="flex flex-1 items-center justify-center py-5 sm:py-7 lg:py-8">
          <div className="relative w-full max-w-[540px] overflow-hidden rounded-[26px] border border-white/20 bg-[linear-gradient(155deg,rgba(25,24,36,0.97),rgba(12,14,22,0.985)_55%,rgba(19,17,29,0.98))] shadow-[0_30px_90px_rgba(0,0,0,0.55),0_0_60px_rgba(192,67,225,0.08)]">
            <div className="absolute inset-x-[9%] top-0 h-px bg-[linear-gradient(90deg,transparent,#d563f4,transparent)] shadow-[0_0_20px_3px_rgba(212,91,241,0.35)]" />
            <div className="pointer-events-none absolute left-1/2 top-[-110px] h-72 w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(176,74,229,0.19),transparent_68%)] blur-xl" />

            <div className="relative px-6 pb-9 pt-9 text-center sm:px-10 sm:pb-10 sm:pt-10">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[linear-gradient(135deg,#ff79b3,#bd67ff)] p-[3px] shadow-[0_0_26px_rgba(231,91,199,0.24)]">
                <span className="grid h-full w-full place-items-center rounded-full bg-[#161622] text-white">
                  <MaterialIcon className="text-[27px]" filled name="play_arrow" />
                </span>
              </div>

              {session?.user ? (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-white/48">Signed in</p>
                  <ProfileAvatar
                    className="mx-auto mt-3 h-16 w-16 rounded-full border border-[#df73f1]/35 bg-[linear-gradient(145deg,rgba(238,102,187,0.2),rgba(125,85,241,0.18))] text-2xl font-black text-white shadow-[0_0_28px_rgba(202,82,221,0.16)]"
                    image={session.user.image}
                    imageSizes="64px"
                    name={memberName}
                  />
                  <h1 className="mt-4 text-2xl font-black tracking-[-0.035em] text-white sm:text-[2rem]">
                    Welcome back, {session.user.name?.split(" ")[0] || "member"}
                  </h1>
                  <p className="mt-2 text-xs text-white/55 sm:text-sm">{session.user.email}</p>

                  <div className="mx-auto mt-6 grid max-w-[460px] gap-3 sm:grid-cols-2">
                    <Link href="/" className="inline-flex h-12 items-center justify-center gap-2 rounded-[13px] bg-[linear-gradient(105deg,#e955a2,#a95eea)] px-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(205,77,188,0.22)] transition hover:brightness-110">
                      <MaterialIcon className="text-[18px]" name="home" />
                      Continue browsing
                    </Link>
                    <form action={signOutAccount}>
                      <button type="submit" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[13px] border border-white/12 bg-white/[0.035] px-4 text-sm font-bold text-white/72 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white">
                        <MaterialIcon className="text-[18px]" name="logout" />
                        Sign out
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="mt-5 text-[1.85rem] font-black leading-tight tracking-[-0.04em] text-white sm:text-[2.2rem]">
                    Welcome to
                    <span className="mt-1 block bg-[linear-gradient(90deg,#f16aa5,#b56cf5)] bg-clip-text text-transparent">RioAnimePlay</span>
                  </h1>
                  <p className="mx-auto mt-3 max-w-[350px] text-sm leading-5 text-white/60">
                    Continue with Google to access your account and keep your favorite anime close.
                  </p>

                  <div className="relative mx-auto mt-7 max-w-[460px]">
                    <div className="absolute inset-[-10px] rounded-[22px] bg-[#dc55e2]/20 blur-xl" />
                    {siteSettings.authLockdown.enabled ? (
                      <button disabled className="relative inline-flex h-14 w-full cursor-not-allowed items-center justify-center gap-3 rounded-[14px] border border-white/70 bg-white/75 px-6 text-sm font-bold text-[#171721] opacity-55">
                        <GoogleMark />
                        Continue with Google
                      </button>
                    ) : (
                      <form action={signInWithGoogle}>
                        <button type="submit" className="relative inline-flex h-14 w-full items-center justify-center gap-3 rounded-[14px] border border-white/80 bg-white px-6 text-sm font-bold text-[#171721] shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#faf8ff] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d967e6]/35 motion-reduce:transition-none">
                          <GoogleMark />
                          Continue with Google
                        </button>
                      </form>
                    )}
                  </div>

                  {siteSettings.authLockdown.enabled ? (
                    <p className="mx-auto mt-4 max-w-[440px] rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-4 py-3 text-xs leading-5 text-amber-100/70">
                      {siteSettings.authLockdown.message}
                    </p>
                  ) : null}
                  {errorMessage ? (
                    <p className="mx-auto mt-4 max-w-[440px] rounded-xl border border-red-400/20 bg-red-400/[0.07] px-4 py-3 text-xs leading-5 text-red-100/75">
                      {errorMessage}
                    </p>
                  ) : null}
                </>
              )}

              <span aria-hidden="true" className="absolute left-[12%] top-[31%] text-2xl text-[#ef70c2]/70">+</span>
              <span aria-hidden="true" className="absolute right-[12%] top-[34%] text-xl text-[#c764ee]/65">+</span>
              <span aria-hidden="true" className="absolute left-[19%] top-[49%] h-3 w-3 rotate-45 border-l border-[#bd59e7]/55" />
              <span aria-hidden="true" className="absolute right-[16%] top-[51%] h-2 w-2 rotate-45 border border-[#f070ba]/55" />
            </div>

            <div className="relative border-t border-white/10 bg-black/10 px-5 py-4 sm:px-6">
              <div className="grid gap-4 sm:grid-cols-3 sm:gap-0">
                {ACCOUNT_BENEFITS.map((item, index) => (
                  <div key={item.title} className={`flex items-center gap-2.5 sm:px-4 ${index > 0 ? "sm:border-l sm:border-white/10" : ""}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ring-1 ring-inset ${item.iconClass}`}>
                      <MaterialIcon className="text-[20px]" name={item.icon} />
                    </span>
                    <span className="min-w-0 text-left">
                      <strong className="block text-xs font-bold text-white/90">{item.title}</strong>
                      <span className="mt-1 block text-[0.66rem] leading-4 text-white/42">{item.text}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <SiteFooter />
          </div>
        </main>
      }
    />
  );
}

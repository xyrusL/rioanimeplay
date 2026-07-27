import type { Metadata } from "next";

import { signIn } from "@/auth";
import { loginAdminAction } from "@/app/admin/actions";
import { fetchDashboardData } from "@/entities/anime/api/catalog";
import { AdminLoginBackground } from "@/features/dashboard/admin-login-background";
import { AdminDashboard } from "@/features/dashboard/admin-dashboard";
import { resolveAdminTab, tabNeedsDashboardData } from "@/features/dashboard/admin-tab-state";
import { fetchAdminProfile } from "@/shared/lib/admin-api";
import { isAdminAuthenticated } from "@/shared/lib/admin-auth";
import { getSiteSettings } from "@/shared/lib/site-settings";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin | RioAnimePlay",
  description: "RioAnime API administration console"
};

type AdminPageProps = {
  searchParams?: Promise<{ error?: string; tab?: string }>;
};

async function signInAdminWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/admin?error=account" });
}

function AdminLogin({ error }: { error?: string }) {
  const errorMessage = error === "account"
    ? "This account could not access the admin workspace. Try another account."
    : error === "credentials"
      ? "The email or password was not accepted. Check your details and try again."
      : null;

  return (
    <main className="relative isolate min-h-[100dvh] overflow-hidden bg-[#050817] text-white">
      <AdminLoginBackground />
      <div className="pointer-events-none absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(3,6,20,0.5),rgba(3,7,22,0.78))] lg:bg-[linear-gradient(90deg,rgba(2,5,18,0.74)_0%,rgba(4,8,24,0.5)_52%,rgba(2,5,17,0.76)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_70%_45%,rgba(112,92,220,0.18),transparent_30%)]" />

      <div className="mx-auto grid min-h-[100dvh] w-full max-w-[1240px] items-center gap-10 px-3 py-4 sm:px-6 sm:py-8 lg:grid-cols-[1fr_440px] lg:px-10 xl:gap-20">
        <section className="hidden max-w-[570px] lg:block">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#080d24]/55 px-3.5 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#d8d7ff] backdrop-blur-xl">
            <span className="h-1.5 w-1.5 rounded-full bg-[#8df1d1] shadow-[0_0_14px_#8df1d1]" />
            Restricted workspace
          </div>
          <p className="mt-8 font-display text-[0.76rem] font-semibold uppercase tracking-[0.3em] text-[#b8afff]">RioAnime Administration</p>
          <h2 className="mt-4 max-w-[540px] font-display text-[clamp(3.1rem,5vw,5.4rem)] font-semibold leading-[0.94] tracking-[-0.055em] text-white">
            Keep the world of anime in motion.
          </h2>
          <p className="mt-6 max-w-[480px] text-[0.98rem] leading-7 text-[#c7cbe0]">
            Manage the catalog, members, platform access, and site operations from one secure console.
          </p>
          <div className="mt-10 flex items-center gap-3 text-xs text-[#aeb5cf]">
            <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.07] backdrop-blur-md"><MaterialIcon className="text-[18px]" name="verified_user" /></span>
            Authorized administrators only
          </div>
        </section>

        <section className="relative mx-auto w-full max-w-[420px] overflow-hidden rounded-[26px] border border-white/15 bg-[rgba(7,10,27,0.82)] p-2 shadow-[0_30px_100px_rgba(0,0,0,0.58)] backdrop-blur-2xl sm:max-w-[440px] sm:rounded-[30px] sm:p-3">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(205,199,255,0.8),transparent)]" />
          <div className="rounded-[20px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.015))] p-4 sm:rounded-[23px] sm:p-6">
            <div className="flex items-center gap-3 sm:block">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] border border-[#b8afff]/25 bg-[#8e7cff]/15 text-[#c9c2ff] shadow-[0_12px_28px_rgba(0,0,0,0.3)] sm:mx-auto sm:h-14 sm:w-14 sm:rounded-[18px]">
                <MaterialIcon className="text-[23px] sm:text-[27px]" filled name="admin_panel_settings" />
              </div>
              <div className="min-w-0 sm:mt-4 sm:text-center">
                <p className="font-display text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-[#b8afff] sm:text-[0.7rem]">RioAnime Admin</p>
                <h1 className="mt-1 text-[1.55rem] font-semibold leading-none tracking-[-0.035em] sm:mt-2 sm:text-[2rem]">Welcome back</h1>
              </div>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#b5bbd0] sm:mt-3 sm:text-center sm:text-sm sm:leading-6">Sign in to continue to your administration console.</p>

            {errorMessage ? (
              <div role="alert" className="mt-3 flex items-start gap-2.5 rounded-[14px] border border-[#ff9caf]/25 bg-[#ff6e8d]/10 px-3 py-2.5 text-[0.72rem] leading-4 text-[#ffd0d9] sm:mt-4 sm:px-3.5 sm:py-3 sm:text-xs">
                <MaterialIcon className="mt-px shrink-0 text-[16px] text-[#ff9caf]" name="error" />
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <form action={signInAdminWithGoogle} className="mt-4">
              <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[13px] border border-white/80 bg-white px-4 text-sm font-semibold text-[#111526] shadow-[0_14px_30px_rgba(0,0,0,0.26)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:h-12 sm:rounded-[14px]"><MaterialIcon className="text-[19px]" name="account_circle" />Continue with Google</button>
            </form>

            <div className="my-3.5 flex items-center gap-2.5 text-[0.58rem] font-semibold uppercase tracking-[0.13em] text-[#7f87a4] sm:my-5 sm:text-[0.64rem]"><span className="h-px flex-1 bg-white/10" /><span>or use credentials</span><span className="h-px flex-1 bg-white/10" /></div>

            <form action={loginAdminAction} className="space-y-3 sm:space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#949bb4]">Email</span>
                <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#7f87a4]"><MaterialIcon className="text-[16px]" name="person" /></span><input type="email" name="username" autoComplete="username" required className="h-11 w-full rounded-[13px] border border-white/10 bg-[#050818]/70 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-[#9e90ff] sm:h-12 sm:rounded-[14px]" /></div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[#949bb4]">Password</span>
                <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#7f87a4]"><MaterialIcon className="text-[16px]" name="lock" /></span><input type="password" name="password" autoComplete="current-password" required className="h-11 w-full rounded-[13px] border border-white/10 bg-[#050818]/70 pl-10 pr-4 text-sm text-white outline-none transition-colors focus:border-[#9e90ff] sm:h-12 sm:rounded-[14px]" /></div>
              </label>
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-[#b5bbd0] sm:text-sm"><input type="checkbox" name="rememberMe" defaultChecked className="h-4 w-4 rounded accent-[#8574f3]" />Remember me</label>
                <span className="inline-flex items-center gap-1 text-[0.65rem] text-[#79819d]"><MaterialIcon className="text-[14px]" name="lock" />Secure access</span>
              </div>
              <button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-[linear-gradient(100deg,#7664e8,#5686f5)] px-4 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(86,101,225,0.35)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a99fff] sm:h-12 sm:rounded-[14px]"><MaterialIcon className="text-[18px]" name="login" />Sign in</button>
            </form>
          </div>
          <p className="px-3 pb-1 pt-3 text-center text-[0.58rem] uppercase tracking-[0.14em] text-[#707894] sm:pb-0 sm:text-[0.62rem]">Protected RioAnime workspace</p>
        </section>
      </div>
    </main>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [params, authenticated] = await Promise.all([searchParams, isAdminAuthenticated()]);
  if (!authenticated) return <AdminLogin error={params?.error} />;

  const activeTab = resolveAdminTab(params?.tab);
  const [data, settings, profile] = await Promise.all([
    tabNeedsDashboardData(activeTab) ? fetchDashboardData().catch(() => null) : null,
    getSiteSettings(),
    activeTab === "setting" ? fetchAdminProfile().catch(() => null) : null
  ]);
  return <AdminDashboard activeTab={activeTab} data={data} initialAppearance={settings.adminAppearance} initialProfile={profile} />;
}

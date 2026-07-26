import type { Metadata } from "next";

import { auth, signIn } from "@/auth";
import { loginAdminAction } from "@/app/admin/actions";
import { fetchDashboardData } from "@/entities/anime/api/catalog";
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
  await signIn("google", { redirectTo: "/admin" });
}

function AdminLogin({ error, signedInEmail }: { error?: string; signedInEmail?: string | null }) {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="relative isolate mx-auto flex min-h-screen w-full max-w-[1600px] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 xl:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(141,114,255,0.14),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-[8%] hidden w-[280px] xl:block">
          <div className="absolute top-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]" />
          <div className="absolute top-[18%] left-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-white/10 bg-white/[0.03]" />
          <div className="absolute top-[18%] right-0 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
          <div className="absolute bottom-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]" />
          <div className="absolute bottom-[18%] left-0 h-14 w-14 -translate-x-1/2 translate-y-1/2 rounded-[18px] border border-white/10 bg-white/[0.03]" />
          <div className="absolute bottom-[18%] right-0 h-2.5 w-2.5 translate-x-1/2 translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-[8%] hidden w-[280px] xl:block">
          <div className="absolute top-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.14))]" />
          <div className="absolute top-[18%] left-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
          <div className="absolute top-[18%] right-0 h-14 w-14 translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-white/10 bg-white/[0.03]" />
          <div className="absolute bottom-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.14))]" />
          <div className="absolute bottom-[18%] left-0 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-white shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
          <div className="absolute bottom-[18%] right-0 h-14 w-14 translate-x-1/2 translate-y-1/2 rounded-[18px] border border-white/10 bg-white/[0.03]" />
        </div>

        <section className="relative w-full max-w-[440px] rounded-[28px] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(30,31,39,0.96),rgba(18,19,24,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)]" />
          <div className="relative rounded-[22px] border border-white/[0.05] bg-white/[0.02] p-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/[0.08] bg-[rgba(141,114,255,0.14)] text-[var(--accent-strong)] shadow-[0_12px_28px_rgba(0,0,0,0.26)]">
              <MaterialIcon className="text-[26px]" filled name="admin_panel_settings" />
            </div>
            <div className="mt-4 text-center">
              <p className="font-display text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">RioAnime Admin</p>
              <h1 className="mt-3 text-[2rem] leading-[1.02] font-semibold text-white">Welcome Back</h1>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Sign in to continue to the RioAnime administration console.</p>
            </div>
            {error === "account" ? <div className="mt-5 rounded-[18px] border border-[rgba(255,120,150,0.26)] bg-[rgba(255,120,150,0.08)] px-4 py-3 text-sm text-[#ffc3d1]">Invalid admin account{signedInEmail ? `: ${signedInEmail}` : "."} This account does not have active administrator access.</div> : null}
            <form action={signInAdminWithGoogle} className="mt-5">
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] border border-white/80 bg-white px-4 py-3.5 text-sm font-semibold text-[#171721] shadow-[0_16px_34px_rgba(0,0,0,0.24)] transition-transform hover:-translate-y-0.5"><MaterialIcon className="text-[19px]" name="account_circle" />Continue with Google</button>
            </form>
            <div className="my-5 flex items-center gap-3 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]"><span className="h-px flex-1 bg-white/[0.08]" /><span>or use admin credentials</span><span className="h-px flex-1 bg-white/[0.08]" /></div>
            <form action={loginAdminAction} className="space-y-4">
              {error === "credentials" ? <div className="rounded-[18px] border border-[rgba(255,120,150,0.26)] bg-[rgba(255,120,150,0.08)] px-4 py-3 text-sm text-[#ffc3d1]">Invalid admin account or credentials.</div> : null}
              <label className="block space-y-1.5">
                <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Email</span>
                <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]"><MaterialIcon className="text-[16px]" name="person" /></span><input type="email" name="username" autoComplete="username" required className="h-12 w-full rounded-[14px] border border-white/[0.08] bg-[rgba(10,11,16,0.78)] pl-10 pr-4 text-sm text-white outline-none focus:border-[var(--line-strong)]" /></div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Password</span>
                <div className="relative"><span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]"><MaterialIcon className="text-[16px]" name="lock" /></span><input type="password" name="password" autoComplete="current-password" required className="h-12 w-full rounded-[14px] border border-white/[0.08] bg-[rgba(10,11,16,0.78)] pl-10 pr-4 text-sm text-white outline-none focus:border-[var(--line-strong)]" /></div>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]"><input type="checkbox" name="rememberMe" defaultChecked className="h-4 w-4 rounded accent-[#2b6fe9]" />Remember me</label>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(90deg,#2b6fe9,#2898ff)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(43,111,233,0.34)] transition-transform hover:-translate-y-0.5"><MaterialIcon className="text-[18px]" name="login" />Login</button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const [params, authenticated, googleSession] = await Promise.all([searchParams, isAdminAuthenticated(), auth()]);
  if (!authenticated) return <AdminLogin error={params?.error ?? (googleSession?.user ? "account" : undefined)} signedInEmail={googleSession?.user?.email} />;

  const activeTab = resolveAdminTab(params?.tab);
  const [data, settings, profile] = await Promise.all([
    tabNeedsDashboardData(activeTab) ? fetchDashboardData().catch(() => null) : null,
    getSiteSettings(),
    activeTab === "setting" ? fetchAdminProfile().catch(() => null) : null
  ]);
  return <AdminDashboard activeTab={activeTab} data={data} initialAppearance={settings.adminAppearance} initialProfile={profile} />;
}

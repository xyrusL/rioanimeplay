import type { Metadata } from "next";
import { headers } from "next/headers";

import { auth, signIn, signOut } from "@/auth";
import { AccountSettingsContent } from "@/features/account/sections/account-settings-content";
import { getBrowseCatalog } from "@/features/browse/model/browse-page-data";
import { SiteFooter } from "@/features/home/sections/site-footer";
import { SiteHeader } from "@/features/home/sections/site-header";
import { MobileSettingsScreen } from "@/features/mobile/account/mobile-settings-screen";
import { ResponsiveRender } from "@/features/mobile/shared/responsive-render";
import { isLikelyMobileUserAgent } from "@/shared/lib/mobile-detection";
import { getSiteSettings } from "@/shared/lib/site-settings";

export const metadata: Metadata = {
  title: "Account | RioAnimePlay",
  description: "Manage your RioAnimePlay account, preferences, and saved anime."
};

type AccountPageProps = {
  searchParams?: Promise<{ error?: string; welcome?: string }>;
};

async function signInWithGoogle() {
  "use server";
  await signIn("google", { redirectTo: "/account?welcome=1" });
}

async function signOutAccount() {
  "use server";
  await signOut({ redirectTo: "/account" });
}

export default async function AccountPage({ searchParams }: AccountPageProps) {
  const headerStore = await headers();
  const initialIsMobile = isLikelyMobileUserAgent(headerStore.get("user-agent") ?? "");
  const [session, siteSettings, params, catalog] = await Promise.all([
    auth(),
    getSiteSettings(),
    searchParams ?? Promise.resolve<{ error?: string; welcome?: string }>({}),
    getBrowseCatalog()
  ]);
  const member = session?.user
    ? {
        email: session.user.email ?? "",
        image: session.user.image ?? null,
        name: session.user.name ?? "RioAnime member"
      }
    : null;
  const sharedProps = {
    authLocked: siteSettings.authLockdown.enabled,
    authLockdownMessage: siteSettings.authLockdown.message,
    catalog,
    defaultFontPreset: siteSettings.fontPreset,
    defaultThemePreset: siteSettings.themePreset,
    errorMessage: params.error === "AccessDenied"
      ? "This Google account does not have access. Use a registered account and try again."
      : params.error
        ? "Google sign-in could not be completed. Please try again."
        : null,
    member,
    showWelcome: params.welcome === "1" && Boolean(member),
    signInAction: signInWithGoogle,
    signOutAction: signOutAccount
  };

  return (
    <ResponsiveRender
      initialIsMobile={initialIsMobile}
      mobileViewportFallback
      mobile={<MobileSettingsScreen {...sharedProps} />}
      desktop={
        <main className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#090a10_0%,#0d0e17_46%,#0a0b11_100%)] text-[var(--text-primary)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,var(--accent-soft),transparent_24%),radial-gradient(circle_at_12%_62%,var(--body-radial-left),transparent_30%)]" />

          <div className="site-shell desktop-shell relative z-10 mx-auto flex min-h-screen w-full flex-col px-4 pb-4 pt-4 sm:px-6 xl:px-24 2xl:px-28">
            <SiteHeader />

            <section className="flex-1 py-7 lg:py-9">
              <AccountSettingsContent {...sharedProps} />
            </section>

            <SiteFooter />
          </div>
        </main>
      }
    />
  );
}

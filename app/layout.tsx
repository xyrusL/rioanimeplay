import type { Metadata, Viewport } from "next";
import { Lexend_Deca, Manrope, Nunito, Outfit, Sora } from "next/font/google";

import { getSiteSettings } from "@/shared/lib/site-settings";
import { AgeGateProvider } from "@/shared/ui/age-gate-provider";
import { PublicCacheStatus } from "@/shared/ui/public-cache-status";
import { RouteProgress } from "@/shared/ui/route-progress";
import { UserLibrarySync } from "@/shared/ui/user-library-sync";
import "./globals.css";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-lexend"
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit"
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope"
});

const sora = Sora({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sora"
});

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito"
});

export const metadata: Metadata = {
  title: "RioAnimePlay",
  description: "Streamlined anime discovery experience built for RioAnimePlay"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSettings = await getSiteSettings();

  return (
    <html
      lang="en"
      className={`${lexendDeca.variable} ${outfit.variable} ${manrope.variable} ${sora.variable} ${nunito.variable}`}
      suppressHydrationWarning
      data-font-preset={siteSettings.fontPreset}
      data-theme-preset={siteSettings.themePreset}
    >
      <body suppressHydrationWarning>
        <AgeGateProvider><RouteProgress /><UserLibrarySync />{children}<PublicCacheStatus /></AgeGateProvider>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";

import { MobileAppShell } from "@/features/mobile/shared/mobile-app-shell";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export function MobileSettingsScreen() {
  return (
    <MobileAppShell>
      <div className="space-y-6">
        <header className="space-y-4 rounded-[34px] border border-[var(--line-soft)] bg-[var(--panel-surface)] p-4 shadow-[var(--panel-shadow)]">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] text-[var(--bg-base)] shadow-[0_14px_28px_var(--accent-soft)]">
              <MaterialIcon className="text-[28px]" name="settings" />
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)]">Mobile control room</p>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">Settings</h1>
            </div>
          </div>
        </header>

        <section className="rounded-[32px] border border-[var(--line-soft)] bg-[var(--bg-card)] px-5 py-10 text-center shadow-[var(--soft-shadow)]">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <MaterialIcon className="text-[30px]" name="construction" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Settings are coming soon</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
            The mobile settings area is reserved, but the controls are not ready yet.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] px-5 py-3 text-sm font-semibold text-[var(--bg-base)] shadow-[0_16px_30px_var(--accent-soft)]"
            >
              <MaterialIcon className="text-[18px]" filled name="home" />
              Back to home
            </Link>
            <Link
              href="/bookmarks"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--bg-card)] px-5 py-3 text-sm font-semibold text-[var(--text-primary)]"
            >
              <MaterialIcon className="text-[18px]" filled name="favorite" />
              Open bookmarks
            </Link>
          </div>
        </section>
      </div>
    </MobileAppShell>
  );
}

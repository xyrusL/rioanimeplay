import type { ReactNode } from "react";
import Link from "next/link";

import { getBrowseCatalogRaw } from "@/features/browse/model/browse-page-data";
import {
  deleteAnimeRuleAction,
  loginAdminAction,
  logoutAdminAction,
  saveAnimeRuleAction,
  updateAnnouncementAction,
  updateAppearanceAction,
  updateAuthLockdownAction
} from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/shared/lib/admin-auth";
import {
  FONT_PRESETS,
  THEME_PRESETS,
  getSiteSettings
} from "@/shared/lib/site-settings";
import { AdminActionForm } from "@/shared/ui/admin-action-form";
import { AdminSelectField } from "@/shared/ui/admin-select-field";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin Dash",
  description: "Administrative control panel for RioAnimePlay"
};

type AdminPageProps = {
  searchParams?: Promise<{
    error?: string;
    notice?: string;
  }>;
};

const THEME_LABELS: Record<(typeof THEME_PRESETS)[number], string> = {
  "dark-purple": "Dark Blue",
  "dark-rose": "Dark Roses",
  "dark-strawberry": "Dark Strawberry",
  "dark-chocolate": "Dark Chocolate",
  "dark-amber": "Dark Amber",
  "dark-pink": "Dark Pink",
  "dark-neon": "Dark Neon",
  "dark-midnight": "Dark Midnight"
};

const FONT_LABELS: Record<(typeof FONT_PRESETS)[number], string> = {
  "lexend-default": "Lexend Default",
  "outfit-manrope": "Outfit + Manrope",
  "sora-nunito": "Sora + Nunito"
};

function Notice({
  error,
  notice
}: {
  error?: string;
  notice?: string;
}) {
  const text =
    error === "credentials"
      ? "Admin login failed. Use username admin and password admin."
      : error === "anime-rule"
        ? "Pick an anime title before saving a rule."
        : notice === "welcome"
          ? "Admin access unlocked."
          : notice === "appearance"
            ? "Public theme and font settings updated."
            : notice === "announcement"
              ? "Homepage announcement updated."
              : notice === "auth"
                ? "Client auth lockdown updated."
                : notice === "anime-rule"
                  ? "Anime visibility rules updated."
                  : "";

  if (!text) {
    return null;
  }

  return (
    <div
      className={`rounded-[20px] border px-4 py-3 text-sm leading-6 ${
        error
          ? "border-[rgba(255,120,150,0.26)] bg-[rgba(255,120,150,0.08)] text-[#ffc3d1]"
          : "border-[var(--line-strong)] bg-[var(--accent-soft)] text-[var(--text-secondary)]"
      }`}
    >
      {text}
    </div>
  );
}

function Card({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="border-b border-[var(--line-soft)] bg-[rgba(255,255,255,0.02)] px-5 py-4">
        <p className="font-display text-[0.82rem] uppercase tracking-[0.22em] text-[var(--accent-strong)]">
          {title}
        </p>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function AdminLogin({ error }: { error?: string }) {
  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="relative isolate mx-auto flex min-h-screen w-full max-w-[1600px] items-center justify-center overflow-hidden px-4 py-8 sm:px-6 xl:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(141,114,255,0.14),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-[8%] hidden w-[280px] xl:block">
          <div className="absolute top-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]" />
          <div className="absolute top-[18%] left-0 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]" />
          <div className="absolute top-[18%] right-0 h-2.5 w-2.5 translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.92)] shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
          <div className="absolute bottom-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.04))]" />
          <div className="absolute bottom-[18%] left-0 h-14 w-14 -translate-x-1/2 translate-y-1/2 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]" />
          <div className="absolute bottom-[18%] right-0 h-2.5 w-2.5 translate-x-1/2 translate-y-1/2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.92)] shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-[8%] hidden w-[280px] xl:block">
          <div className="absolute top-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.14))]" />
          <div className="absolute top-[18%] left-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.92)] shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
          <div className="absolute top-[18%] right-0 h-14 w-14 translate-x-1/2 -translate-y-1/2 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]" />
          <div className="absolute bottom-[18%] h-px w-full bg-[linear-gradient(90deg,rgba(255,255,255,0.04),rgba(255,255,255,0.14))]" />
          <div className="absolute bottom-[18%] left-0 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border border-[rgba(255,255,255,0.18)] bg-[rgba(255,255,255,0.92)] shadow-[0_0_18px_rgba(255,255,255,0.38)]" />
          <div className="absolute bottom-[18%] right-0 h-14 w-14 translate-x-1/2 translate-y-1/2 rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] shadow-[0_12px_30px_rgba(0,0,0,0.24)]" />
        </div>

        <section className="relative w-full max-w-[440px] rounded-[28px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,rgba(30,31,39,0.96),rgba(18,19,24,0.98))] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent)]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(141,114,255,0.18),transparent_72%)]" />

          <div className="relative rounded-[22px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] p-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[18px] border border-[rgba(255,255,255,0.08)] bg-[rgba(141,114,255,0.14)] text-[var(--accent-strong)] shadow-[0_12px_28px_rgba(0,0,0,0.26)]">
              <MaterialIcon className="text-[26px]" filled name="admin_panel_settings" />
            </div>

            <div className="mt-4 text-center">
              <p className="font-display text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                RioAnime Admin
              </p>
              <h1 className="mt-3 text-[2rem] leading-[1.02] font-semibold text-white">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                Domain control login only. No public member access here.
              </p>
            </div>

            <div className="mt-5 rounded-[18px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-center">
              <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                Demo credentials
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Username: <span className="font-semibold text-white">admin</span>
                {" · "}
                Password: <span className="font-semibold text-white">admin</span>
              </p>
            </div>

            <form action={loginAdminAction} className="mt-5 space-y-4">
              <Notice error={error} />
              <label className="block space-y-1.5">
                <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Username
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
                    <MaterialIcon className="text-[16px]" name="person" />
                  </span>
                  <input
                    name="username"
                    defaultValue="admin"
                    className="h-12 w-full rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,16,0.78)] pl-10 pr-4 text-sm text-white outline-none transition-[border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] focus:border-[var(--line-strong)]"
                  />
                </div>
              </label>
              <label className="block space-y-1.5">
                <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
                  Password
                </span>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[var(--text-muted)]">
                    <MaterialIcon className="text-[16px]" name="lock" />
                  </span>
                  <input
                    type="password"
                    name="password"
                    defaultValue="admin"
                    className="h-12 w-full rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[rgba(10,11,16,0.78)] pl-10 pr-4 text-sm text-white outline-none transition-[border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] focus:border-[var(--line-strong)]"
                  />
                </div>
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  name="rememberMe"
                  defaultChecked
                  className="h-4 w-4 rounded border-[rgba(255,255,255,0.16)] accent-[#2b6fe9]"
                />
                Remember me
              </label>
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(90deg,#2b6fe9,#2898ff)] px-4 py-3.5 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(43,111,233,0.34)] transition-transform duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5"
              >
                <MaterialIcon className="text-[18px]" name="login" />
                Login
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}

function AdminDashboard({
  error,
  notice,
  settings,
  catalog
}: {
  error?: string;
  notice?: string;
  settings: Awaited<ReturnType<typeof getSiteSettings>>;
  catalog: Awaited<ReturnType<typeof getBrowseCatalogRaw>>;
}) {
  const animeOptions = [...catalog]
    .sort((left, right) => left.title.localeCompare(right.title, "en", { sensitivity: "base" }))
    .map((item) => ({
      value: `${item.id}|${toAnimeSlug(item.title)}|${item.title}`,
      label: item.title
    }));

  return (
    <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1460px] gap-6 px-4 py-5 sm:px-6 xl:px-8">
        <aside className="hidden w-[280px] shrink-0 flex-col rounded-[30px] border border-[var(--line-soft)] bg-[rgba(16,17,25,0.94)] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.36)] xl:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <MaterialIcon className="text-[24px]" filled name="tune" />
            </span>
            <div>
              <p className="font-display text-[1rem] uppercase tracking-[0.16em] text-[var(--text-primary)]">
                RioAnime Admin
              </p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Site control
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-[rgba(255,255,255,0.05)] bg-[rgba(255,255,255,0.03)] p-4">
            <p className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Theme</p>
            <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">{THEME_LABELS[settings.themePreset]}</p>
            <p className="mt-4 text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Fonts</p>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">{FONT_LABELS[settings.fontPreset]}</p>
          </div>

          <div className="mt-auto space-y-3">
            <Link
              href="/"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-[border-color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
            >
              <MaterialIcon className="text-[16px]" name="arrow_back" />
              Back to Main Page
            </Link>
            <form action={logoutAdminAction}>
              <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                <MaterialIcon className="text-[16px]" name="logout" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <section className="rounded-[30px] border border-[var(--line-soft)] bg-[linear-gradient(135deg,rgba(141,114,255,0.12),rgba(14,15,20,0.92)_38%,rgba(11,12,16,0.98))] px-6 py-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
            <div className="max-w-[72rem]">
              <p className="font-display text-[0.82rem] uppercase tracking-[0.22em] text-[var(--accent-strong)]">Domain control panel</p>
              <h1 className="mt-3 text-[2rem] leading-[1.02] font-semibold text-[var(--text-primary)] sm:text-[2.6rem]">
                Tune the site, gate access, and hide titles without touching code.
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.98rem]">
                This admin area is separate from the public RioAnimePlay member pages and uses local settings for now.
              </p>
            </div>
          </section>

          <Notice error={error} notice={notice} />

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Appearance" description="Switch the public theme palette and curated font pair.">
              <AdminActionForm
                action={updateAppearanceAction}
                className="space-y-4"
                refreshOnSuccess
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <AdminSelectField
                    label="Theme preset"
                    name="themePreset"
                    options={THEME_PRESETS.map((preset) => ({
                      label: THEME_LABELS[preset],
                      value: preset
                    }))}
                    value={settings.themePreset}
                  />
                  <AdminSelectField
                    label="Font pair"
                    name="fontPreset"
                    options={FONT_PRESETS.map((preset) => ({
                      label: FONT_LABELS[preset],
                      value: preset
                    }))}
                    value={settings.fontPreset}
                  />
                </div>
                <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  <MaterialIcon className="text-[16px]" name="palette" />
                  Save Appearance
                </button>
              </AdminActionForm>
            </Card>

            <Card title="Announcement" description="Edit the homepage Dear Viewers strip without touching the component code.">
              <AdminActionForm action={updateAnnouncementAction} className="space-y-4">
                <label className="block space-y-1.5">
                  <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Title</span>
                <input name="title" defaultValue={settings.announcement.title} className="h-12 w-full rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 text-sm text-[var(--text-primary)] outline-none" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">Message</span>
                <textarea name="message" defaultValue={settings.announcement.message} rows={5} className="w-full rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none" />
                </label>
                <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  <MaterialIcon className="text-[16px]" name="campaign" />
                  Save Announcement
                </button>
              </AdminActionForm>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <Card title="Auth Lockdown" description="Temporarily stop public login and registration attempts and show your message instead.">
              <AdminActionForm action={updateAuthLockdownAction} className="space-y-4">
                <label className="flex items-center gap-3 rounded-[18px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                  <input type="checkbox" name="enabled" defaultChecked={settings.authLockdown.enabled} className="accent-[var(--accent)]" />
                  Enable temporary client auth lockdown
                </label>
                <textarea name="message" defaultValue={settings.authLockdown.message} rows={5} className="w-full rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none" />
                <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  <MaterialIcon className="text-[16px]" name="lock_clock" />
                  Save Lockdown
                </button>
              </AdminActionForm>
            </Card>

            <Card title="Anime Rules" description="Use locked for temporarily unavailable anime and private to hide a title from the public site completely.">
              <AdminActionForm
                action={saveAnimeRuleAction}
                className="space-y-4"
                refreshOnSuccess
              >
                <AdminSelectField
                  label="Anime title"
                  name="selectedAnime"
                  options={[
                    { label: "Select an anime", value: "" },
                    ...animeOptions
                  ]}
                  value=""
                />
                <AdminSelectField
                  label="Status"
                  name="status"
                  options={[
                    { label: "Public", value: "public" },
                    { label: "Temporarily unavailable", value: "locked" },
                    { label: "Private", value: "private" }
                  ]}
                  value="locked"
                />
                <textarea name="message" rows={4} placeholder="Optional custom message for temporarily unavailable anime." className="w-full rounded-2xl border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm leading-7 text-[var(--text-primary)] outline-none" />
                <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                  <MaterialIcon className="text-[16px]" name="save" />
                  Save Anime Rule
                </button>
              </AdminActionForm>

              <div className="mt-6 space-y-3">
                {settings.animeRules.length === 0 ? (
                  <div className="rounded-[20px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-[var(--text-secondary)]">No anime rules yet.</div>
                ) : (
                  settings.animeRules.map((rule) => (
                    <div key={rule.slug} className="flex flex-col gap-3 rounded-[22px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{rule.title}</p>
                        <p className="mt-1 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
                          {rule.status === "locked" ? "Temporarily unavailable" : "Private"}
                        </p>
                        {rule.message ? <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{rule.message}</p> : null}
                      </div>
                      <AdminActionForm action={deleteAnimeRuleAction} refreshOnSuccess>
                        <input type="hidden" name="slug" value={rule.slug} />
                        <input type="hidden" name="title" value={rule.title} />
                        <button type="submit" className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                          <MaterialIcon className="text-[16px]" name="delete" />
                          Remove Rule
                        </button>
                      </AdminActionForm>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await searchParams;
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLogin error={params?.error} />;
  }

  const [settings, catalog] = await Promise.all([
    getSiteSettings(),
    getBrowseCatalogRaw()
  ]);

  return (
    <AdminDashboard
      catalog={catalog}
      error={params?.error}
      notice={params?.notice}
      settings={settings}
    />
  );
}

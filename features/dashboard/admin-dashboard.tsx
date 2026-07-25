"use client";

import Link from "next/link";
import { type MouseEvent, type ReactNode, useEffect, useState } from "react";

import { logoutAdminAction } from "@/app/admin/actions";
import type { DashboardResponse } from "@/entities/anime/api/catalog";
import { addVisitedTab, ADMIN_TABS, type AdminTab, resolveAdminTab, tabNeedsDashboardData } from "@/features/dashboard/admin-tab-state";
import { AccountSettings, type Profile } from "@/features/dashboard/account-settings";
import { AdminAppearanceSettings } from "@/features/dashboard/admin-appearance-settings";
import { ApiKeyManager } from "@/features/dashboard/api-key-manager";
import { ContentManager } from "@/features/dashboard/content-manager";
import { MemberList } from "@/features/dashboard/member-list";
import { OverviewAnalytics } from "@/features/dashboard/overview-analytics";
import { PlatformStatus } from "@/features/dashboard/platform-status";
import { StatusManager } from "@/features/dashboard/status-manager";
import type { AdminAppearance } from "@/shared/lib/admin-appearance";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export { ADMIN_TABS, type AdminTab } from "@/features/dashboard/admin-tab-state";

const navigation: Array<{ id: AdminTab; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "space_dashboard" },
  { id: "content", label: "Content", icon: "video_library" },
  { id: "member", label: "Member", icon: "group" },
  { id: "api", label: "API", icon: "api" },
  { id: "status", label: "Status", icon: "campaign" },
  { id: "activity", label: "Activity Log", icon: "history" },
  { id: "setting", label: "Setting", icon: "settings" }
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 100000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Unknown";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(normalized));
}

function Brand() {
  return <Link href="/admin" className="group flex items-center gap-3" aria-label="RioAnimePlay admin"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_22px_rgba(0,0,0,0.2)] transition-transform group-hover:-rotate-6"><MaterialIcon className="text-[24px]" filled name="play_circle" /></span><span className="min-w-0"><span className="block truncate text-[17px] font-bold tracking-[-0.035em] text-[#f5f7fb]">RioAnimePlay</span><span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#7f899d]">Admin console</span></span></Link>;
}

function Navigation({ activeTab, onNavigate, mobile = false }: { activeTab: AdminTab; onNavigate: (event: MouseEvent<HTMLAnchorElement>, tab: AdminTab) => void; mobile?: boolean }) {
  return navigation.map((item) => (
    <a key={item.id} href={`/admin?tab=${item.id}`} onClick={(event) => onNavigate(event, item.id)} aria-current={activeTab === item.id ? "page" : undefined} className={`${mobile ? "shrink-0 px-3 py-2 text-[11px]" : "px-3.5 py-3 text-[13px]"} flex items-center gap-2.5 rounded-xl font-semibold transition-colors ${activeTab === item.id ? "bg-[#202a4c] text-[#9cafff]" : "text-[#838da0] hover:bg-[#1a1e29] hover:text-[#e5e8ef]"}`}>
      <MaterialIcon className={mobile ? "text-[16px]" : "text-[20px]"} filled={activeTab === item.id} name={item.icon} />{item.label}
    </a>
  ));
}

function Sidebar({ activeTab, onNavigate }: { activeTab: AdminTab; onNavigate: (event: MouseEvent<HTMLAnchorElement>, tab: AdminTab) => void }) {
  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-[#252a37] bg-[#11141c] px-4 py-6 lg:flex"><div className="px-3"><Brand /></div><nav className="mt-9 space-y-1.5" aria-label="Admin navigation"><Navigation activeTab={activeTab} onNavigate={onNavigate} /></nav><div className="mt-auto rounded-2xl border border-[#2b3141] bg-[#181d29] p-4 text-white"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10"><MaterialIcon className="text-[19px]" name="shield_lock" /></span><p className="mt-4 text-[13px] font-semibold">Protected workspace</p><p className="mt-1 text-[11px] leading-5 text-[#8f99ac]">Administrative access is verified against the D1 account database.</p></div><div className="mt-5 flex items-center gap-3 border-t border-[#252a37] px-2 pt-5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#202a4c] text-[#9cafff]"><MaterialIcon className="text-[18px]" name="admin_panel_settings" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-[#e8ebf2]">Administrator</p><p className="truncate text-[10px] text-[#7f899d]">D1 authenticated</p></div><form action={logoutAdminAction}><button type="submit" className="grid h-8 w-8 place-items-center rounded-lg text-[#7f899d] hover:bg-[#202532] hover:text-[#e8ebf2]" aria-label="Sign out"><MaterialIcon className="text-[18px]" name="logout" /></button></form></div></aside>;
}

function Header({ activeTab, onNavigate }: { activeTab: AdminTab; onNavigate: (event: MouseEvent<HTMLAnchorElement>, tab: AdminTab) => void }) {
  const label = navigation.find((item) => item.id === activeTab)?.label ?? "Overview";
  return <><header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-[#252a37] bg-[#11141c]/95 px-4 backdrop-blur sm:px-7 lg:px-8"><div className="lg:hidden"><Brand /></div><div className="hidden items-center gap-2 text-xs text-[#7f899d] lg:flex"><MaterialIcon className="text-[17px]" name="home" /><span>/</span><span>Admin</span><span>/</span><span className="font-semibold text-[#dfe3eb]">{label}</span></div><div className="flex items-center gap-2"><Link href="/" className="flex h-10 items-center gap-2 rounded-xl border border-[#2b3141] px-3 text-[11px] font-semibold text-[#a3acbc] hover:bg-[#1a1e29]"><MaterialIcon className="text-[17px]" name="open_in_new" /><span className="hidden sm:inline">View website</span></Link><form action={logoutAdminAction} className="lg:hidden"><button type="submit" className="grid h-10 w-10 place-items-center rounded-xl border border-[#2b3141] text-[#a3acbc]" aria-label="Sign out"><MaterialIcon className="text-[18px]" name="logout" /></button></form></div></header><nav className="flex gap-1 overflow-x-auto border-b border-[#252a37] bg-[#11141c] px-3 py-2 lg:hidden" aria-label="Mobile admin navigation"><Navigation activeTab={activeTab} onNavigate={onNavigate} mobile /></nav></>;
}

function EmptyData() {
  return <div className="rounded-2xl border border-[#292e3c] bg-[#151923] px-6 py-16 text-center"><MaterialIcon className="text-[30px] text-[#667188]" name="cloud_off" /><p className="mt-3 text-sm font-semibold text-[#d8dce5]">Dashboard data is unavailable</p><p className="mt-1 text-xs text-[#7f899d]">The admin API could not be reached.</p></div>;
}

function Metric({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone: string }) {
  return <article className="flex items-center gap-3 rounded-xl border border-[#292e3c] bg-[#151923] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.14)]"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}><MaterialIcon className="text-[16px]" filled name={icon} /></span><div className="min-w-0 flex-1"><div className="flex items-baseline justify-between gap-2"><p className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7f899d]">{label}</p><p className="shrink-0 text-lg font-bold leading-none tracking-[-0.025em] text-[#f5f7fb]">{value}</p></div><p className="mt-1 truncate text-[9px] text-[#778196]">{detail}</p></div></article>;
}

function Overview({ data }: { data: DashboardResponse | null }) {
  return <><OverviewAnalytics />{data ? <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_0.7fr]"><RecentContent data={data} compact /><ActivityList data={data} compact /></section> : null}<div className="mt-5"><PlatformStatus data={data} /></div></>;
}

function RecentContent({ data, compact = false }: { data: DashboardResponse; compact?: boolean }) {
  const rows = compact ? data.recentContent.slice(0, 4) : data.recentContent;
  return <section className="overflow-hidden rounded-2xl border border-[#292e3c] bg-[#151923]"><div className="border-b border-[#292e3c] px-5 py-4"><h2 className="text-sm font-bold text-[#eef1f6]">Recent content</h2><p className="mt-1 text-[10px] text-[#7f899d]">Latest catalog records from D1</p></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead className="bg-[#121620] text-[9px] uppercase tracking-[0.08em] text-[#707a8e]"><tr><th className="px-5 py-3">Title</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Episodes</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Updated</th></tr></thead><tbody className="divide-y divide-[#252a37]">{rows.map((row) => <tr key={row.anime_id} className="text-[11px] text-[#98a2b4]"><td className="px-5 py-4 font-semibold text-[#dfe3eb]">{row.title}</td><td className="px-4 py-4">{row.type ?? "Unknown"}</td><td className="px-4 py-4">{row.episodes ?? "—"}</td><td className="px-4 py-4"><span className="rounded-full bg-[#202a4c] px-2 py-1 text-[9px] font-bold text-[#9cafff]">{row.status?.replaceAll("_", " ") ?? "Unknown"}</span></td><td className="px-5 py-4">{formatDate(row.updated_at ?? row.created_at)}</td></tr>)}</tbody></table>{rows.length === 0 ? <p className="px-5 py-12 text-center text-xs text-[#7f899d]">No content records found.</p> : null}</div></section>;
}

function ContentPanel() {
  return <ContentManager />;
}

function MemberPanel({ data }: { data: DashboardResponse | null }) {
  if (!data) return <EmptyData />;
  return <><section className="grid gap-4 sm:grid-cols-3"><Metric icon="verified_user" label="Enabled members" value={formatNumber(data.summary.enabledMembers)} detail="Active D1 member accounts" tone="bg-[#15352c] text-[#70d5ad]" /><Metric icon="hourglass_top" label="Pending members" value={formatNumber(data.summary.pendingMembers)} detail="Awaiting activation" tone="bg-[#3a2d19] text-[#efbd68]" /><Metric icon="person_add" label="30 day change" value={`${data.summary.changes.members > 0 ? "+" : ""}${data.summary.changes.members}%`} detail="New members vs prior period" tone="bg-[#202a4c] text-[#9cafff]" /></section><MemberList /></>;
}

function ActivityList({ data, compact = false }: { data: DashboardResponse; compact?: boolean }) {
  const events = compact ? data.activities.slice(0, 5) : data.activities;
  return <section className="rounded-2xl border border-[#292e3c] bg-[#151923] p-5"><div><h2 className="text-sm font-bold text-[#eef1f6]">Activity log</h2><p className="mt-1 text-[10px] text-[#7f899d]">Recorded administrator and system events</p></div><div className="mt-4 divide-y divide-[#252a37]">{events.map((event, index) => <article key={`${event.created_at}-${index}`} className="flex gap-3 py-4 first:pt-1"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#202a4c] text-[#9cafff]"><MaterialIcon className="text-[18px]" name="event_note" /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-[#dfe3eb]">{event.summary}</p><p className="mt-1 text-[9px] capitalize text-[#778196]">{event.event_type.replaceAll("_", " ")}</p></div><time className="text-[9px] text-[#697386]">{formatDate(event.created_at)}</time></article>)}{events.length === 0 ? <p className="py-10 text-center text-xs text-[#7f899d]">No activity has been recorded yet.</p> : null}</div></section>;
}

function SettingsPanel({ appearance, initialProfile, onAppearanceChange }: { appearance: AdminAppearance; initialProfile: Profile | null; onAppearanceChange: (appearance: AdminAppearance) => void }) {
  return <div className="space-y-5"><AccountSettings initialProfile={initialProfile} /><AdminAppearanceSettings appearance={appearance} onChange={onAppearanceChange} /></div>;
}

function RetainedPanel({ active, children }: { active: boolean; children: ReactNode }) {
  return <section hidden={!active} aria-hidden={!active} inert={!active ? true : undefined}>{children}</section>;
}

export function AdminDashboard({ activeTab: initialTab, data: initialData, initialAppearance, initialProfile }: { activeTab: AdminTab; data: DashboardResponse | null; initialAppearance: AdminAppearance; initialProfile: Profile | null }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [data, setData] = useState(initialData);
  const [appearance, setAppearance] = useState(initialAppearance);
  const [visitedTabs, setVisitedTabs] = useState<ReadonlySet<AdminTab>>(() => new Set([initialTab]));

  useEffect(() => {
    if (data || !tabNeedsDashboardData(activeTab)) return;

    const controller = new AbortController();
    fetch("/api/dashboard", { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (result) setData(result);
      })
      .catch((cause) => {
        if (cause instanceof Error && cause.name !== "AbortError") console.error(cause);
      });
    return () => controller.abort();
  }, [activeTab, data]);

  useEffect(() => {
    const handlePopState = () => {
      const tab = resolveAdminTab(new URLSearchParams(window.location.search).get("tab"));
      setActiveTab(tab);
      setVisitedTabs((visited) => addVisitedTab(visited, tab));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function navigate(event: MouseEvent<HTMLAnchorElement>, tab: AdminTab) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    window.history.pushState(null, "", `/admin?tab=${tab}`);
    setActiveTab(tab);
    setVisitedTabs((visited) => addVisitedTab(visited, tab));
  }

  const title = navigation.find((item) => item.id === activeTab)?.label ?? "Overview";
  const pageTitle = activeTab === "setting" ? "Settings" : title;
  const pageDescription = activeTab === "setting" ? "Manage and configure your RioAnime platform settings." : "Manage and monitor the RioAnime platform.";
  return <main className="admin-shell min-h-screen" data-admin-font-size={appearance.fontSize} data-admin-font-family={appearance.fontFamily} data-admin-theme={appearance.theme} data-admin-accent={appearance.accent}><Sidebar activeTab={activeTab} onNavigate={navigate} /><div className="min-h-screen lg:pl-[248px]"><Header activeTab={activeTab} onNavigate={navigate} /><div className="mx-auto max-w-[1540px] px-4 py-6 sm:px-7 lg:px-8 lg:py-8"><section className="mb-6"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--admin-accent-text)]">Administration</p><h1 className="mt-1 text-[25px] font-bold tracking-[-0.035em] text-[#f5f7fb] sm:text-[29px]">{pageTitle}</h1><p className="mt-1.5 text-[12px] text-[#8f99ac]">{pageDescription}</p></section>{visitedTabs.has("overview") ? <RetainedPanel active={activeTab === "overview"}><Overview data={data} /></RetainedPanel> : null}{visitedTabs.has("content") ? <RetainedPanel active={activeTab === "content"}><ContentPanel /></RetainedPanel> : null}{visitedTabs.has("member") ? <RetainedPanel active={activeTab === "member"}><MemberPanel data={data} /></RetainedPanel> : null}{visitedTabs.has("api") ? <RetainedPanel active={activeTab === "api"}><ApiKeyManager /></RetainedPanel> : null}{visitedTabs.has("status") ? <RetainedPanel active={activeTab === "status"}><StatusManager /></RetainedPanel> : null}{visitedTabs.has("activity") ? <RetainedPanel active={activeTab === "activity"}>{data ? <ActivityList data={data} /> : <EmptyData />}</RetainedPanel> : null}{visitedTabs.has("setting") ? <RetainedPanel active={activeTab === "setting"}><SettingsPanel appearance={appearance} initialProfile={initialProfile} onAppearanceChange={setAppearance} /></RetainedPanel> : null}<footer className="mt-8 flex flex-col gap-2 border-t border-[#252a37] pt-5 text-[9px] text-[#697386] sm:flex-row sm:justify-between"><p>© 2026 RioAnime. Administration console.</p><p>D1 connected · Development environment</p></footer></div></div></main>;
}

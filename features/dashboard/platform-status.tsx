"use client";

import type { DashboardResponse } from "@/entities/anime/api/catalog";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const tooltipStyle = { background: "#111722", border: "1px solid #303747", borderRadius: 10, color: "#eef1f6", fontSize: 11 };

function StatusPill({ label, value }: { label: string; value: string }) {
  const operational = value === "operational";
  return <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">{label}</p><p className={`mt-2 flex items-center gap-2 text-sm font-semibold capitalize ${operational ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{operational ? "Operational" : value}</p></div>;
}

export function PlatformStatus({ data }: { data: DashboardResponse | null }) {
  const metrics = data?.routeMetrics ?? [];
  const chartData = metrics.map((metric) => ({ ...metric, label: metric.route.replace(/^\/v1\//, "") }));
  const totalRequests = metrics.reduce((sum, metric) => sum + metric.requests, 0);
  const totalErrors = metrics.reduce((sum, metric) => sum + metric.errors, 0);
  const peak = metrics.reduce((max, metric) => Math.max(max, metric.max_duration_ms), 0);

  return <section className="admin-card overflow-hidden p-5 sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon name="monitoring" /></span><div><p className="admin-eyebrow">Infrastructure overview</p><h2 className="mt-1 text-sm font-bold text-[var(--admin-text)]">Platform status</h2><p className="admin-support mt-0.5">Live API health and route activity</p></div></div><div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-right"><p className="text-[9px] uppercase tracking-[0.1em] text-[var(--admin-subtle)]">Database query</p><p className="mt-1 text-sm font-bold text-[var(--admin-accent-text)]">{data?.health.queryDurationMs ?? "—"}{data ? "ms" : ""}</p></div></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><StatusPill label="API status" value={data?.health.api ?? "unavailable"} /><StatusPill label="Database status" value={data?.health.database ?? "unavailable"} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]"><div className="min-w-0 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-[var(--admin-text)]">Route traffic</p><p className="mt-1 text-[10px] text-[var(--admin-subtle)]">Requests and errors by endpoint · last 24 hours</p></div><span className="text-[10px] text-[var(--admin-subtle)]">{metrics.length} routes</span></div><div className="mt-4 h-[250px]">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 42 }}><CartesianGrid stroke="#252b38" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" angle={-35} textAnchor="end" interval={0} height={58} tick={{ fill: "#8792a6", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={{ fill: "#697386", fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(89,111,229,0.08)" }} /><Bar dataKey="requests" name="Requests" fill="#7188f5" radius={[4, 4, 0, 0]} /><Bar dataKey="errors" name="Errors" fill="#f27f8d" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-xs text-[var(--admin-subtle)]">No route metrics available</div>}</div></div><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1"><div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">Requests / 24h</p><p className="mt-1 text-2xl font-bold text-[var(--admin-text)]">{totalRequests.toLocaleString()}</p></div><div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">Errors / 24h</p><p className="mt-1 text-2xl font-bold text-[#ff9ca8]">{totalErrors.toLocaleString()}</p></div><div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">Peak response</p><p className="mt-1 text-2xl font-bold text-[var(--admin-accent-text)]">{peak ? `${peak}ms` : "—"}</p></div></div></div>
    <div className="mt-5 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)]"><div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3"><p className="text-xs font-semibold text-[var(--admin-text)]">Tracked routes</p><span className="text-[10px] text-[var(--admin-subtle)]">{metrics.length} configured</span></div><div className="grid gap-px bg-[var(--admin-border)] sm:grid-cols-2">{metrics.map((metric, index) => <div key={metric.route} className="flex items-center justify-between gap-3 bg-[var(--admin-surface)] px-4 py-3"><span className="flex min-w-0 items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${index % 2 ? "bg-[var(--admin-success)]" : "bg-[var(--admin-accent)]"}`} /><code className="truncate text-[10px] text-[var(--admin-accent-text)]">{metric.route}</code></span><span className="shrink-0 text-[9px] text-[var(--admin-subtle)]">{metric.requests} req · {metric.errors} err</span></div>)}</div></div>
  </section>;
}

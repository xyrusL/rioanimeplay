"use client";

import { useEffect, useState } from "react";
import type { DashboardResponse } from "@/entities/anime/api/catalog";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Range = "24h" | "7d" | "30d";
type RouteMetric = DashboardResponse["routeMetrics"][number];
type RangeData = { range: Range; metrics: RouteMetric[]; peak: number };

const tooltipStyle = { background: "#111722", border: "1px solid #303747", borderRadius: 10, color: "#eef1f6", fontSize: 11 };
const routeColors = ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767", "#256abf", "#b94a20", "#12845c", "#a86f00", "#ad3d67"];
const ranges: Array<{ value: Range; label: string; period: string }> = [
  { value: "24h", label: "Today", period: "last 24 hours" },
  { value: "7d", label: "7 days", period: "last 7 days" },
  { value: "30d", label: "30 days", period: "last 30 days" }
];

function StatusPill({ label, value }: { label: string; value: string }) {
  const operational = value === "operational";
  return <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">{label}</p><p className={`mt-2 flex items-center gap-2 text-sm font-semibold capitalize ${operational ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{operational ? "Operational" : value}</p></div>;
}

function successRate(requests: number, errors: number) {
  return requests ? Math.max(0, Math.round(((requests - errors) / requests) * 1000) / 10) : null;
}

export function PlatformStatus({ data }: { data: DashboardResponse | null }) {
  const [range, setRange] = useState<Range>("24h");
  const [rangeData, setRangeData] = useState<RangeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (range === "24h") {
      setRangeData(null);
      setError("");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/dashboard/analytics?range=${range}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error?.message ?? "Route metrics could not be loaded");
        const fetched = new Map<string, { route: string; requests: number; errors: number; averageResponseMs: number | null }>(result.routes.map((metric: { route: string; requests: number; errors: number; averageResponseMs: number | null }) => [metric.route, metric]));
        const metrics = (data?.routeMetrics ?? []).map((metric) => {
          const current = fetched.get(metric.route);
          return current ? { ...metric, requests: current.requests, errors: current.errors, duration_ms: (current.averageResponseMs ?? 0) * current.requests } : { ...metric, requests: 0, errors: 0, duration_ms: 0, max_duration_ms: 0 };
        });
        setRangeData({ range, metrics, peak: result.summary.maxResponseMs ?? 0 });
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [data?.routeMetrics, range]);

  const defaultMetrics = data?.routeMetrics ?? [];
  const metrics = rangeData?.range === range ? rangeData.metrics : defaultMetrics;
  const period = ranges.find((item) => item.value === range)?.period ?? "last 24 hours";
  const chartData = metrics.map((metric) => {
    const rate = successRate(metric.requests, metric.errors);
    return { ...metric, label: metric.route.replace(/^\/v1\//, ""), successRate: rate, successLabel: rate === null ? "No data" : `${rate}%` };
  });
  const totalRequests = metrics.reduce((sum, metric) => sum + metric.requests, 0);
  const totalErrors = metrics.reduce((sum, metric) => sum + metric.errors, 0);
  const overallSuccess = successRate(totalRequests, totalErrors);
  const peak = rangeData?.range === range ? rangeData.peak : metrics.reduce((max, metric) => Math.max(max, metric.max_duration_ms), 0);

  return <section className={`admin-card overflow-hidden p-5 sm:p-6 ${loading ? "opacity-70" : ""}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon name="monitoring" /></span><div><p className="admin-eyebrow">Infrastructure overview</p><h2 className="mt-1 text-sm font-bold text-[var(--admin-text)]">Platform status</h2><p className="admin-support mt-0.5">Live API health and route activity</p></div></div><div className="flex flex-wrap items-center gap-2"><div className="flex rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] p-1">{ranges.map((item) => <button key={item.value} type="button" onClick={() => setRange(item.value)} className={`rounded-md px-3 py-1.5 text-[9px] font-bold transition-colors ${range === item.value ? "bg-[var(--admin-accent)] text-white" : "text-[var(--admin-muted)] hover:text-[var(--admin-text)]"}`}>{item.label}</button>)}</div><div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-right"><p className="text-[9px] uppercase tracking-[0.1em] text-[var(--admin-subtle)]">Database query</p><p className="mt-1 text-sm font-bold text-[var(--admin-accent-text)]">{data?.health.queryDurationMs ?? "—"}{data ? "ms" : ""}</p></div></div></div>
    {error ? <div className="mt-4 rounded-lg border border-[#63363c] bg-[#2b191d] px-3 py-2 text-[10px] text-[#ff9ca8]">{error}</div> : null}
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><StatusPill label="API status" value={data?.health.api ?? "unavailable"} /><StatusPill label="Database status" value={data?.health.database ?? "unavailable"} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
      <div className="min-w-0 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-[var(--admin-text)]">Route success rate</p><p className="mt-1 text-[10px] text-[var(--admin-subtle)]">Successful requests by endpoint · {period}</p></div><span className="text-[10px] text-[var(--admin-subtle)]">{metrics.length} routes</span></div><div className="mt-4 h-[250px]">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 24, right: 8, left: -10, bottom: 42 }}><CartesianGrid stroke="#252b38" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" angle={-35} textAnchor="end" interval={0} height={58} tick={{ fill: "#8792a6", fontSize: 9 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(value) => `${value}%`} tick={{ fill: "#697386", fontSize: 9 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(89,111,229,0.08)" }} formatter={(value, name, entry) => name === "Success" ? [`${value}% (${entry.payload.requests - entry.payload.errors}/${entry.payload.requests})`, "Success"] : [value, name]} /><Bar dataKey="successRate" name="Success" radius={[4, 4, 0, 0]}>{chartData.map((metric, index) => <Cell key={metric.route} fill={routeColors[index]} />)}<LabelList dataKey="successLabel" position="top" fill="#aeb8c9" fontSize={9} /></Bar></BarChart></ResponsiveContainer> : <div className="grid h-full place-items-center text-xs text-[var(--admin-subtle)]">No route metrics available</div>}</div></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">Success rate</p><p className={`mt-1 text-2xl font-bold ${overallSuccess === null ? "text-[var(--admin-subtle)]" : overallSuccess >= 99 ? "text-[var(--admin-success)]" : "text-[#efbd68]"}`}>{overallSuccess === null ? "No data" : `${overallSuccess}%`}</p></div><div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">Requests · {period}</p><p className="mt-1 text-2xl font-bold text-[var(--admin-text)]">{totalRequests.toLocaleString()}</p></div><div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">Errors · {period}</p><p className="mt-1 text-2xl font-bold text-[#ff9ca8]">{totalErrors.toLocaleString()}</p></div><div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4"><p className="text-[10px] text-[var(--admin-muted)]">Peak response</p><p className="mt-1 text-2xl font-bold text-[var(--admin-accent-text)]">{peak ? `${peak}ms` : "—"}</p></div></div>
    </div>
    <div className="mt-5 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)]"><div className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3"><p className="text-xs font-semibold text-[var(--admin-text)]">Tracked routes</p><span className="text-[10px] text-[var(--admin-subtle)]">{metrics.length} configured</span></div><div className="grid gap-px bg-[var(--admin-border)] sm:grid-cols-2">{metrics.map((metric) => { const rate = successRate(metric.requests, metric.errors); return <div key={metric.route} className="flex items-center justify-between gap-3 bg-[var(--admin-surface)] px-4 py-3"><span className="flex min-w-0 items-center gap-2"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${rate === null ? "bg-[var(--admin-subtle)]" : rate >= 99 ? "bg-[var(--admin-success)]" : "bg-[var(--admin-danger)]"}`} /><code className="truncate text-[10px] text-[var(--admin-accent-text)]">{metric.route}</code></span><span className="shrink-0 text-[9px] text-[var(--admin-subtle)]">{metric.requests} req · {metric.errors} err · <strong className="text-[var(--admin-text)]">{rate === null ? "No data" : `${rate}%`}</strong></span></div>; })}</div></div>
  </section>;
}

"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  LabelList,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type Range = "24h" | "7d" | "30d";

type Analytics = {
  range: Range;
  generatedAt: string;
  summary: {
    requests: number;
    errors: number;
    errorRate: number;
    averageResponseMs: number | null;
    maxResponseMs: number | null;
    responseBytes: number;
    postsCreated: number;
    newViewers: number;
    activeViewers: number;
    reactions: number;
    anime: number;
    published: number;
    drafts: number;
    episodes: number;
    members: number;
    activeApiKeys: number;
    lifetimeViews: number;
    lifetimeReactions: number;
  };
  series: Array<{
    timestamp: string;
    requests: number;
    errors: number;
    responseBytes: number;
    posts: number;
    newViewers: number;
    activeViewers: number;
    reactions: number;
  }>;
  routes: Array<{ route: string; requests: number; errors: number; averageResponseMs: number | null }>;
  topPosts: Array<{ animeId: string; urlSlug: string; title: string; views: number; reactions: number }>;
  formats: Array<{ name: string; value: number }>;
};

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const pieColors = ["#7188f5", "#62d1a6", "#efb35f", "#bd84e5", "#f27f8d", "#65b7eb", "#a5b0c2", "#d4d9e2"];
const tooltipStyle = { background: "#111620", border: "1px solid #303747", borderRadius: 12, fontSize: 11, color: "#e8ebf2" };

function bytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`;
  return `${(value / 1024 ** 3).toFixed(2)} GB`;
}

function label(timestamp: string, range: Range) {
  const value = new Date(timestamp);
  return range === "24h"
    ? new Intl.DateTimeFormat("en", { hour: "numeric" }).format(value)
    : new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(value);
}

function MiniBars({ values, color, secondary, secondaryColor = "#f27f8d" }: { values: number[]; color: string; secondary?: number[]; secondaryColor?: string }) {
  const visible = values.slice(-16);
  const secondaryVisible = secondary?.slice(-16) ?? [];
  const chart = visible.map((value, index) => ({ index, value, secondary: secondaryVisible[index] ?? 0 }));
  return <div><div className="h-10" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} barGap={1} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}><Bar dataKey="value" fill={color} background={{ fill: "#202633", radius: 2 }} radius={[2, 2, 0, 0]} animationDuration={650} />{secondary ? <Bar dataKey="secondary" fill={secondaryColor} radius={[2, 2, 0, 0]} animationDuration={650} /> : null}</BarChart></ResponsiveContainer></div><div className="mt-1.5 flex gap-3 text-[7px] font-semibold uppercase tracking-[0.07em]"><span style={{ color }}><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />Requests</span>{secondary ? <span style={{ color: secondaryColor }}><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />Errors</span> : null}</div></div>;
}

function MiniArea({ values, color, label: chartLabel }: { values: number[]; color: string; label: string }) {
  const chart = values.slice(-16).map((value, index) => ({ index, value }));
  const hasData = chart.some((point) => point.value > 0);
  const gradientId = `mini-${chartLabel.toLowerCase().replaceAll(" ", "-")}`;
  return <div className="relative h-[52px]" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chart} margin={{ top: 3, right: 1, bottom: 1, left: 1 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.42} /><stop offset="100%" stopColor={color} stopOpacity={0.03} /></linearGradient></defs><YAxis hide domain={[0, hasData ? "auto" : 1]} /><CartesianGrid stroke="#252b38" strokeDasharray="3 4" vertical={false} /><Area type="monotone" dataKey="value" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} animationDuration={700} /></AreaChart></ResponsiveContainer>{!hasData ? <span className="absolute inset-0 grid place-items-center text-[7px] font-semibold uppercase tracking-[0.08em] text-[#566176]">No activity in this period</span> : <span className="absolute bottom-0 right-0 text-[7px] font-semibold uppercase tracking-[0.08em]" style={{ color }}>{chartLabel} trend</span>}</div>;
}

function Gauge({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return <div className="flex items-center gap-3"><div className="relative h-11 w-11 shrink-0"><ResponsiveContainer width="100%" height="100%"><RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: percentage, fill: color }]} startAngle={90} endAngle={-270}><RadialBar dataKey="value" background={{ fill: "#252b38" }} cornerRadius={8} animationDuration={750} /></RadialBarChart></ResponsiveContainer><span className="absolute inset-0 grid place-items-center text-[8px] font-bold text-[#eef1f6]">{Math.round(percentage)}%</span></div><div><p className="text-[7px] font-semibold uppercase leading-3 tracking-[0.08em] text-[#78839a]">{label}</p><p className="mt-1 text-[8px] font-semibold" style={{ color }}>{percentage >= 90 ? "Healthy" : percentage >= 70 ? "Monitor" : "Needs attention"}</p></div></div>;
}

function PublishingMix({ published, drafts }: { published: number; drafts: number }) {
  const chart = published || drafts ? [{ name: "Live", value: published }, { name: "Drafts", value: drafts }] : [{ name: "Empty", value: 1 }];
  return <div className="flex items-center gap-3"><div className="h-11 w-11 shrink-0"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chart} dataKey="value" innerRadius="58%" outerRadius="100%" paddingAngle={published && drafts ? 4 : 0} animationDuration={750}>{chart.map((entry) => <Cell key={entry.name} fill={entry.name === "Live" ? "#62d1a6" : entry.name === "Drafts" ? "#efb35f" : "#252b38"} />)}</Pie></PieChart></ResponsiveContainer></div><div className="space-y-1.5 text-[7px] font-semibold uppercase tracking-[0.06em]"><p className="text-[#62d1a6]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />{published} live</p><p className="text-[#efb35f]"><span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />{drafts} drafts</p></div></div>;
}

function ComparisonBars({ primary, secondary }: { primary: { label: string; value: number; color: string }; secondary: { label: string; value: number; color: string } }) {
  const chart = [{ ...primary, fill: primary.color }, { ...secondary, fill: secondary.color }];
  return <div className="h-[52px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} layout="vertical" margin={{ top: 0, right: 28, bottom: 0, left: 0 }}><XAxis type="number" hide /><YAxis type="category" dataKey="label" width={42} axisLine={false} tickLine={false} tick={{ fill: "#78839a", fontSize: 7, fontWeight: 600 }} /><Bar dataKey="value" background={{ fill: "#202633", radius: 3 }} radius={[0, 3, 3, 0]} animationDuration={700}>{chart.map((entry) => <Cell key={entry.label} fill={entry.fill} />)}<LabelList dataKey="value" position="right" fill="#aab3c3" fontSize={7} formatter={(value: unknown) => compact.format(Number(value))} /></Bar></BarChart></ResponsiveContainer></div>;
}

function Card({ icon, label, value, detail, tone, visual }: { icon: string; label: string; value: string; detail: string; tone: string; visual: React.ReactNode }) {
  return (
    <article className="flex min-h-[190px] flex-col rounded-2xl border border-[#292e3c] bg-[#151923] p-4 shadow-[0_14px_35px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}><MaterialIcon className="text-[16px]" filled name={icon} /></span>
        <span className="text-[23px] font-bold tracking-[-0.035em] text-[#f5f7fb]">{value}</span>
      </div>
      <p className="mt-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7f899d]">{label}</p>
      <p className="mt-1.5 text-[8px] text-[#778196]">{detail}</p>
      <div className="mt-auto rounded-lg border border-[#252b38] bg-[#10141d] px-2.5 py-2">{visual}</div>
    </article>
  );
}

function Panel({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#292e3c] bg-[#151923] p-5">
      <div><h2 className="text-sm font-bold text-[#eef1f6]">{title}</h2><p className="mt-1 text-[10px] text-[#778196]">{detail}</p></div>
      <div className="mt-5 h-[280px]">{children}</div>
    </section>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <div className="grid h-full place-items-center rounded-xl border border-dashed border-[#303747] bg-[#11151e]"><div className="text-center"><MaterialIcon className="text-[26px] text-[#505b70]" name="monitoring" /><p className="mt-2 text-[10px] text-[#717c90]">{message}</p></div></div>;
}

export function OverviewAnalytics() {
  const [range, setRange] = useState<Range>("30d");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/dashboard/analytics?range=${range}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error?.message ?? "Analytics could not be loaded");
        setData(result);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [range, refresh]);

  if (!data && loading) {
    return <div className="grid min-h-[420px] place-items-center rounded-2xl border border-[#292e3c] bg-[#151923] text-xs text-[#7f899d]">Loading live analytics...</div>;
  }
  if (!data) {
    return <div className="rounded-2xl border border-[#63363c] bg-[#2b191d] px-5 py-12 text-center text-xs text-[#ff9ca8]">{error || "Analytics are unavailable"}</div>;
  }

  const chartData = data.series.map((point) => ({ ...point, label: label(point.timestamp, range), bandwidthMb: Number((point.responseBytes / 1024 ** 2).toFixed(3)) }));
  const hasAudience = chartData.some((point) => point.posts || point.activeViewers || point.reactions);
  const hasEngagement = data.topPosts.some((post) => post.views || post.reactions);
  const periodLabel = range === "24h" ? "Last 24 hours" : range === "7d" ? "Last 7 days" : "Last 30 days";

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#7180a0]">Live D1 analytics</p><p className="mt-1 text-[10px] text-[#697386]">Updated {new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date(data.generatedAt))}</p></div>
        <div className="flex items-center gap-2"><button type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)} className="flex h-10 items-center gap-2 rounded-xl border border-[#303747] px-3 text-[10px] font-bold text-[#aab3c3] disabled:opacity-50"><MaterialIcon className="text-[16px]" name="refresh" />{loading ? "Refreshing..." : "Refresh"}</button><div className="flex w-fit rounded-xl border border-[#303747] bg-[#11151e] p-1">{(["24h", "7d", "30d"] as Range[]).map((value) => <button key={value} onClick={() => setRange(value)} className={`rounded-lg px-3 py-2 text-[10px] font-bold transition-colors ${range === value ? "bg-[#596fe5] text-white" : "text-[#7f899d] hover:text-[#dce1e9]"}`} type="button">{value === "24h" ? "24 hours" : value === "7d" ? "7 days" : "30 days"}</button>)}</div></div>
      </div>
      {error ? <div className="mb-4 rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-[10px] text-[#ff9ca8]">{error}</div> : null}
      <section className={`grid gap-3 sm:grid-cols-2 xl:grid-cols-4 ${loading ? "opacity-60" : ""}`}>
        <Card icon="data_object" label="API requests" value={compact.format(data.summary.requests)} detail={`${periodLabel} · ${data.summary.errors} errors`} tone="bg-[#202a4c] text-[#9cafff]" visual={<MiniBars values={chartData.map((point) => point.requests)} secondary={chartData.map((point) => point.errors)} color="#7188f5" />} />
        <Card icon="speed" label="Response speed" value={data.summary.averageResponseMs === null ? "—" : `${data.summary.averageResponseMs}ms`} detail={`${data.summary.errorRate}% error · ${data.summary.maxResponseMs ?? 0}ms peak`} tone="bg-[#30233e] text-[#c99bf2]" visual={<Gauge value={data.summary.averageResponseMs ?? 0} max={data.summary.maxResponseMs ?? 0} color="#bd84e5" label="Average vs peak latency" />} />
        <Card icon="visibility" label="Views" value={compact.format(data.summary.lifetimeViews)} detail={`${compact.format(data.summary.activeViewers)} viewer-title records · ${periodLabel}`} tone="bg-[#15352c] text-[#70d5ad]" visual={<MiniArea values={chartData.map((point) => point.activeViewers)} color="#62d1a6" label="Viewer" />} />
        <Card icon="movie" label="Anime posts" value={compact.format(data.summary.anime)} detail={`${data.summary.postsCreated} new in ${periodLabel.toLowerCase()}`} tone="bg-[#3a2d19] text-[#efbd68]" visual={<PublishingMix published={data.summary.published} drafts={data.summary.drafts} />} />
        <Card icon="thumb_up" label="Reactions" value={compact.format(data.summary.reactions)} detail={`${compact.format(data.summary.lifetimeReactions)} current lifetime records`} tone="bg-[#342027] text-[#ff9ca8]" visual={<MiniArea values={chartData.map((point) => point.reactions)} color="#f27f8d" label="Reaction" />} />
        <Card icon="vpn_key" label="Active API keys" value={compact.format(data.summary.activeApiKeys)} detail={`${bytes(data.summary.responseBytes)} transferred in period`} tone="bg-[#173343] text-[#72c6eb]" visual={<Gauge value={100 - data.summary.errorRate} max={100} color="#65b7eb" label="Request success rate" />} />
        <Card icon="play_circle" label="Episodes" value={compact.format(data.summary.episodes)} detail="Available D1 episode records" tone="bg-[#26331a] text-[#a6cf75]" visual={<ComparisonBars primary={{ label: "Episodes", value: data.summary.episodes, color: "#a6cf75" }} secondary={{ label: "Titles", value: data.summary.anime, color: "#efb35f" }} />} />
        <Card icon="group" label="Members" value={compact.format(data.summary.members)} detail={`${compact.format(data.summary.newViewers)} new viewer-title records`} tone="bg-[#332a1c] text-[#dfba79]" visual={<MiniArea values={chartData.map((point) => point.newViewers)} color="#dfba79" label="Member" />} />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <Panel title="Request traffic" detail={`Successful and failed API calls · ${periodLabel}`}>
          <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ left: -20, right: 4, top: 8, bottom: 0 }}><defs><linearGradient id="requestFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7188f5" stopOpacity={0.42} /><stop offset="100%" stopColor="#7188f5" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#252b38" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" stroke="#5f6a7e" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={24} /><YAxis stroke="#5f6a7e" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 10 }} /><Area type="monotone" dataKey="requests" name="Requests" stroke="#7188f5" strokeWidth={2} fill="url(#requestFill)" /><Area type="monotone" dataKey="errors" name="Errors" stroke="#f27f8d" strokeWidth={2} fill="transparent" /></AreaChart></ResponsiveContainer>
        </Panel>
        <Panel title="Content formats" detail={`${data.summary.anime} active anime posts`}>
          {data.formats.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data.formats} dataKey="value" nameKey="name" innerRadius="48%" outerRadius="78%" paddingAngle={3}>{data.formats.map((entry, index) => <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />)}</Pie><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 9 }} /></PieChart></ResponsiveContainer> : <EmptyChart message="No content format data" />}
        </Panel>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel title="Audience and publishing" detail="New posts, active viewer-title records, and current reactions">
          {hasAudience ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ left: -20, right: 4 }}><CartesianGrid stroke="#252b38" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" stroke="#5f6a7e" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={22} /><YAxis stroke="#5f6a7e" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 10 }} /><Bar dataKey="posts" name="Posts" fill="#efb35f" radius={[4, 4, 0, 0]} /><Bar dataKey="activeViewers" name="Viewer records" fill="#62d1a6" radius={[4, 4, 0, 0]} /><Bar dataKey="reactions" name="Reactions" fill="#bd84e5" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyChart message="No views, reactions, or new posts recorded in this period" />}
        </Panel>
        <Panel title="API bandwidth" detail={`${bytes(data.summary.responseBytes)} response data transferred`}>
          {data.summary.responseBytes ? <ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ left: -15, right: 4 }}><defs><linearGradient id="bandwidthFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#65b7eb" stopOpacity={0.38} /><stop offset="100%" stopColor="#65b7eb" stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="#252b38" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" stroke="#5f6a7e" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} minTickGap={22} /><YAxis stroke="#5f6a7e" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}MB`} /><Tooltip contentStyle={tooltipStyle} formatter={(value) => [`${value} MB`, "Bandwidth"]} /><Area type="monotone" dataKey="bandwidthMb" stroke="#65b7eb" strokeWidth={2} fill="url(#bandwidthFill)" /></AreaChart></ResponsiveContainer> : <EmptyChart message="No response bandwidth recorded in this period" />}
        </Panel>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-2xl border border-[#292e3c] bg-[#151923]"><div className="border-b border-[#292e3c] px-5 py-4"><h2 className="text-sm font-bold text-[#eef1f6]">API route performance</h2><p className="mt-1 text-[10px] text-[#778196]">Requests, failures, and weighted response speed</p></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left"><thead className="bg-[#121620] text-[9px] uppercase tracking-[0.08em] text-[#697386]"><tr><th className="px-5 py-3">Route</th><th className="px-4 py-3">Requests</th><th className="px-4 py-3">Errors</th><th className="px-5 py-3">Avg. speed</th></tr></thead><tbody className="divide-y divide-[#252a37]">{data.routes.map((route) => <tr key={route.route} className="text-[10px] text-[#9aa4b6]"><td className="px-5 py-3.5 font-mono text-[#cbd1dc]">{route.route}</td><td className="px-4 py-3.5 font-semibold">{compact.format(route.requests)}</td><td className="px-4 py-3.5 text-[#ef8c98]">{compact.format(route.errors)}</td><td className="px-5 py-3.5">{route.averageResponseMs === null ? "—" : `${route.averageResponseMs}ms`}</td></tr>)}</tbody></table>{data.routes.length === 0 ? <p className="py-12 text-center text-[10px] text-[#697386]">No API routes recorded in this period.</p> : null}</div></section>
        <section className="rounded-2xl border border-[#292e3c] bg-[#151923] p-5"><h2 className="text-sm font-bold text-[#eef1f6]">Top anime engagement</h2><p className="mt-1 text-[10px] text-[#778196]">Lifetime view and reaction records</p>{hasEngagement ? <div className="mt-4 divide-y divide-[#252a37]">{data.topPosts.map((post, index) => <a key={post.animeId} href={`/watch/${encodeURIComponent(post.urlSlug)}`} className="flex items-center gap-3 py-3.5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#202a4c] text-[10px] font-bold text-[#9cafff]">{index + 1}</span><span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-[#dfe3eb]">{post.title}</span><span className="text-right text-[9px] text-[#7f899d]">{compact.format(post.views)} views<br />{compact.format(post.reactions)} reactions</span></a>)}</div> : <div className="mt-5 h-[235px]"><EmptyChart message="View and reaction tracking has no records yet" /></div>}</section>
      </section>
    </>
  );
}

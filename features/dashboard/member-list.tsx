"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type Member = {
  id: string;
  email: string;
  username: string;
  role: "member" | "admin";
  membershipTier: "member" | "paid";
  accountType: "member" | "paid" | "admin";
  status: "active" | "disabled" | "pending";
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  animeWatched: number;
};

type MembersResponse = {
  members: Member[];
  pagination: { page: number; total: number; totalPages: number; hasMore: boolean };
};

type MemberDetail = {
  member: Member;
  activity: { animeWatched: number; watchActivity: number; bookmarks: number; firstWatchedAt: string | null; lastWatchedAt: string | null };
  watchedAnime: Array<{ animeId: string; title: string; type: string | null; watchActivity: number; firstWatchedAt: string; lastWatchedAt: string }>;
};

const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

function formatDate(value: string | null) {
  return value ? date.format(new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`)) : "Never";
}

function displayMemberName(username: string) {
  return username.replace(/_[a-f0-9]{8}$/i, "").replaceAll("_", " ");
}

function RoleBadge({ type }: { type: Member["accountType"] }) {
  const style = type === "admin" ? "bg-[#34234b] text-[#d4a7ff]" : type === "paid" ? "bg-[#3a2d19] text-[#efbd68]" : "bg-[#202a4c] text-[#9cafff]";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${style}`}><MaterialIcon className="text-[13px]" filled name={type === "admin" ? "admin_panel_settings" : type === "paid" ? "workspace_premium" : "person"} />{type}</span>;
}

function MemberDetails({ data, loading, error, onClose }: { data: MemberDetail | null; loading: boolean; error: string; onClose: () => void }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  const member = data?.member;
  const name = member ? displayMemberName(member.username) : "Member";
  const detail = (label: string, value: string) => <div className="rounded-xl border border-[#292f3e] bg-[#10141d] p-3"><dt className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#697386]">{label}</dt><dd className="mt-1.5 break-words text-[11px] font-semibold text-[#d9dee8]">{value}</dd></div>;

  return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="member-detail-title"><button type="button" aria-label="Close member details" className="absolute inset-0 cursor-default" onClick={onClose} /><section className="relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#303747] bg-[#151923] shadow-[0_32px_110px_rgba(0,0,0,.7)]"><header className="flex items-start justify-between border-b border-[#292e3c] bg-[#121620] px-5 py-4"><div><p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#78839a]">D1 account information</p><h2 id="member-detail-title" className="mt-1 text-lg font-bold capitalize text-[#f2f4f8]">{name}</h2>{member ? <p className="mt-0.5 text-[10px] text-[#7f899d]">{member.email}</p> : null}</div><button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-[#303647] text-[#9ba5b8]" aria-label="Close"><MaterialIcon name="close" /></button></header><div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{loading ? <div className="grid min-h-72 place-items-center text-xs text-[#7f899d]">Loading member details...</div> : error ? <div className="rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-xs text-[#ff9ca8]">{error}</div> : data && member ? <div className="space-y-6"><section><div className="flex flex-wrap items-center gap-2"><RoleBadge type={member.accountType} /><span className={`rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${member.status === "active" ? "bg-[#15352c] text-[#70d5ad]" : member.status === "pending" ? "bg-[#3a2d19] text-[#efbd68]" : "bg-[#342027] text-[#ff9ca8]"}`}>{member.status}</span><code className="text-[9px] text-[#657084]">{member.id}</code></div><dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{detail("Created", formatDate(member.createdAt))}{detail("Updated", formatDate(member.updatedAt))}{detail("Last login", formatDate(member.lastLoginAt))}{detail("Email", member.emailVerifiedAt ? "Verified" : "Not verified")}</dl></section><section><h3 className="text-sm font-bold text-[#eef1f6]">Viewing activity</h3><p className="mt-1 text-[10px] text-[#7f899d]">Anime titles watched, not individual episodes.</p><div className="mt-3 grid gap-3 sm:grid-cols-3">{[["Anime watched", data.activity.animeWatched, "movie"], ["Watch activity", data.activity.watchActivity, "history"], ["Bookmarks", data.activity.bookmarks, "bookmark"]].map(([label, value, icon]) => <article key={String(label)} className="rounded-xl border border-[#292f3e] bg-[#10141d] p-4"><MaterialIcon className="text-[18px] text-[#9cafff]" filled name={String(icon)} /><p className="mt-2 text-2xl font-bold text-[#f4f6fa]">{value}</p><p className="text-[9px] uppercase tracking-[0.08em] text-[#697386]">{label}</p></article>)}</div><dl className="mt-3 grid gap-3 sm:grid-cols-2">{detail("First watched", formatDate(data.activity.firstWatchedAt))}{detail("Last watched", formatDate(data.activity.lastWatchedAt))}</dl></section><section><h3 className="text-sm font-bold text-[#eef1f6]">Recently watched anime</h3><div className="mt-3 overflow-hidden rounded-xl border border-[#292f3e]">{data.watchedAnime.length ? <div className="divide-y divide-[#252a37]">{data.watchedAnime.map((anime) => <article key={anime.animeId} className="flex items-center gap-3 bg-[#10141d] px-4 py-3"><MaterialIcon className="text-[#9cafff]" name="play_circle" /><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#dfe3eb]">{anime.title}</p><p className="mt-0.5 text-[9px] text-[#697386]">{anime.type ?? "Anime"} · {formatDate(anime.lastWatchedAt)}</p></div><span className="text-[9px] text-[#78839a]">{anime.watchActivity} updates</span></article>)}</div> : <p className="bg-[#10141d] py-10 text-center text-xs text-[#7f899d]">No watched anime recorded yet.</p>}</div></section></div> : null}</div></section></div>;
}

export function MemberList() {
  const [data, setData] = useState<MembersResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/dashboard/members?page=${page}&limit=25`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error?.message ?? "Unable to load members");
        setData(result);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, refresh]);

  useEffect(() => {
    if (!selectedId) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailError("");
    setDetailLoading(true);
    fetch(`/api/dashboard/members?id=${encodeURIComponent(selectedId)}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result?.error?.message ?? "Unable to load member details");
        setDetail(result);
      })
      .catch((cause) => { if (cause.name !== "AbortError") setDetailError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [selectedId]);

  return (
    <><section className="mt-5 overflow-hidden rounded-2xl border border-[#292e3c] bg-[#151923]">
      <div className="flex items-center justify-between border-b border-[#292e3c] px-5 py-4">
        <div><h2 className="text-sm font-bold text-[#eef1f6]">Member directory</h2><p className="mt-1 text-[10px] text-[#7f899d]">{data ? `${data.pagination.total} D1 accounts` : "D1 account records"}</p></div>
        <button type="button" disabled={loading} onClick={() => setRefresh((value) => value + 1)} className="flex h-9 items-center gap-2 rounded-xl border border-[#303647] px-3 text-[10px] font-bold text-[#aab3c3] disabled:opacity-50"><MaterialIcon className="text-[16px]" name="refresh" />{loading ? "Refreshing..." : "Refresh"}</button>
      </div>
      {error ? <div className="m-5 rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-xs text-[#ff9ca8]">{error}</div> : null}
      {loading && !data ? <div className="grid place-items-center py-20 text-xs text-[#7f899d]">Loading members...</div> : null}
      {data ? <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[#121620] text-[9px] uppercase tracking-[0.08em] text-[#707a8e]"><tr><th className="px-5 py-3">Member</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Anime watched</th><th className="px-4 py-3">Created</th><th className="px-5 py-3 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-[#252a37]">{data.members.map((member) => { const name = displayMemberName(member.username); return <tr key={member.id} className="text-[11px] text-[#98a2b4]"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#202a4c] text-[10px] font-bold uppercase text-[#9cafff]">{name.slice(0, 2)}</span><div><p className="font-semibold capitalize text-[#e1e5ed]">{name}</p><p className="mt-0.5 font-mono text-[9px] text-[#657084]">{member.id}</p></div></div></td><td className="px-4 py-4"><RoleBadge type={member.accountType} /></td><td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${member.status === "active" ? "bg-[#15352c] text-[#70d5ad]" : member.status === "pending" ? "bg-[#3a2d19] text-[#efbd68]" : "bg-[#342027] text-[#ff9ca8]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{member.status}</span></td><td className="px-4 py-4"><p className="text-[#c9cfda]">{member.email}</p><p className="mt-1 text-[9px] text-[#697386]">{member.emailVerifiedAt ? "Verified" : "Not verified"}</p></td><td className="px-4 py-4 font-semibold text-[#d7dce6]">{member.animeWatched}</td><td className="px-4 py-4">{formatDate(member.createdAt)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => setSelectedId(member.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#303647] px-3 text-[10px] font-bold text-[#aeb8cb] hover:bg-[#1a1f2b] hover:text-white"><MaterialIcon className="text-[16px]" name="visibility" />View</button></td></tr>; })}</tbody>
          </table>
          {data.members.length === 0 ? <div className="py-16 text-center text-xs text-[#7f899d]">No member accounts found.</div> : null}
        </div>
        <div className="flex items-center justify-between border-t border-[#292e3c] px-5 py-4 text-[10px] text-[#7f899d]"><span>Page {data.pagination.page} of {data.pagination.totalPages}</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[#343a4a] px-3 py-2 font-semibold text-[#b0b8c7] disabled:opacity-30" type="button">Previous</button><button disabled={!data.pagination.hasMore} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#343a4a] px-3 py-2 font-semibold text-[#b0b8c7] disabled:opacity-30" type="button">Next</button></div></div>
      </> : null}
    </section>{selectedId ? <MemberDetails data={detail} loading={detailLoading} error={detailError} onClose={() => setSelectedId(null)} /> : null}</>
  );
}

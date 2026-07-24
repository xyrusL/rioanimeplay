"use client";

import { FormEvent, useDeferredValue, useEffect, useRef, useState } from "react";

import { FeaturedPostsModal } from "@/features/dashboard/featured-posts-modal";
import { normalizePostUrlSlug } from "@/shared/lib/post-url-slug.mjs";
import { CustomSelect } from "@/shared/ui/custom-select";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type ContentItem = {
  animeId: string;
  urlSlug: string;
  title: string;
  titleEnglish: string | null;
  titleNative: string | null;
  titleUserPreferred: string | null;
  synopsis: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  type: string | null;
  episodes: number | null;
  year: number | null;
  season: string | null;
  genres: string[];
  studio: string | null;
  sourceStatus: string | null;
  contentStatus: "published" | "draft";
  visibility: "public" | "private";
  isNsfw: boolean;
  views: number;
  postPath: string;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  deletedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
};

type ContentResponse = {
  items: ContentItem[];
  summary: { total: number; published: number; draft: number; private: number; nsfw: number; deleted: number; views: number };
  pagination: { page: number; total: number; totalPages: number; hasMore: boolean };
};

const filters = ["all", "published", "draft", "private", "nsfw", "deleted"] as const;
const contentStatusOptions = [
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" }
] as const;
const visibilityOptions = [
  { label: "Public", value: "public" },
  { label: "Private", value: "private" }
] as const;
const number = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

function formatDate(value: string | null) {
  if (!value) return "Never";
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  return date.format(new Date(normalized));
}

async function responseError(response: Response) {
  const result = await response.json().catch(() => null);
  return result?.error?.message ?? "The content request could not be completed";
}

function SummaryCard({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone: string }) {
  return <article className="rounded-2xl border border-[#292e3c] bg-[#151923] p-5"><span className={`grid h-9 w-9 place-items-center rounded-lg ${tone}`}><MaterialIcon className="text-[18px]" filled name={icon} /></span><p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#7f899d]">{label}</p><p className="mt-1 text-2xl font-bold text-[#f2f4f8]">{value}</p><p className="mt-1.5 text-[9px] text-[#697386]">{detail}</p></article>;
}

function Badge({ children, tone }: { children: React.ReactNode; tone: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${tone}`}>{children}</span>;
}

function retentionCopy(days: number | null) {
  if (days === null || days <= 0) return "Deletes today";
  return days === 1 ? "1 day remaining" : `${days} days remaining`;
}

type Confirmation = { title: string; message: string; confirmLabel: string; action: () => Promise<void> };

function ConfirmationDialog({ confirmation, busy, onClose }: { confirmation: Confirmation; busy: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) onClose(); };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [busy, onClose]);
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="delete-confirmation-title"><button type="button" className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close confirmation" /><div ref={dialogRef} className="admin-card relative z-10 w-full max-w-md p-6 shadow-[0_28px_100px_rgba(0,0,0,0.6)]"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#402129] text-[#ff9ca8]"><MaterialIcon filled name="delete_forever" /></span><h2 id="delete-confirmation-title" className="mt-4 text-lg font-bold text-[#f2f4f8]">{confirmation.title}</h2><p className="mt-2 text-xs leading-5 text-[#8f99ac]">{confirmation.message}</p><div className="mt-6 flex justify-end gap-3"><button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-[#343a4a] px-4 py-2.5 text-xs font-bold text-[#aab2c1]">Cancel</button><button type="button" disabled={busy} onClick={() => void confirmation.action()} className="rounded-xl bg-[#b64654] px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{busy ? "Deleting..." : confirmation.confirmLabel}</button></div></div></div>;
}

function Editor({ item, busy, onClose, onSave }: { item: ContentItem; busy: boolean; onClose: () => void; onSave: (item: ContentItem) => void }) {
  const [draft, setDraft] = useState(item);
  const [genres, setGenres] = useState(item.genres.join(", "));
  const dialogRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLElement>("button")?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", handleKeyDown); };
  }, [busy, onClose]);
  function field<K extends keyof ContentItem>(key: K, value: ContentItem[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({ ...draft, genres: genres.split(",").map((genre) => genre.trim()).filter(Boolean) });
  }
  const input = "mt-1.5 h-10 w-full rounded-xl border border-[#313747] bg-[#10141d] px-3 text-xs text-[#e4e8ef] outline-none focus:border-[#657ee9]";
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby="editor-title"><button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Close editor" type="button" /><form ref={dialogRef} onSubmit={submit} className="admin-card relative z-10 flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden shadow-[0_28px_100px_rgba(0,0,0,0.58)] sm:max-h-[calc(100dvh-3rem)]"><header className="sticky top-0 z-10 flex items-start justify-between border-b border-[#292e3c] bg-[#11151e]/95 px-5 py-5 backdrop-blur"><div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#78839a]">Edit post</p><h2 id="editor-title" className="mt-1 text-lg font-bold text-[#f2f4f8]">{item.title}</h2><p className="mt-1 font-mono text-[9px] text-[#667188]">Anime ID · {item.animeId}</p></div><button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl border border-[#303647] text-[#9ba5b8] hover:bg-[#1b202c]" type="button"><MaterialIcon name="close" /></button></header><div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6"><section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9cafff]">Post URL</h3><label className="mt-3 block text-[10px] font-semibold text-[#929caf]">Public URL<span className="mt-1.5 flex h-10 items-center overflow-hidden rounded-xl border border-[#313747] bg-[#10141d] text-xs text-[#e4e8ef] focus-within:border-[#657ee9]"><span className="h-full shrink-0 border-r border-[#313747] bg-[#171c27] px-3 leading-10 text-[#78839a]">/watch/</span><input required maxLength={100} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={draft.urlSlug} onChange={(event) => field("urlSlug", normalizePostUrlSlug(event.target.value))} className="h-full min-w-0 flex-1 bg-transparent px-3 font-mono outline-none" /></span></label><p className="mt-2 text-[9px] text-[#667188]">Changing this replaces the old public URL. The Anime ID and related data stay unchanged.</p></section><section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9cafff]">Publishing</h3><div className="mt-3 grid gap-4 sm:grid-cols-3"><CustomSelect label="Status" value={draft.contentStatus} options={contentStatusOptions} onChange={(value) => field("contentStatus", value as ContentItem["contentStatus"])} className="text-[10px] font-semibold text-[#929caf]" buttonClassName="mt-1.5 h-10 border-[#313747] bg-[#10141d] px-3 text-xs font-semibold text-[#e4e8ef]" menuClassName="rounded-xl border-[#313747] bg-[#10141d]" /><CustomSelect label="Visibility" value={draft.visibility} options={visibilityOptions} onChange={(value) => field("visibility", value as ContentItem["visibility"])} className="text-[10px] font-semibold text-[#929caf]" buttonClassName="mt-1.5 h-10 border-[#313747] bg-[#10141d] px-3 text-xs font-semibold text-[#e4e8ef]" menuClassName="rounded-xl border-[#313747] bg-[#10141d]" /><label className="flex items-end"><span className="flex h-10 w-full items-center gap-2 rounded-xl border border-[#313747] bg-[#10141d] px-3 text-xs text-[#d8dde7]"><input checked={draft.isNsfw} onChange={(event) => field("isNsfw", event.target.checked)} type="checkbox" className="accent-[#e49b5c]" />NSFW content</span></label></div></section><section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9cafff]">Titles and description</h3><div className="mt-3 grid gap-4 sm:grid-cols-2"><label className="text-[10px] font-semibold text-[#929caf]">Primary title<input required maxLength={200} value={draft.title} onChange={(event) => field("title", event.target.value)} className={input} /></label><label className="text-[10px] font-semibold text-[#929caf]">English title<input maxLength={200} value={draft.titleEnglish ?? ""} onChange={(event) => field("titleEnglish", event.target.value || null)} className={input} /></label><label className="text-[10px] font-semibold text-[#929caf]">Native title<input maxLength={200} value={draft.titleNative ?? ""} onChange={(event) => field("titleNative", event.target.value || null)} className={input} /></label><label className="text-[10px] font-semibold text-[#929caf]">Preferred title<input maxLength={200} value={draft.titleUserPreferred ?? ""} onChange={(event) => field("titleUserPreferred", event.target.value || null)} className={input} /></label></div><label className="mt-4 block text-[10px] font-semibold text-[#929caf]">Synopsis<textarea maxLength={10000} rows={7} value={draft.synopsis ?? ""} onChange={(event) => field("synopsis", event.target.value || null)} className={`${input} h-auto py-3 leading-5`} /></label></section><section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9cafff]">Catalog information</h3><div className="mt-3 grid gap-4 sm:grid-cols-3"><label className="text-[10px] font-semibold text-[#929caf]">Format<input maxLength={40} value={draft.type ?? ""} onChange={(event) => field("type", event.target.value || null)} className={input} /></label><label className="text-[10px] font-semibold text-[#929caf]">Episodes<input min={0} type="number" value={draft.episodes ?? ""} onChange={(event) => field("episodes", event.target.value ? Number(event.target.value) : null)} className={input} /></label><label className="text-[10px] font-semibold text-[#929caf]">Year<input min={1900} max={2200} type="number" value={draft.year ?? ""} onChange={(event) => field("year", event.target.value ? Number(event.target.value) : null)} className={input} /></label><label className="text-[10px] font-semibold text-[#929caf]">Season<input maxLength={20} value={draft.season ?? ""} onChange={(event) => field("season", event.target.value || null)} className={input} /></label><label className="text-[10px] font-semibold text-[#929caf] sm:col-span-2">Studio<input maxLength={200} value={draft.studio ?? ""} onChange={(event) => field("studio", event.target.value || null)} className={input} /></label></div><label className="mt-4 block text-[10px] font-semibold text-[#929caf]">Genres, separated by commas<input value={genres} onChange={(event) => setGenres(event.target.value)} className={input} /></label></section><section><h3 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9cafff]">Artwork</h3><div className="mt-3 space-y-4"><label className="block text-[10px] font-semibold text-[#929caf]">Cover image URL<input type="url" maxLength={2000} value={draft.imageUrl ?? ""} onChange={(event) => field("imageUrl", event.target.value || null)} className={input} /></label><label className="block text-[10px] font-semibold text-[#929caf]">Banner image URL<input type="url" maxLength={2000} value={draft.bannerUrl ?? ""} onChange={(event) => field("bannerUrl", event.target.value || null)} className={input} /></label></div></section><section className="rounded-2xl border border-[#2a3040] bg-[#0e121a] p-4"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#697386]">Post URL</p><a href={item.postPath} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 break-all font-mono text-[10px] text-[#8fa4ff] hover:underline">{item.postPath}<MaterialIcon className="shrink-0 text-[14px]" name="open_in_new" /></a></section></div><footer className="sticky bottom-0 flex justify-end gap-3 border-t border-[#292e3c] bg-[#11151e]/95 px-5 py-4 backdrop-blur"><button onClick={onClose} className="rounded-xl border border-[#343a4a] px-4 py-2.5 text-xs font-bold text-[#aab2c1]" type="button">Cancel</button><button disabled={busy} className="rounded-xl bg-[#596fe5] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-50" type="submit">{busy ? "Saving..." : "Save changes"}</button></footer></form></div>;
}

export function ContentManager() {
  const [data, setData] = useState<ContentResponse | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [confirmationBusy, setConfirmationBusy] = useState(false);
  const editorTriggerRef = useRef<HTMLElement | null>(null);
  const [error, setError] = useState("");
  const [featuredOpen, setFeaturedOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: `${page}`, limit: "20", filter, q: deferredSearch });
    fetch(`/api/dashboard/content?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        setData(await response.json());
      })
      .catch((cause) => { if (cause.name !== "AbortError") setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, filter, deferredSearch, refresh]);

  useEffect(() => {
    const refreshContent = () => setRefresh((value) => value + 1);
    window.addEventListener("rioanime:content-change", refreshContent);
    return () => window.removeEventListener("rioanime:content-change", refreshContent);
  }, []);

  function chooseFilter(value: (typeof filters)[number]) {
    setFilter(value);
    setPage(1);
  }

  async function patch(item: ContentItem, changes: Record<string, unknown>, closeEditor = false) {
    setBusyId(item.animeId);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/content/${encodeURIComponent(item.animeId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
      if (!response.ok) throw new Error(await responseError(response));
      if (closeEditor) setEditing(null);
      setRefresh((value) => value + 1);
      window.dispatchEvent(new CustomEvent("rioanime:content-change"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Content could not be updated");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(item: ContentItem) {
    if (!window.confirm(`Delete “${item.title}”? The post will be hidden but can be restored later.`)) return;
    setBusyId(item.animeId);
    try {
      const response = await fetch(`/api/dashboard/content/${encodeURIComponent(item.animeId)}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Content could not be deleted");
    } finally {
      setBusyId(null);
    }
  }

  async function permanentRequest(url: string) {
    setConfirmationBusy(true);
    setError("");
    try {
      const response = await fetch(url, { method: "DELETE" });
      if (!response.ok) throw new Error(await responseError(response));
      setConfirmation(null);
      if (data && data.items.length === 1 && page > 1) setPage((value) => value - 1);
      else setRefresh((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Content could not be permanently deleted");
    } finally {
      setConfirmationBusy(false);
    }
  }

  function confirmPermanent(item: ContentItem) {
    setConfirmation({
      title: "Delete this post permanently?",
      message: `“${item.title}” and its related episode, view, and reaction records will be permanently deleted. This action cannot be undone.`,
      confirmLabel: "Delete permanently",
      action: () => permanentRequest(`/api/dashboard/content/${encodeURIComponent(item.animeId)}/permanent`)
    });
  }

  function confirmEmptyBin() {
    const count = data?.summary.deleted ?? 0;
    setConfirmation({
      title: "Empty the recycle bin?",
      message: `${count} deleted ${count === 1 ? "post" : "posts"} will be permanently removed. This action cannot be undone.`,
      confirmLabel: "Delete all permanently",
      action: () => permanentRequest("/api/dashboard/content/deleted")
    });
  }

  function closeEditor() {
    setEditing(null);
    requestAnimationFrame(() => editorTriggerRef.current?.focus());
  }

  const saveEditor = (item: ContentItem) => patch(item, {
    urlSlug: item.urlSlug, title: item.title, titleEnglish: item.titleEnglish, titleNative: item.titleNative,
    titleUserPreferred: item.titleUserPreferred, synopsis: item.synopsis, imageUrl: item.imageUrl,
    bannerUrl: item.bannerUrl, type: item.type, episodes: item.episodes, year: item.year,
    season: item.season, genres: item.genres, studio: item.studio, contentStatus: item.contentStatus,
    visibility: item.visibility, isNsfw: item.isNsfw
  }, true);

  return <>
    {featuredOpen ? <FeaturedPostsModal onClose={() => setFeaturedOpen(false)} onSaved={() => setRefresh((value) => value + 1)} /> : null}
    {editing ? <Editor item={editing} busy={busyId === editing.animeId} onClose={closeEditor} onSave={saveEditor} /> : null}
    {confirmation ? <ConfirmationDialog confirmation={confirmation} busy={confirmationBusy} onClose={() => { if (!confirmationBusy) setConfirmation(null); }} /> : null}
    <div className="mb-5 flex justify-end lg:-mt-[76px] lg:mb-7"><button type="button" onClick={() => setFeaturedOpen(true)} className="flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#8b467c] to-[#5841bd] px-4 text-[10px] font-bold text-white"><MaterialIcon filled className="text-[16px]" name="kid_star" />Manage featured posts</button></div>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard icon="movie" label="All titles" value={number.format(data?.summary.total ?? 0)} detail={`${number.format(data?.summary.published ?? 0)} published`} tone="bg-[#202a4c] text-[#9cafff]" /><SummaryCard icon="draft" label="Drafts" value={number.format(data?.summary.draft ?? 0)} detail={`${number.format(data?.summary.private ?? 0)} private`} tone="bg-[#3a2d19] text-[#efbd68]" /><SummaryCard icon="visibility" label="Recorded views" value={number.format(data?.summary.views ?? 0)} detail="From anime view history" tone="bg-[#15352c] text-[#70d5ad]" /><SummaryCard icon="18_up_rating" label="NSFW tagged" value={number.format(data?.summary.nsfw ?? 0)} detail={`${number.format(data?.summary.deleted ?? 0)} deleted`} tone="bg-[#342027] text-[#ff9ca8]" /></section>
    <section className="mt-5 overflow-hidden rounded-2xl border border-[#292e3c] bg-[#151923]"><header className="flex flex-col gap-4 border-b border-[#292e3c] px-5 py-5 xl:flex-row xl:items-center xl:justify-between"><div><h2 className="text-sm font-bold text-[#eef1f6]">{filter === "deleted" ? "Deleted content" : "Content library"}</h2><p className="mt-1 text-[10px] text-[#7f899d]">{filter === "deleted" ? "Posts remain recoverable for 30 days before permanent deletion." : "Manage every anime post stored in D1"}</p></div><div className="flex w-full items-center gap-2 xl:w-auto">{filter === "deleted" && (data?.summary.deleted ?? 0) > 0 ? <button type="button" onClick={confirmEmptyBin} className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#63363c] px-3 text-[10px] font-bold text-[#ff9ca8]"><MaterialIcon className="text-[16px]" name="delete_sweep" />Delete all permanently</button> : null}<button type="button" disabled={loading} aria-busy={loading} onClick={() => setRefresh((value) => value + 1)} className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-[#303647] px-3 text-[10px] font-bold text-[#aab3c3] disabled:cursor-wait disabled:opacity-70"><MaterialIcon className={`text-[16px] ${loading ? "animate-spin text-[#8fa4ff]" : ""}`} name="refresh" /><span className={loading ? "animate-pulse" : ""}>{loading ? "Refreshing..." : "Refresh"}</span></button><label className="relative block w-full xl:w-72"><span className="sr-only">Search content</span><MaterialIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[17px] text-[#667188]" name="search" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search title or anime ID" className="h-10 w-full rounded-xl border border-[#303647] bg-[#10141d] pl-9 pr-3 text-xs text-[#dfe3eb] outline-none focus:border-[#657ee9]" /></label></div></header><div className="flex gap-2 overflow-x-auto border-b border-[#292e3c] px-5 py-3">{filters.map((value) => <button key={value} onClick={() => chooseFilter(value)} className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold capitalize ${filter === value ? "bg-[#596fe5] text-white" : "bg-[#1a1f2b] text-[#8f99ac] hover:text-[#dce1e9]"}`} type="button">{value}</button>)}</div>
      {error ? <div className="m-5 rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-xs text-[#ff9ca8]">{error}</div> : null}
      {loading && !data ? <div className="grid place-items-center py-24 text-xs text-[#7f899d]">Loading content...</div> : null}
      {data ? <><div className="divide-y divide-[#252a37]">{data.items.map((item) => <article key={item.animeId} className={`px-5 py-5 ${item.deletedAt ? "bg-[#1a1317]/70" : ""}`}><div className="flex flex-col gap-5 xl:flex-row xl:items-start"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-[#e7eaf0]">{item.title}</h3>{item.deletedAt ? <Badge tone="bg-[#402129] text-[#ff9ca8]">Deleted</Badge> : <Badge tone={item.contentStatus === "published" ? "bg-[#15352c] text-[#70d5ad]" : "bg-[#3a2d19] text-[#efbd68]"}>{item.contentStatus}</Badge>}{item.visibility === "private" ? <Badge tone="bg-[#2c263e] text-[#c8a9f0]"><MaterialIcon className="text-[12px]" name="lock" />Private</Badge> : null}{item.isNsfw ? <Badge tone="bg-[#40252a] text-[#ffa19d]">NSFW</Badge> : null}</div><p className="mt-2 line-clamp-2 max-w-2xl text-[10px] leading-5 text-[#818b9e]">{item.synopsis || "No synopsis has been added."}</p><div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-[#6f798c]"><span>{item.type ?? "Unknown format"}</span><span>{item.episodes ?? 0} episodes</span><span>{item.sourceStatus?.replaceAll("_", " ") ?? "Unknown source status"}</span><span>Updated {formatDate(item.updatedAt)}</span>{item.deletedAt ? <><span>Deleted {formatDate(item.deletedAt)}</span><span>Expires {formatDate(item.expiresAt)}</span><span className="font-bold text-[#ff9ca8]">{retentionCopy(item.daysRemaining)}</span></> : null}</div><a href={item.postPath} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#10141d] px-2.5 py-1.5 font-mono text-[9px] text-[#8fa4ff] hover:underline">{item.postPath}<MaterialIcon className="text-[13px]" name="open_in_new" /></a></div><dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:w-[390px]"><div className="rounded-xl bg-[#10141d] p-3"><dt className="text-[8px] uppercase tracking-[0.08em] text-[#667188]">Views</dt><dd className="mt-1 text-sm font-bold text-[#dfe3eb]">{number.format(item.views)}</dd></div><div className="rounded-xl bg-[#10141d] p-3"><dt className="text-[8px] uppercase tracking-[0.08em] text-[#667188]">Published</dt><dd className="mt-1 text-[10px] font-semibold text-[#b7bfcd]">{formatDate(item.publishedAt)}</dd></div><div className="rounded-xl bg-[#10141d] p-3"><dt className="text-[8px] uppercase tracking-[0.08em] text-[#667188]">Anime ID</dt><dd title={item.animeId} className="mt-1 truncate font-mono text-[9px] text-[#9ba5b8]">{item.animeId}</dd></div></dl></div><div className="mt-4 flex flex-wrap gap-2 border-t border-[#252a37] pt-4">{item.deletedAt ? <><button onClick={() => patch(item, { action: "restore" })} disabled={busyId === item.animeId} className="content-action text-[#70d5ad]" type="button"><MaterialIcon name="restore" />Restore as draft</button><button onClick={() => confirmPermanent(item)} disabled={busyId === item.animeId} className="content-action ml-auto text-[#ff8f9c]!" type="button"><MaterialIcon name="delete_forever" />Delete permanently</button></> : <><button onClick={(event) => { editorTriggerRef.current = event.currentTarget; setEditing(item); }} className="content-action" type="button"><MaterialIcon name="edit" />Edit information</button><button onClick={() => patch(item, { contentStatus: item.contentStatus === "published" ? "draft" : "published" })} disabled={busyId === item.animeId} className="content-action" type="button"><MaterialIcon name={item.contentStatus === "published" ? "draft" : "publish"} />{item.contentStatus === "published" ? "Move to draft" : "Publish"}</button><button onClick={() => patch(item, { visibility: item.visibility === "public" ? "private" : "public" })} disabled={busyId === item.animeId} className="content-action" type="button"><MaterialIcon name={item.visibility === "public" ? "lock" : "public"} />Make {item.visibility === "public" ? "private" : "public"}</button><button onClick={() => patch(item, { isNsfw: !item.isNsfw })} disabled={busyId === item.animeId} className="content-action" type="button"><MaterialIcon name="18_up_rating" />{item.isNsfw ? "Remove NSFW" : "Tag NSFW"}</button><button onClick={() => remove(item)} disabled={busyId === item.animeId} className="content-action ml-auto text-[#ff8f9c]!" type="button"><MaterialIcon name="delete" />Delete</button></>}{busyId === item.animeId ? <span className="self-center text-[9px] font-semibold text-[#78839a]">Updating...</span> : null}</div></article>)}{data.items.length === 0 ? <div className="py-20 text-center"><MaterialIcon className="text-[30px] text-[#536078]" name={filter === "deleted" ? "delete_sweep" : "movie_off"} /><p className="mt-3 text-xs font-semibold text-[#a9b1c0]">{filter === "deleted" ? "Recycle bin is empty" : "No matching content"}</p></div> : null}</div><footer className="flex items-center justify-between border-t border-[#292e3c] px-5 py-4 text-[10px] text-[#7f899d]"><span>Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} records</span><div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-[#343a4a] px-3 py-2 font-semibold text-[#b0b8c7] disabled:opacity-30" type="button">Previous</button><button disabled={!data.pagination.hasMore} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-[#343a4a] px-3 py-2 font-semibold text-[#b0b8c7] disabled:opacity-30" type="button">Next</button></div></footer></> : null}
    </section><style jsx>{`.content-action{display:flex;align-items:center;gap:6px;border-radius:9px;padding:7px 10px;color:#919bad;font-size:10px;font-weight:700;transition:background-color .15s}.content-action:hover{background:#202532}.content-action:disabled{opacity:.45}.content-action :global(.material-symbols-rounded){font-size:15px}.content-action.danger-action{color:#ff8f9c}`}</style>
  </>;
}

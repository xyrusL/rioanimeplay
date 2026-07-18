"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type Post = { animeId: string; title: string; imageUrl: string | null; type: string | null; episodes: number | null; year: number | null; visibility: string };
type Result = { items: Post[]; pagination: { totalPages: number } };

export function FeaturedPostsModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [items, setItems] = useState<Post[]>([]), [selected, setSelected] = useState<Post[]>([]);
  const [query, setQuery] = useState(""), [page, setPage] = useState(1), [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true), [saving, setSaving] = useState(false), [error, setError] = useState("");

  useEffect(() => {
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", key);
    fetch("/api/dashboard/content/featured", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setSelected(data.items ?? []))
      .catch(() => setError("Featured posts could not be loaded"));
    return () => { document.body.style.overflow = old; document.removeEventListener("keydown", key); };
  }, [onClose]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: `${page}`, limit: "50", filter: "published", q: query });
      fetch(`/api/dashboard/content?${params}`, { cache: "no-store", signal: controller.signal })
        .then((response) => response.json())
        .then((data: Result) => { setItems(data.items.filter((item) => item.visibility === "public")); setPages(data.pagination.totalPages); })
        .catch((cause) => { if (cause.name !== "AbortError") setError("Posts could not be loaded"); })
        .finally(() => setLoading(false));
    }, 180);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [page, query]);

  function toggle(item: Post) {
    setSelected((current) => {
      if (current.some((post) => post.animeId === item.animeId)) return current.filter((post) => post.animeId !== item.animeId);
      if (current.length === 10) { setError("You can feature up to 10 posts."); return current; }
      return [...current, item];
    });
  }

  function move(index: number, offset: number) {
    setSelected((current) => {
      const target = index + offset;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const response = await fetch("/api/dashboard/content/featured", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ animeIds: selected.map((item) => item.animeId) }) });
      if (!response.ok) throw new Error((await response.json()).error?.message);
      onSaved(); onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Featured posts could not be saved");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#05070c]/82 p-3 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="featured-title" className="flex h-[min(720px,calc(100dvh-1.5rem))] w-[min(1000px,calc(100vw-1.5rem))] max-w-full flex-col overflow-hidden rounded-[14px] border border-[#343b4d] bg-[#0e131c] shadow-[0_36px_120px_rgba(0,0,0,.8)]">
        <header className="flex items-start justify-between border-b border-[#29303e] bg-[#10151e] px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[linear-gradient(145deg,#a53886,#6635b5)] text-white shadow-[0_8px_22px_rgba(135,50,146,.3)]"><MaterialIcon filled name="kid_star" /></span>
            <div><h2 id="featured-title" className="text-base font-bold text-[#f2f4f8]">Manage featured posts</h2><p className="mt-0.5 text-[10px] text-[#8490a5]">Select up to 10 posts to feature on the homepage.</p></div>
          </div>
          <button onClick={onClose} aria-label="Close modal" className="grid h-9 w-9 place-items-center rounded-full border border-[#2c3443] text-[#aab4c5] hover:bg-[#1b2230] hover:text-white"><MaterialIcon className="text-[19px]" name="close" /></button>
        </header>

        <div className="grid min-h-0 min-w-0 flex-1 overflow-hidden lg:grid-cols-2">
          <section className="flex min-h-[390px] min-w-0 flex-col overflow-hidden border-b border-[#29303e] lg:min-h-0 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between px-5 pb-3 pt-4 text-[9px] font-bold uppercase tracking-[0.12em] text-[#a9b7d4]"><h3>1. Select posts</h3><span>{selected.length} / 10 selected</span></div>
            <div className="flex gap-2 px-5">
              <label className="relative min-w-0 flex-1"><MaterialIcon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-[16px] text-[#69758b]" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search title or anime ID..." className="h-9 w-full rounded-lg border border-[#333b4c] bg-[#0d121a] pl-9 pr-3 text-[10px] text-[#e5e9f0] outline-none focus:border-[#667fee]" /></label>
              <span className="grid h-9 min-w-20 place-items-center rounded-lg border border-[#333b4c] bg-[#0d121a] text-[10px] text-[#aab3c2]">All <MaterialIcon className="ml-1 text-[15px]" name="keyboard_arrow_down" /></span>
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-y-auto px-5">
              {loading ? <p className="py-12 text-center text-xs text-[#748096]">Loading posts...</p> : items.map((item) => {
                const checked = selected.some((post) => post.animeId === item.animeId);
                return <button key={item.animeId} onClick={() => toggle(item)} className={`flex w-full items-center gap-2.5 rounded-lg border-b border-[#252c39] px-2 py-2 text-left ${checked ? "bg-[#211b36]" : "hover:bg-[#151b27]"}`}><span className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${checked ? "border-[#7664f2] bg-[#7664f2]" : "border-[#465165]"}`}>{checked ? <MaterialIcon name="check" className="text-[12px]" /> : null}</span>{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-9 w-8 rounded object-cover" /> : <span className="h-9 w-8 rounded bg-[#242b38]" />}<span className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-[#e8ebf1]">{item.title}</strong><small className="text-[8px] text-[#778399]">Episode {item.episodes ?? 0}</small></span><span className="rounded-md bg-[#12392d] px-2 py-1 text-[8px] font-bold text-[#68d5a7]">{item.type ?? "TV"}</span></button>;
              })}
            </div>
            <div className="flex items-center justify-center gap-3 p-3 text-[9px] text-[#8490a5]"><button disabled={page === 1} onClick={() => setPage(page - 1)}><MaterialIcon className="text-[17px]" name="chevron_left" /></button><span>{page} / {pages}</span><button disabled={page === pages} onClick={() => setPage(page + 1)}><MaterialIcon className="text-[17px]" name="chevron_right" /></button></div>
          </section>

          <section className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
            <div className="border-b border-[#29303e] p-4">
              <div className="flex justify-between text-[9px] font-bold uppercase tracking-[0.12em] text-[#a9b7d4]"><h3>2. Featured posts (drag to reorder)</h3>{selected.length ? <button onClick={() => setSelected([])} className="normal-case tracking-normal text-[#9b8cff]">Clear all</button> : null}</div>
              <div className="mt-3 space-y-2">{selected.map((item, index) => <div key={item.animeId} className="flex items-center gap-2 rounded-lg border border-[#303747] bg-[#0d121a] p-2"><MaterialIcon className="text-[15px] text-[#69758b]" name="drag_indicator" /><span className="w-4 text-center text-[9px] text-[#cbd2df]">{index + 1}</span>{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-8 w-7 rounded object-cover" /> : <span className="h-8 w-7 rounded bg-[#242b38]" />}<strong className="min-w-0 flex-1 truncate text-[10px] text-[#e7eaf0]">{item.title}</strong><button disabled={!index} onClick={() => move(index, -1)} aria-label="Move up"><MaterialIcon className="text-[16px]" name="keyboard_arrow_up" /></button><button disabled={index === selected.length - 1} onClick={() => move(index, 1)} aria-label="Move down"><MaterialIcon className="text-[16px]" name="keyboard_arrow_down" /></button><button onClick={() => toggle(item)} aria-label="Remove"><MaterialIcon className="text-[16px]" name="close" /></button></div>)}</div>
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#31294d] bg-[#1a1730] px-3 py-2.5 text-[9px] text-[#aaa3d0]"><MaterialIcon className="text-[17px] text-[#9b7df2]" name="info" />Only the first 10 posts will be displayed on the homepage.</div>
            </div>
            <div className="p-4"><h3 className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#a9b7d4]">3. Preview <span className="normal-case tracking-normal text-[#778399]">(How it will appear on homepage)</span></h3><div className="mt-3 grid grid-cols-3 gap-2.5">{selected.slice(0, 3).map((item) => <article key={item.animeId} className="overflow-hidden rounded-lg border border-[#2d3544] bg-[#0d121a]">{item.imageUrl ? <img src={item.imageUrl} alt="" className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] bg-[#242b38]" />}<div className="p-2"><p className="truncate text-[9px] font-bold text-[#ecedf2]">{item.title}</p><p className="mt-1 text-[7px] text-[#748096]">{item.type ?? "TV"} · {item.year ?? "Unknown"}</p></div></article>)}</div></div>
          </section>
        </div>

        {error ? <p className="bg-[#2a191d] px-5 py-2 text-[10px] text-[#ff9ca8]">{error}</p> : null}
        <footer className="flex justify-end gap-3 border-t border-[#29303e] bg-[#10151e] px-5 py-4"><button disabled={saving} onClick={onClose} className="rounded-lg border border-[#313949] px-5 py-2.5 text-[10px] font-bold text-[#c2c8d3]">Cancel</button><button disabled={saving} onClick={() => void save()} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#526ee3] to-[#6854dc] px-5 py-2.5 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(91,81,225,.25)] disabled:opacity-50"><MaterialIcon className="text-[16px]" name="save" />{saving ? "Saving..." : "Save changes"}</button></footer>
      </div>
    </div>
  );
}

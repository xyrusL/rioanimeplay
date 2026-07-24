"use client";

import Image from "next/image";
import { useCallback, useDeferredValue, useEffect, useState } from "react";

import { AnimatedModal } from "@/shared/ui/animated-modal";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type Anime = { animeId: string; title: string; imageUrl: string | null };
type NoticeKey = "nsfw" | "video_ads";
type NoticeTemplate = { key: NoticeKey; title: string; message: string; anime: Anime[] };
type TemplateDefinition = NoticeTemplate & {
  icon: string;
  label: string;
  summary: string;
  managementNote: string;
};

const FIXED_TEMPLATES: TemplateDefinition[] = [
  {
    key: "nsfw",
    icon: "18_up_rating",
    label: "NSFW",
    title: "Mature content warning",
    message: "This anime may contain adult themes, nudity, or other sensitive material.",
    summary: "Require adult confirmation before the watch page opens.",
    managementNote: "This is the same NSFW tag used in Content. Changes made here or in Content stay synchronized.",
    anime: []
  },
  {
    key: "video_ads",
    icon: "ads_click",
    label: "Video has ads",
    title: "Video contains advertising",
    message: "The video player for this anime may show third-party advertising.",
    summary: "Show a standard advertising notice before playback.",
    managementNote: "This group is managed only from Status. Selected anime show the fixed video-ad notice before other post notifications.",
    anime: []
  }
];

function emptyTemplates() {
  return FIXED_TEMPLATES.map((template) => ({ ...template, anime: [] }));
}

function normalizeTemplates(input: unknown): TemplateDefinition[] {
  const rows = Array.isArray(input) ? input : [];
  return FIXED_TEMPLATES.map((definition) => {
    const row = rows.find((item) => item && typeof item === "object" && (item as { key?: unknown }).key === definition.key) as Partial<NoticeTemplate> | undefined;
    const anime = Array.isArray(row?.anime)
      ? row.anime.filter((item): item is Anime => Boolean(item && typeof item.animeId === "string" && typeof item.title === "string"))
      : [];
    return {
      ...definition,
      title: typeof row?.title === "string" && row.title.trim() ? row.title : definition.title,
      message: typeof row?.message === "string" && row.message.trim() ? row.message : definition.message,
      anime
    };
  });
}

async function responseError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.error?.message ?? "Content notices could not be updated";
}

function AnimeArtwork({ anime }: { anime: Anime }) {
  return anime.imageUrl ? (
    <Image
      alt={`${anime.title} cover`}
      className="h-12 w-9 shrink-0 rounded-lg object-cover ring-1 ring-white/10"
      height={48}
      src={anime.imageUrl}
      unoptimized
      width={36}
    />
  ) : (
    <span className="grid h-12 w-9 shrink-0 place-items-center rounded-lg bg-[var(--admin-surface-muted)] text-[var(--admin-subtle)] ring-1 ring-[var(--admin-border)]">
      <MaterialIcon className="text-[16px]" name="image_not_supported" />
    </span>
  );
}

export function ContentNoticeManager() {
  const [templates, setTemplates] = useState<TemplateDefinition[]>(emptyTemplates);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<TemplateDefinition | null>(null);
  const [selected, setSelected] = useState<Anime[]>([]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [results, setResults] = useState<Anime[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");

  const load = useCallback(async (background = false) => {
    if (!background) setLoadError("");
    try {
      const response = await fetch("/api/dashboard/content-notices", { cache: "no-store" });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json() as { templates?: unknown };
      if (!Array.isArray(data.templates)) throw new Error("Content notice templates returned an invalid response");
      setTemplates(normalizeTemplates(data.templates));
      setLoadError("");
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Content notices could not be loaded");
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => void load(true);
    window.addEventListener("rioanime:content-change", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("rioanime:content-change", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  useEffect(() => {
    if (!editing || deferredQuery.length < 2) {
      setResults([]);
      setSearching(false);
      setSearchError("");
      return;
    }

    const controller = new AbortController();
    const params = new URLSearchParams({ filter: "all", limit: "5", q: deferredQuery });
    setSearching(true);
    setSearchError("");
    fetch(`/api/dashboard/content?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(await responseError(response));
        return response.json();
      })
      .then((data) => setResults((data.items ?? []).filter((item: Anime & { deletedAt?: string | null }) => !item.deletedAt)))
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setResults([]);
        setSearchError(cause instanceof Error ? cause.message : "Anime search could not be loaded");
      })
      .finally(() => {
        if (!controller.signal.aborted) setSearching(false);
      });
    return () => controller.abort();
  }, [deferredQuery, editing]);

  function open(template: TemplateDefinition) {
    setEditing(template);
    setSelected(template.anime);
    setQuery("");
    setResults([]);
    setSearchError("");
    setSaveError("");
  }

  function close() {
    if (busy) return;
    setEditing(null);
    setSelected([]);
    setResults([]);
    setQuery("");
    setSearchError("");
    setSaveError("");
  }

  function toggle(anime: Anime) {
    setSelected((current) => current.some((item) => item.animeId === anime.animeId)
      ? current.filter((item) => item.animeId !== anime.animeId)
      : [...current, anime]);
  }

  async function save() {
    if (!editing) return;
    setBusy(true);
    setSaveError("");
    try {
      const response = await fetch(`/api/dashboard/content-notices/${editing.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animeIds: selected.map((item) => item.animeId) })
      });
      if (!response.ok) throw new Error(await responseError(response));
      await load(true);
      window.dispatchEvent(new CustomEvent("rioanime:content-change"));
      setEditing(null);
      setSelected([]);
      setResults([]);
      setQuery("");
    } catch (cause) {
      setSaveError(cause instanceof Error ? cause.message : "Content notices could not be updated");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-[var(--admin-border)] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div>
          <p className="admin-eyebrow">Content notices</p>
          <h2 className="mt-1 text-sm font-bold text-[var(--admin-text)]">Fixed warning templates</h2>
          <p className="admin-support mt-2">Select which anime automatically use each standard warning. These do not create custom notifications.</p>
        </div>
        <span className="w-fit rounded-full border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-1.5 text-[9px] font-bold text-[var(--admin-muted)]">Shown before notifications</span>
      </header>

      {loadError ? (
        <div className="mx-5 mt-5 flex flex-col gap-3 rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 sm:mx-6 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex min-w-0 items-start gap-2 text-xs text-[#ffadb6]"><MaterialIcon className="mt-px shrink-0 text-[17px]" name="error" /><span><strong className="block">Template groups could not be refreshed</strong><span className="mt-1 block text-[10px] leading-4 text-[#c98f96]">{loadError}</span></span></span>
          <button type="button" onClick={() => void load()} className="admin-button-secondary shrink-0"><MaterialIcon className="text-[16px]" name="refresh" />Retry</button>
        </div>
      ) : null}

      <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        {templates.map((template) => (
          <article key={template.key} className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-5 transition-colors hover:border-[var(--admin-accent)]/65 hover:bg-[var(--admin-input)]">
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon filled name={template.icon} /></span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-input)] px-2.5 py-1.5"><span className="text-sm font-bold leading-none text-[var(--admin-text)]">{loaded ? template.anime.length : "—"}</span><span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-[var(--admin-subtle)]">anime selected</span></span>
            </div>
            <h3 className="mt-5 text-sm font-bold text-[var(--admin-text)]">{template.label}</h3>
            <p className="mt-2 min-h-10 text-[10px] leading-5 text-[var(--admin-muted)]">{template.summary}</p>
            <div className="mt-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-3"><p className="text-[9px] font-bold text-[var(--admin-muted)]">Visitor message</p><p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[var(--admin-subtle)]">{template.message}</p></div>
            <button type="button" disabled={!loaded} onClick={() => open(template)} className="admin-button-secondary mt-5 w-full justify-between disabled:cursor-wait disabled:opacity-50"><span className="flex items-center gap-2"><MaterialIcon className="text-[16px]" name="library_add" />{loaded ? "Manage anime" : "Loading group…"}</span><MaterialIcon className="text-[17px]" name="arrow_forward" /></button>
          </article>
        ))}
      </div>

      <AnimatedModal
        isOpen={editing !== null}
        onClose={close}
        labelledBy="content-notice-title"
        closeOnBackdrop={!busy}
        backdropClassName="bg-[#050810]/80 p-3 backdrop-blur-sm sm:p-5"
        panelClassName="admin-card flex max-h-[calc(100dvh-2rem)] w-full min-w-0 max-w-[min(64rem,calc(100vw-1.5rem))] flex-col overflow-hidden shadow-[0_32px_120px_rgba(0,0,0,0.65)]"
      >
        {editing ? <>
          <header className="flex items-start justify-between gap-4 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon filled name={editing.icon} /></span>
              <div className="min-w-0"><p className="admin-eyebrow">Content notice template</p><h2 id="content-notice-title" className="mt-1 text-lg font-bold">Manage {editing.label} warning</h2><p className="mt-1 text-[10px] leading-4 text-[var(--admin-muted)]">{editing.managementNote}</p></div>
            </div>
            <button type="button" disabled={busy} onClick={close} aria-label="Close content notice" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[var(--admin-border)] text-[var(--admin-muted)] hover:bg-[var(--admin-input)] hover:text-[var(--admin-text)] disabled:opacity-50"><MaterialIcon name="close" /></button>
          </header>

          <div className="grid min-h-0 min-w-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.4fr)_minmax(17rem,0.6fr)]">
            <section className="min-w-0 border-b border-[var(--admin-border)] p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-end justify-between gap-3"><label htmlFor="content-notice-search" className="admin-label">Find anime</label><span className="text-[9px] text-[var(--admin-subtle)]">Search by title or Anime ID</span></div>
              <div className="relative mt-2"><MaterialIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[var(--admin-subtle)]" name="search" /><input id="content-notice-search" autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type at least 2 characters" className="admin-input h-11 w-full rounded-xl pl-10 pr-10 text-sm" />{searching ? <MaterialIcon className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[17px] text-[var(--admin-accent-text)]" name="progress_activity" /> : null}</div>

              <div className="mt-4 max-h-[min(26rem,calc(100dvh-23rem))] space-y-2 overflow-y-auto overscroll-contain pr-1" aria-live="polite">
                {searchError ? <div className="rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-xs text-[#ffadb6]">{searchError}</div> : null}
                {!searching && !searchError && deferredQuery.length >= 2 && results.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--admin-border)] px-4 py-8 text-center"><MaterialIcon className="text-[24px] text-[var(--admin-subtle)]" name="search_off" /><p className="mt-2 text-xs font-semibold text-[var(--admin-muted)]">No matching anime found</p><p className="mt-1 text-[9px] text-[var(--admin-subtle)]">Try another title or Anime ID.</p></div> : null}
                {deferredQuery.length < 2 ? <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-input)]/45 px-4 py-8 text-center"><MaterialIcon className="text-[24px] text-[var(--admin-subtle)]" name="manage_search" /><p className="mt-2 text-xs font-semibold text-[var(--admin-muted)]">Search the content library</p><p className="mt-1 text-[9px] text-[var(--admin-subtle)]">Select an anime to add it to this warning group.</p></div> : null}
                {results.map((anime) => { const checked = selected.some((item) => item.animeId === anime.animeId); return <button key={anime.animeId} type="button" aria-pressed={checked} onClick={() => toggle(anime)} className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${checked ? "border-[var(--admin-accent)] bg-[var(--admin-accent-soft)]" : "border-[var(--admin-border)] bg-[var(--admin-input)] hover:border-[var(--admin-accent)]/60"}`}><AnimeArtwork anime={anime} /><span className="min-w-0 flex-1"><strong title={anime.title} className="block truncate text-xs text-[var(--admin-text)]">{anime.title}</strong><span title={anime.animeId} className="mt-1 block truncate font-mono text-[9px] text-[var(--admin-subtle)]">{anime.animeId}</span></span><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${checked ? "bg-[var(--admin-accent)] text-white" : "bg-[var(--admin-surface-muted)] text-[var(--admin-subtle)]"}`}><MaterialIcon className="text-[17px]" filled={checked} name={checked ? "check" : "add"} /></span></button>; })}
              </div>
            </section>

            <section className="min-w-0 bg-[var(--admin-surface-muted)] p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3"><div><p className="admin-label">Selected anime</p><p className="mt-1 text-[9px] text-[var(--admin-subtle)]">These titles will use the {editing.label} warning.</p></div><span className="grid h-9 min-w-9 place-items-center rounded-full bg-[var(--admin-accent-soft)] px-2 text-sm font-bold text-[var(--admin-accent-text)]">{selected.length}</span></div>
              <div className="mt-4 max-h-[min(26rem,calc(100dvh-23rem))] space-y-2 overflow-y-auto overscroll-contain pr-1">{selected.map((anime) => <div key={anime.animeId} className="flex min-w-0 items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-2.5"><AnimeArtwork anime={anime} /><span className="min-w-0 flex-1"><strong title={anime.title} className="block truncate text-xs">{anime.title}</strong><span title={anime.animeId} className="mt-1 block truncate font-mono text-[9px] text-[var(--admin-subtle)]">{anime.animeId}</span></span><button type="button" onClick={() => toggle(anime)} aria-label={`Remove ${anime.title} from ${editing.label}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[var(--admin-danger)] hover:bg-[var(--admin-surface)]"><MaterialIcon className="text-[18px]" name="remove_circle" /></button></div>)}{!selected.length ? <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-input)]/45 p-8 text-center"><MaterialIcon className="text-[25px] text-[var(--admin-subtle)]" name="playlist_add" /><p className="mt-2 text-xs font-semibold text-[var(--admin-muted)]">No anime selected</p><p className="mt-1 text-[9px] text-[var(--admin-subtle)]">Use search to build this warning group.</p></div> : null}</div>
            </section>
          </div>

          {saveError ? <p className="mx-5 mb-3 rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-xs text-[#ffadb6] sm:mx-6">{saveError}</p> : null}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-surface)] px-5 py-4 sm:px-6"><p className="text-[9px] text-[var(--admin-subtle)]">Saving replaces the current {editing.label} group.</p><div className="flex gap-2"><button type="button" disabled={busy} onClick={close} className="admin-button-secondary">Cancel</button><button type="button" disabled={busy} onClick={() => void save()} className="admin-button-primary"><MaterialIcon className="text-[16px]" name="save" />{busy ? "Saving…" : "Save group"}</button></div></footer>
        </> : null}
      </AnimatedModal>
    </section>
  );
}

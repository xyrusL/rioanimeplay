"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import type { HomeAnimeItem } from "@/entities/anime/model/types";
import {
  FONT_OPTIONS,
  THEME_OPTIONS,
  type FontPreset,
  type ThemePreset
} from "@/shared/lib/appearance-presets";
import {
  LIBRARY_CHANGE_EVENT,
  getUserLibrarySnapshot,
  type UserLibrarySnapshot
} from "@/shared/lib/watch-storage";
import {
  FONT_SIZE_OPTIONS,
  getUserPreferences,
  saveUserPreferences,
  type FontSizePreference,
  type UserPreferences
} from "@/shared/lib/user-preferences";
import { AnimatedModal } from "@/shared/ui/animated-modal";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { ProfileAvatar } from "@/shared/ui/profile-avatar";
import { SensitiveImage } from "@/shared/ui/sensitive-image";

type AccountMember = {
  email: string;
  image: string | null;
  name: string;
};

type AccountSettingsContentProps = {
  authLocked: boolean;
  authLockdownMessage: string;
  catalog: HomeAnimeItem[];
  compact?: boolean;
  defaultFontPreset: FontPreset;
  defaultThemePreset: ThemePreset;
  errorMessage: string | null;
  member: AccountMember | null;
  showWelcome: boolean;
  signInAction: () => Promise<void>;
  signOutAction: () => Promise<void>;
};

const EMPTY_LIBRARY: UserLibrarySnapshot = {
  bookmarks: [],
  progress: {},
  recentWatchIds: []
};

const WELCOME_MESSAGES = [
  "Your watchlist is ready. Let’s find your next favorite anime.",
  "Your library missed you. Pick up right where you left off.",
  "New stories are waiting. Make yourself at home."
];

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.36l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.12-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.64.39 3.19 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.78.5 3.82 1.49l2.88-2.88A9.65 9.65 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

function SectionHeading({ icon, title, action }: { icon: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-extrabold text-[var(--text-primary)] sm:text-base">
        <MaterialIcon className="text-[20px] text-[var(--accent-strong)]" name={icon} />
        {title}
      </h2>
      {action}
    </div>
  );
}

export function AccountSettingsContent({
  authLocked,
  authLockdownMessage,
  catalog,
  compact = false,
  defaultFontPreset,
  defaultThemePreset,
  errorMessage,
  member,
  showWelcome,
  signInAction,
  signOutAction
}: AccountSettingsContentProps) {
  const [library, setLibrary] = useState<UserLibrarySnapshot>(EMPTY_LIBRARY);
  const [canScrollContinueWatching, setCanScrollContinueWatching] = useState(false);
  const [isSignOutOpen, setIsSignOutOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);
  const signOutCancelRef = useRef<HTMLButtonElement>(null);
  const continueWatchingRef = useRef<HTMLDivElement>(null);
  const continueWatchingDragRef = useRef({
    active: false,
    didDrag: false,
    lastTime: 0,
    lastX: 0,
    momentumFrame: null as number | null,
    pointerId: -1,
    startX: 0,
    velocity: 0
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    fontPreset: null,
    fontSize: "default",
    themePreset: null
  });
  const [preferenceSaveState, setPreferenceSaveState] = useState<"idle" | "saved" | "error">("idle");

  useEffect(() => {
    if (!showWelcome) return;

    setWelcomeMessage(WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)]);
    window.history.replaceState(null, "", "/account");
  }, [showWelcome]);

  useEffect(() => {
    if (!isSignOutOpen && !welcomeMessage) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (isSignOutOpen) signOutCancelRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setIsSignOutOpen(false);
      setWelcomeMessage(null);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSignOutOpen, welcomeMessage]);

  useEffect(() => {
    function refreshLibrary() {
      setLibrary(getUserLibrarySnapshot());
    }

    function refreshPreferences() {
      setPreferences(getUserPreferences());
    }

    refreshLibrary();
    refreshPreferences();
    window.addEventListener(LIBRARY_CHANGE_EVENT, refreshLibrary);
    window.addEventListener("storage", refreshLibrary);
    window.addEventListener("storage", refreshPreferences);
    return () => {
      window.removeEventListener(LIBRARY_CHANGE_EVENT, refreshLibrary);
      window.removeEventListener("storage", refreshLibrary);
      window.removeEventListener("storage", refreshPreferences);
    };
  }, []);

  const catalogById = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const followedItems = library.bookmarks.map((id) => catalogById.get(id)).filter((item): item is HomeAnimeItem => Boolean(item));
  const progressIds = Object.keys(library.progress)
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isSafeInteger(id));
  const continueWatchingIds = [...new Set([...library.recentWatchIds, ...progressIds])];
  const recentItems = continueWatchingIds.map((id) => catalogById.get(id)).filter((item): item is HomeAnimeItem => Boolean(item)).slice(0, compact ? 4 : 6);
  const recentItemCount = recentItems.length;

  useEffect(() => {
    const rail = continueWatchingRef.current;
    const drag = continueWatchingDragRef.current;
    if (!rail) {
      setCanScrollContinueWatching(false);
      return;
    }

    const updateOverflow = () => {
      setCanScrollContinueWatching(rail.scrollWidth > rail.clientWidth + 1);
    };

    updateOverflow();
    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(rail);
    return () => {
      resizeObserver.disconnect();
      const momentumFrame = drag.momentumFrame;
      if (momentumFrame !== null) cancelAnimationFrame(momentumFrame);
    };
  }, [recentItemCount]);

  function updatePreference(next: Partial<UserPreferences>) {
    const nextPreferences = { ...preferences, ...next };
    setPreferences(nextPreferences);
    setPreferenceSaveState(saveUserPreferences(nextPreferences) ? "saved" : "error");
  }

  function startContinueWatchingDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!canScrollContinueWatching || event.pointerType === "touch" || event.button !== 0) return;

    const drag = continueWatchingDragRef.current;
    if (drag.momentumFrame !== null) {
      cancelAnimationFrame(drag.momentumFrame);
      drag.momentumFrame = null;
    }
    drag.active = true;
    drag.didDrag = false;
    drag.lastTime = performance.now();
    drag.lastX = event.clientX;
    drag.pointerId = event.pointerId;
    drag.startX = event.clientX;
    drag.velocity = 0;
  }

  function moveContinueWatchingDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = continueWatchingDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    const distance = event.clientX - drag.startX;
    if (!drag.didDrag && Math.abs(distance) < 5) return;

    if (!drag.didDrag) {
      drag.didDrag = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const now = performance.now();
    const elapsed = Math.max(now - drag.lastTime, 1);
    const movement = event.clientX - drag.lastX;
    const currentVelocity = (-movement * 1.15) / elapsed;
    drag.velocity = drag.velocity * 0.6 + currentVelocity * 0.4;
    drag.lastTime = now;
    drag.lastX = event.clientX;
    event.preventDefault();
    event.currentTarget.scrollLeft -= movement * 1.15;
  }

  function stopContinueWatchingDrag(event: React.PointerEvent<HTMLDivElement>) {
    const drag = continueWatchingDragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    drag.active = false;
    drag.pointerId = -1;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (!drag.didDrag || Math.abs(drag.velocity) < 0.02) return;

    const rail = event.currentTarget;
    let previousTime = performance.now();
    const glide = (time: number) => {
      const elapsed = Math.min(time - previousTime, 32);
      previousTime = time;
      const previousScrollLeft = rail.scrollLeft;
      rail.scrollLeft += drag.velocity * elapsed;
      drag.velocity *= Math.pow(0.9, elapsed / 16.67);

      const reachedEdge = rail.scrollLeft === previousScrollLeft;
      if (!reachedEdge && Math.abs(drag.velocity) >= 0.02) {
        drag.momentumFrame = requestAnimationFrame(glide);
      } else {
        drag.momentumFrame = null;
      }
    };
    drag.momentumFrame = requestAnimationFrame(glide);
  }

  const cardClass = "rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-strong)] shadow-[var(--soft-shadow)]";

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className={compact ? "px-1 pb-1 pt-2" : "flex items-end justify-between gap-6 pb-2"}>
        <div>
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[var(--accent-strong)]">Your space</p>
          <h1 className={`${compact ? "mt-1 text-2xl" : "mt-2 text-3xl"} font-display font-black tracking-[-0.045em] text-white`}>Account settings</h1>
          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">Manage your library, appearance, and session.</p>
        </div>
      </div>

      <section className={`${cardClass} ${compact ? "p-4" : "p-5"}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <ProfileAvatar
              className="h-14 w-14 shrink-0 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] text-lg font-black text-white shadow-[0_0_24px_var(--accent-soft)]"
              image={member?.image ?? null}
              imageSizes="56px"
              name={member?.name ?? "Guest"}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-extrabold text-white">{member?.name ?? "Guest account"}</h2>
                <span className="rounded-full bg-[var(--accent-soft)] px-2 py-1 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-[var(--accent-strong)]">{member ? "Member" : "Local"}</span>
              </div>
              <p className="mt-1 truncate text-xs text-[var(--text-secondary)]">{member?.email ?? "Your library is saved in this browser"}</p>
            </div>
          </div>

          {member ? (
            <button type="button" onClick={() => setIsSignOutOpen(true)} aria-label="Sign out" className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--line-soft)] bg-white/[0.035] text-xs font-bold text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)] ${compact ? "w-11 px-0" : "px-5"}`}>
              <MaterialIcon className="text-[18px]" name="logout" /> <span className={compact ? "sr-only" : ""}>Sign out</span>
            </button>
          ) : authLocked ? (
            <button disabled className={`inline-flex h-11 shrink-0 cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-white/70 text-xs font-bold text-[#171721] opacity-50 ${compact ? "w-11 px-0" : "px-5"}`}><GoogleMark /><span className={compact ? "sr-only" : ""}>Sign in with Google</span></button>
          ) : (
            <form action={signInAction} className="shrink-0">
              <button type="submit" aria-label="Sign in with Google" className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-xs font-bold text-[#171721] shadow-[0_12px_26px_rgba(0,0,0,.22)] focus-visible:outline-4 focus-visible:outline-[var(--accent-soft)] ${compact ? "w-11 px-0" : "px-5"}`}><GoogleMark /><span className={compact ? "sr-only" : ""}>Sign in with Google</span></button>
            </form>
          )}
        </div>
        {!member && authLocked ? <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] px-3 py-2 text-[0.68rem] leading-5 text-amber-100/70">{authLockdownMessage}</p> : null}
        {errorMessage ? <p className="mt-3 rounded-xl border border-red-400/20 bg-red-400/[0.07] px-3 py-2 text-[0.68rem] leading-5 text-red-100/75">{errorMessage}</p> : null}
      </section>

      <div className={`grid gap-4 ${compact ? "" : "xl:grid-cols-[1.15fr_.85fr]"}`}>
        <section className={`${cardClass} min-w-0 overflow-hidden p-4 sm:p-5`}>
          <SectionHeading
            icon="history"
            title="Continue watching"
            action={canScrollContinueWatching ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Scroll continue watching left"
                  onClick={() => continueWatchingRef.current?.scrollBy({ left: -360, behavior: "smooth" })}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line-soft)] bg-white/[0.03] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                >
                  <MaterialIcon className="text-[18px]" name="chevron_left" />
                </button>
                <button
                  type="button"
                  aria-label="Scroll continue watching right"
                  onClick={() => continueWatchingRef.current?.scrollBy({ left: 360, behavior: "smooth" })}
                  className="grid h-8 w-8 place-items-center rounded-full border border-[var(--line-soft)] bg-white/[0.03] text-[var(--text-secondary)] hover:border-[var(--line-strong)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                >
                  <MaterialIcon className="text-[18px]" name="chevron_right" />
                </button>
              </div>
            ) : undefined}
          />
          {recentItems.length ? (
            <div
              ref={continueWatchingRef}
              onClickCapture={(event) => {
                if (!continueWatchingDragRef.current.didDrag) return;
                event.preventDefault();
                event.stopPropagation();
                continueWatchingDragRef.current.didDrag = false;
              }}
              onDragStart={(event) => event.preventDefault()}
              onPointerCancel={(event) => {
                continueWatchingDragRef.current.velocity = 0;
                stopContinueWatchingDrag(event);
                continueWatchingDragRef.current.didDrag = false;
              }}
              onPointerDown={startContinueWatchingDrag}
              onPointerMove={moveContinueWatchingDrag}
              onPointerUp={stopContinueWatchingDrag}
              onWheel={(event) => {
                if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
                  event.currentTarget.scrollLeft += event.deltaY;
                }
              }}
              className={`mt-4 flex max-w-full snap-x snap-proximity select-none gap-3 overflow-x-auto overscroll-x-contain pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [touch-action:pan-x] ${canScrollContinueWatching ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
            >
              {recentItems.map((item) => (
                <Link key={item.id} href={`/watch/${encodeURIComponent(item.urlSlug)}`} aria-label={`Continue ${item.title} from episode ${library.progress[String(item.id)]?.lastEpisode ?? 1}`} className="group w-[116px] shrink-0 snap-start focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-[var(--line-soft)] bg-[var(--bg-panel)]">
                    <SensitiveImage fill isNsfw={item.isNsfw} overlay="card" alt={item.title} className="object-cover transition-transform group-hover:scale-105" sizes="116px" src={item.coverImage} />
                    <span className="absolute bottom-2 left-2 rounded-md bg-black/75 px-2 py-1 text-[0.58rem] font-bold text-white">EP {library.progress[String(item.id)]?.lastEpisode ?? 1}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-1 text-[0.68rem] font-bold text-white">{item.title}</h3>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex min-h-28 items-center gap-4 rounded-xl border border-dashed border-[var(--line-soft)] bg-white/[0.02] p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)]">
                <MaterialIcon className="text-[24px] text-[var(--accent-strong)]" name="play_circle" />
              </span>
              <div>
                <p className="text-xs leading-5 text-[var(--text-secondary)]">Your watch history is empty. Start an anime and it will appear here.</p>
                <Link href="/anime/a-z" className="mt-2 inline-flex items-center gap-1 text-[0.68rem] font-bold text-[var(--accent-strong)] hover:text-white">
                  Browse anime <MaterialIcon className="text-[16px]" name="arrow_forward" />
                </Link>
              </div>
            </div>
          )}
        </section>

        <section className={`${cardClass} min-w-0 p-4 sm:p-5`}>
          <SectionHeading icon="favorite" title="Followed anime" action={<Link href="/bookmarks" className="text-[0.66rem] font-bold text-[var(--accent-strong)]">View all</Link>} />
          <div className="mt-4 flex items-center gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-[var(--accent-soft)] text-center">
              <span><strong className="block text-2xl font-black text-white">{followedItems.length}</strong><span className="text-[0.58rem] uppercase tracking-[0.12em] text-[var(--accent-strong)]">saved</span></span>
            </div>
            {followedItems.length ? (
              <div className="flex min-w-0 -space-x-3">
                {followedItems.slice(0, 4).map((item) => (
                  <Link
                    key={item.id}
                    href={`/watch/${encodeURIComponent(item.urlSlug)}`}
                    aria-label={`Watch ${item.title}`}
                    className="relative h-20 w-14 overflow-hidden rounded-lg border-2 border-[var(--bg-card-strong)] bg-[var(--bg-panel)] focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
                  >
                    <SensitiveImage fill isNsfw={item.isNsfw} overlay="card" alt={item.title} className="object-cover" sizes="56px" src={item.coverImage} />
                  </Link>
                ))}
              </div>
            ) : <p className="text-xs leading-5 text-[var(--text-secondary)]">Follow anime to keep your favorites close.</p>}
          </div>
        </section>
      </div>

      <section className={`${cardClass} min-w-0 overflow-hidden p-4 sm:p-5`}>
        <SectionHeading
          icon="palette"
          title="Appearance"
          action={
            <span aria-live="polite" className={`text-[0.62rem] font-bold ${preferenceSaveState === "error" ? "text-red-300" : "text-[var(--text-muted)]"}`}>
              {preferenceSaveState === "saved"
                ? "Saved to this browser"
                : preferenceSaveState === "error"
                  ? "Browser storage unavailable"
                  : "Changes save automatically"}
            </span>
          }
        />
        <div className={`mt-4 grid min-w-0 gap-4 ${compact ? "" : "xl:grid-cols-[1.1fr_.9fr_1.1fr]"}`}>
          <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white/[0.02] p-4">
            <h3 className="text-xs font-extrabold text-white">Theme</h3>
            <p className="mt-1 text-[0.65rem] text-[var(--text-muted)]">Choose your color atmosphere.</p>
            <div className={`mt-4 gap-2 ${compact ? "-mx-1 flex snap-x overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" : "grid grid-cols-4"}`}>
              {THEME_OPTIONS.map((option) => {
                const selected = (preferences.themePreset ?? defaultThemePreset) === option.value;
                return (
                  <button key={option.value} type="button" aria-label={`Use ${option.label} theme`} aria-pressed={selected} onClick={() => updatePreference({ themePreset: option.value })} className={`flex min-h-16 flex-col items-center justify-center gap-2 rounded-xl border text-[0.58rem] font-bold ${compact ? "w-[72px] shrink-0 snap-start" : ""} ${selected ? "border-[var(--accent-strong)] bg-[var(--accent-soft)] text-white" : "border-[var(--line-soft)] text-[var(--text-secondary)]"}`}>
                    <span className="grid h-6 w-6 place-items-center rounded-full" style={{ backgroundColor: option.accent }}>{selected ? <MaterialIcon className="text-[15px] text-white" name="check" /> : null}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => updatePreference({ themePreset: null })} className="mt-3 text-[0.62rem] font-bold text-[var(--accent-strong)]">Use site default</button>
          </div>

          <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white/[0.02] p-4">
            <h3 className="text-xs font-extrabold text-white">Font size</h3>
            <p className="mt-1 text-[0.65rem] text-[var(--text-muted)]">Adjust text across the site.</p>
            <div className="mt-4 grid min-w-0 grid-cols-2 gap-2">
              {FONT_SIZE_OPTIONS.map((option) => (
                <button key={option.value} type="button" aria-pressed={preferences.fontSize === option.value} onClick={() => updatePreference({ fontSize: option.value as FontSizePreference })} className={`rounded-xl border px-3 py-3 text-[0.65rem] font-bold ${preferences.fontSize === option.value ? "border-[var(--accent-strong)] bg-[var(--accent-soft)] text-white" : "border-[var(--line-soft)] text-[var(--text-secondary)]"}`}>{option.label}</button>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-[var(--line-soft)] bg-black/10 p-3">
              <strong className="text-sm text-white">Preview text</strong>
              <p className="mt-1 text-[0.65rem] text-[var(--text-secondary)]">Find your next favorite anime.</p>
            </div>
          </div>

          <div className="min-w-0 overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white/[0.02] p-4">
            <h3 className="text-xs font-extrabold text-white">Font family</h3>
            <p className="mt-1 text-[0.65rem] text-[var(--text-muted)]">Pick the reading style you prefer.</p>
            <div className="mt-4 space-y-2">
              {FONT_OPTIONS.map((option) => {
                const selected = (preferences.fontPreset ?? defaultFontPreset) === option.value;
                return (
                  <button key={option.value} type="button" aria-pressed={selected} onClick={() => updatePreference({ fontPreset: option.value })} className={`flex min-w-0 w-full items-center justify-between gap-2 overflow-hidden rounded-xl border px-3 py-3 text-left ${selected ? "border-[var(--accent-strong)] bg-[var(--accent-soft)]" : "border-[var(--line-soft)]"}`}>
                    <span className="min-w-0"><strong className="block truncate text-xs text-white" style={{ fontFamily: option.displayFamily }}>{option.label}</strong><span className="mt-1 block truncate text-[0.6rem] text-[var(--text-muted)]" style={{ fontFamily: option.bodyFamily }}>Anime starts here</span></span>
                    <MaterialIcon className={`text-[19px] ${selected ? "text-[var(--accent-strong)]" : "text-[var(--text-muted)]"}`} filled={selected} name={selected ? "radio_button_checked" : "radio_button_unchecked"} />
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => updatePreference({ fontPreset: null })} className="mt-3 text-[0.62rem] font-bold text-[var(--accent-strong)]">Use site default</button>
          </div>
        </div>
      </section>

      {compact ? (
        <section className={`${cardClass} flex items-center justify-between gap-4 p-4`}>
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
              <MaterialIcon className="text-[21px]" name="shield" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-white">Session</h2>
              <p className="mt-1 text-[0.65rem] leading-4 text-[var(--text-muted)]">{member ? "Manage your account session." : "Sign in to sync your viewing library."}</p>
            </div>
          </div>
          {member ? (
            <button type="button" onClick={() => setIsSignOutOpen(true)} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] px-3 text-[0.65rem] font-bold text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
              <MaterialIcon className="text-[17px]" name="logout" /> Sign out
            </button>
          ) : (
            <form action={signInAction} className="shrink-0">
              <button type="submit" disabled={authLocked} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-3 text-[0.65rem] font-bold text-[#171721] disabled:cursor-not-allowed disabled:opacity-50">
                <GoogleMark /> Sign in
              </button>
            </form>
          )}
        </section>
      ) : null}

      <AnimatedModal
        isOpen={Boolean(welcomeMessage)}
        onClose={() => setWelcomeMessage(null)}
        labelledBy="welcome-back-dialog-title"
        placement={compact ? "bottom" : "center"}
        backdropClassName={`bg-[rgba(4,5,10,0.8)] backdrop-blur-[9px] ${compact ? "px-3 pt-8" : "px-4 py-5"}`}
        panelClassName={`relative w-full overflow-hidden border border-[var(--line-strong)] bg-[linear-gradient(145deg,rgba(28,27,39,0.99),rgba(13,15,23,0.99))] p-5 shadow-[0_26px_72px_rgba(0,0,0,0.64),0_0_38px_var(--accent-soft)] ${compact ? "max-w-[416px] rounded-t-[24px] rounded-b-none pb-[max(1.25rem,env(safe-area-inset-bottom))]" : "max-w-[360px] rounded-[22px] sm:p-6"}`}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-64 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <button
          type="button"
          aria-label="Close welcome message"
          onClick={() => setWelcomeMessage(null)}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/20 text-white/60 transition hover:border-[var(--line-strong)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
        >
          <MaterialIcon className="text-[18px]" name="close" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          <div className="relative">
            <ProfileAvatar
              className="h-16 w-16 rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] text-xl font-black text-white shadow-[0_0_30px_var(--accent-soft)]"
              image={member?.image ?? null}
              imageSizes="64px"
              name={member?.name ?? "RioAnime member"}
            />
            <span className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[#171721] bg-[var(--accent-strong)] text-white">
              <MaterialIcon className="text-[14px]" name="check" />
            </span>
          </div>
          <p className="mt-4 text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Signed in successfully</p>
          <h2 id="welcome-back-dialog-title" className="mt-1.5 font-display text-xl font-black tracking-[-0.035em] text-white sm:text-[1.35rem]">
            Welcome back{member?.name ? `, ${member.name.split(" ")[0]}` : ""}!
          </h2>
          <p className="mt-2 max-w-[280px] text-xs leading-5 text-[var(--text-secondary)]">
            {welcomeMessage}
          </p>
          <button
            type="button"
            onClick={() => setWelcomeMessage(null)}
            className="mt-5 flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(105deg,var(--accent-strong),var(--accent))] px-4 text-xs font-bold text-white shadow-[0_12px_28px_var(--accent-soft)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] motion-reduce:transition-none"
          >
            Start watching
            <MaterialIcon className="text-[18px]" name="play_arrow" />
          </button>
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={isSignOutOpen}
        onClose={() => setIsSignOutOpen(false)}
        labelledBy="sign-out-dialog-title"
        placement={compact ? "bottom" : "center"}
        backdropClassName={`bg-[rgba(4,5,10,0.8)] backdrop-blur-[9px] ${compact ? "px-3 pt-8" : "px-4 py-5"}`}
        panelClassName={`relative w-full overflow-hidden border border-[var(--line-strong)] bg-[linear-gradient(145deg,rgba(28,27,39,0.99),rgba(13,15,23,0.99))] p-5 shadow-[0_26px_72px_rgba(0,0,0,0.64),0_0_38px_var(--accent-soft)] ${compact ? "max-w-[416px] rounded-t-[24px] rounded-b-none pb-[max(1.25rem,env(safe-area-inset-bottom))]" : "max-w-[380px] rounded-[22px] sm:p-6"}`}
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-52 w-64 -translate-x-1/2 rounded-full bg-[var(--accent-soft)] blur-3xl" />
        <button
          type="button"
          aria-label="Close sign out confirmation"
          onClick={() => setIsSignOutOpen(false)}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-black/20 text-white/60 transition hover:border-[var(--line-strong)] hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
        >
          <MaterialIcon className="text-[18px]" name="close" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] text-[2rem] shadow-[0_0_30px_var(--accent-soft)]" aria-hidden="true">
            😢
          </span>
          <h2 id="sign-out-dialog-title" className="mt-4 max-w-[290px] font-display text-xl font-black leading-tight tracking-[-0.035em] text-white sm:text-[1.35rem]">
            Are you sure you want to sign out?
          </h2>
          <p className="mt-2 max-w-[280px] text-xs leading-5 text-[var(--text-secondary)]">
            You&apos;ll be signed out of your account. We&apos;ll miss you!
          </p>

          <div className="mt-5 grid w-full grid-cols-2 gap-2.5">
            <button
              ref={signOutCancelRef}
              type="button"
              onClick={() => setIsSignOutOpen(false)}
              className="flex h-11 items-center justify-center rounded-xl border border-white/15 bg-white/[0.025] px-3 text-xs font-bold text-white/80 transition hover:border-white/25 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)] motion-reduce:transition-none"
            >
              Cancel
            </button>
            <form action={signOutAction}>
              <button type="submit" className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(105deg,var(--accent-strong),var(--accent))] px-3 text-xs font-bold text-white shadow-[0_12px_28px_var(--accent-soft)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-strong)] motion-reduce:transition-none">
                <MaterialIcon className="text-[18px]" name="logout" />
                Yes, sign out
              </button>
            </form>
          </div>
        </div>
      </AnimatedModal>
    </div>
  );
}

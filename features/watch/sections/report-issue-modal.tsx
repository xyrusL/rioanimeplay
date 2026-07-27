"use client";

import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import { MOTION_VARIANTS } from "@/shared/lib/motion";
import { AnimatedModal } from "@/shared/ui/animated-modal";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type TurnstileApi = {
  remove: (widgetId: string) => void;
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type ReportIssueModalProps = {
  animeId: string;
  animeTitle: string;
  currentEpisode: number;
  episodeNumbers: number[];
  isOpen: boolean;
  onClose: () => void;
};

type ReportToastState = {
  id: number;
  tone: "success" | "warning" | "error";
  title: string;
  message: string;
};

const TURNSTILE_ACTION = "report_issue";

function isMeaningfulMessage(value: string) {
  const lettersAndNumbers = [...value.matchAll(/[\p{L}\p{N}]/gu)].map((match) => match[0]);
  const words = value.match(/[\p{L}\p{N}]+/gu) ?? [];
  const hasCjkText = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(value);
  const uniqueCharacters = new Set(lettersAndNumbers.map((character) => character.toLocaleLowerCase())).size;
  const hasEnoughContent = hasCjkText ? lettersAndNumbers.length >= 4 : lettersAndNumbers.length >= 6;
  return hasEnoughContent && uniqueCharacters >= (hasCjkText ? 3 : 4) && (words.length >= 2 || hasCjkText);
}

function ReportToast({ toast, onClose }: { toast: ReportToastState | null; onClose: () => void }) {
  if (typeof document === "undefined") return null;
  const tone = toast?.tone === "success"
    ? { icon: "check", accent: "#34d66d", border: "border-emerald-400/35", glow: "bg-emerald-400/12 text-emerald-300" }
    : toast?.tone === "warning"
      ? { icon: "priority_high", accent: "#f5a524", border: "border-amber-400/35", glow: "bg-amber-400/12 text-amber-300" }
      : { icon: "close", accent: "#ff4961", border: "border-rose-400/40", glow: "bg-rose-400/12 text-rose-300" };

  return createPortal(
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[520] flex justify-center sm:top-6">
      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={MOTION_VARIANTS.toast}
            role={toast.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto relative flex w-full max-w-md items-center gap-3 overflow-hidden rounded-2xl border ${tone.border} bg-[#11151e]/96 p-3.5 text-white shadow-[0_22px_70px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-4`}
          >
            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-current/25 ${tone.glow}`}>
              <MaterialIcon className="text-[24px]" name={tone.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm font-bold sm:text-base">{toast.title}</strong>
              <span className="mt-0.5 block text-xs leading-5 text-white/52">{toast.message}</span>
            </span>
            <button type="button" onClick={onClose} aria-label="Dismiss notification" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/50 hover:bg-white/7 hover:text-white">
              <MaterialIcon className="text-[19px]" name="close" />
            </button>
            <motion.span className="absolute inset-x-0 bottom-0 h-0.5 origin-left" style={{ backgroundColor: tone.accent }} initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 5, ease: "linear" }} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export function ReportIssueModal({ animeId, animeTitle, currentEpisode, episodeNumbers, isOpen, onClose }: ReportIssueModalProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
  const challengeContainerRef = useRef<HTMLDivElement>(null);
  const episodeMenuRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [episodeNumber, setEpisodeNumber] = useState(currentEpisode);
  const [reporterName, setReporterName] = useState("");
  const [message, setMessage] = useState("");
  const [challengeToken, setChallengeToken] = useState("");
  const [challengeReady, setChallengeReady] = useState(false);
  const [episodeMenuOpen, setEpisodeMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState<ReportToastState | null>(null);

  function showToast(tone: ReportToastState["tone"], title: string, toastMessage: string) {
    setToast({ id: Date.now(), tone, title, message: toastMessage });
  }

  useEffect(() => {
    if (!isOpen) return;
    setEpisodeNumber(currentEpisode);
    setReporterName("");
    setMessage("");
    setChallengeToken("");
    setEpisodeMenuOpen(false);
    setError("");
    setSubmitted(false);
  }, [currentEpisode, isOpen]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5_000);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!episodeMenuOpen) return;
    episodeMenuRef.current?.querySelector<HTMLElement>(`[data-episode="${episodeNumber}"]`)?.scrollIntoView({ block: "center" });

    function closeEpisodeMenu(event: PointerEvent) {
      if (!episodeMenuRef.current?.contains(event.target as Node)) setEpisodeMenuOpen(false);
    }
    function closeEpisodeMenuOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setEpisodeMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeEpisodeMenu);
    document.addEventListener("keydown", closeEpisodeMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeEpisodeMenu);
      document.removeEventListener("keydown", closeEpisodeMenuOnEscape);
    };
  }, [episodeMenuOpen, episodeNumber]);

  useEffect(() => {
    const turnstile = window.turnstile;
    const container = challengeContainerRef.current;
    if (!isOpen || !challengeReady || !siteKey || !turnstile || !container || widgetIdRef.current) return;

    widgetIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      action: TURNSTILE_ACTION,
      theme: "dark",
      size: "flexible",
      appearance: "always",
      callback: (token: string) => {
        setChallengeToken(token);
        setError("");
      },
      "expired-callback": () => setChallengeToken(""),
      "error-callback": () => {
        setChallengeToken("");
        setError("Verification could not load. Please try again.");
        showToast("warning", "Verification unavailable", "Cloudflare could not complete the security check. Please retry.");
      }
    });

    return () => {
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    };
  }, [challengeReady, isOpen, siteKey]);

  function resetChallenge() {
    if (widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    setChallengeToken("");
  }

  async function submitReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMessage = message.trim();
    if (!isMeaningfulMessage(cleanMessage)) {
      setError("Please describe the issue using at least a few clear words.");
      showToast("warning", "Invalid information", "Please describe the problem using a few clear words.");
      return;
    }
    if (!challengeToken) {
      setError("Complete the verification before sending your report.");
      showToast("warning", "Security check required", "Complete the Cloudflare verification before sending.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animeId,
          episodeNumber,
          reporterName: reporterName.trim(),
          message: cleanMessage,
          turnstileToken: challengeToken
        })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const requestError = new Error(result.error?.message ?? "Your report could not be submitted.") as Error & { status?: number };
        requestError.status = response.status;
        throw requestError;
      }
      setSubmitted(true);
      showToast("success", "Report sent successfully", "Thank you for helping us improve the watching experience.");
    } catch (cause) {
      resetChallenge();
      const requestError = cause as Error & { status?: number };
      const errorMessage = cause instanceof Error ? cause.message : "Your report could not be submitted.";
      setError(errorMessage);
      if (requestError.status === 409) {
        showToast("warning", "Already reported", "You can report this episode again after 10 minutes.");
      } else if (requestError.status === 429) {
        showToast("warning", "Too many reports", "Please wait a few minutes before trying again.");
      } else if (requestError.status === 400 || requestError.status === 403) {
        showToast("warning", "Report needs attention", errorMessage);
      } else {
        showToast("error", "Failed to send report", "Something went wrong. Please try again later.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ReportToast toast={toast} onClose={() => setToast(null)} />
      <Script
        id="cloudflare-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setChallengeReady(true)}
        onReady={() => setChallengeReady(true)}
      />
      <AnimatedModal
        isOpen={isOpen}
        onClose={busy ? undefined : onClose}
        closeOnBackdrop={!busy}
        labelledBy="report-issue-title"
        backdropClassName="bg-[#05070b]/88 p-0 backdrop-blur-md sm:p-3"
        panelClassName="flex max-h-[calc(100dvh-20px)] w-full max-w-2xl self-end flex-col overflow-hidden rounded-t-[30px] border border-white/12 bg-[radial-gradient(circle_at_top_left,rgba(244,63,122,0.08),transparent_36%),linear-gradient(150deg,#151821,#0c0f16)] text-white shadow-[0_30px_90px_rgba(0,0,0,0.72)] sm:max-h-[calc(100dvh-24px)] sm:self-auto sm:rounded-[24px]"
      >
        {submitted ? (
          <div className="p-7 text-center sm:p-9">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
              <MaterialIcon className="text-[31px]" filled name="task_alt" />
            </span>
            <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.2em] text-emerald-300/80">Report received</p>
            <h2 id="report-issue-title" className="mt-2 text-xl font-bold">Thank you for letting us know</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/55">
              Your report for <span className="font-semibold text-white/80">{animeTitle}, Episode {episodeNumber}</span> is now available to the administrators.
            </p>
            <button type="button" onClick={onClose} className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-[#111318] hover:bg-white/90">Done</button>
          </div>
        ) : (
          <>
            <span className="mx-auto mt-2.5 block h-1 w-11 shrink-0 rounded-full bg-white/20 sm:hidden" />
            <header className="flex shrink-0 items-center justify-between gap-4 px-5 pb-4 pt-5 sm:border-b sm:border-white/8 sm:px-7 sm:py-4">
              <div className="flex min-w-0 items-center gap-4 sm:gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-rose-400/25 bg-gradient-to-br from-rose-400/25 to-pink-500/10 text-rose-300 shadow-[0_0_24px_rgba(244,63,122,0.12)]">
                  <MaterialIcon className="text-[25px] sm:text-[23px]" filled name="error" />
                </span>
                <div className="min-w-0">
                  <h2 id="report-issue-title" className="text-xl font-bold sm:text-lg">Report a problem</h2>
                  <p className="mt-1 text-sm leading-5 text-white/50 sm:mt-0.5 sm:text-xs">Help us improve your watching experience.</p>
                </div>
              </div>
              <button type="button" disabled={busy} onClick={onClose} aria-label="Close report dialog" className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.025] text-white/60 hover:bg-white/8 hover:text-white sm:h-9 sm:w-9">
                <MaterialIcon className="text-[24px] sm:text-[19px]" name="close" />
              </button>
            </header>
            <form onSubmit={submitReport} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 pb-3 pt-1 sm:px-7 sm:py-5">
                <label className="block text-sm font-semibold text-white/65 sm:text-xs">
                  Anime title
                  <span className="mt-2 flex min-h-14 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-base leading-6 text-white/85 sm:min-h-12 sm:rounded-xl sm:py-2 sm:text-sm sm:leading-5">
                    <MaterialIcon className="shrink-0 text-[21px] text-rose-300 sm:text-[19px]" filled name="lock" />
                    <span className="min-w-0 flex-1 break-words font-semibold">{animeTitle}</span>
                  </span>
                </label>

                <div className="grid grid-cols-[minmax(0,1fr)_6.75rem] gap-2.5 sm:grid-cols-[1.35fr_0.65fr] sm:gap-4">
                  <label className="block min-w-0 text-[13px] font-semibold text-white/65 sm:text-xs">
                    Your name <span className="font-normal text-white/35">(optional)</span>
                    <span className="relative mt-2 block">
                      <MaterialIcon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[21px] text-rose-300/80 sm:text-[19px]" name="person" />
                      <input value={reporterName} onChange={(event) => setReporterName(event.target.value)} maxLength={60} autoComplete="name" placeholder="How should we address you?" className="h-[52px] w-full rounded-2xl border border-white/10 bg-black/15 pl-11 pr-10 text-sm leading-5 text-white outline-none placeholder:text-white/28 focus:border-rose-300/45 sm:h-11 sm:rounded-xl sm:pr-14" />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.65rem] font-normal text-white/30">{reporterName.length}/60</span>
                    </span>
                  </label>

                  <div className="block min-w-0 text-[13px] font-semibold text-white/65 sm:text-xs">
                    <p>Episode</p>
                    <div ref={episodeMenuRef} className="relative mt-2">
                      <button
                        type="button"
                        aria-haspopup="listbox"
                        aria-expanded={episodeMenuOpen}
                        onClick={() => setEpisodeMenuOpen((open) => !open)}
                        className={`flex h-[52px] w-full items-center gap-1 rounded-2xl border bg-[#0d1017] px-2 text-[13px] font-semibold text-white outline-none transition sm:h-11 sm:gap-3 sm:rounded-xl sm:px-3.5 sm:text-sm ${episodeMenuOpen ? "border-rose-300/65 ring-2 ring-rose-400/10" : "border-white/10 hover:border-white/20"}`}
                      >
                        <MaterialIcon className="text-[19px] text-rose-300/80" name="video_library" />
                        <span className="flex-1 text-left">EP {episodeNumber}</span>
                        <MaterialIcon className={`text-[18px] text-white/45 transition-transform ${episodeMenuOpen ? "rotate-180" : ""}`} name="expand_more" />
                      </button>
                      {episodeMenuOpen ? (
                        <div role="listbox" aria-label="Episode" className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-[190px] overflow-y-auto rounded-xl border border-white/12 bg-[#11151e] p-1.5 shadow-[0_18px_45px_rgba(0,0,0,0.65)]">
                          {episodeNumbers.map((number) => (
                            <button
                              key={number}
                              type="button"
                              role="option"
                              aria-selected={episodeNumber === number}
                              data-episode={number}
                              onClick={() => {
                                setEpisodeNumber(number);
                                setEpisodeMenuOpen(false);
                              }}
                              className={`flex h-[37px] w-full items-center justify-between rounded-lg px-3 text-xs font-bold transition ${episodeNumber === number ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white" : "text-white/65 hover:bg-white/7 hover:text-white"}`}
                            >
                              <span>EP {number}</span>
                              {episodeNumber === number ? <MaterialIcon className="text-[16px]" name="check" /> : null}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <label className="block text-sm font-semibold text-white/65 sm:text-xs">
                  Message
                  <span className="relative mt-2 block">
                    <MaterialIcon className="pointer-events-none absolute left-3.5 top-3.5 text-[20px] text-rose-300/80" name="edit_note" />
                    <textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={2000} rows={4} placeholder="Describe what happened so we can investigate and fix it." className={`min-h-[130px] w-full resize-none rounded-2xl border bg-black/15 py-3 pl-11 pr-4 text-sm leading-6 text-white outline-none placeholder:text-white/28 sm:min-h-[116px] sm:rounded-xl ${message && !isMeaningfulMessage(message.trim()) ? "border-amber-300/35 focus:border-amber-300/60" : "border-white/10 focus:border-rose-300/45"}`} />
                    <span className="pointer-events-none absolute bottom-3 right-3 text-[0.65rem] font-normal text-white/30">{message.length}/2000</span>
                  </span>
                  {message && !isMeaningfulMessage(message.trim()) ? <span className="mt-1.5 block text-[0.66rem] font-normal text-amber-200/70">Use at least a few clear words describing the problem.</span> : null}
                </label>

                <div className="flex items-center justify-between gap-2 rounded-2xl border border-white/8 bg-black/15 p-2.5 sm:rounded-xl">
                  <div className="min-w-0 sm:pl-1">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-white/75 sm:text-xs"><MaterialIcon className="text-[18px] text-rose-300 sm:text-[16px]" name="verified_user" /> Security check</p>
                    <p className="mt-0.5 text-[0.62rem] leading-4 text-white/32">Protected by Cloudflare.</p>
                  </div>
                  <div className="relative h-[45px] w-[190px] shrink-0 overflow-hidden rounded-md sm:h-[52px] sm:w-[240px]">
                    <div ref={challengeContainerRef} className="absolute left-0 top-0 w-[300px] origin-top-left scale-[0.68] sm:scale-80" />
                  </div>
                  {!siteKey ? <p className="py-1 text-xs text-amber-200/80">Report verification is not configured.</p> : null}
                </div>

                {error ? <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/8 px-3.5 py-3 text-xs leading-5 text-rose-200">{error}</p> : null}
              </div>
              <footer className="flex shrink-0 flex-col gap-2.5 bg-[#0d1017]/96 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-2 sm:flex-row sm:items-center sm:justify-between sm:border-t sm:border-white/8 sm:px-7 sm:py-3.5">
                <p className="flex h-11 w-full items-center gap-2 rounded-2xl border border-white/8 bg-black/15 px-4 text-xs leading-4 text-white/38 sm:hidden">
                  <MaterialIcon className="text-[18px] text-rose-300" name="lock" />
                  Your report stays private.
                </p>
                <p className="hidden items-center gap-2 text-[0.66rem] leading-4 text-white/38 sm:flex">
                  <MaterialIcon className="text-[17px] text-rose-300" name="verified_user" />
                  Your report stays private.
                </p>
                <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto sm:gap-2">
                  <button type="button" disabled={busy} onClick={onClose} className="h-12 flex-1 rounded-2xl border border-white/8 px-4 text-sm font-bold text-white/65 hover:bg-white/5 hover:text-white sm:h-9 sm:flex-none sm:rounded-xl sm:text-xs">Cancel</button>
                  <button type="submit" disabled={busy || !challengeToken || !siteKey} className="inline-flex h-12 flex-[1.2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-500 px-4 text-sm font-bold text-white shadow-[0_7px_22px_rgba(244,63,122,0.22)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45 sm:h-9 sm:flex-none sm:rounded-xl sm:text-xs">
                  <MaterialIcon className="text-[17px]" name="send" />
                  {busy ? "Sending..." : "Send report"}
                  </button>
                </div>
              </footer>
            </form>
          </>
        )}
      </AnimatedModal>
    </>
  );
}

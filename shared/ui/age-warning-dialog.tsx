"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { useAgeGate } from "@/shared/ui/age-gate-provider";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type AgeWarningDialogProps = {
  title: string;
  artwork?: string | null;
};

export function AgeWarningDialog({ title, artwork }: AgeWarningDialogProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const { confirmAdult } = useAgeGate();

  const goBack = useCallback(() => {
    if (window.history.length > 1) router.back();
    else router.replace("/");
  }, [router]);

  useEffect(() => {
    confirmButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        goBack();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goBack]);

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[rgba(5,6,10,0.9)] p-4 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-warning-title"
    >
      {artwork ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-[-40px] scale-110 bg-cover bg-center opacity-[0.12] blur-2xl"
          style={{ backgroundImage: `url(${JSON.stringify(artwork).slice(1, -1)})` }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,55,79,0.1),transparent_34%),rgba(5,6,10,0.42)]" />

      <div
        ref={panelRef}
        className="relative my-auto w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[rgba(232,74,91,0.46)] bg-[linear-gradient(145deg,rgba(27,25,30,0.99),rgba(12,14,19,0.99))] p-4 shadow-[0_24px_72px_rgba(0,0,0,0.68),0_0_34px_rgba(218,59,77,0.07)] sm:p-5"
      >
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-64 -translate-x-1/2 rounded-full bg-[rgba(221,57,75,0.1)] blur-3xl" />

        <button
          type="button"
          aria-label="Close mature content warning"
          onClick={goBack}
          className="absolute top-4 right-4 z-10 grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-black/20 text-white/65 transition hover:border-[rgba(255,104,116,0.5)] hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee5361] motion-reduce:transition-none"
        >
          <MaterialIcon className="text-[20px]" name="close" />
        </button>

        <div className="relative flex flex-col items-center text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full border border-[rgba(232,74,91,0.3)] bg-[rgba(163,36,51,0.12)] text-[#ef5362] shadow-[0_0_22px_rgba(226,65,81,0.1)]">
            <MaterialIcon className="text-[27px]" filled name="warning" />
          </div>

          <div className="mt-3 flex w-full items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,rgba(232,74,91,0.26))]" />
            <span className="rounded-full bg-[rgba(195,48,65,0.72)] px-3 py-1 text-[0.7rem] font-black text-white shadow-[0_8px_18px_rgba(178,41,58,0.2)]">
              18+
            </span>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,rgba(232,74,91,0.26),transparent)]" />
          </div>

          <p className="sr-only">Mature Content</p>
          <h1 id="age-warning-title" className="mt-3 text-[1.35rem] leading-none font-black tracking-[-0.03em] text-white">
            <span className="text-[#ef5362]">NSFW</span> Content
          </h1>
          <p className="mt-2.5 max-w-[340px] text-[0.72rem] leading-[1.15rem] text-white/60">
            “{title}” may contain adult themes, nudity, or other sensitive material.
          </p>

          <div className="mt-4 flex w-full items-start gap-2.5 rounded-[14px] border border-white/8 bg-white/[0.035] p-3 text-left">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[rgba(181,42,58,0.12)] text-[#ef5362]">
              <MaterialIcon className="text-[22px]" name="shield_lock" />
            </span>
            <div className="min-w-0">
              <p className="text-[0.7rem] font-semibold leading-4 text-white/90">
                Continue only if you are 18 or older.
              </p>
              <p className="mt-0.5 text-[0.64rem] leading-[0.95rem] text-white/50">
                If adult content makes you uncomfortable, please go back.
              </p>
            </div>
          </div>

          <div className="mt-4 grid w-full gap-2 sm:grid-cols-[0.8fr_1.2fr]">
            <button
              type="button"
              onClick={goBack}
              className="flex h-10 items-center justify-center gap-1.5 rounded-[12px] border border-white/12 bg-white/[0.025] px-3 text-[0.72rem] font-semibold text-white/72 transition hover:border-white/20 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ee5361] motion-reduce:transition-none"
            >
              <MaterialIcon className="text-[19px]" name="arrow_back" />
              Go back
            </button>
            <button
              ref={confirmButtonRef}
              type="button"
              onClick={confirmAdult}
              className="flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-[12px] bg-[linear-gradient(105deg,#dd4b62,#cf344a)] px-3 text-[0.7rem] font-bold text-white shadow-[0_12px_28px_rgba(194,47,68,0.26)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8b96] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151419] motion-reduce:transition-none"
            >
              I understand, continue
              <MaterialIcon className="text-[17px]" name="arrow_forward" />
            </button>
          </div>

          <p className="mt-3 inline-flex items-center gap-1 text-[0.58rem] text-white/42">
            <MaterialIcon className="text-[14px] text-[#ef5362]" name="lock" />
            Your choice is remembered for this browser tab.
          </p>
        </div>
      </div>
    </div>
  );
}

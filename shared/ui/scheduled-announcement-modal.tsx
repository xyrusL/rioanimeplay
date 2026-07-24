"use client";

import { useEffect, useState } from "react";

import { loadCachedAnnouncements, type PublicAnnouncement } from "@/shared/lib/cached-announcements";
import { AnimatedModal } from "@/shared/ui/animated-modal";
import { useAgeGate } from "@/shared/ui/age-gate-provider";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type ScheduledAnnouncementModalProps = {
  placement: "home_modal" | "post_modal";
  animeId?: string;
  waitForAdultConfirmation?: boolean;
};

export function ScheduledAnnouncementModal({
  placement,
  animeId,
  waitForAdultConfirmation = false
}: ScheduledAnnouncementModalProps) {
  const [queue, setQueue] = useState<PublicAnnouncement[]>([]);
  const { ready: ageGateReady, confirmed: adultConfirmed } = useAgeGate();

  useEffect(() => {
    const params = new URLSearchParams({ placement });
    if (animeId) params.set("animeId", animeId);

    let active = true;
    void loadCachedAnnouncements(params)
      .then(({ data }) => {
        if (!active) return;
        setQueue(data.filter((next) => next.repeat === "always" || !localStorage.getItem(`notification:${next.id}:${next.occurrence ?? "once"}`)));
      })
      .catch(() => undefined);

    return () => { active = false; };
  }, [animeId, placement]);

  const item = !waitForAdultConfirmation || (ageGateReady && adultConfirmed) ? queue[0] ?? null : null;

  function close() {
    if (item && item.repeat !== "always") {
      localStorage.setItem(`notification:${item.id}:${item.occurrence ?? "once"}`, "dismissed");
    }
    setQueue((current) => current.slice(1));
  }

  return (
    <AnimatedModal
      isOpen={Boolean(item)}
      onClose={close}
      labelledBy="scheduled-announcement-title"
      backdropClassName="bg-[rgba(4,5,10,0.86)] px-4 py-5 backdrop-blur-[10px]"
      panelClassName="relative w-full max-w-[460px] overflow-hidden rounded-[24px] border border-[rgba(180,156,255,0.24)] bg-[linear-gradient(145deg,rgba(31,28,47,0.98),rgba(17,18,29,0.98))] shadow-[0_28px_76px_rgba(0,0,0,0.62),0_0_44px_rgba(125,72,255,0.1)]"
    >
      <div className="relative p-5">
        <div className="pointer-events-none absolute -top-24 -left-20 h-56 w-56 rounded-full bg-[rgba(218,63,181,0.16)] blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-[rgba(90,72,255,0.18)] blur-3xl" />

        <header className="relative flex items-start gap-3.5 pr-11">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(145deg,#ef56ad_0%,#9b45f3_48%,#5d55ff_100%)] text-white shadow-[0_12px_28px_rgba(139,68,244,0.34)]">
            <MaterialIcon className="text-[27px]" filled name={item?.kind === "video_ads" ? "ads_click" : "notifications_active"} />
          </span>
          <div className="min-w-0 pt-0.5 sm:pt-1">
            <h2
              id="scheduled-announcement-title"
              className="text-[1.3rem] leading-tight font-bold text-white"
            >
              {item?.kind === "video_ads" ? "Before you watch" : <>Hello there! <span aria-hidden="true">👋</span></>}
            </h2>
            <p className="mt-1.5 text-sm leading-5 text-[rgba(229,225,240,0.7)]">
              {item?.kind === "video_ads" ? "A quick note about this video player." : "We've got an update to share with you."}
            </p>
          </div>
        </header>

        <button
          type="button"
          aria-label="Close announcement"
          onClick={close}
          className="absolute top-4 right-4 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/15 text-white/65 transition-[border-color,color,background-color,transform] hover:rotate-3 hover:border-white/20 hover:bg-white/5 hover:text-white"
        >
          <MaterialIcon className="text-[20px]" name="close" />
        </button>

        <section className="relative mt-4 rounded-[18px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.055),rgba(255,255,255,0.025))] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className="flex items-start gap-3 sm:gap-5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[rgba(151,75,237,0.13)] text-[#c984ff] ring-1 ring-[rgba(190,132,255,0.08)]">
              <MaterialIcon className="text-[23px]" name="auto_awesome" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="text-base leading-5 font-bold text-white">
                  {item?.title}
                </h3>
                <span className="shrink-0 rounded-lg bg-[linear-gradient(135deg,#a23ee4,#6b43d7)] px-2.5 py-1 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-white shadow-[0_8px_22px_rgba(117,57,209,0.3)]">
                  {item?.kind === "video_ads" ? "Notice" : "New"}
                </span>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-5 text-[rgba(229,225,240,0.72)]">
                {item?.message}
              </p>
            </div>
          </div>
        </section>

        <footer className="relative mt-4 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              For you <span className="text-[#ef67b5]">♥</span>
            </p>
            <p className="truncate text-xs text-white/50">Thanks for being part of RioAnime.</p>
          </div>
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(110deg,#eb5aa8,#a647e8_52%,#6655ff)] px-5 text-sm font-bold text-white shadow-[0_14px_32px_rgba(139,65,229,0.28)] transition-[transform,filter,box-shadow] hover:-translate-y-0.5 hover:brightness-110 hover:shadow-[0_18px_38px_rgba(139,65,229,0.38)]"
          >
            Got it!
            <MaterialIcon className="text-[22px]" name="arrow_forward" />
          </button>
        </footer>
      </div>
    </AnimatedModal>
  );
}

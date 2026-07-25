"use client";

import { useEffect, useState } from "react";

import { loadCachedAnnouncements, type PublicAnnouncement } from "@/shared/lib/cached-announcements";
import { AnimatedModal } from "@/shared/ui/animated-modal";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export function AnnouncementStrip() {
  const [isOpen, setIsOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<PublicAnnouncement | null>(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ placement: "home_inline" });
    void loadCachedAnnouncements(params)
      .then(({ data }) => { if (active) setAnnouncement(data[0] ?? null); })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  if (!announcement) return null;
  const { title, message } = announcement;

  return (
    <>
      <section className="rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card-soft)] px-5 py-4 shadow-[var(--soft-shadow)]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5">
          <div className="min-w-0 space-y-1">
            <p className="flex items-center gap-2 font-display text-[0.9rem] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
              <MaterialIcon className="text-[18px]" name="campaign" />
              {title}
            </p>
            <p className="line-clamp-2 text-sm leading-6 text-[var(--text-secondary)]">
              {message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="inline-flex w-fit shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.18em] text-[var(--text-primary)] shadow-[0_10px_26px_rgba(0,0,0,0.14)] transition-[border-color,color,transform,background-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[var(--accent-soft)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.22)]"
          >
            <MaterialIcon className="text-[17px] text-[var(--accent-strong)]" name="info" />
            More Info
          </button>
        </div>
      </section>

      <AnimatedModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        backdropClassName="bg-[var(--modal-overlay)] px-3 py-4 backdrop-blur-sm sm:px-4"
        panelClassName="relative max-h-[calc(100dvh-2rem)] w-full max-w-[680px] overflow-y-auto rounded-[22px] border border-[var(--line-strong)] bg-[var(--modal-surface)] p-5 shadow-[var(--modal-shadow)] sm:rounded-[30px] sm:p-6"
      >
        <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2.5 pr-11 sm:gap-x-3 sm:pr-12">
          <MaterialIcon className="mt-0.5 text-[18px] text-[var(--accent-strong)]" name="campaign" />
          <div className="min-w-0 space-y-2">
            <p className="font-display text-[0.8rem] leading-5 uppercase tracking-[0.18em] text-[var(--accent-strong)] sm:text-[0.86rem] sm:tracking-[0.22em]">
              {title}
            </p>
            <p className="text-sm leading-6 text-[var(--text-secondary)] sm:text-[0.98rem] sm:leading-7">
              {message}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Close announcement details"
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] transition-[border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] sm:right-5 sm:top-5"
        >
          <MaterialIcon className="text-[18px]" name="close" />
        </button>
      </AnimatedModal>
    </>
  );
}

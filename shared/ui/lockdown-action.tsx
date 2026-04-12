"use client";

import { type ReactNode, useState } from "react";
import { useRouter } from "next/navigation";

type LockdownActionProps = {
  children: ReactNode;
  className: string;
  href?: string;
  locked: boolean;
  message: string;
  modalTitle?: string;
};

export function LockdownAction({
  children,
  className,
  href,
  locked,
  message,
  modalTitle = "Temporarily unavailable"
}: LockdownActionProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  function handleClick() {
    if (locked) {
      setIsOpen(true);
      return;
    }

    if (href) {
      router.push(href);
    }
  }

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {children}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[420] flex items-center justify-center bg-[var(--modal-overlay)] px-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[520px] rounded-[28px] border border-[var(--line-strong)] bg-[var(--modal-surface)] p-6 shadow-[var(--modal-shadow)]"
          >
            <p className="font-display text-[0.82rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
              {modalTitle}
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)] sm:text-[0.98rem]">
              {message}
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center rounded-full border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-[border-color,color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:text-[var(--text-primary)]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

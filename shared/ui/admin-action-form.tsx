"use client";

import type { ReactNode } from "react";
import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";

import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState
} from "@/app/admin/action-state";
import { MOTION_VARIANTS } from "@/shared/lib/motion";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type AdminActionFormProps = {
  action: (
    state: AdminActionState,
    formData: FormData
  ) => Promise<AdminActionState>;
  children: ReactNode;
  className?: string;
  refreshOnSuccess?: boolean;
};

const STATUS_STYLES: Record<
  Exclude<AdminActionState["status"], "idle">,
  {
    icon: string;
    ring: string;
    accent: string;
  }
> = {
  success: {
    icon: "check_circle",
    ring: "border-[rgba(88,220,165,0.24)]",
    accent: "text-[#8af0bf]"
  },
  failed: {
    icon: "warning",
    ring: "border-[rgba(255,196,92,0.24)]",
    accent: "text-[#ffd37a]"
  },
  error: {
    icon: "error",
    ring: "border-[rgba(255,120,150,0.24)]",
    accent: "text-[#ffb5c7]"
  }
};

function AdminFeedbackToast({
  state,
  onClose
}: {
  state: AdminActionState;
  onClose: () => void;
}) {
  if (state.status === "idle") {
    return null;
  }

  const style = STATUS_STYLES[state.status];

  return (
    <AnimatePresence>
      <motion.div
        key={`${state.status}-${state.title}`}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={MOTION_VARIANTS.toast}
        className="pointer-events-none fixed top-5 right-5 z-[460] w-full max-w-[360px] px-4 sm:px-0"
      >
        <div
          className={`pointer-events-auto rounded-[24px] border bg-[var(--modal-surface)] px-4 py-4 shadow-[var(--modal-shadow)] backdrop-blur-md ${style.ring}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.08)] bg-[var(--modal-section-surface)] ${style.accent}`}
            >
              <MaterialIcon className="text-[20px]" filled name={style.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{state.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                {state.message}
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss save status"
              onClick={onClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] text-[var(--text-secondary)] transition-[border-color,color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:border-[rgba(255,255,255,0.18)] hover:text-white"
            >
              <MaterialIcon className="text-[16px]" name="close" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function AdminActionForm({
  action,
  children,
  className,
  refreshOnSuccess = false
}: AdminActionFormProps) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    action,
    INITIAL_ADMIN_ACTION_STATE
  );
  const [toastState, setToastState] = useState(INITIAL_ADMIN_ACTION_STATE);

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }

    setToastState(state);

    if (state.status === "success" && refreshOnSuccess) {
      const refreshTimer = window.setTimeout(() => {
        router.refresh();
      }, 700);

      const clearTimer = window.setTimeout(() => {
        setToastState(INITIAL_ADMIN_ACTION_STATE);
      }, 3800);

      return () => {
        window.clearTimeout(refreshTimer);
        window.clearTimeout(clearTimer);
      };
    }

    const clearTimer = window.setTimeout(() => {
      setToastState(INITIAL_ADMIN_ACTION_STATE);
    }, state.status === "success" ? 3200 : 4200);

    return () => {
      window.clearTimeout(clearTimer);
    };
  }, [refreshOnSuccess, router, state]);

  return (
    <>
      <form action={formAction} className={className} data-pending={isPending || undefined}>
        {children}
      </form>
      <AdminFeedbackToast
        state={toastState}
        onClose={() => setToastState(INITIAL_ADMIN_ACTION_STATE)}
      />
    </>
  );
}

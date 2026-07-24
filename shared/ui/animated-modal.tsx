"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import { MOTION_VARIANTS } from "@/shared/lib/motion";

type AnimatedModalProps = {
  children: ReactNode;
  isOpen: boolean;
  panelClassName: string;
  onClose?: () => void;
  labelledBy?: string;
  placement?: "center" | "bottom";
  closeOnBackdrop?: boolean;
  backdropClassName?: string;
  containerClassName?: string;
};

export function AnimatedModal({
  children,
  isOpen,
  panelClassName,
  onClose,
  labelledBy,
  placement = "center",
  closeOnBackdrop = true,
  backdropClassName,
  containerClassName
}: AnimatedModalProps) {
  const alignmentClassName =
    placement === "bottom"
      ? "items-end"
      : "items-center";

  if (typeof document === "undefined") return null;

  const portalRoot = document.querySelector<HTMLElement>(".admin-shell") ?? document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          key="modal-backdrop"
          initial="initial"
          animate="animate"
          exit="exit"
          variants={MOTION_VARIANTS.backdrop}
          className={`fixed inset-0 z-[420] flex justify-center ${alignmentClassName} ${backdropClassName ?? ""}`}
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div
            key="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={placement === "bottom" ? MOTION_VARIANTS.sheet : MOTION_VARIANTS.modal}
            className={`${panelClassName} ${containerClassName ?? ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    portalRoot
  );
}

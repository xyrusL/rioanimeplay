"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      const documentHeight = document.documentElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const maxScroll = Math.max(documentHeight - viewportHeight, 0);

      const hasLargeHeight = documentHeight > viewportHeight * 1.6;
      const isNearBottom = maxScroll > 0 && scrollTop / maxScroll > 0.58;

      setIsVisible(hasLargeHeight && isNearBottom);
    }

    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    window.addEventListener("resize", updateVisibility);

    return () => {
      window.removeEventListener("scroll", updateVisibility);
      window.removeEventListener("resize", updateVisibility);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <button
      type="button"
      aria-label="Go back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed right-6 bottom-8 z-[240] inline-flex h-13 w-13 items-center justify-center rounded-full border border-[var(--line-soft)] bg-[rgba(17,18,23,0.88)] text-[var(--accent-strong)] shadow-[0_18px_38px_rgba(0,0,0,0.34)] backdrop-blur-sm transition-[transform,border-color,color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-1 hover:border-[var(--line-strong)] hover:bg-[rgba(24,25,31,0.96)] hover:text-[var(--text-primary)] sm:right-8 sm:bottom-10"
    >
      <MaterialIcon className="text-[22px]" name="keyboard_arrow_up" />
    </button>
  );
}

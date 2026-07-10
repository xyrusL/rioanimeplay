"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export const ROUTE_PROGRESS_START_EVENT = "rioanime:route-progress-start";

function shouldTrackAnchorClick(event: MouseEvent) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return false;
  }

  const target = event.target as HTMLElement | null;
  const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;

  if (!anchor) {
    return false;
  }

  const href = anchor.getAttribute("href");

  if (!href || href.startsWith("#") || anchor.hasAttribute("download")) {
    return false;
  }

  if (anchor.target && anchor.target !== "_self") {
    return false;
  }

  const url = new URL(anchor.href, window.location.href);

  if (url.origin !== window.location.origin) {
    return false;
  }

  return `${url.pathname}${url.search}` !== `${window.location.pathname}${window.location.search}`;
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const isActiveRef = useRef(false);
  const currentLocation = useMemo(
    () => `${pathname}?${searchParams?.toString() ?? ""}`,
    [pathname, searchParams]
  );

  useEffect(() => {
    function clearTicker() {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    function startProgress() {
      clearTicker();
      isActiveRef.current = true;
      setIsVisible(true);
      setProgress((current) => (current > 0 && current < 80 ? current : 12));

      intervalRef.current = window.setInterval(() => {
        setProgress((current) => {
          if (current >= 88) {
            return current;
          }

          const nextStep = current < 45 ? 9 : current < 72 ? 5 : 2;
          return Math.min(88, current + nextStep);
        });
      }, 180);
    }

    function handleDocumentClick(event: MouseEvent) {
      if (shouldTrackAnchorClick(event)) {
        startProgress();
      }
    }

    function handleManualStart() {
      startProgress();
    }

    document.addEventListener("click", handleDocumentClick);
    window.addEventListener(ROUTE_PROGRESS_START_EVENT, handleManualStart);

    return () => {
      clearTicker();
      document.removeEventListener("click", handleDocumentClick);
      window.removeEventListener(ROUTE_PROGRESS_START_EVENT, handleManualStart);
    };
  }, []);

  useEffect(() => {
    if (!isActiveRef.current) {
      return;
    }

    isActiveRef.current = false;

    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setProgress(100);

    const hideTimer = window.setTimeout(() => {
      setIsVisible(false);
      setProgress(0);
    }, 280);

    return () => window.clearTimeout(hideTimer);
  }, [currentLocation]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-[500] h-[3px] transition-opacity duration-[var(--motion-base)] ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full bg-[linear-gradient(90deg,var(--accent),var(--accent-strong),var(--accent))] shadow-[0_0_18px_var(--accent-glow)] transition-[width] duration-[var(--motion-base)] ease-[var(--ease-soft)]"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

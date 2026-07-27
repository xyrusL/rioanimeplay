"use client";

import { useEffect } from "react";

const DEVTOOLS_SIZE_THRESHOLD = 160;

export function AntiInspectGuard({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const redirectHome = () => {
      if (window.location.pathname !== "/home") window.location.replace("/home");
    };
    const detectDockedDevTools = () => {
      const widthDifference = window.outerWidth - window.innerWidth;
      const heightDifference = window.outerHeight - window.innerHeight;
      if (widthDifference > DEVTOOLS_SIZE_THRESHOLD || heightDifference > DEVTOOLS_SIZE_THRESHOLD) redirectHome();
    };
    const detectDevToolsShortcut = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const inspectShortcut = event.key === "F12"
        || ((event.ctrlKey || event.metaKey) && event.shiftKey && ["i", "j", "c"].includes(key))
        || ((event.ctrlKey || event.metaKey) && key === "u");
      if (!inspectShortcut) return;
      event.preventDefault();
      redirectHome();
    };

    detectDockedDevTools();
    const interval = window.setInterval(detectDockedDevTools, 1000);
    window.addEventListener("resize", detectDockedDevTools);
    window.addEventListener("keydown", detectDevToolsShortcut, true);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("resize", detectDockedDevTools);
      window.removeEventListener("keydown", detectDevToolsShortcut, true);
    };
  }, [enabled]);

  return null;
}

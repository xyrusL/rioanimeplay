"use client";

import { useEffect, useState } from "react";

type ResponsiveRenderProps = {
  initialIsMobile: boolean;
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  breakpoint?: number;
};

export function ResponsiveRender({
  initialIsMobile,
  mobile,
  desktop,
  breakpoint = 1024
}: ResponsiveRenderProps) {
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const updateMatch = () => setIsMobile(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, [breakpoint]);

  return isMobile ? mobile : desktop;
}

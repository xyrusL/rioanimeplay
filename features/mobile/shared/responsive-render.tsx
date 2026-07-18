"use client";

import { useEffect, useState } from "react";
import { isLikelyMobileClient } from "@/shared/lib/mobile-detection";

type ResponsiveRenderProps = {
  initialIsMobile: boolean;
  mobile: React.ReactNode;
  desktop: React.ReactNode;
  mobileViewportFallback?: boolean;
};

export function ResponsiveRender({
  initialIsMobile,
  mobile,
  desktop,
  mobileViewportFallback = false
}: ResponsiveRenderProps) {
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    const updateMatch = () => {
      const matchesMobileViewport = mobileViewportFallback && window.innerWidth <= 440;
      setIsMobile(isLikelyMobileClient() || matchesMobileViewport);
    };

    updateMatch();
    window.addEventListener("resize", updateMatch);
    window.addEventListener("orientationchange", updateMatch);

    return () => {
      window.removeEventListener("resize", updateMatch);
      window.removeEventListener("orientationchange", updateMatch);
    };
  }, [mobileViewportFallback]);

  return isMobile ? mobile : desktop;
}

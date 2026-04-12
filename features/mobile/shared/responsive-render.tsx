"use client";

import { useEffect, useState } from "react";
import { isLikelyMobileClient } from "@/shared/lib/mobile-detection";

type ResponsiveRenderProps = {
  initialIsMobile: boolean;
  mobile: React.ReactNode;
  desktop: React.ReactNode;
};

export function ResponsiveRender({
  initialIsMobile,
  mobile,
  desktop
}: ResponsiveRenderProps) {
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  useEffect(() => {
    const updateMatch = () => setIsMobile(isLikelyMobileClient());

    updateMatch();
    window.addEventListener("resize", updateMatch);
    window.addEventListener("orientationchange", updateMatch);

    return () => {
      window.removeEventListener("resize", updateMatch);
      window.removeEventListener("orientationchange", updateMatch);
    };
  }, []);

  return isMobile ? mobile : desktop;
}

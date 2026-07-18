"use client";

import { useEffect, useState } from "react";

import {
  getPublicCacheStaleStatus,
  PUBLIC_CACHE_STATUS_EVENT
} from "@/shared/lib/public-resource-cache";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export function PublicCacheStatus() {
  const [stale, setStale] = useState(getPublicCacheStaleStatus);

  useEffect(() => {
    function update(event: Event) {
      setStale(Boolean((event as CustomEvent<{ stale?: boolean }>).detail?.stale));
    }
    window.addEventListener(PUBLIC_CACHE_STATUS_EVENT, update);
    return () => window.removeEventListener(PUBLIC_CACHE_STATUS_EVENT, update);
  }, []);

  if (!stale) return null;
  return (
    <div className="fixed bottom-5 left-1/2 z-[500] flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300/25 bg-[#211b12]/95 px-4 py-2 text-xs font-semibold text-amber-100 shadow-2xl backdrop-blur">
      <MaterialIcon className="text-[17px]" name="cloud_off" />
      Showing saved data while the server is unavailable
    </div>
  );
}

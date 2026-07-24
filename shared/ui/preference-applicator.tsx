"use client";

import { useEffect } from "react";

import { getUserPreferences, USER_PREFERENCES_EVENT } from "@/shared/lib/user-preferences";

type PreferenceApplicatorProps = {
  defaultFontPreset: string;
  defaultThemePreset: string;
};

export function PreferenceApplicator({
  defaultFontPreset,
  defaultThemePreset
}: PreferenceApplicatorProps) {
  useEffect(() => {
    function applyPreferences() {
      const preferences = getUserPreferences();
      const root = document.documentElement;
      root.dataset.themePreset = preferences.themePreset ?? defaultThemePreset;
      root.dataset.fontPreset = preferences.fontPreset ?? defaultFontPreset;
      root.dataset.fontSize = preferences.fontSize;
    }

    applyPreferences();
    window.addEventListener(USER_PREFERENCES_EVENT, applyPreferences);
    window.addEventListener("storage", applyPreferences);

    return () => {
      window.removeEventListener(USER_PREFERENCES_EVENT, applyPreferences);
      window.removeEventListener("storage", applyPreferences);
    };
  }, [defaultFontPreset, defaultThemePreset]);

  return null;
}

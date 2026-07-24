import {
  isFontPreset,
  isThemePreset,
  type FontPreset,
  type ThemePreset
} from "@/shared/lib/appearance-presets";

export const USER_PREFERENCES_KEY = "rioanime:user-preferences";
export const USER_PREFERENCES_EVENT = "rioanime:preferences-change";

export const FONT_SIZE_OPTIONS = [
  { value: "small", label: "Small", scale: "0.9" },
  { value: "default", label: "Default", scale: "1" },
  { value: "large", label: "Large", scale: "1.1" },
  { value: "x-large", label: "X-large", scale: "1.2" }
] as const;

export type FontSizePreference = (typeof FONT_SIZE_OPTIONS)[number]["value"];

export type UserPreferences = {
  fontPreset: FontPreset | null;
  fontSize: FontSizePreference;
  themePreset: ThemePreset | null;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  fontPreset: null,
  fontSize: "default",
  themePreset: null
};

function isFontSizePreference(value: unknown): value is FontSizePreference {
  return FONT_SIZE_OPTIONS.some((option) => option.value === value);
}

export function getUserPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_USER_PREFERENCES;

  try {
    const rawValue = window.localStorage.getItem(USER_PREFERENCES_KEY);
    if (!rawValue) return DEFAULT_USER_PREFERENCES;
    const candidate = JSON.parse(rawValue) as Partial<UserPreferences>;

    return {
      fontPreset: isFontPreset(candidate.fontPreset) ? candidate.fontPreset : null,
      fontSize: isFontSizePreference(candidate.fontSize) ? candidate.fontSize : "default",
      themePreset: isThemePreset(candidate.themePreset) ? candidate.themePreset : null
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveUserPreferences(preferences: UserPreferences): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new CustomEvent(USER_PREFERENCES_EVENT));
    return true;
  } catch {
    // Browsing preferences are optional when storage is unavailable.
    return false;
  }
}

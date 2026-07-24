export const THEME_PRESETS = [
  "dark-purple",
  "dark-rose",
  "dark-strawberry",
  "dark-chocolate",
  "dark-amber",
  "dark-pink",
  "dark-neon",
  "dark-midnight"
] as const;

export const FONT_PRESETS = [
  "lexend-default",
  "outfit-manrope",
  "sora-nunito"
] as const;

export type ThemePreset = (typeof THEME_PRESETS)[number];
export type FontPreset = (typeof FONT_PRESETS)[number];

export const THEME_OPTIONS: ReadonlyArray<{
  accent: string;
  label: string;
  value: ThemePreset;
}> = [
  { value: "dark-purple", label: "Purple", accent: "#8d72ff" },
  { value: "dark-rose", label: "Rose", accent: "#cf5f90" },
  { value: "dark-strawberry", label: "Berry", accent: "#c94f68" },
  { value: "dark-chocolate", label: "Cocoa", accent: "#b47a58" },
  { value: "dark-amber", label: "Amber", accent: "#ffb45f" },
  { value: "dark-pink", label: "Pink", accent: "#d764aa" },
  { value: "dark-neon", label: "Ocean", accent: "#2fe1ff" },
  { value: "dark-midnight", label: "Midnight", accent: "#6f8fff" }
];

export const FONT_OPTIONS: ReadonlyArray<{
  bodyFamily: string;
  displayFamily: string;
  label: string;
  value: FontPreset;
}> = [
  {
    value: "lexend-default",
    label: "Lexend",
    bodyFamily: "var(--font-lexend)",
    displayFamily: "var(--font-lexend)"
  },
  {
    value: "outfit-manrope",
    label: "Outfit + Manrope",
    bodyFamily: "var(--font-manrope)",
    displayFamily: "var(--font-outfit)"
  },
  {
    value: "sora-nunito",
    label: "Sora + Nunito",
    bodyFamily: "var(--font-nunito)",
    displayFamily: "var(--font-sora)"
  }
];

export function isThemePreset(value: unknown): value is ThemePreset {
  return typeof value === "string" && THEME_PRESETS.includes(value as ThemePreset);
}

export function isFontPreset(value: unknown): value is FontPreset {
  return typeof value === "string" && FONT_PRESETS.includes(value as FontPreset);
}

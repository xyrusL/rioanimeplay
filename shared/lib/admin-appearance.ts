export const ADMIN_FONT_SIZES = ["comfortable", "large", "extra-large"] as const;
export const ADMIN_FONT_FAMILIES = ["manrope", "lexend", "outfit", "sora"] as const;
export const ADMIN_THEMES = ["midnight", "slate"] as const;
export const ADMIN_ACCENTS = ["indigo", "violet", "rose", "cyan", "amber"] as const;

export type AdminAppearance = {
  fontSize: (typeof ADMIN_FONT_SIZES)[number];
  fontFamily: (typeof ADMIN_FONT_FAMILIES)[number];
  theme: (typeof ADMIN_THEMES)[number];
  accent: (typeof ADMIN_ACCENTS)[number];
};

export const DEFAULT_ADMIN_APPEARANCE: AdminAppearance = {
  fontSize: "comfortable",
  fontFamily: "manrope",
  theme: "midnight",
  accent: "indigo"
};

export function normalizeAdminAppearance(input: unknown): AdminAppearance {
  const candidate = input && typeof input === "object" ? input as Partial<AdminAppearance> : {};
  return {
    fontSize: ADMIN_FONT_SIZES.includes(candidate.fontSize as AdminAppearance["fontSize"]) ? candidate.fontSize as AdminAppearance["fontSize"] : DEFAULT_ADMIN_APPEARANCE.fontSize,
    fontFamily: ADMIN_FONT_FAMILIES.includes(candidate.fontFamily as AdminAppearance["fontFamily"]) ? candidate.fontFamily as AdminAppearance["fontFamily"] : DEFAULT_ADMIN_APPEARANCE.fontFamily,
    theme: ADMIN_THEMES.includes(candidate.theme as AdminAppearance["theme"]) ? candidate.theme as AdminAppearance["theme"] : DEFAULT_ADMIN_APPEARANCE.theme,
    accent: ADMIN_ACCENTS.includes(candidate.accent as AdminAppearance["accent"]) ? candidate.accent as AdminAppearance["accent"] : DEFAULT_ADMIN_APPEARANCE.accent
  };
}

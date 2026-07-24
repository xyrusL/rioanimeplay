import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { toAnimeSlug } from "@/entities/anime/lib/slug";
import { DEFAULT_ADMIN_APPEARANCE, normalizeAdminAppearance, type AdminAppearance } from "@/shared/lib/admin-appearance";
import {
  isFontPreset,
  isThemePreset,
  type FontPreset,
  type ThemePreset
} from "@/shared/lib/appearance-presets";

export { FONT_PRESETS, THEME_PRESETS } from "@/shared/lib/appearance-presets";
export type { FontPreset, ThemePreset } from "@/shared/lib/appearance-presets";

export const ANIME_RULE_STATUSES = ["public", "locked", "private"] as const;
export type AnimeRuleStatus = (typeof ANIME_RULE_STATUSES)[number];

export type SiteAnnouncementSettings = {
  title: string;
  message: string;
};

export type SiteAuthLockdownSettings = {
  enabled: boolean;
  message: string;
};

export type SiteAnimeRule = {
  animeId?: number;
  slug: string;
  title: string;
  status: Exclude<AnimeRuleStatus, "public">;
  message?: string;
  updatedAt: string;
};

export type SiteSettings = {
  themePreset: ThemePreset;
  fontPreset: FontPreset;
  announcement: SiteAnnouncementSettings;
  authLockdown: SiteAuthLockdownSettings;
  animeRules: SiteAnimeRule[];
  adminAppearance: AdminAppearance;
};

const SETTINGS_DIR = path.join(process.cwd(), "data");
const SETTINGS_PATH = path.join(SETTINGS_DIR, "site-settings.json");

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  themePreset: "dark-purple",
  fontPreset: "lexend-default",
  announcement: {
    title: "Welcome to RioAnimePlay",
    message:
      "Browse the RioAnime library, search titles, explore genres, and open available episodes from one place."
  },
  authLockdown: {
    enabled: false,
    message: "Login and registration are currently unavailable."
  },
  animeRules: [],
  adminAppearance: DEFAULT_ADMIN_APPEARANCE
};

function isAnimeRuleStatus(value: string): value is Exclude<AnimeRuleStatus, "public"> {
  return value === "locked" || value === "private";
}

function normalizeAnimeRules(input: unknown): SiteAnimeRule[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<SiteAnimeRule[]>((rules, entry) => {
      if (!entry || typeof entry !== "object") {
        return rules;
      }

      const candidate = entry as Partial<SiteAnimeRule>;
      const slug = typeof candidate.slug === "string" ? candidate.slug.trim() : "";
      const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
      const status = typeof candidate.status === "string" ? candidate.status : "";

      if (!slug || !title || !isAnimeRuleStatus(status)) {
        return rules;
      }

      rules.push({
        animeId: typeof candidate.animeId === "number" ? candidate.animeId : undefined,
        slug,
        title,
        status,
        message: typeof candidate.message === "string" ? candidate.message.trim() : undefined,
        updatedAt:
          typeof candidate.updatedAt === "string" && candidate.updatedAt.trim()
            ? candidate.updatedAt
            : new Date().toISOString()
      } satisfies SiteAnimeRule);

      return rules;
    }, []);
}

function normalizeSettings(input: unknown): SiteSettings {
  if (!input || typeof input !== "object") {
    return DEFAULT_SITE_SETTINGS;
  }

  const candidate = input as Partial<SiteSettings>;
  const announcement = candidate.announcement ?? DEFAULT_SITE_SETTINGS.announcement;
  const authLockdown = candidate.authLockdown ?? DEFAULT_SITE_SETTINGS.authLockdown;

  return {
    themePreset:
      typeof candidate.themePreset === "string" && isThemePreset(candidate.themePreset)
        ? candidate.themePreset
        : DEFAULT_SITE_SETTINGS.themePreset,
    fontPreset:
      typeof candidate.fontPreset === "string" && isFontPreset(candidate.fontPreset)
        ? candidate.fontPreset
        : DEFAULT_SITE_SETTINGS.fontPreset,
    announcement: {
      title:
        typeof announcement.title === "string" && announcement.title.trim()
          ? announcement.title.trim()
          : DEFAULT_SITE_SETTINGS.announcement.title,
      message:
        typeof announcement.message === "string" && announcement.message.trim()
          ? announcement.message.trim()
          : DEFAULT_SITE_SETTINGS.announcement.message
    },
    authLockdown: {
      enabled:
        typeof authLockdown.enabled === "boolean"
          ? authLockdown.enabled
          : DEFAULT_SITE_SETTINGS.authLockdown.enabled,
      message:
        typeof authLockdown.message === "string" && authLockdown.message.trim()
          ? authLockdown.message.trim()
          : DEFAULT_SITE_SETTINGS.authLockdown.message
    },
    animeRules: normalizeAnimeRules(candidate.animeRules),
    adminAppearance: normalizeAdminAppearance(candidate.adminAppearance)
  };
}

async function ensureSettingsFile() {
  await mkdir(SETTINGS_DIR, { recursive: true });

  try {
    await readFile(SETTINGS_PATH, "utf8");
  } catch {
    await writeFile(
      SETTINGS_PATH,
      JSON.stringify(DEFAULT_SITE_SETTINGS, null, 2),
      "utf8"
    );
  }
}

export async function getSiteSettings(): Promise<SiteSettings> {
  await ensureSettingsFile();

  try {
    const raw = await readFile(SETTINGS_PATH, "utf8");
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

export async function saveSiteSettings(settings: SiteSettings) {
  await ensureSettingsFile();
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf8");
}

export async function updateSiteSettings(
  updater: (current: SiteSettings) => SiteSettings | Promise<SiteSettings>
) {
  const current = await getSiteSettings();
  const next = normalizeSettings(await updater(current));
  await saveSiteSettings(next);
  return next;
}

export function getAnimeRuleBySlug(settings: SiteSettings, slug: string) {
  return settings.animeRules.find((rule) => rule.slug === slug) ?? null;
}

export function getAnimeRuleByTitle(settings: SiteSettings, title: string) {
  return getAnimeRuleBySlug(settings, toAnimeSlug(title));
}

export function isAnimePrivate(settings: SiteSettings, title: string) {
  return getAnimeRuleByTitle(settings, title)?.status === "private";
}

export function isAnimeLocked(settings: SiteSettings, title: string) {
  return getAnimeRuleByTitle(settings, title)?.status === "locked";
}

export function filterPrivateAnimeItems<T extends { title: string }>(
  items: T[],
  settings: SiteSettings
) {
  return items.filter((item) => !isAnimePrivate(settings, item.title));
}

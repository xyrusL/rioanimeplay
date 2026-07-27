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

export type SiteAuthLockdownSettings = {
  enabled: boolean;
  message: string;
};

export type SiteSecuritySettings = {
  antiInspect: boolean;
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
  authLockdown: SiteAuthLockdownSettings;
  security: SiteSecuritySettings;
  animeRules: SiteAnimeRule[];
  adminAppearance: AdminAppearance;
};

const SETTINGS_DIR = path.join(process.cwd(), "data");
const SETTINGS_PATH = path.join(SETTINGS_DIR, "site-settings.json");
const API_URL = process.env.RIOANIME_API_URL ?? "https://api.rioanime.dezely.com";

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  themePreset: "dark-purple",
  fontPreset: "lexend-default",
  authLockdown: {
    enabled: false,
    message: "Login and registration are currently unavailable."
  },
  security: {
    antiInspect: false
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
  const authLockdown = candidate.authLockdown ?? DEFAULT_SITE_SETTINGS.authLockdown;
  const security = candidate.security ?? DEFAULT_SITE_SETTINGS.security;

  return {
    themePreset:
      typeof candidate.themePreset === "string" && isThemePreset(candidate.themePreset)
        ? candidate.themePreset
        : DEFAULT_SITE_SETTINGS.themePreset,
    fontPreset:
      typeof candidate.fontPreset === "string" && isFontPreset(candidate.fontPreset)
        ? candidate.fontPreset
        : DEFAULT_SITE_SETTINGS.fontPreset,
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
    security: {
      antiInspect:
        typeof security.antiInspect === "boolean"
          ? security.antiInspect
          : DEFAULT_SITE_SETTINGS.security.antiInspect
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
    const settings = normalizeSettings(JSON.parse(raw));
    const apiKey = process.env.RIOANIME_API_KEY;
    if (!apiKey) return settings;

    try {
      const response = await fetch(`${API_URL}/v1/site-settings`, {
        headers: { Accept: "application/json", "X-RioAnime-Key": apiKey },
        next: { revalidate: 300, tags: ["site-security-settings"] }
      });
      if (!response.ok) return settings;
      const remote = await response.json() as { security?: { antiInspect?: unknown } };
      if (typeof remote.security?.antiInspect !== "boolean") return settings;
      return { ...settings, security: { antiInspect: remote.security.antiInspect } };
    } catch {
      return settings;
    }
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

export function filterPrivateAnimeItems<T extends { title: string }>(
  items: T[],
  settings: SiteSettings
) {
  return items.filter((item) => !isAnimePrivate(settings, item.title));
}

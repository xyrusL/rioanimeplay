"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth, signOut } from "@/auth";
import {
  INITIAL_ADMIN_ACTION_STATE,
  type AdminActionState
} from "@/app/admin/action-state";
import {
  clearAdminSession,
  createAdminSession,
  createPersistentAdminSession,
  requireAdminAuthentication,
  verifyAdminCredentials
} from "@/shared/lib/admin-auth";
import { ADMIN_ACCENTS, ADMIN_FONT_FAMILIES, ADMIN_FONT_SIZES, ADMIN_THEMES, type AdminAppearance } from "@/shared/lib/admin-appearance";
import {
  FONT_PRESETS,
  THEME_PRESETS,
  updateSiteSettings
} from "@/shared/lib/site-settings";

function createResult(
  status: Exclude<AdminActionState["status"], "idle">,
  title: string,
  message: string
): AdminActionState {
  return {
    status,
    title,
    message,
    timestamp: Date.now()
  };
}

export async function loginAdminAction(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";

  const account = await verifyAdminCredentials(username, password);
  if (!account) {
    redirect("/admin?error=credentials");
  }

  if (rememberMe) {
    await createPersistentAdminSession(account);
  } else {
    await createAdminSession(account);
  }
  redirect("/admin?notice=welcome");
}

export async function logoutAdminAction() {
  const googleSession = await auth();
  await clearAdminSession();
  if (googleSession?.user) {
    await signOut({ redirectTo: "/admin" });
  }
  redirect("/admin");
}

export async function updateAppearanceAction(
  previousState: AdminActionState = INITIAL_ADMIN_ACTION_STATE,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdminAuthentication();
  void previousState;

  try {
    const themePreset = String(formData.get("themePreset") ?? "");
    const fontPreset = String(formData.get("fontPreset") ?? "");

    if (
      !THEME_PRESETS.includes(themePreset as (typeof THEME_PRESETS)[number]) ||
      !FONT_PRESETS.includes(fontPreset as (typeof FONT_PRESETS)[number])
    ) {
      return createResult(
        "failed",
        "Appearance not saved",
        "Pick a valid theme and font pair, then try again."
      );
    }

    await updateSiteSettings((current) => ({
      ...current,
      themePreset: themePreset as (typeof THEME_PRESETS)[number],
      fontPreset: fontPreset as (typeof FONT_PRESETS)[number]
    }));

    revalidatePath("/", "layout");
    revalidatePath("/admin");

    return createResult(
      "success",
      "Appearance saved",
      "The public site palette and font pair were updated."
    );
  } catch {
    return createResult(
      "error",
      "Appearance save failed",
      "The site settings could not be saved right now. Try again in a moment."
    );
  }
}

export async function updateAdminAppearanceAction(
  previousState: AdminActionState = INITIAL_ADMIN_ACTION_STATE,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdminAuthentication();
  void previousState;

  const appearance = {
    fontSize: String(formData.get("fontSize") ?? ""),
    fontFamily: String(formData.get("fontFamily") ?? ""),
    theme: String(formData.get("theme") ?? ""),
    accent: String(formData.get("accent") ?? "")
  };
  if (!ADMIN_FONT_SIZES.includes(appearance.fontSize as AdminAppearance["fontSize"]) || !ADMIN_FONT_FAMILIES.includes(appearance.fontFamily as AdminAppearance["fontFamily"]) || !ADMIN_THEMES.includes(appearance.theme as AdminAppearance["theme"]) || !ADMIN_ACCENTS.includes(appearance.accent as AdminAppearance["accent"])) {
    return createResult("failed", "Console appearance not saved", "Choose a valid size, font, theme, and accent.");
  }

  try {
    await updateSiteSettings((current) => ({ ...current, adminAppearance: appearance as AdminAppearance }));
    revalidatePath("/admin");
    return createResult("success", "Console appearance saved", "Your admin workspace preferences were updated.");
  } catch {
    return createResult("error", "Console appearance save failed", "The preferences could not be saved right now.");
  }
}

export async function updateAnnouncementAction(
  previousState: AdminActionState = INITIAL_ADMIN_ACTION_STATE,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdminAuthentication();
  void previousState;

  try {
    const title = String(formData.get("title") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();

    if (!title || !message) {
      return createResult(
        "failed",
        "Announcement not saved",
        "Add both a title and message before saving the homepage notice."
      );
    }

    await updateSiteSettings((current) => ({
      ...current,
      announcement: {
        title,
        message
      }
    }));

    revalidatePath("/", "layout");
    revalidatePath("/admin");

    return createResult(
      "success",
      "Announcement saved",
      "The homepage notice now uses your latest title and message."
    );
  } catch {
    return createResult(
      "error",
      "Announcement save failed",
      "The homepage notice could not be updated right now. Try again in a moment."
    );
  }
}

export async function updateAuthLockdownAction(
  previousState: AdminActionState = INITIAL_ADMIN_ACTION_STATE,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdminAuthentication();
  void previousState;

  try {
    const enabled = formData.get("enabled") === "on";
    const message = String(formData.get("message") ?? "").trim();

    if (!message) {
      return createResult(
        "failed",
        "Lockdown not saved",
        "Add the message users should see before saving the lockdown setting."
      );
    }

    await updateSiteSettings((current) => ({
      ...current,
      authLockdown: {
        enabled,
        message
      }
    }));

    revalidatePath("/", "layout");
    revalidatePath("/account");
    revalidatePath("/admin");

    return createResult(
      "success",
      "Lockdown saved",
      enabled
        ? "Client login and registration are now temporarily locked."
        : "Client login and registration are open again."
    );
  } catch {
    return createResult(
      "error",
      "Lockdown save failed",
      "The auth lockdown setting could not be updated right now. Try again in a moment."
    );
  }
}

export async function saveAnimeRuleAction(
  previousState: AdminActionState = INITIAL_ADMIN_ACTION_STATE,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdminAuthentication();
  void previousState;

  try {
    const selectedAnime = String(formData.get("selectedAnime") ?? "").trim();
    const status = String(formData.get("status") ?? "").trim();
    const message = String(formData.get("message") ?? "").trim();
    const [animeIdRaw, slug = "", ...titleParts] = selectedAnime.split("|");
    const animeId = animeIdRaw ? Number(animeIdRaw) : undefined;
    const title = titleParts.join("|").trim();

    if (!title || !slug) {
      return createResult(
        "failed",
        "Anime rule not saved",
        "Pick an anime title before saving the rule."
      );
    }

    if (!["public", "locked", "private"].includes(status)) {
      return createResult(
        "failed",
        "Anime rule not saved",
        "Pick a valid visibility status before saving the rule."
      );
    }

    await updateSiteSettings((current) => {
      const nextRules = current.animeRules.filter((rule) => rule.slug !== slug);

      if (status === "locked" || status === "private") {
        nextRules.push({
          animeId: Number.isFinite(animeId) ? animeId : undefined,
          slug,
          title,
          status,
          message: message || undefined,
          updatedAt: new Date().toISOString()
        });
      }

      return {
        ...current,
        animeRules: nextRules.sort((left, right) =>
          left.title.localeCompare(right.title, "en", { sensitivity: "base" })
        )
      };
    });

    revalidatePath("/", "layout");
    revalidatePath("/filter");
    revalidatePath("/watch/[slug]", "page");
    revalidatePath("/admin");

    return createResult(
      "success",
      "Anime rule saved",
      status === "public"
        ? `${title} is public again.`
        : status === "locked"
          ? `${title} is now marked as temporarily unavailable.`
          : `${title} is now hidden from the public site.`
    );
  } catch {
    return createResult(
      "error",
      "Anime rule save failed",
      "The anime rule could not be updated right now. Try again in a moment."
    );
  }
}

export async function deleteAnimeRuleAction(
  previousState: AdminActionState = INITIAL_ADMIN_ACTION_STATE,
  formData: FormData
): Promise<AdminActionState> {
  await requireAdminAuthentication();
  void previousState;

  try {
    const slug = String(formData.get("slug") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();

    if (!slug) {
      return createResult(
        "failed",
        "Rule removal failed",
        "The anime rule could not be found."
      );
    }

    await updateSiteSettings((current) => ({
      ...current,
      animeRules: current.animeRules.filter((rule) => rule.slug !== slug)
    }));

    revalidatePath("/", "layout");
    revalidatePath("/filter");
    revalidatePath("/watch/[slug]", "page");
    revalidatePath("/admin");

    return createResult(
      "success",
      "Rule removed",
      title ? `${title} is back to normal visibility.` : "The anime rule was removed."
    );
  } catch {
    return createResult(
      "error",
      "Rule removal failed",
      "The anime rule could not be removed right now. Try again in a moment."
    );
  }
}

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
import { updateSiteSettings } from "@/shared/lib/site-settings";

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

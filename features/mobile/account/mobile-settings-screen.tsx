import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { AccountSettingsContent } from "@/features/account/sections/account-settings-content";
import { MobileAppShell } from "@/features/mobile/shared/mobile-app-shell";
import type { FontPreset, ThemePreset } from "@/shared/lib/appearance-presets";

type MobileSettingsScreenProps = {
  authLocked: boolean;
  authLockdownMessage: string;
  catalog: HomeAnimeItem[];
  defaultFontPreset: FontPreset;
  defaultThemePreset: ThemePreset;
  errorMessage: string | null;
  member: {
    email: string;
    image: string | null;
    name: string;
  } | null;
  showWelcome: boolean;
  signInAction: () => Promise<void>;
  signOutAction: () => Promise<void>;
};

export function MobileSettingsScreen(props: MobileSettingsScreenProps) {
  return (
    <MobileAppShell>
      <AccountSettingsContent {...props} compact />
    </MobileAppShell>
  );
}

"use client";

import { useActionState } from "react";

import { INITIAL_ADMIN_ACTION_STATE } from "@/app/admin/action-state";
import { updateAdminAppearanceAction } from "@/app/admin/actions";
import { ADMIN_ACCENTS, ADMIN_FONT_FAMILIES, ADMIN_FONT_SIZES, ADMIN_THEMES, DEFAULT_ADMIN_APPEARANCE, type AdminAppearance } from "@/shared/lib/admin-appearance";
import { CustomSelect, type CustomSelectOption } from "@/shared/ui/custom-select";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

const labels: Record<string, string> = { comfortable: "Comfortable", large: "Large", "extra-large": "Extra large", manrope: "Manrope", lexend: "Lexend Deca", outfit: "Outfit", sora: "Sora", midnight: "Midnight", slate: "Slate", indigo: "Indigo", violet: "Violet", rose: "Rose", cyan: "Cyan", amber: "Amber" };

function options<T extends string>(values: readonly T[]): CustomSelectOption[] {
  return values.map((value) => ({ value, label: labels[value] }));
}

export function AdminAppearanceSettings({ appearance, onChange }: { appearance: AdminAppearance; onChange: (appearance: AdminAppearance) => void }) {
  const [state, action, pending] = useActionState(updateAdminAppearanceAction, INITIAL_ADMIN_ACTION_STATE);

  return <section className="admin-card p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon name="desktop_windows" /></span><div><h2 className="text-sm font-bold">Workspace appearance</h2><p className="admin-support mt-0.5">Customize the look and feel of the admin console.</p></div></div><button type="button" onClick={() => onChange(DEFAULT_ADMIN_APPEARANCE)} className="admin-button-secondary"><MaterialIcon name="restart_alt" />Reset to default</button></div>
    <form action={action} className="mt-5"><div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Picker label="Font size" name="fontSize" value={appearance.fontSize} values={ADMIN_FONT_SIZES} onChange={(fontSize) => onChange({ ...appearance, fontSize })} />
      <Picker label="Font family" name="fontFamily" value={appearance.fontFamily} values={ADMIN_FONT_FAMILIES} onChange={(fontFamily) => onChange({ ...appearance, fontFamily })} />
      <Picker label="Dark theme" name="theme" value={appearance.theme} values={ADMIN_THEMES} onChange={(theme) => onChange({ ...appearance, theme })} />
      <Picker label="Accent color" name="accent" value={appearance.accent} values={ADMIN_ACCENTS} onChange={(accent) => onChange({ ...appearance, accent })} />
    </div><div className="mt-5 flex flex-col gap-5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4 xl:flex-row xl:items-center xl:justify-between"><div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center"><AppearancePreview appearance={appearance} /><div><p className="font-semibold">Live workspace preview</p><p className="admin-support mt-0.5">Updates instantly as you change size, font, theme, or accent.</p><div className="mt-2 flex flex-wrap gap-1.5 text-[0.62rem] font-bold uppercase tracking-[0.06em] text-[var(--admin-subtle)]"><span>{labels[appearance.fontSize]}</span><span>·</span><span>{labels[appearance.fontFamily]}</span><span>·</span><span>{labels[appearance.theme]}</span><span>·</span><span>{labels[appearance.accent]}</span></div></div></div><button disabled={pending} className="admin-button-primary" type="submit"><MaterialIcon className="text-[17px]" name="visibility" />{pending ? "Saving..." : "Save appearance"}</button></div>{state.status !== "idle" ? <p className={`mt-3 admin-support ${state.status === "success" ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"}`}>{state.title}: {state.message}</p> : null}</form>
  </section>;
}

function AppearancePreview({ appearance }: { appearance: AdminAppearance }) {
  return <div className="admin-appearance-preview h-[108px] w-full shrink-0 overflow-hidden rounded-xl border sm:w-[190px]" data-preview-font-size={appearance.fontSize} data-preview-font-family={appearance.fontFamily} data-preview-theme={appearance.theme} data-preview-accent={appearance.accent} aria-label={`Live preview: ${labels[appearance.fontSize]}, ${labels[appearance.fontFamily]}, ${labels[appearance.theme]}, ${labels[appearance.accent]}`}><div className="grid h-full grid-cols-[42px_1fr]"><aside className="border-r p-2"><span className="grid h-6 w-6 place-items-center rounded-md text-white"><MaterialIcon className="text-[13px]" filled name="play_arrow" /></span><span className="mt-3 block h-1.5 w-full rounded-full" /><span className="mt-2 block h-1.5 w-4/5 rounded-full" /><span className="mt-2 block h-1.5 w-full rounded-full" /></aside><div className="p-2.5"><div className="flex items-center justify-between"><div><p className="preview-eyebrow">Dashboard</p><p className="preview-title">Welcome back</p></div><span className="preview-avatar grid h-6 w-6 place-items-center rounded-full"><MaterialIcon className="text-[12px]" name="person" /></span></div><div className="mt-2 grid grid-cols-[1fr_auto] gap-2"><div className="preview-card rounded-md border p-2"><p className="preview-label">Members</p><p className="preview-value">12.4K</p></div><button type="button" tabIndex={-1} className="preview-button self-end rounded-md px-2 py-1.5 font-bold text-white">View</button></div></div></div></div>;
}

function Picker<T extends string>({ label, name, value, values, onChange }: { label: string; name: string; value: T; values: readonly T[]; onChange: (value: T) => void }) {
  return <CustomSelect label={label} name={name} value={value} options={options(values)} onChange={(nextValue) => onChange(nextValue as T)} className="admin-label grid gap-2" buttonClassName="h-12 rounded-2xl border-[var(--admin-border)] bg-[var(--admin-input)] px-4 text-[0.9rem] font-bold text-[var(--admin-text)]" menuClassName="rounded-2xl border-[var(--admin-border)] bg-[#11141c]! text-[var(--admin-text)] shadow-[0_24px_70px_rgba(0,0,0,0.72)]" />;
}

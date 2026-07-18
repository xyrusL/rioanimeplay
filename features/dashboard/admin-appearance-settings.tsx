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
    </div><div className="mt-5 flex flex-col gap-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-4"><div className="hidden h-16 w-28 overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-canvas)] sm:grid sm:grid-cols-[28px_1fr]"><div className="border-r border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-1.5"><span className="block h-3 w-3 rounded bg-[var(--admin-accent)]" /><span className="mt-3 block h-1 w-4 rounded bg-[var(--admin-border)]" /><span className="mt-1.5 block h-1 w-4 rounded bg-[var(--admin-border)]" /><span className="mt-1.5 block h-1 w-4 rounded bg-[var(--admin-border)]" /></div><div className="p-2"><div className="flex gap-1"><span className="h-2 flex-1 rounded-sm bg-[var(--admin-accent-soft)]" /><span className="h-2 flex-1 rounded-sm bg-[var(--admin-surface)]" /></div><span className="mt-2 block h-1 w-10 rounded bg-[var(--admin-accent)]" /><span className="mt-1.5 block h-1 w-full rounded bg-[var(--admin-border)]" /><span className="mt-1.5 block h-1 w-4/5 rounded bg-[var(--admin-border)]" /></div></div><div><p className="font-semibold">Preview your workspace</p><p className="admin-support mt-0.5">See how changes look across labels, tables, dialogs, and controls.</p></div></div><button disabled={pending} className="admin-button-primary" type="submit"><MaterialIcon className="text-[17px]" name="visibility" />{pending ? "Saving..." : "Save appearance"}</button></div>{state.status !== "idle" ? <p className={`mt-3 admin-support ${state.status === "success" ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"}`}>{state.title}: {state.message}</p> : null}</form>
  </section>;
}

function Picker<T extends string>({ label, name, value, values, onChange }: { label: string; name: string; value: T; values: readonly T[]; onChange: (value: T) => void }) {
  return <CustomSelect label={label} name={name} value={value} options={options(values)} onChange={(nextValue) => onChange(nextValue as T)} className="admin-label grid gap-2" buttonClassName="h-12 rounded-2xl border-[var(--admin-border)] bg-[var(--admin-input)] px-4 text-[0.9rem] font-bold text-[var(--admin-text)]" menuClassName="rounded-2xl border-[var(--admin-border)] bg-[#11141c]! text-[var(--admin-text)] shadow-[0_24px_70px_rgba(0,0,0,0.72)]" />;
}

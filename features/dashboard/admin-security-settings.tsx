"use client";

import { useState, useTransition } from "react";

import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/app/admin/action-state";
import { setAntiInspectAction } from "@/app/admin/actions";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export function AdminSecuritySettings({ initialAntiInspect }: { initialAntiInspect: boolean }) {
  const [antiInspect, setAntiInspect] = useState(initialAntiInspect);
  const [state, setState] = useState<AdminActionState>(INITIAL_ADMIN_ACTION_STATE);
  const [pending, startTransition] = useTransition();

  function handleToggle(nextValue: boolean) {
    const previousValue = antiInspect;
    setAntiInspect(nextValue);
    setState(INITIAL_ADMIN_ACTION_STATE);
    startTransition(async () => {
      const result = await setAntiInspectAction(nextValue);
      setState(result);
      if (result.status !== "success") setAntiInspect(previousValue);
    });
  }

  return <section className="admin-card overflow-hidden"><div className="border-b border-[var(--admin-border)] p-5 sm:p-6"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon filled name="shield_lock" /></span><div><h2 className="text-sm font-bold">Security</h2><p className="admin-support mt-0.5">Control browser-side protection for the public website.</p></div></div></div>
    <div className="p-5 sm:p-6"><div className="flex flex-col gap-5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="flex min-w-0 items-start gap-3"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${antiInspect ? "bg-[#16372f] text-[#70d5ad]" : "bg-[var(--admin-surface-muted)] text-[var(--admin-subtle)]"}`}><MaterialIcon name={antiInspect ? "verified_user" : "policy"} filled={antiInspect} /></span><div><label htmlFor="anti-inspect" className="cursor-pointer text-[0.88rem] font-bold">Anti-inspect protection</label><p className="admin-support mt-1 max-w-2xl leading-5">When DevTools shortcuts or an open docked developer panel are detected, the visitor is redirected to <code className="rounded bg-black/20 px-1.5 py-0.5 text-[0.9em] text-[var(--admin-accent-text)]">/home</code> on the current domain.</p></div></div><label className={`flex shrink-0 items-center gap-3 ${pending ? "cursor-wait opacity-70" : "cursor-pointer"}`}><span className={`text-[0.68rem] font-bold uppercase tracking-[0.08em] ${antiInspect ? "text-[#70d5ad]" : "text-[var(--admin-subtle)]"}`}>{pending ? "Saving" : antiInspect ? "Enabled" : "Disabled"}</span><input id="anti-inspect" type="checkbox" checked={antiInspect} disabled={pending} onChange={(event) => handleToggle(event.target.checked)} className="peer sr-only" /><span aria-hidden="true" className="relative h-7 w-12 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] transition-colors after:absolute after:left-1 after:top-1 after:h-[18px] after:w-[18px] after:rounded-full after:bg-[var(--admin-subtle)] after:transition-transform peer-checked:border-[var(--admin-accent)] peer-checked:bg-[var(--admin-accent)] peer-checked:after:translate-x-5 peer-checked:after:bg-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--admin-accent)]" /></label></div>
      <div className="mt-4 flex items-center justify-between gap-3"><p className="admin-support flex items-center gap-2"><MaterialIcon className="text-[16px]" name="cloud_done" />The switch is saved automatically and preserved across page loads.</p>{state.status !== "idle" ? <p className={`admin-support text-right ${state.status === "success" ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"}`}>{state.message}</p> : null}</div></div>
  </section>;
}

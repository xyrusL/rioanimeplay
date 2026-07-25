"use client";

import { FormEvent, useEffect, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type DomainLock = { enabled: boolean; origins: string[] };

type DomainLockDialogProps = {
  apiKey: { id: string; name: string; keyHint: string; domainLock: DomainLock };
  onClose: () => void;
  onSaved: (domainLock: DomainLock) => void;
};

async function readResponse(response: Response) {
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error?.message ?? "Domain lock could not be updated");
  return result as { enabled: boolean; domains: Array<{ origin: string }> };
}

export function DomainLockDialog({ apiKey, onClose, onSaved }: DomainLockDialogProps) {
  const [enabled, setEnabled] = useState(apiKey.domainLock.enabled);
  const [domains, setDomains] = useState(apiKey.domainLock.origins);
  const [newDomain, setNewDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  function addDomain(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const origin = new URL(newDomain.trim()).origin.toLowerCase();
      if (!/^https?:\/\//.test(origin)) throw new Error();
      if (!domains.includes(origin)) setDomains((current) => [...current, origin]);
      setNewDomain("");
    } catch {
      setError("Enter a valid origin, for example https://example.com.");
    }
  }

  async function save() {
    setSaving(true);
    setError("");
    try {
      const result = await readResponse(await fetch(`/api/dashboard/api-keys/${encodeURIComponent(apiKey.id)}/domain-lock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, domains })
      }));
      onSaved({ enabled: result.enabled, origins: result.domains.map((item) => item.origin) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="domain-lock-title" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="flex max-h-[min(680px,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-[#343a4a] bg-[#171b25] shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <div className="flex items-start gap-3 border-b border-[#292e3c] p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#202a4c] text-[#9cafff]"><MaterialIcon name="domain_verification" /></span>
          <div className="min-w-0 flex-1"><h2 id="domain-lock-title" className="text-sm font-bold text-[#eef1f6]">Domain lock</h2><p className="mt-1 truncate text-[10px] text-[#8994a8]">{apiKey.name} / <code>{apiKey.keyHint}</code></p></div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#7f899d] hover:bg-[#202532] hover:text-[#dfe3eb]" type="button" aria-label="Close domain lock"><MaterialIcon className="text-[18px]" name="close" /></button>
        </div>

        <div className="overflow-y-auto p-5">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#303646] bg-[#11151e] px-4 py-3"><span><span className="block text-xs font-bold text-[#dfe3eb]">Restrict browser origins</span><span className="mt-1 block text-[9px] text-[#778196]">This setting applies only to this API key.</span></span><span className={`flex items-center gap-2 text-[10px] font-bold ${enabled ? "text-[#70d5ad]" : "text-[#8b95a8]"}`}>{enabled ? "Enabled" : "Disabled"}<input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-4 w-4 accent-[#596fe5]" /></span></label>

          {error ? <div className="mt-3 rounded-xl border border-[#63363c] bg-[#2b191d] px-3 py-2.5 text-[10px] font-semibold text-[#ff9ca8]">{error}</div> : null}

          <div className="mt-4 overflow-hidden rounded-xl border border-[#292e3c]">
            <div className="flex items-center justify-between bg-[#11151e] px-3 py-2.5"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8b95a8]">Allowed origins</p><span className="text-[9px] text-[#657084]">{domains.length}/20</span></div>
            <div className="max-h-44 divide-y divide-[#252a37] overflow-y-auto">{domains.map((domain) => <div key={domain} className="flex items-center gap-2 px-3 py-2.5"><MaterialIcon className="text-[15px] text-[#8fa4ff]" name={domain.includes("localhost") ? "computer" : "language"} /><code className="min-w-0 flex-1 truncate text-[10px] text-[#cbd1dc]">{domain}</code><button onClick={() => setDomains((current) => current.filter((item) => item !== domain))} className="grid h-7 w-7 place-items-center rounded-lg text-[#7f899d] hover:bg-[#342027] hover:text-[#ff9ca8]" type="button" aria-label={`Remove ${domain}`}><MaterialIcon className="text-[16px]" name="close" /></button></div>)}{domains.length === 0 ? <div className="px-3 py-6 text-center text-[10px] text-[#7f899d]">No origins configured for this key.</div> : null}</div>
          </div>

          <form onSubmit={addDomain} className="mt-3 flex gap-2"><input autoFocus type="url" value={newDomain} onChange={(event) => setNewDomain(event.target.value)} placeholder="https://example.com" className="h-10 min-w-0 flex-1 rounded-xl border border-[#343a4a] bg-[#0e121a] px-3 text-[11px] text-[#e3e7ef] outline-none placeholder:text-[#586174] focus:border-[#7184e8]" /><button disabled={domains.length >= 20} className="flex h-10 items-center gap-1.5 rounded-xl border border-[#343a4a] px-3 text-[10px] font-bold text-[#b8c0cf] hover:bg-[#202532] disabled:opacity-40" type="submit"><MaterialIcon className="text-[16px]" name="add" />Add</button></form>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#292e3c] bg-[#141821] px-5 py-4"><button onClick={onClose} disabled={saving} className="rounded-xl px-4 py-2.5 text-[10px] font-bold text-[#9da7b9] hover:bg-[#202532] disabled:opacity-50" type="button">Cancel</button><button onClick={save} disabled={saving || (enabled && domains.length === 0)} className="rounded-xl bg-[#596fe5] px-4 py-2.5 text-[10px] font-bold text-white shadow-[0_8px_20px_rgba(89,111,229,0.2)] disabled:opacity-40" type="button">{saving ? "Saving..." : "Save domain lock"}</button></div>
      </section>
    </div>
  );
}

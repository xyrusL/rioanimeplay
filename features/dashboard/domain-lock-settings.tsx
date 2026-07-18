"use client";

import { FormEvent, useEffect, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type DomainLockResponse = {
  enabled: boolean;
  domains: Array<{ origin: string }>;
};

async function readResponse(response: Response) {
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error?.message ?? "Domain lock could not be updated");
  return result as DomainLockResponse;
}

export function DomainLockSettings() {
  const [enabled, setEnabled] = useState(true);
  const [domains, setDomains] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/domain-lock", { cache: "no-store" })
      .then(readResponse)
      .then((result) => { setEnabled(result.enabled); setDomains(result.domains.map((item) => item.origin)); })
      .catch((cause) => setFeedback({ type: "error", message: cause.message }))
      .finally(() => setLoading(false));
  }, []);

  function addDomain(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    try {
      const origin = new URL(newDomain.trim()).origin.toLowerCase();
      if (!/^https?:\/\//.test(origin)) throw new Error();
      if (!domains.includes(origin)) setDomains((current) => [...current, origin]);
      setNewDomain("");
    } catch {
      setFeedback({ type: "error", message: "Enter a valid origin, for example https://example.com." });
    }
  }

  async function save() {
    setSaving(true); setFeedback(null);
    try {
      const result = await readResponse(await fetch("/api/dashboard/domain-lock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, domains })
      }));
      setEnabled(result.enabled);
      setDomains(result.domains.map((item) => item.origin));
      setFeedback({ type: "success", message: "Domain lock updated on the Worker." });
    } catch (cause) {
      setFeedback({ type: "error", message: cause instanceof Error ? cause.message : "Update failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="domain-lock" className="admin-card scroll-mt-24 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#202a4c] text-[#9cafff]"><MaterialIcon name="domain_verification" /></span><div><h2 className="text-sm font-bold text-[#eef1f6]">Domain lock</h2><p className="mt-1 max-w-xl text-[10px] leading-5 text-[#7f899d]">Restrict browser requests to approved origins. Server-to-server requests without an Origin header continue to use API-key authentication.</p></div></div>
        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#303646] bg-[#11151e] px-4 py-3"><span className={`text-[10px] font-bold ${enabled ? "text-[#70d5ad]" : "text-[#8b95a8]"}`}>{enabled ? "Enabled" : "Disabled"}</span><input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-4 w-4 accent-[#596fe5]" /></label>
      </div>

      {feedback ? <div className={`mt-5 rounded-xl border px-4 py-3 text-xs font-semibold ${feedback.type === "success" ? "border-[#24483d] bg-[#14251f] text-[#70d5ad]" : "border-[#63363c] bg-[#2b191d] text-[#ff9ca8]"}`}>{feedback.message}</div> : null}

      <div className="mt-6 overflow-hidden rounded-xl border border-[#292e3c]">
        <div className="flex items-center justify-between bg-[#11151e] px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b95a8]">Allowed origins</p><span className="text-[9px] text-[#657084]">{domains.length} configured</span></div>
        {loading ? <div className="px-4 py-8 text-center text-xs text-[#7f899d]">Loading domains...</div> : <div className="divide-y divide-[#252a37]">{domains.map((domain) => <div key={domain} className="flex items-center gap-3 px-4 py-3"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#202532] text-[#8fa4ff]"><MaterialIcon className="text-[16px]" name={domain.includes("localhost") ? "computer" : "language"} /></span><code className="min-w-0 flex-1 truncate text-[11px] text-[#cbd1dc]">{domain}</code><button onClick={() => setDomains((current) => current.filter((item) => item !== domain))} className="grid h-8 w-8 place-items-center rounded-lg text-[#7f899d] hover:bg-[#342027] hover:text-[#ff9ca8]" type="button" aria-label={`Remove ${domain}`}><MaterialIcon className="text-[17px]" name="close" /></button></div>)}{domains.length === 0 ? <div className="px-4 py-8 text-center text-xs text-[#7f899d]">No origins configured.</div> : null}</div>}
      </div>

      <form onSubmit={addDomain} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="url" value={newDomain} onChange={(event) => setNewDomain(event.target.value)} placeholder="https://example.com" className="h-11 flex-1 rounded-xl border border-[#343a4a] bg-[#0e121a] px-4 text-xs text-[#e3e7ef] outline-none placeholder:text-[#586174] focus:border-[#7184e8]" /><button className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#343a4a] px-4 text-xs font-bold text-[#b8c0cf] hover:bg-[#202532]" type="submit"><MaterialIcon className="text-[17px]" name="add" />Add domain</button></form>
      <div className="mt-5 flex items-center gap-3"><button onClick={save} disabled={saving || loading || (enabled && domains.length === 0)} className="rounded-xl bg-[#596fe5] px-5 py-3 text-xs font-bold text-white disabled:opacity-40" type="button">{saving ? "Saving..." : "Save domain lock"}</button>{enabled && domains.length === 0 ? <span className="text-[10px] text-[#ff9ca8]">Add at least one origin before enabling.</span> : null}</div>
    </section>
  );
}

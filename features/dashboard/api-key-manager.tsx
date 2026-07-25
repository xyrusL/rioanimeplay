"use client";

import { FormEvent, startTransition, useEffect, useState } from "react";

import { DomainLockDialog } from "@/features/dashboard/domain-lock-settings";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type DomainLock = { enabled: boolean; origins: string[] };

type ApiKey = {
  id: string;
  name: string;
  keyPrefix: string;
  keyHint: string;
  status: "active" | "paused";
  createdAt: string | null;
  updatedAt: string | null;
  lastUsedAt: string | null;
  isSiteKey: boolean;
  managed: boolean;
  domainLock?: DomainLock;
  policy: {
    rateLimitPerMinute: number | null;
    dailyRequestLimit: number | null;
    dailyBandwidthLimitBytes: number | null;
  };
  usage: {
    requests: number;
    errors: number;
    successfulRequests: number;
    errorRate: number;
    averageResponseMs: number | null;
    maxResponseMs: number | null;
  };
};

type KeysResponse = { keys: ApiKey[]; periodDays: number };
type Confirmation = { key: ApiKey; action: "delete" | "regenerate" };

const number = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
const date = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

async function readError(response: Response) {
  const payload = await response.json().catch(() => null);
  return payload?.error?.message ?? "The request could not be completed";
}

function Metric({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone: string }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-[#292e3c] bg-[#151923] p-3 shadow-[0_10px_24px_rgba(0,0,0,0.14)]">
      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tone}`}><MaterialIcon className="text-[16px]" filled name={icon} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2"><p className="truncate text-[9px] font-semibold uppercase tracking-[0.08em] text-[#7f899d]">{label}</p><p className="shrink-0 text-lg font-bold leading-none tracking-[-0.025em] text-[#f5f7fb]">{value}</p></div>
        <p className="mt-1 truncate text-[9px] text-[#778196]">{detail}</p>
      </div>
    </article>
  );
}

function SecretDialog({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="secret-title">
      <section className="w-full max-w-lg rounded-3xl border border-[#343a4a] bg-[#171b25] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#202a4c] text-[#9cafff]"><MaterialIcon filled name="key" /></span>
        <h2 id="secret-title" className="mt-5 text-xl font-bold tracking-[-0.03em] text-[#f5f7fb]">Save your API key</h2>
        <p className="mt-2 text-xs leading-5 text-[#929caf]">For security, the complete key is visible only now. Store it somewhere secure before closing.</p>
        <div className="mt-5 break-all rounded-2xl border border-[#30374a] bg-[#101522] p-4 font-mono text-xs leading-6 text-[#aebcff]">{secret}</div>
        <div className="mt-5 flex gap-3">
          <button onClick={copy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#596fe5] px-4 py-3 text-xs font-bold text-white" type="button"><MaterialIcon className="text-[17px]" name={copied ? "check" : "content_copy"} />{copied ? "Copied" : "Copy key"}</button>
          <button onClick={onClose} className="rounded-xl border border-[#343a4a] px-5 py-3 text-xs font-bold text-[#aab2c2] hover:bg-[#202532]" type="button">I saved it</button>
        </div>
      </section>
    </div>
  );
}

function ConfirmDialog({ confirmation, busy, onCancel, onConfirm }: { confirmation: Confirmation; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const { key, action } = confirmation;
  const revokeSite = action === "delete" && key.isSiteKey;
  const title = action === "regenerate" ? "Replace API key?" : revokeSite ? "Revoke site access?" : "Delete API key?";
  const message = action === "regenerate"
    ? `The current secret for ${key.name} will stop working immediately. Any service using it must be updated with the replacement key.`
    : revokeSite
      ? "The RioAnime application will immediately lose API access. You can restore access later by resuming this key."
      : `${key.name} and its usage history will be permanently deleted. This action cannot be undone.`;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <section className="w-full max-w-md rounded-3xl border border-[#343a4a] bg-[#171b25] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.55)]">
        <span className={`grid h-11 w-11 place-items-center rounded-2xl ${action === "regenerate" ? "bg-[#202a4c] text-[#9cafff]" : "bg-[#342027] text-[#ff9ca8]"}`}><MaterialIcon filled name={action === "regenerate" ? "sync_lock" : "delete"} /></span>
        <h2 id="confirm-title" className="mt-5 text-xl font-bold tracking-[-0.03em] text-[#f5f7fb]">{title}</h2>
        <p className="mt-2 text-xs leading-6 text-[#929caf]">{message}</p>
        <div className="mt-5 rounded-xl border border-[#2b3141] bg-[#10141d] px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[#687287]">API credential</p><p className="mt-1.5 text-xs font-semibold text-[#dfe3eb]">{key.name}</p><code className="mt-1 block text-[10px] text-[#8f9ab0]">{key.keyHint}</code></div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="rounded-xl border border-[#343a4a] px-5 py-3 text-xs font-bold text-[#aab2c2] hover:bg-[#202532] disabled:opacity-50" type="button">Cancel</button>
          <button onClick={onConfirm} disabled={busy} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white disabled:opacity-50 ${action === "regenerate" ? "bg-[#596fe5]" : "bg-[#b64654]"}`} type="button"><MaterialIcon className="text-[16px]" name={action === "regenerate" ? "sync_lock" : "delete"} />{busy ? "Working..." : action === "regenerate" ? "Replace key" : revokeSite ? "Revoke access" : "Delete key"}</button>
        </div>
      </section>
    </div>
  );
}

export function ApiKeyManager() {
  const [data, setData] = useState<KeysResponse>({ keys: [], periodDays: 30 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [bandwidthMb, setBandwidthMb] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [domainLockKey, setDomainLockKey] = useState<(ApiKey & { domainLock: DomainLock }) | null>(null);

  async function load() {
    setError("");
    const response = await fetch("/api/dashboard/api-keys", { cache: "no-store" });
    if (!response.ok) throw new Error(await readError(response));
    const result = await response.json() as KeysResponse;
    startTransition(() => setData({
      ...result,
      keys: result.keys.map((key) => ({
        ...key,
        domainLock: key.domainLock ?? { enabled: false, origins: [] }
      }))
    }));
  }

  useEffect(() => {
    load().catch((cause) => setError(cause.message)).finally(() => setLoading(false));
  }, []);

  async function createKey(event: FormEvent) {
    event.preventDefault();
    setBusyId("new");
    setError("");
    try {
      const response = await fetch("/api/dashboard/api-keys", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newName }) });
      if (!response.ok) throw new Error(await readError(response));
      const result = await response.json();
      setSecret(result.key);
      setNewName("");
      setCreating(false);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create API key");
    } finally {
      setBusyId(null);
    }
  }

  async function updateKey(key: ApiKey, action: string, name?: string, policy?: Record<string, number | null>) {
    setBusyId(key.id);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/api-keys/${key.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, name, ...policy }) });
      if (!response.ok) throw new Error(await readError(response));
      const result = await response.json();
      if (result.key) setSecret(result.key);
      setEditingId(null);
      await load();
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update API key");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function deleteKey(key: ApiKey) {
    setBusyId(key.id);
    setError("");
    try {
      const response = await fetch(`/api/dashboard/api-keys/${key.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to delete API key");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmAction() {
    if (!confirmation) return;
    const { key, action } = confirmation;
    if (action === "delete") await deleteKey(key);
    else await updateKey(key, "regenerate");
    setConfirmation(null);
  }

  function editPolicy(key: ApiKey) {
    setEditingPolicyId(key.id);
    setRateLimit(key.policy.rateLimitPerMinute?.toString() ?? "");
    setDailyLimit(key.policy.dailyRequestLimit?.toString() ?? "");
    setBandwidthMb(key.policy.dailyBandwidthLimitBytes === null ? "" : String(Math.round(key.policy.dailyBandwidthLimitBytes / 1048576)));
  }

  async function savePolicy(event: FormEvent, key: ApiKey) {
    event.preventDefault();
    const toLimit = (value: string) => value.trim() ? Number(value) : null;
    const saved = await updateKey(key, "policy", undefined, {
      rateLimitPerMinute: toLimit(rateLimit),
      dailyRequestLimit: toLimit(dailyLimit),
      dailyBandwidthLimitBytes: bandwidthMb.trim() ? Number(bandwidthMb) * 1048576 : null
    });
    if (saved) setEditingPolicyId(null);
  }

  const siteKey = data.keys.find((key) => key.isSiteKey);
  const usageKeys = siteKey ? [siteKey] : data.keys;
  const totals = usageKeys.reduce((sum, key) => ({ requests: sum.requests + key.usage.requests, errors: sum.errors + key.usage.errors, duration: sum.duration + (key.usage.averageResponseMs ?? 0) * key.usage.requests }), { requests: 0, errors: 0, duration: 0 });
  const average = totals.requests ? Math.round(totals.duration / totals.requests) : null;

  return (
    <>
      {secret && <SecretDialog secret={secret} onClose={() => setSecret(null)} />}
      {confirmation && <ConfirmDialog confirmation={confirmation} busy={busyId === confirmation.key.id} onCancel={() => setConfirmation(null)} onConfirm={confirmAction} />}
      {domainLockKey && <DomainLockDialog apiKey={domainLockKey} onClose={() => setDomainLockKey(null)} onSaved={(domainLock) => { setData((current) => ({ ...current, keys: current.keys.map((key) => key.id === domainLockKey.id ? { ...key, domainLock } : key) })); setDomainLockKey(null); }} />}
      <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-[#2d395e] bg-[#151b2b] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#202a4c] text-[#9cafff]"><MaterialIcon className="text-[20px]" name="hub" /></span><div><h2 className="text-sm font-bold text-[#eef1f6]">Site API credentials</h2><p className="mt-1 text-[10px] leading-5 text-[#8994a8]">Active keys can access the site API. Add, rename, pause, replace, or delete managed credentials below.</p></div></div>
        <span className="w-fit rounded-full bg-[#15352c] px-3 py-1.5 text-[9px] font-bold text-[#70d5ad]">{data.keys.filter((key) => key.status === "active").length} active</span>
      </section>
      <section id="summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="API usage summary">
        <Metric icon="key" label="API keys" value={`${data.keys.length}`} detail={`${data.keys.filter((key) => key.status === "active").length} active`} tone="bg-[#e9eeff] text-[#536ee8]" />
        <Metric icon="data_object" label="Requests" value={number.format(totals.requests)} detail={`Last ${data.periodDays} days`} tone="bg-[#e7f8f1] text-[#279b72]" />
        <Metric icon="error" label="Failed requests" value={number.format(totals.errors)} detail={`${totals.requests ? ((totals.errors / totals.requests) * 100).toFixed(2) : "0.00"}% error rate`} tone="bg-[#fff0ed] text-[#d56a57]" />
        <Metric icon="speed" label="Average speed" value={average === null ? "—" : `${average}ms`} detail="Across all managed keys" tone="bg-[#f3eaff] text-[#9560d9]" />
      </section>

      <section id="keys" className="mt-5 overflow-hidden rounded-2xl border border-[#292e3c] bg-[#151923] shadow-[0_14px_35px_rgba(0,0,0,0.18)]">
        <div className="flex flex-col gap-4 border-b border-[#292e3c] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div><h2 className="text-[15px] font-bold text-[#f0f2f7]">API keys</h2><p className="mt-1 text-[11px] text-[#828ca0]">Create and control credentials for your services</p></div>
          <button onClick={() => setCreating((value) => !value)} className="flex w-fit items-center gap-2 rounded-xl bg-[#596fe5] px-4 py-2.5 text-[11px] font-bold text-white shadow-[0_8px_20px_rgba(89,111,229,0.2)]" type="button"><MaterialIcon className="text-[17px]" name={creating ? "close" : "add"} />{creating ? "Cancel" : "Add API key"}</button>
        </div>

        {creating && <form onSubmit={createKey} className="flex flex-col gap-3 border-b border-[#292e3c] bg-[#121722] px-5 py-5 sm:flex-row sm:items-end sm:px-6"><label className="flex-1"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b95a8]">Key name</span><input autoFocus value={newName} onChange={(event) => setNewName(event.target.value)} maxLength={60} placeholder="Production website" className="h-11 w-full rounded-xl border border-[#343a4a] bg-[#0e121a] px-4 text-xs text-[#e3e7ef] outline-none placeholder:text-[#586174] focus:border-[#7184e8]" /></label><button disabled={busyId === "new"} className="h-11 rounded-xl bg-[#596fe5] px-5 text-xs font-bold text-white disabled:opacity-50" type="submit">{busyId === "new" ? "Creating..." : "Create key"}</button></form>}

        {error && <div className="m-5 flex items-center gap-2 rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-xs font-semibold text-[#ff9ca8]"><MaterialIcon className="text-[18px]" name="error" />{error}</div>}
        {loading ? <div className="grid place-items-center px-6 py-20 text-xs text-[#828ca0]">Loading API keys...</div> : data.keys.length === 0 ? <div className="grid place-items-center px-6 py-20 text-center"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#202a4c] text-[#8fa4ff]"><MaterialIcon name="key_off" /></span><h3 className="mt-4 text-sm font-bold text-[#e3e7ef]">No managed keys yet</h3><p className="mt-1 text-xs text-[#828ca0]">Add a key to begin tracking usage separately.</p></div> : <div className="divide-y divide-[#292e3c]">{data.keys.map((key) => (
          <article key={key.id} className="px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">{editingId === key.id ? <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); updateKey(key, "rename", editingName); }}><input autoFocus value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={60} className="h-9 rounded-lg border border-[#343a4a] bg-[#0e121a] px-3 text-xs font-semibold text-[#e3e7ef] outline-none focus:border-[#7184e8]" /><button className="rounded-lg bg-[#596fe5] px-3 text-[10px] font-bold text-white" type="submit">Save</button><button onClick={() => setEditingId(null)} className="px-2 text-[10px] font-bold text-[#8b95a8]" type="button">Cancel</button></form> : <h3 className="text-sm font-bold text-[#e3e7ef]">{key.name}</h3>}{key.isSiteKey ? <span className="rounded-full bg-[#202a4c] px-2.5 py-1 text-[9px] font-bold text-[#9cafff]">Current site key</span> : null}<span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold capitalize ${key.status === "active" ? "bg-[#15352c] text-[#70d5ad]" : "bg-[#3a2d19] text-[#efbd68]"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{key.status}</span></div>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-[#7f899d]"><code className="rounded-md bg-[#10141d] px-2 py-1 font-mono text-[#a5aec0]">{key.keyHint}</code><span>{key.createdAt ? `Created ${date.format(new Date(`${key.createdAt}Z`))}` : "Cloudflare deployment secret"}</span><span>{key.isSiteKey ? "Used by the RioAnime application" : key.lastUsedAt ? `Last used ${date.format(new Date(`${key.lastUsedAt}Z`))}` : "Never used"}</span></div>
              </div>
              <div id="usage" className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:w-[470px]">{[
                ["Requests", number.format(key.usage.requests)],
                ["Succeeded", number.format(key.usage.successfulRequests)],
                ["Errors", `${number.format(key.usage.errors)} (${key.usage.errorRate}%)`],
                ["Speed", key.usage.averageResponseMs === null ? "—" : `${key.usage.averageResponseMs}ms`]
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-[#10141d] px-3 py-2.5"><p className="text-[9px] font-semibold text-[#707a8e]">{label}</p><p className="mt-1 text-xs font-bold text-[#d7dce5]">{value}</p></div>)}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#252a37] pt-4 text-[9px] text-[#7f899d]"><span>Rate: <strong className="text-[#b8c0cf]">{key.policy.rateLimitPerMinute === null ? "Unlimited" : `${number.format(key.policy.rateLimitPerMinute)}/min`}</strong></span><span>Daily requests: <strong className="text-[#b8c0cf]">{key.policy.dailyRequestLimit === null ? "Unlimited" : number.format(key.policy.dailyRequestLimit)}</strong></span><span>Daily bandwidth: <strong className="text-[#b8c0cf]">{key.policy.dailyBandwidthLimitBytes === null ? "Unlimited" : `${number.format(key.policy.dailyBandwidthLimitBytes / 1048576)} MB`}</strong></span><span>Domain lock: <strong className={(key.domainLock?.enabled ?? false) ? "text-[#70d5ad]" : "text-[#efbd68]"}>{key.domainLock?.enabled ? `${key.domainLock.origins.length} origins` : "Disabled"}</strong></span></div>
            {editingPolicyId === key.id ? <form onSubmit={(event) => savePolicy(event, key)} className="mt-4 grid gap-3 rounded-xl border border-[#2d395e] bg-[#111725] p-4 sm:grid-cols-3"><label className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8994a8]">Requests per minute<input type="number" min="1" max="10000" value={rateLimit} onChange={(event) => setRateLimit(event.target.value)} placeholder="Unlimited" className="mt-2 h-10 w-full rounded-lg border border-[#343a4a] bg-[#0e121a] px-3 text-xs text-[#e3e7ef] outline-none focus:border-[#7184e8]" /></label><label className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8994a8]">Requests per day<input type="number" min="1" max="100000000" value={dailyLimit} onChange={(event) => setDailyLimit(event.target.value)} placeholder="Unlimited" className="mt-2 h-10 w-full rounded-lg border border-[#343a4a] bg-[#0e121a] px-3 text-xs text-[#e3e7ef] outline-none focus:border-[#7184e8]" /></label><label className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8994a8]">Bandwidth MB per day<input type="number" min="1" max="1048576" value={bandwidthMb} onChange={(event) => setBandwidthMb(event.target.value)} placeholder="Unlimited" className="mt-2 h-10 w-full rounded-lg border border-[#343a4a] bg-[#0e121a] px-3 text-xs text-[#e3e7ef] outline-none focus:border-[#7184e8]" /></label><div className="flex gap-2 sm:col-span-3"><button disabled={busyId === key.id} className="rounded-lg bg-[#596fe5] px-4 py-2.5 text-[10px] font-bold text-white disabled:opacity-50" type="submit">Save limits</button><button onClick={() => setEditingPolicyId(null)} className="rounded-lg px-4 py-2.5 text-[10px] font-bold text-[#9da7b9]" type="button">Cancel</button><span className="self-center text-[9px] text-[#697386]">Leave a field blank for Unlimited.</span></div></form> : null}
            <div className="mt-3 flex flex-wrap gap-2"><button onClick={() => { setEditingId(key.id); setEditingName(key.name); }} className="action-button" type="button"><MaterialIcon name="edit" />Rename</button><button onClick={() => editPolicy(key)} className="action-button" type="button"><MaterialIcon name="tune" />Edit limits</button><button onClick={() => setDomainLockKey({ ...key, domainLock: key.domainLock ?? { enabled: false, origins: [] } })} className="action-button" type="button"><MaterialIcon name="domain_verification" />Domain lock</button><button onClick={() => updateKey(key, key.status === "active" ? "pause" : "resume")} className="action-button" type="button"><MaterialIcon name={key.status === "active" ? "pause" : "play_arrow"} />{key.status === "active" ? "Pause" : "Resume"}</button>{key.managed ? <button onClick={() => setConfirmation({ key, action: "regenerate" })} className="action-button" type="button"><MaterialIcon name="sync_lock" />Replace key</button> : null}<button onClick={() => setConfirmation({ key, action: "delete" })} className="action-button ml-auto text-[#ff8d98]! hover:bg-[#2b191d]!" type="button"><MaterialIcon name="delete" />{key.isSiteKey ? "Revoke access" : "Delete"}</button>{busyId === key.id && <span className="self-center text-[10px] font-semibold text-[#8b95a8]">Updating...</span>}</div>
          </article>
        ))}</div>}
      </section>
      <style jsx>{`.action-button { display:flex; align-items:center; gap:6px; border-radius:9px; padding:7px 10px; color:#98a2b4; font-size:10px; font-weight:700; transition:background-color .15s; } .action-button:hover { background:#202532; } .action-button :global(.material-symbols-rounded) { font-size:15px; }`}</style>
    </>
  );
}

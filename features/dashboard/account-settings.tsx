"use client";

import { FormEvent, useEffect, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

export type Profile = {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
};

async function responseMessage(response: Response) {
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error?.message ?? "The update could not be completed");
  return result;
}

export function AccountSettings({ initialProfile }: { initialProfile: Profile | null }) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [email, setEmail] = useState(initialProfile?.email ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    if (initialProfile) return;

    const controller = new AbortController();
    fetch("/api/dashboard/profile", { cache: "no-store", signal: controller.signal })
      .then(responseMessage)
      .then((result) => {
        setProfile(result.account);
        setUsername(result.account.username);
        setEmail(result.account.email);
      })
      .catch((cause) => {
        if (cause instanceof Error && cause.name !== "AbortError") {
          setFeedback({ type: "error", message: cause.message });
        }
      });
    return () => controller.abort();
  }, [initialProfile]);

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    setFeedback(null);
    if (newPassword !== confirmPassword) {
      setFeedback({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    setBusy(true);
    try {
      const result = await responseMessage(await fetch("/api/dashboard/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          currentPassword,
          ...(newPassword ? { newPassword } : {})
        })
      }));
      setProfile(result.account);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setFeedback({
        type: "success",
        message: result.passwordChanged ? "Profile and password updated." : "Profile updated."
      });
    } catch (cause) {
      setFeedback({ type: "error", message: cause instanceof Error ? cause.message : "Update failed" });
    } finally {
      setBusy(false);
    }
  }

  const input = "mt-2 h-11 w-full rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] px-4 text-xs text-[var(--admin-text)] outline-none placeholder:text-[#586174] focus:border-[var(--admin-accent)]";
  const label = "block text-xs font-semibold text-[var(--admin-muted)]";

  return (
    <>
      <div className="admin-card p-5">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon name="manage_accounts" /></span>
          <div className="min-w-0"><h2 className="text-sm font-bold text-[var(--admin-text)]">Administrator account</h2><p className="admin-support mt-0.5 truncate">{profile ? `${profile.username} · ${profile.email}` : "Loading account information..."}</p></div>
        </div>
      </div>

      {feedback ? <div className={`rounded-xl border px-4 py-3 text-xs font-semibold ${feedback.type === "success" ? "border-[#24483d] bg-[#14251f] text-[var(--admin-success)]" : "border-[#63363c] bg-[#2b191d] text-[var(--admin-danger)]"}`}>{feedback.message}</div> : null}

      <form onSubmit={saveAccount} className="admin-card p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon name="badge" /></span><div><h2 className="text-sm font-bold text-[var(--admin-text)]">Account information</h2><p className="admin-support mt-0.5">Update your account details or enter a new password.</p></div></div>
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <label className={label}>Username<input value={username} onChange={(event) => setUsername(event.target.value)} minLength={2} maxLength={50} required className={input} /></label>
          <label className={`${label} lg:col-span-2`}>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={input} /></label>
          <label className={label}>Current password<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" placeholder="Enter current password" className={input} /></label>
          <label className={label}>New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="Enter new password" className={input} /></label>
          <label className={label}>Confirm new password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} autoComplete="new-password" placeholder="Confirm new password" className={input} /></label>
        </div>
        <div className="mt-5 flex justify-end"><button disabled={busy || !profile} className="admin-button-primary disabled:opacity-50" type="submit"><MaterialIcon className="text-[17px]" name="lock" />{busy ? "Saving changes..." : "Save changes"}</button></div>
      </form>
    </>
  );
}

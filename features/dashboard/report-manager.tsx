"use client";

import { useEffect, useState } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type UserReport = {
  id: string;
  animeId: string;
  animeTitle: string;
  episodeNumber: number;
  reporterName: string | null;
  reporterType: "member" | "guest";
  memberEmail: string | null;
  message: string;
  createdAt: string;
};

function reportDate(value: string) {
  const date = new Date(value.includes("T") ? value : `${value.replace(" ", "T")}Z`);
  return {
    date: new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date),
    time: new Intl.DateTimeFormat(undefined, { timeStyle: "short" }).format(date)
  };
}

function isUserReport(value: unknown): value is UserReport {
  if (!value || typeof value !== "object") return false;
  const report = value as Partial<UserReport>;
  return typeof report.id === "string"
    && typeof report.animeTitle === "string"
    && typeof report.message === "string"
    && typeof report.episodeNumber === "number"
    && typeof report.createdAt === "string"
    && (report.reporterType === "member" || report.reporterType === "guest");
}

export function ReportManager() {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/dashboard/reports", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error?.message ?? "Reports could not be loaded");
        const items: unknown[] = Array.isArray(result.items) ? result.items : [];
        setReports(items.filter(isUserReport));
      })
      .catch((cause) => {
        if (!(cause instanceof DOMException && cause.name === "AbortError")) {
          setError(cause instanceof Error ? cause.message : "Reports could not be loaded");
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const today = new Date().toDateString();
  const todayCount = reports.filter((report) => new Date(report.createdAt.includes("T") ? report.createdAt : `${report.createdAt.replace(" ", "T")}Z`).toDateString() === today).length;
  const memberCount = reports.filter((report) => report.reporterType === "member").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3">
        <article className="admin-card flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#3b2028] text-[#ff9ca8]"><MaterialIcon filled name="report" /></span>
          <div><p className="admin-support">Total reports</p><p className="text-xl font-bold">{reports.length}</p></div>
        </article>
        <article className="admin-card flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#302817] text-[#f4c84e]"><MaterialIcon filled name="today" /></span>
          <div><p className="admin-support">Received today</p><p className="text-xl font-bold">{todayCount}</p></div>
        </article>
        <article className="admin-card flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--admin-accent-soft)] text-[var(--admin-accent-text)]"><MaterialIcon filled name="verified_user" /></span>
          <div><p className="admin-support">Member reports</p><p className="text-xl font-bold">{memberCount}</p></div>
        </article>
      </section>

      <section className="admin-card overflow-hidden">
        <header className="flex flex-col gap-2 border-b border-[var(--admin-border)] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="admin-eyebrow">User reports</p>
            <h2 className="mt-1 text-base font-bold">Reported playback problems</h2>
            <p className="admin-support mt-1">Member identity is verified from the signed-in account; unsigned visitors are marked as guests.</p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--admin-border)] bg-[var(--admin-input)] px-3 py-2 text-[10px] font-bold text-[var(--admin-muted)]">
            <MaterialIcon className="text-[16px]" name="database" />D1 records
          </span>
        </header>

        {error ? <p className="m-5 rounded-xl border border-[#63363c] bg-[#2b191d] px-4 py-3 text-xs text-[#ff9ca8]">{error}</p> : null}
        {loading ? <div className="grid place-items-center px-5 py-20 text-[var(--admin-subtle)]"><MaterialIcon className="animate-spin text-[26px]" name="progress_activity" /><p className="mt-3 text-xs">Loading reports...</p></div> : null}
        {!loading && !error && reports.length === 0 ? (
          <div className="px-5 py-20 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--admin-input)] text-[var(--admin-subtle)]"><MaterialIcon className="text-[27px]" name="inbox" /></span>
            <p className="mt-4 text-sm font-bold">No reports yet</p>
            <p className="admin-support mt-1">New watch-page reports will appear here.</p>
          </div>
        ) : null}
        {!loading && reports.length ? (
          <div className="divide-y divide-[var(--admin-border)]">
            {reports.map((report) => {
              const timestamp = reportDate(report.createdAt);
              const isMember = report.reporterType === "member";
              return (
                <article key={report.id} className="grid gap-4 p-5 transition-colors hover:bg-white/2 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,1.25fr)]">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-accent-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--admin-accent-text)]"><MaterialIcon className="text-[14px]" name="movie" />{report.animeTitle}</span>
                      <span className="rounded-full border border-[var(--admin-border)] px-2.5 py-1 text-[10px] font-bold text-[var(--admin-muted)]">Episode {report.episodeNumber}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${isMember ? "bg-[#153327] text-[#76e6ac]" : "bg-[var(--admin-input)] text-[var(--admin-muted)]"}`}>
                        <MaterialIcon className="text-[14px]" name={isMember ? "verified_user" : "public"} />{isMember ? "Member" : "Guest"}
                      </span>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--admin-subtle)]">Reporter</p>
                        <p className="mt-1 truncate text-xs font-semibold text-[var(--admin-text)]">{report.reporterName || (isMember ? "Name not provided" : "Guest")}</p>
                        {isMember && report.memberEmail ? <p className="mt-1 break-all text-[10px] text-[var(--admin-accent-text)]">{report.memberEmail}</p> : <p className="mt-1 text-[10px] text-[var(--admin-subtle)]">No signed-in account</p>}
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--admin-subtle)]">Submitted</p>
                        <p className="mt-1 text-xs font-semibold text-[var(--admin-text)]">{timestamp.date} <span className="font-normal text-[var(--admin-subtle)]">at {timestamp.time}</span></p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-input)] p-4">
                    <p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--admin-subtle)]"><MaterialIcon className="text-[15px]" name="chat" />Problem description</p>
                    <p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-[var(--admin-muted)]">{report.message}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </div>
  );
}

import type { ReactNode } from "react";

import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type PanelProps = {
  title: string;
  children: ReactNode;
  actionLabel?: string;
  className?: string;
  icon?: string;
  allowOverflow?: boolean;
};

export function Panel({
  title,
  children,
  actionLabel,
  className,
  icon,
  allowOverflow = false
}: PanelProps) {
  return (
    <section
      className={`${allowOverflow ? "overflow-visible" : "overflow-hidden"} rounded-[24px] border border-[var(--line-soft)] bg-[var(--panel-surface)] shadow-[var(--panel-shadow)] ${className ?? ""}`}
    >
      <div className="flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--panel-header-surface)] px-4 py-3">
        <div className="flex items-center gap-2">
          {icon ? (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-panel)] text-[var(--accent-strong)]">
              <MaterialIcon className="text-[18px]" name={icon} />
            </span>
          ) : null}
          <h2 className="font-display text-[0.98rem] uppercase tracking-[0.2em] text-[var(--accent-strong)]">
            {title}
          </h2>
        </div>
        {actionLabel ? (
          <span className="text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-muted)]">
            {actionLabel}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

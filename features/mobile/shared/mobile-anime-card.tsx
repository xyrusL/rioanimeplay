import Link from "next/link";

import { formatDecimalScore } from "@/entities/anime/lib/formatters";
import type { HomeAnimeItem, WeeklyTopEntry } from "@/entities/anime/model/types";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { SensitiveImage } from "@/shared/ui/sensitive-image";

type MobilePosterCardProps = {
  item: HomeAnimeItem;
  className?: string;
  compact?: boolean;
};

export function MobilePosterCard({ item, className, compact = false }: MobilePosterCardProps) {
  return (
    <Link
      href={`/watch/${encodeURIComponent(item.urlSlug)}`}
      className={`group flex flex-col overflow-hidden rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card)] shadow-[var(--soft-shadow)] ${compact ? "min-h-0" : "min-h-[292px]"} ${className ?? "w-[148px] shrink-0"}`}
    >
      <div className={`relative shrink-0 overflow-hidden ${compact ? "aspect-[4/5]" : "aspect-[11/16]"}`}>
        <SensitiveImage
          isNsfw={item.isNsfw}
          overlay="card"
          fill
          alt={item.title}
          className="object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-soft)] group-hover:scale-[1.04]"
          sizes="148px"
          src={item.coverImage}
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--badge-dark)] px-2 py-1 text-[0.64rem] font-semibold text-[var(--gold)] backdrop-blur-sm">
            <MaterialIcon className="text-[14px]" filled name="star" />
            {formatDecimalScore(item.score)}
          </span>
          <span className="rounded-full bg-[var(--badge-dark)] px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] backdrop-blur-sm">
            {item.episodesLabel} EP
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(6,9,13,0.96)] to-transparent" />
      </div>
      <div className={`flex flex-1 flex-col justify-between gap-2 px-3 py-3 ${compact ? "min-h-[78px]" : "min-h-[82px]"}`}>
        <h3 className={`${compact ? "line-clamp-1 min-h-[1.25rem]" : "line-clamp-2 min-h-[2.5rem]"} text-sm font-semibold leading-5 text-[var(--text-primary)]`}>
          {item.title}
        </h3>
        <p className="line-clamp-1 min-h-[1rem] pt-0.5 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          {item.formatLabel} • {item.seasonLabel}
        </p>
      </div>
    </Link>
  );
}

type MobileWeeklyCardProps = {
  entry: WeeklyTopEntry;
};

export function MobileWeeklyCard({ entry }: MobileWeeklyCardProps) {
  return (
    <Link
      href={`/watch/${encodeURIComponent(entry.urlSlug)}`}
      className="flex items-center gap-3 rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-3"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent-strong)]">
        {entry.rank}
      </span>
      <div className="relative h-[68px] w-[52px] shrink-0 overflow-hidden rounded-[16px]">
        <SensitiveImage isNsfw={entry.isNsfw} fill alt={entry.title} className="object-cover" sizes="52px" src={entry.image} />
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">{entry.title}</h3>
        <p className="line-clamp-1 text-[0.68rem] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {entry.meta}
        </p>
        <p className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-[var(--gold)]">
          <MaterialIcon className="text-[14px]" filled name="star" />
          {entry.scoreLabel}
        </p>
      </div>
    </Link>
  );
}

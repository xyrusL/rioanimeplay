import Image from "next/image";
import Link from "next/link";

import { formatDecimalScore } from "@/entities/anime/lib/formatters";
import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type AnimeCardProps = {
  item: HomeAnimeItem;
};

function getYearLabel(seasonLabel: string) {
  const matchedYear = seasonLabel.match(/\b\d{4}\b/);
  return matchedYear?.[0] ?? seasonLabel;
}

export function AnimeCard({ item }: AnimeCardProps) {
  const watchHref = `/watch/${toAnimeSlug(item.title)}`;

  return (
    <Link
      href={watchHref}
      className="group block overflow-hidden rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card)] transition-[transform,border-color,box-shadow,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-1 hover:border-[var(--line-strong)] hover:shadow-[var(--card-shadow)]"
    >
      <div className="relative aspect-[7/8] overflow-hidden">
        <Image
          fill
          alt={item.title}
          className="object-cover transition-[transform,filter] duration-[var(--motion-slow)] ease-[var(--ease-soft)] group-hover:scale-[1.04] group-hover:blur-[6px]"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          src={item.coverImage}
        />
        <div className="pointer-events-none absolute inset-0 bg-[var(--image-hover-overlay)] opacity-0 transition-opacity duration-[var(--motion-base)] ease-[var(--ease-soft)] group-hover:opacity-100" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--badge-dark)] px-2.5 py-1 text-[0.66rem] font-semibold uppercase tracking-[0.14em] text-[var(--gold)] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            <MaterialIcon
              className="leading-none"
              filled
              name="star"
              style={{ fontSize: "15px" }}
            />
            {formatDecimalScore(item.score)}
          </span>
          <span className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border border-[var(--line-strong)] bg-[rgba(17,18,23,0.78)] px-2 py-1 text-[0.58rem] font-semibold uppercase tracking-[0.1em] text-[var(--accent-strong)] shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <MaterialIcon
              className="leading-none"
              name="video_library"
              style={{ fontSize: "15px" }}
            />
            {item.episodesLabel}
          </span>
        </div>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-[var(--motion-base)] ease-[var(--ease-soft)] group-hover:opacity-100">
          <span className="flex h-11 w-11 scale-95 items-center justify-center rounded-[14px] border border-[var(--line-soft)] bg-[var(--play-button-bg)] text-[var(--play-button-fg)] shadow-[0_18px_40px_rgba(0,0,0,0.22)] transition-transform duration-[var(--motion-base)] ease-[var(--ease-soft)] group-hover:scale-100">
            <MaterialIcon className="text-[28px]" filled name="play_arrow" />
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--image-overlay-strong)] via-[var(--image-overlay-soft)] to-transparent" />
      </div>
      <div className="space-y-1.5 px-3.5 py-3">
        <h3 className="truncate text-[0.94rem] leading-[1.35] font-semibold text-[var(--text-primary)]">
          {item.title}
        </h3>
        <p className="flex items-center gap-1.5 whitespace-nowrap text-[0.69rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
          <MaterialIcon className="leading-none" name="movie_info" style={{ fontSize: "15px" }} />
          {item.formatLabel} • {getYearLabel(item.seasonLabel)}
        </p>
      </div>
    </Link>
  );
}

export function FeaturedPosterCard({ item }: AnimeCardProps) {
  const watchHref = `/watch/${toAnimeSlug(item.title)}`;

  return (
    <Link
      href={watchHref}
      className="group block overflow-hidden rounded-[18px] border border-[var(--line-soft)] bg-[rgba(11,12,16,0.42)] transition-[border-color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:border-[var(--line-strong)] hover:bg-[rgba(19,20,25,0.72)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          fill
          alt={item.title}
          className="object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-soft)] group-hover:scale-[1.05]"
          sizes="(max-width: 1024px) 50vw, 18vw"
          src={item.coverImage}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.88)] via-transparent to-transparent" />
        <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--badge-dark-strong)] px-2 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--gold)]">
          <MaterialIcon className="text-[13px]" filled name="star" />
          {formatDecimalScore(item.score)}
        </div>
      </div>
      <div className="space-y-1 px-3 py-2.5">
        <h3 className="line-clamp-1 text-sm font-semibold text-[var(--text-primary)]">
          {item.title}
        </h3>
        <p className="inline-flex items-center gap-1.5 line-clamp-1 text-[0.68rem] uppercase tracking-[0.16em] text-[var(--text-muted)]">
          <MaterialIcon className="text-[11px]" name="movie" />
          {item.formatLabel}
        </p>
      </div>
    </Link>
  );
}

import Link from "next/link";

import type { HomeAnimeItem, HomePageData } from "@/entities/anime/model/types";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { SensitiveImage } from "@/shared/ui/sensitive-image";

type IntroArticleProps = {
  homePageData: HomePageData;
};

const BENEFITS = [
  {
    icon: "bookmarks",
    title: "Huge catalog",
    text: "Anime across seasons, formats, and genres."
  },
  {
    icon: "filter_alt",
    title: "Smart filters",
    text: "Narrow the catalog to exactly what you want."
  },
  {
    icon: "bolt",
    title: "Fast and simple",
    text: "Move from a title to its watch page quickly."
  },
  {
    icon: "lock_open",
    title: "Free to use",
    text: "No hidden fees. Browse at your own pace."
  }
];

const STEPS = [
  {
    icon: "search",
    title: "Search or browse",
    text: "Use search, filters, or A-Z to find the anime you want."
  },
  {
    icon: "bookmark",
    title: "Save and bookmark",
    text: "Keep favorite titles close for your next visit."
  },
  {
    icon: "play_arrow",
    title: "Watch and enjoy",
    text: "Open a title, choose an episode, and start watching."
  }
];

function buildPopularItems(homePageData: HomePageData) {
  const seen = new Set<number>();

  return [...homePageData.featured, ...homePageData.grid]
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, 8);
}

function getMeta(item: HomeAnimeItem) {
  return [item.genres[0], item.genres[1]].filter(Boolean).join(" · ") || item.formatLabel;
}

export function IntroArticle({ homePageData }: IntroArticleProps) {
  const popularItems = buildPopularItems(homePageData);
  const ctaItem = homePageData.spotlight ?? popularItems[0] ?? null;

  return (
    <div className="space-y-7 pb-8 pt-6 sm:space-y-9 sm:pt-8">
      <section aria-label="Why use RioAnimePlay" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {BENEFITS.map((benefit) => (
          <article
            key={benefit.title}
            className="flex min-h-28 items-center gap-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-surface)] p-5 shadow-[var(--card-shadow)]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-white shadow-[var(--cta-shadow)]">
              <MaterialIcon className="text-[24px]" filled name={benefit.icon} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">{benefit.title}</h2>
              <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{benefit.text}</p>
            </div>
          </article>
        ))}
      </section>

      <section aria-labelledby="popular-title" className="rounded-[24px] border border-[var(--line-soft)] bg-[var(--bg-elevated)] p-4 shadow-[var(--panel-shadow)] sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 id="popular-title" className="flex items-center gap-2 font-display text-lg font-bold tracking-[-0.03em] text-white sm:text-xl">
            <span aria-hidden="true">🔥</span>
            Top search right now
          </h2>
          <Link
            href="/anime/a-z"
            className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[var(--line-soft)] bg-[var(--cta-ghost)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            View A-Z list
            <MaterialIcon className="text-[16px]" name="chevron_right" />
          </Link>
        </div>

        {popularItems.length ? (
          <div className="intro-popular-rail mt-5 grid auto-cols-[minmax(145px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3 sm:auto-cols-[minmax(165px,1fr)] lg:auto-cols-[minmax(0,1fr)] lg:grid-flow-row lg:grid-cols-4 xl:grid-cols-8 xl:overflow-visible xl:pb-0">
            {popularItems.map((item) => (
              <Link
                key={item.id}
                href={`/watch/${encodeURIComponent(item.urlSlug)}`}
                className="group min-w-0 snap-start rounded-xl focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--accent)]"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-[var(--line-soft)] bg-[var(--bg-panel)] shadow-[var(--card-shadow)] transition-[transform,border-color,box-shadow] group-hover:-translate-y-1 group-hover:border-[var(--line-strong)] group-hover:shadow-[var(--soft-shadow)]">
                  <SensitiveImage
                    fill
                    isNsfw={item.isNsfw}
                    overlay="card"
                    alt={item.title}
                    className="object-cover transition-transform duration-[var(--motion-slow)] group-hover:scale-105"
                    sizes="(max-width: 1024px) 165px, 12vw"
                    src={item.coverImage}
                  />
                  <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                <h3 className="mt-2 line-clamp-1 text-xs font-semibold text-white sm:text-sm">{item.title}</h3>
                <p className="mt-1 line-clamp-1 text-[0.66rem] text-[var(--text-secondary)]">{getMeta(item)}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-xl border border-dashed border-[var(--line-soft)] px-5 py-10 text-center text-sm text-[var(--text-secondary)]">
            Popular titles are loading. Search or browse the catalog in the meantime.
          </div>
        )}
      </section>

      <section aria-labelledby="steps-title" className="px-1 py-5 sm:py-7">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-[var(--accent-soft)] px-4 py-2 text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            <MaterialIcon className="text-[15px]" filled name="bolt" />
            How it works
          </p>
          <h2 id="steps-title" className="mt-4 font-display text-2xl font-bold tracking-[-0.04em] text-white sm:text-3xl">
            Get started in 3 easy steps
          </h2>
        </div>

        <ol className="mt-10 grid gap-8 md:grid-cols-3 md:gap-10">
          {STEPS.map((step, index) => (
            <li key={step.title} className="intro-step relative text-center">
              <div className="relative mx-auto grid h-24 w-24 place-items-center rounded-2xl border border-[var(--line-soft)] bg-[var(--panel-surface)] text-white shadow-[var(--card-shadow)]">
                <span className="absolute -right-2 -top-3 grid h-8 w-8 place-items-center rounded-full border border-[var(--line-strong)] bg-[var(--accent)] text-sm font-bold text-white">
                  {index + 1}
                </span>
                <MaterialIcon className="text-[45px]" name={step.icon} />
              </div>
              <h3 className="mt-4 text-sm font-bold text-white">{step.title}</h3>
              <p className="mx-auto mt-2 max-w-[250px] text-xs leading-5 text-[var(--text-secondary)]">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative isolate overflow-hidden rounded-[22px] border border-[var(--line-strong)] bg-[var(--bg-panel)] px-6 py-8 shadow-[var(--panel-shadow)] sm:px-10 sm:py-9 lg:pl-[38%]">
        {ctaItem ? (
          <SensitiveImage
            fill
            isNsfw={ctaItem.isNsfw}
            alt=""
            aria-hidden="true"
            className="-z-20 object-cover object-[25%_30%] opacity-60"
            sizes="100vw"
            src={ctaItem.bannerImage ?? ctaItem.coverImage}
          />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-[var(--hero-backdrop)]" />
        <h2 className="font-display text-xl font-bold tracking-[-0.03em] text-white sm:text-2xl">
          Ready to find your next favorite anime?
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
          Explore the full catalog and let your next watch start here.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white shadow-[var(--cta-shadow)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--accent-strong)]"
        >
          Browse catalog
          <MaterialIcon className="text-[18px]" name="arrow_forward" />
        </Link>
      </section>
    </div>
  );
}

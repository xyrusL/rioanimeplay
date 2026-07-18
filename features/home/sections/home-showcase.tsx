import Image from "next/image";
import Link from "next/link";

import { SearchAutocomplete } from "@/features/search/sections/search-autocomplete";
import type { HomePageData } from "@/entities/anime/model/types";

type HomeShowcaseProps = {
  homePageData: HomePageData;
};

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Filter", href: "/filter" },
  { label: "A-Z List", href: "/anime/a-z" },
  { label: "Random", href: "/random" }
];

export function HomeShowcase({ homePageData }: HomeShowcaseProps) {
  const spotlight = homePageData.spotlight;
  const visualItems = homePageData.featured.slice(0, 4);
  const topLinks = homePageData.featured.slice(0, 8);

  return (
    <section className="relative overflow-hidden rounded-[20px] border border-[var(--line-soft)] bg-[var(--hero-surface)] shadow-[0_18px_42px_rgba(0,0,0,0.24)]">
      {spotlight ? (
        <div className="absolute inset-0">
          <Image
            fill
            priority
            alt={spotlight.title}
            className="object-cover opacity-18"
            sizes="(max-width: 1280px) 100vw, 1180px"
            src={spotlight.bannerImage ?? spotlight.coverImage}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,14,18,0.97),rgba(11,14,18,0.9)_48%,rgba(11,14,18,0.72))]" />
        </div>
      ) : null}

      <div className="relative">
        <div className="px-5 py-4">
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.76rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--text-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid gap-5 border-t border-[var(--line-soft)] px-5 py-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
          <div className="max-w-[560px]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[var(--header-logo-surface)] text-[var(--accent-strong)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                <span className="text-[1.15rem] font-bold leading-none">R</span>
              </div>
              <div>
                <p className="font-display text-[1.5rem] leading-none text-[var(--text-primary)]">
                  RioAnimePlay
                </p>
              </div>
            </div>

            <SearchAutocomplete className="mt-5 max-w-[500px]" />

            <div className="mt-4 max-w-[530px] space-y-2.5">
              <p className="text-[0.82rem] uppercase tracking-[0.24em] text-[var(--gold)]">
                Top search
              </p>
              <p className="text-[0.95rem] leading-7 text-[var(--text-secondary)]">
                {topLinks.map((item, index) => (
                  <span key={item.id}>
                    <Link
                      href={`/watch/${encodeURIComponent(item.urlSlug)}`}
                      className="transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--text-primary)]"
                    >
                      {item.title}
                    </Link>
                    {index < topLinks.length - 1 ? ", " : "."}
                  </span>
                ))}
              </p>
              <p className="text-[0.98rem] leading-7 text-[var(--text-secondary)]">
                Search the live catalog, browse the filter page, open the A-Z list, or jump into the
                main site when you want the full RioAnimePlay experience.
              </p>
            </div>
          </div>

          <div className="relative hidden min-h-[240px] lg:block">
            {visualItems[0] ? (
              <div className="absolute right-4 top-0 h-[190px] w-[132px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
                <Image fill alt={visualItems[0].title} className="object-cover" sizes="132px" src={visualItems[0].coverImage} />
              </div>
            ) : null}
            {visualItems[1] ? (
              <div className="absolute right-[124px] top-10 h-[170px] w-[118px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
                <Image fill alt={visualItems[1].title} className="object-cover" sizes="118px" src={visualItems[1].coverImage} />
              </div>
            ) : null}
            {visualItems[2] ? (
              <div className="absolute right-[34px] top-[116px] h-[136px] w-[102px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
                <Image fill alt={visualItems[2].title} className="object-cover" sizes="102px" src={visualItems[2].coverImage} />
              </div>
            ) : null}
            {visualItems[3] ? (
              <div className="absolute right-[160px] top-[128px] h-[124px] w-[90px] overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] shadow-[0_18px_36px_rgba(0,0,0,0.3)]">
                <Image fill alt={visualItems[3].title} className="object-cover" sizes="90px" src={visualItems[3].coverImage} />
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[var(--line-soft)] bg-[var(--intro-cta-strip-bg)] px-5 py-3">
          <Link
            href="/"
            className="flex items-center justify-center text-center text-[0.92rem] font-semibold uppercase tracking-[0.18em] text-[var(--intro-cta-strip-fg)]"
          >
            View Full Site
          </Link>
        </div>
      </div>
    </section>
  );
}

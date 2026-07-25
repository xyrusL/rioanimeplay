import Image from "next/image";
import Link from "next/link";

import type { HomePageData } from "@/entities/anime/model/types";
import { SearchAutocomplete } from "@/features/search/sections/search-autocomplete";
import type { SiteSettings } from "@/shared/lib/site-settings";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { SensitiveImage } from "@/shared/ui/sensitive-image";
import { HomeNavigationHeader } from "@/features/home/sections/home-navigation-header";

type HomeShowcaseProps = {
  authLockdown: SiteSettings["authLockdown"];
  homePageData: HomePageData;
  member: { name: string; email: string; image: string | null } | null;
};

const QUICK_LINKS = [
  { label: "A-Z List", href: "/anime/a-z", icon: "format_list_bulleted" },
  { label: "Random Anime", href: "/random", icon: "shuffle" },
  { label: "Advanced Filter", href: "/filter", icon: "filter_alt" }
];

export function HomeShowcase({ authLockdown, homePageData, member }: HomeShowcaseProps) {
  const spotlight = homePageData.spotlight;
  const visualItems = homePageData.featured.slice(0, 4);

  return (
    <section aria-labelledby="intro-hero-title">
      <HomeNavigationHeader authLockdown={authLockdown} member={member} />

      <div className="intro-hero relative z-[200] isolate min-h-[610px] overflow-visible rounded-b-[28px] border-x border-b border-[var(--line-soft)] bg-[var(--hero-surface)] px-5 py-12 shadow-[var(--hero-shadow)] sm:px-8 lg:px-12 lg:py-16">
        {spotlight?.bannerImage ? (
          <Image
            fill
            priority
            alt=""
            aria-hidden="true"
            className="-z-30 rounded-b-[28px] object-cover object-center opacity-25"
            sizes="100vw"
            src={spotlight.bannerImage}
          />
        ) : null}
        <div className="absolute inset-0 -z-20 rounded-b-[28px] bg-[var(--hero-backdrop)]" />
        <div className="absolute inset-0 -z-10 rounded-b-[28px] bg-[var(--hero-accent-glow)]" />

        <div className="relative z-20 max-w-[650px]">
          <p className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[var(--accent-strong)]">
            <MaterialIcon className="text-[16px]" filled name="bolt" />
            Your anime destination
          </p>
          <h1 id="intro-hero-title" className="mt-6 font-display text-[clamp(3rem,6.2vw,5.6rem)] font-bold leading-[0.96] tracking-[-0.07em] text-white">
            Find. Watch.
            <span className="mt-2 block text-[var(--accent)]">Fall in Love.</span>
          </h1>
          <p className="mt-6 max-w-[540px] text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
            Discover anime without the detour. Search the live catalog, narrow it by what matters, or let chance pick your next obsession.
          </p>

          <div className="relative z-[250] mt-7 max-w-[570px] rounded-2xl border border-[var(--line-soft)] bg-[var(--bg-elevated)] p-1.5 shadow-[var(--soft-shadow)] backdrop-blur-xl">
            <SearchAutocomplete resultLimit={4} />
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--cta-ghost)] px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] transition-[border-color,color,transform,background-color] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <MaterialIcon className="text-[17px]" name={item.icon} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {visualItems.length ? (
          <div aria-label="Featured anime" className="intro-poster-collage absolute inset-y-0 right-0 z-10 hidden w-[52%] overflow-hidden rounded-br-[28px] lg:block">
            {visualItems.map((item, index) => (
              <Link
                key={item.id}
                href={`/watch/${encodeURIComponent(item.urlSlug)}`}
                aria-label={`Open ${item.title}`}
                className={`intro-poster intro-poster--${index + 1} absolute overflow-hidden border border-[var(--line-strong)] bg-[var(--bg-panel)] shadow-[var(--panel-shadow)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]`}
              >
                <SensitiveImage
                  fill
                  isNsfw={item.isNsfw}
                  alt={item.title}
                  className="object-cover transition-transform duration-[var(--motion-slow)] hover:scale-105"
                  sizes="260px"
                  src={item.coverImage}
                />
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

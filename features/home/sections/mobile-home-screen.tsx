import Link from "next/link";

import type { HomeAnimeItem, HomePageData } from "@/entities/anime/model/types";
import { SearchAutocomplete } from "@/features/search/sections/search-autocomplete";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { SensitiveImage } from "@/shared/ui/sensitive-image";
import { SiteBrand } from "@/shared/ui/site-brand";

const QUICK_LINKS = [
  { label: "A-Z list", href: "/anime/a-z", icon: "format_list_bulleted" },
  { label: "Random", href: "/random", icon: "shuffle" },
  { label: "Filter", href: "/filter", icon: "filter_alt" },
  { label: "Top search", href: "#mobile-top-search", icon: "local_fire_department" }
];

const BENEFITS = [
  { title: "Huge catalog", text: "Thousands of anime titles and counting.", icon: "bookmark" },
  { title: "Smart filters", text: "Find exactly what you want to watch.", icon: "filter_alt" },
  { title: "Fast & simple", text: "A clean path from search to screen.", icon: "bolt" },
  { title: "Free to use", text: "No hidden fees. Just pure anime.", icon: "lock" }
];

const STEPS = [
  { title: "Search or browse", text: "Use search, filters, or A-Z to find the anime you want.", icon: "search" },
  { title: "Save & bookmark", text: "Keep your favorite titles close and return whenever you like.", icon: "bookmark" },
  { title: "Watch & enjoy", text: "Choose an episode and settle in for your next story.", icon: "play_arrow" }
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

export function MobileHomeScreen({ homePageData }: { homePageData: HomePageData }) {
  const popularItems = buildPopularItems(homePageData);
  const collageItems = popularItems.slice(0, 5);
  const ctaItem = homePageData.spotlight ?? popularItems[0] ?? null;

  return (
    <div className="mobile-home mx-auto w-full max-w-[520px] pb-5 lg:hidden">
      <header className="flex h-[74px] items-center justify-between border-b border-white/10 px-4">
        <SiteBrand compact href="/" />
        <Link
          href="#mobile-search"
          aria-label="Jump to anime search"
          className="grid h-11 w-11 place-items-center rounded-xl text-white focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
        >
          <MaterialIcon className="text-[27px]" name="search" />
        </Link>
      </header>

      <section className="mobile-home-hero relative isolate overflow-hidden px-5 pb-7 pt-8" aria-labelledby="mobile-hero-title">
        {ctaItem?.bannerImage ? (
          <SensitiveImage
            fill
            priority
            isNsfw={ctaItem.isNsfw}
            alt=""
            aria-hidden="true"
            className="-z-30 object-cover object-center opacity-25"
            sizes="520px"
            src={ctaItem.bannerImage}
          />
        ) : null}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(6,8,18,.7),rgba(6,8,18,.96)_72%,#070a12)]" />
        <div className="absolute -right-24 top-10 -z-10 h-64 w-64 rounded-full bg-[var(--accent)]/15 blur-3xl" />

        <p className="inline-flex items-center gap-2 rounded-full border border-pink-400/15 bg-pink-500/10 px-3 py-2 text-[0.64rem] font-extrabold uppercase tracking-[0.12em] text-pink-300">
          <MaterialIcon className="text-[15px]" filled name="bolt" />
          Your anime destination
        </p>
        <h1 id="mobile-hero-title" className="mt-5 font-display text-[2.4rem] font-black leading-[1.08] tracking-[-0.055em] text-white">
          Find. Watch.
          <span className="mt-1 block bg-gradient-to-r from-[#ff4f91] to-[#ff78ad] bg-clip-text text-transparent">Fall in Love.</span>
        </h1>
        <p className="mt-4 max-w-[345px] text-[0.86rem] leading-6 text-slate-300">
          Search the live catalog, browse by filters, or jump straight to the anime you love.
        </p>

        <div id="mobile-search" className="relative z-30 mt-5 rounded-2xl border border-white/10 bg-white/[0.06] p-1.5 shadow-[0_18px_50px_rgba(0,0,0,.38)] backdrop-blur-xl">
          <SearchAutocomplete resultLimit={4} />
        </div>

        <nav aria-label="Quick anime links" className="mt-4 grid grid-cols-4 gap-2.5">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-[#10141f]/90 px-1 text-center text-[0.65rem] font-bold text-slate-200 shadow-[0_12px_30px_rgba(0,0,0,.22)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]"
            >
              <MaterialIcon className="text-[25px] text-white" name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        {collageItems.length ? (
          <div aria-label="Featured anime" className="mobile-poster-collage relative mx-auto mt-5 h-[250px] max-w-[390px]">
            {collageItems.map((item, index) => (
              <Link
                key={item.id}
                href={`/watch/${encodeURIComponent(item.urlSlug)}`}
                aria-label={`Open ${item.title}`}
                className={`mobile-collage-poster mobile-collage-poster--${index + 1} absolute overflow-hidden rounded-xl border border-white/15 bg-[#111522] shadow-[0_18px_35px_rgba(0,0,0,.55)] focus-visible:outline-2 focus-visible:outline-[var(--accent)]`}
              >
                <SensitiveImage fill isNsfw={item.isNsfw} alt={item.title} className="object-cover" sizes="135px" src={item.coverImage} />
              </Link>
            ))}
          </div>
        ) : null}
      </section>

      <main className="space-y-8 px-4 pt-1">
        <section aria-label="Why RioAnimePlay" className="grid grid-cols-2 gap-2.5">
          {BENEFITS.map((benefit) => (
            <article key={benefit.title} className="flex min-h-[84px] items-start gap-3 rounded-xl border border-white/[0.09] bg-[#10141e] p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ff4a89] to-[#c92967] text-white shadow-[0_8px_20px_rgba(236,54,119,.3)]">
                <MaterialIcon className="text-[19px]" filled name={benefit.icon} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[0.73rem] font-extrabold text-white">{benefit.title}</h2>
                <p className="mt-1 text-[0.62rem] leading-[1.45] text-slate-400">{benefit.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section id="mobile-top-search" aria-labelledby="mobile-top-search-title">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 id="mobile-top-search-title" className="flex min-w-0 items-center gap-2 font-display text-[1.05rem] font-extrabold text-white">
              <span aria-hidden="true">🔥</span>
              Top search right now
            </h2>
            <Link href="/anime/a-z" className="shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.67rem] font-bold text-slate-200">
              View all
            </Link>
          </div>

          {popularItems.length ? (
            <div className="mobile-popular-rail -mx-4 mt-3 flex snap-x gap-2.5 overflow-x-auto px-4 pb-2">
              {popularItems.map((item) => (
                <Link key={item.id} href={`/watch/${encodeURIComponent(item.urlSlug)}`} className="w-[100px] shrink-0 snap-start focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                  <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-[#111522]">
                    <SensitiveImage fill isNsfw={item.isNsfw} overlay="card" alt={item.title} className="object-cover" sizes="100px" src={item.coverImage} />
                  </div>
                  <h3 className="mt-2 line-clamp-1 text-[0.65rem] font-extrabold text-white">{item.title}</h3>
                  <p className="mt-1 line-clamp-1 text-[0.56rem] text-slate-400">{getMeta(item)}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </section>

        <section aria-labelledby="mobile-steps-title">
          <div className="text-center">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/10 px-4 py-2 text-[0.61rem] font-extrabold uppercase tracking-[0.12em] text-pink-300">
              <MaterialIcon className="text-[14px]" filled name="bolt" />
              How it works
            </p>
            <h2 id="mobile-steps-title" className="mt-3 font-display text-lg font-extrabold text-white">Get started in 3 easy steps</h2>
          </div>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative ml-7 flex min-h-[82px] items-center gap-4 rounded-xl border border-white/[0.09] bg-[#10141e] p-3 pl-7">
                <span className="absolute -left-4 top-3 grid h-7 w-7 place-items-center rounded-full bg-[#f0447e] text-[0.7rem] font-black text-white">{index + 1}</span>
                <MaterialIcon className="shrink-0 text-[38px] text-slate-100" name={step.icon} />
                <div>
                  <h3 className="text-[0.75rem] font-extrabold text-white">{step.title}</h3>
                  <p className="mt-1 text-[0.63rem] leading-[1.5] text-slate-400">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="relative isolate min-h-[198px] overflow-hidden rounded-xl border border-pink-400/40 bg-[#2a1020] p-5">
          {ctaItem ? (
            <SensitiveImage fill isNsfw={ctaItem.isNsfw} alt="" aria-hidden="true" className="-z-20 object-cover object-center opacity-55" sizes="490px" src={ctaItem.bannerImage ?? ctaItem.coverImage} />
          ) : null}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(35,9,26,.98)_0%,rgba(35,9,26,.84)_48%,rgba(35,9,26,.18)_100%)]" />
          <h2 className="max-w-[245px] font-display text-xl font-black leading-tight text-white">Ready to watch your next favorite anime?</h2>
          <p className="mt-2 max-w-[205px] text-[0.72rem] leading-5 text-slate-200">Explore thousands of titles and start your journey today.</p>
          <Link href="/" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#f33f7d] px-4 py-3 text-[0.72rem] font-extrabold text-white shadow-[0_10px_25px_rgba(243,63,125,.3)]">
            Browse catalog
            <MaterialIcon className="text-[17px]" name="arrow_forward" />
          </Link>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#0e121b] p-5">
          <h2 className="flex items-center gap-2 font-display text-base font-extrabold text-white">
            <MaterialIcon className="text-[22px] text-pink-400" name="star" />
            About RioAnimePlay
          </h2>
          <div className="mt-2 h-px w-36 bg-gradient-to-r from-pink-500 to-transparent" />
          <p className="mt-4 text-[0.75rem] leading-6 text-slate-300">
            RioAnimePlay is a simple place to start when you want to find something good to watch. The catalog is built for anime lovers who want discovery without the detour.
          </p>
          <Link href="/about" className="mt-4 inline-flex items-center gap-1 text-[0.72rem] font-bold text-pink-400">
            Learn more <MaterialIcon className="text-[16px]" name="chevron_right" />
          </Link>
        </section>

        {popularItems.length ? (
          <section aria-labelledby="mobile-list-title">
            <div className="flex items-center justify-between px-1">
              <h2 id="mobile-list-title" className="font-display text-base font-extrabold text-white">🔥 Top search right now</h2>
              <Link href="/anime/a-z" className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[0.67rem] font-bold text-slate-200">View all</Link>
            </div>
            <div className="mt-3 space-y-1.5">
              {popularItems.map((item) => (
                <Link key={item.id} href={`/watch/${encodeURIComponent(item.urlSlug)}`} className="flex min-h-[96px] items-center gap-3 rounded-xl border border-white/[0.08] bg-[#0e121b] p-2.5 focus-visible:outline-2 focus-visible:outline-[var(--accent)]">
                  <div className="relative h-[76px] w-[54px] shrink-0 overflow-hidden rounded-lg">
                    <SensitiveImage fill isNsfw={item.isNsfw} overlay="card" alt={item.title} className="object-cover" sizes="54px" src={item.coverImage} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-1 text-[0.75rem] font-extrabold text-white">{item.title}</h3>
                    <p className="mt-2 line-clamp-1 text-[0.65rem] text-slate-400">{getMeta(item)}</p>
                  </div>
                  <MaterialIcon className="text-[22px] text-slate-200" name="chevron_right" />
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <aside className="relative isolate overflow-hidden rounded-xl border border-pink-400/30 bg-[#291020] px-5 py-6 text-center">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(242,62,125,.25),transparent_38%)]" />
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-pink-300/50 bg-pink-500/10">
            <MaterialIcon className="text-[26px] text-white" name="mail" />
          </span>
          <h2 className="mt-3 text-sm font-extrabold text-white">Stay in the loop</h2>
          <p className="mt-2 text-[0.7rem] text-slate-300">Keep bookmarks and your next watch close at hand.</p>
          <Link href="/account" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#f33f7d] px-4 py-3 text-[0.73rem] font-extrabold text-white">
            Open your account <MaterialIcon className="text-[17px]" name="arrow_forward" />
          </Link>
        </aside>
      </main>

      <footer id="mobile-footer-nav" className="mt-9 border-t border-white/10 px-5 pb-4 pt-7">
        <SiteBrand compact href="/" />
        <p className="mt-4 max-w-[285px] text-[0.75rem] leading-6 text-slate-400">Your simple place to discover and watch amazing anime.</p>
        <nav aria-label="Footer navigation" className="mt-6 space-y-2">
          {[
            { label: "Explore", href: "/anime/a-z" },
            { label: "Filters", href: "/filter" },
            { label: "Your account", href: "/account" }
          ].map((item) => (
            <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#0e121b] px-3.5 py-3 text-[0.7rem] font-bold text-slate-200">
              {item.label}<MaterialIcon className="text-[18px]" name="chevron_right" />
            </Link>
          ))}
        </nav>
        <div className="mt-6 border-t border-white/[0.07] pt-5 text-[0.65rem] leading-5 text-slate-500">
          <p>© 2026 RioAnimePlay. All rights reserved.</p>
          <p>Made with <span className="text-pink-500">♥</span> for anime lovers.</p>
        </div>
      </footer>
    </div>
  );
}

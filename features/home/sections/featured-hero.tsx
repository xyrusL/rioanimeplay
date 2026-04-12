"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type FeaturedHeroProps = {
  featured: HomeAnimeItem[];
};

export function FeaturedHero({ featured }: FeaturedHeroProps) {
  const autoplay = useRef(
    Autoplay({
      delay: 3200,
      stopOnInteraction: false,
      stopOnMouseEnter: true
    })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      loop: true
    },
    [autoplay.current]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    onSelect();
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (featured.length === 0) {
    return (
      <section className="overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--hero-surface)] shadow-[var(--hero-shadow)]">
        <div className="flex min-h-[390px] flex-col items-center justify-center gap-3 px-6 py-10 text-center lg:min-h-[450px]">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
            <MaterialIcon className="text-[30px]" name="live_tv" />
          </span>
          <div className="space-y-1">
            <p className="font-display text-[1rem] uppercase tracking-[0.18em] text-[var(--text-primary)]">
              No Featured Anime
            </p>
            <p className="max-w-xl text-sm leading-6 text-[var(--text-secondary)]">
              AniList did not return featured anime right now. Live content will appear here when
              data is available.
            </p>
          </div>
        </div>
      </section>
    );
  }

  function getRankBadgeStyle(index: number) {
    if (index === 0) {
      return {
        borderColor: "rgba(255,207,112,0.36)",
        backgroundColor: "rgba(48,38,14,0.82)",
        color: "#ffcf70"
      };
    }

    if (index === 1) {
      return {
        borderColor: "rgba(140,214,134,0.34)",
        backgroundColor: "rgba(22,52,26,0.82)",
        color: "#8fe08b"
      };
    }

    if (index === 2) {
      return {
        borderColor: "rgba(255,143,143,0.34)",
        backgroundColor: "rgba(58,24,24,0.82)",
        color: "#ff9f9f"
      };
    }

    return {
      borderColor: "rgba(255,255,255,0.12)",
      backgroundColor: "rgba(15,16,21,0.78)",
      color: "var(--accent-strong)"
    };
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--line-soft)] bg-[var(--hero-surface)] shadow-[var(--hero-shadow)]">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {featured.map((item, index) => {
            const watchHref = `/watch/${toAnimeSlug(item.title)}`;

            return (
              <article key={item.id} className="min-w-0 shrink-0 grow-0 basis-full">
              <div className="relative h-[390px] overflow-hidden lg:h-[450px]">
                <div className="absolute inset-0">
                  <Image
                    fill
                    priority
                    alt={item.title}
                    className="object-cover opacity-30"
                    sizes="(max-width: 1280px) 100vw, 960px"
                    src={item.bannerImage ?? item.coverImage}
                  />
                  <div className="absolute inset-0 bg-[var(--hero-backdrop)]" />
                  <div className="absolute inset-0 bg-[var(--hero-accent-glow)]" />
                </div>
                <button
                  type="button"
                  aria-label={`Bookmark ${item.title}`}
                  className="absolute top-5 right-5 z-10 inline-flex h-[46px] w-[46px] items-center justify-center rounded-full border border-[var(--line-soft)] bg-[var(--cta-ghost)] text-[var(--text-secondary)] backdrop-blur transition-[transform,border-color,color,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] lg:top-7 lg:right-7"
                >
                  <MaterialIcon className="text-[20px]" name="bookmark_add" />
                </button>

                <div className="relative flex h-full flex-col p-5 lg:p-7">
                  <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start xl:grid-cols-[250px_minmax(0,1fr)]">
                    <Link
                      href={watchHref}
                      className={`group/poster relative block aspect-[4/5] max-w-[220px] overflow-hidden rounded-[22px] border shadow-[0_18px_42px_rgba(0,0,0,0.46)] transition-[transform,border-color,box-shadow] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-1 xl:max-w-[250px] ${
                        index === 0
                          ? "border-[rgba(255,207,112,0.34)] shadow-[0_18px_42px_rgba(0,0,0,0.46),0_0_0_1px_rgba(255,207,112,0.16),0_0_34px_rgba(255,207,112,0.18)] hover:border-[rgba(255,207,112,0.54)] hover:shadow-[0_18px_42px_rgba(0,0,0,0.46),0_0_0_1px_rgba(255,207,112,0.22),0_0_46px_rgba(255,207,112,0.24)]"
                          : index === 1
                            ? "border-[rgba(123,174,255,0.3)] shadow-[0_18px_42px_rgba(0,0,0,0.46),0_0_0_1px_rgba(123,174,255,0.14),0_0_30px_rgba(123,174,255,0.16)] hover:border-[rgba(123,174,255,0.48)] hover:shadow-[0_18px_42px_rgba(0,0,0,0.46),0_0_0_1px_rgba(123,174,255,0.2),0_0_42px_rgba(123,174,255,0.22)]"
                            : index === 2
                              ? "border-[rgba(255,159,159,0.3)] shadow-[0_18px_42px_rgba(0,0,0,0.46),0_0_0_1px_rgba(255,159,159,0.14),0_0_30px_rgba(255,159,159,0.16)] hover:border-[rgba(255,159,159,0.48)] hover:shadow-[0_18px_42px_rgba(0,0,0,0.46),0_0_0_1px_rgba(255,159,159,0.2),0_0_42px_rgba(255,159,159,0.22)]"
                              : "border-[rgba(255,255,255,0.12)] hover:border-[var(--line-strong)]"
                      }`}
                    >
                      <span
                        className="absolute top-3 left-3 z-10 inline-flex min-w-[2.4rem] items-center justify-center rounded-full border px-3 py-1.5 text-[0.95rem] font-bold leading-none backdrop-blur-sm"
                        style={getRankBadgeStyle(index)}
                      >
                        {index + 1}
                      </span>
                      <Image
                        fill
                        alt={item.title}
                        className="object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-soft)] group-hover/poster:scale-[1.04]"
                        sizes="(max-width: 1279px) 220px, 250px"
                        src={item.coverImage}
                      />
                    </Link>

                    <div className="flex min-h-0 max-w-[52rem] flex-col justify-start">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                          <MaterialIcon className="text-[15px]" filled name="kid_star" />
                          Featured
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(15,16,21,0.72)] px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-[var(--text-secondary)] backdrop-blur-sm">
                          <MaterialIcon className="text-[15px]" name="theaters" />
                          {item.subtitle}
                        </span>
                      </div>

                      <div className="mt-4 space-y-3 overflow-hidden">
                        <Link href={watchHref} className="block">
                          <h1 className="line-clamp-2 max-w-[16ch] text-[2.45rem] leading-[1.02] font-medium tracking-[0.01em] text-[var(--text-primary)] text-balance transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:text-[var(--accent-strong)] sm:text-[3rem] xl:text-[3.3rem]">
                            {item.title}
                          </h1>
                        </Link>
                        <p className="line-clamp-2 max-w-[44rem] text-[0.9rem] leading-6 text-[var(--text-secondary)] sm:text-[0.95rem]">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 flex min-h-[2.5rem] flex-wrap gap-2">
                        {item.genres.map((genre) => (
                          <span
                            key={genre}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(15,16,21,0.68)] px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-secondary)] backdrop-blur-sm"
                          >
                            <MaterialIcon className="text-[14px]" name="sell" />
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto flex flex-col gap-3 border-t border-[var(--line-soft)] pt-4">
                    <div className="flex flex-wrap items-center gap-3 sm:justify-between">
                      <div className="flex items-center gap-2">
                        {featured.map((slideItem, index) => (
                          <button
                            key={slideItem.id}
                            type="button"
                            aria-label={`Go to featured slide ${index + 1}`}
                            onClick={() => emblaApi?.scrollTo(index)}
                            className={`h-2.5 rounded-full transition-[width,background-color,transform] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:scale-110 ${
                              selectedIndex === index
                                ? "w-7 bg-[var(--accent)]"
                                : "w-2.5 bg-[rgba(255,255,255,0.14)]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => emblaApi?.scrollPrev()}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(15,16,21,0.72)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] backdrop-blur-sm transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[rgba(15,16,21,0.84)] hover:text-[var(--text-primary)]"
                      >
                        <MaterialIcon className="text-[16px]" name="chevron_left" />
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => emblaApi?.scrollNext()}
                        className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(15,16,21,0.72)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--text-secondary)] backdrop-blur-sm transition-[border-color,color,transform,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-[rgba(15,16,21,0.84)] hover:text-[var(--text-primary)]"
                      >
                        Next
                        <MaterialIcon className="text-[16px]" name="chevron_right" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

import { toAnimeSlug } from "@/entities/anime/lib/slug";
import type { HomeAnimeItem } from "@/entities/anime/model/types";
import {
  getBookmarkedAnimeIds,
  toggleAnimeBookmark
} from "@/shared/lib/watch-storage";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type MobileFeaturedCarouselProps = {
  featured: HomeAnimeItem[];
};

export function MobileFeaturedCarousel({
  featured
}: MobileFeaturedCarouselProps) {
  const autoplay = useRef(
    Autoplay({
      delay: 3600,
      stopOnInteraction: false,
      stopOnMouseEnter: true
    })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplay.current]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [bookmarkedIds, setBookmarkedIds] = useState<number[]>([]);

  useEffect(() => {
    setBookmarkedIds(getBookmarkedAnimeIds());

    const handleStorage = (event: StorageEvent) => {
      if (event.key && event.key !== "rioanime:bookmarks") {
        return;
      }

      setBookmarkedIds(getBookmarkedAnimeIds());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!emblaApi) {
      return;
    }

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());

    onSelect();
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (featured.length === 0) {
    return (
      <section className="rounded-[32px] border border-[var(--line-soft)] bg-[var(--bg-card)] px-5 py-8 text-center shadow-[var(--soft-shadow)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <MaterialIcon className="text-[28px]" name="live_tv" />
        </span>
        <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Nothing featured right now</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
          Fresh anime picks will show up here when the feed updates.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {featured.map((item) => {
            const href = `/watch/${toAnimeSlug(item.title)}`;
            const isBookmarked = bookmarkedIds.includes(item.id);

            return (
              <article key={item.id} className="min-w-0 shrink-0 grow-0 basis-full">
                <div className="relative h-[420px] overflow-hidden rounded-[34px] border border-[var(--line-soft)] bg-[var(--bg-card-strong)] shadow-[0_30px_64px_rgba(0,0,0,0.34)]">
                  <Image
                    fill
                    priority
                    alt={item.title}
                    className="object-cover"
                    sizes="(max-width: 1023px) 100vw, 420px"
                    src={item.bannerImage ?? item.coverImage}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,15,0.22),rgba(5,10,15,0.68)_48%,rgba(5,10,15,0.96))]" />
                  <div
                    className="absolute inset-x-[-20%] bottom-[-10%] h-[55%] rounded-full blur-3xl"
                    style={{ background: `${item.accent}55` }}
                  />

                  <div className="relative flex h-full flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="inline-flex items-center gap-2 rounded-full bg-[var(--badge-dark)] px-3 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)] backdrop-blur-md">
                        <MaterialIcon className="text-[16px]" filled name="kid_star" />
                        Featured
                      </div>
                      <button
                        type="button"
                        aria-label={isBookmarked ? `Remove ${item.title} bookmark` : `Bookmark ${item.title}`}
                        onClick={() => setBookmarkedIds(toggleAnimeBookmark(item.id))}
                        className={`flex h-12 w-12 items-center justify-center rounded-full border backdrop-blur-md transition-colors duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
                          isBookmarked
                            ? "border-[color:var(--gold)]/40 bg-[color:var(--gold)]/15 text-[var(--gold)]"
                            : "border-[var(--line-soft)] bg-[var(--badge-dark)] text-[var(--text-primary)]"
                        }`}
                      >
                        <MaterialIcon
                          className="text-[22px]"
                          filled={isBookmarked}
                          name={isBookmarked ? "favorite" : "favorite"}
                        />
                      </button>
                    </div>

                    <div className="mt-auto flex min-h-0 flex-col justify-end gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {item.genres.slice(0, 3).map((genre) => (
                            <span
                              key={genre}
                              className="rounded-full border border-[var(--line-soft)] bg-[var(--badge-dark)] px-3 py-1.5 text-[0.68rem] uppercase tracking-[0.18em] text-[var(--text-secondary)] backdrop-blur-sm"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                        <div>
                          <p className="text-[0.72rem] uppercase tracking-[0.24em] text-[var(--accent-strong)]">
                            {item.subtitle}
                          </p>
                          <h2 className="mt-2 line-clamp-4 min-h-[8.7rem] max-w-[12ch] text-[2.15rem] leading-[1.02] font-semibold text-[var(--text-primary)]">
                            {item.title}
                          </h2>
                        </div>
                        <p className="line-clamp-2 min-h-[3rem] max-w-[32ch] text-sm leading-6 text-[var(--text-secondary)]">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex min-h-[3.5rem] items-center gap-3">
                        <Link
                          href={href}
                          className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--accent-strong),var(--accent))] px-5 py-3 text-sm font-semibold text-[var(--bg-base)] shadow-[0_18px_34px_var(--accent-soft)]"
                        >
                          <MaterialIcon className="text-[20px]" filled name="play_arrow" />
                          Watch now
                        </Link>
                        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--badge-dark)] px-4 py-3 text-sm text-[var(--text-primary)] backdrop-blur-sm">
                          <MaterialIcon className="text-[18px] text-[var(--gold)]" filled name="star" />
                          {item.score ?? "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        {featured.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Go to featured slide ${index + 1}`}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`h-2.5 rounded-full transition-[width,background-color] duration-[var(--motion-base)] ease-[var(--ease-smooth)] ${
              selectedIndex === index ? "w-7 bg-[var(--accent)]" : "w-2.5 bg-[var(--line-soft)]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

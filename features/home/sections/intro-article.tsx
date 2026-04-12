import type { HomeAnimeItem } from "@/entities/anime/model/types";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type IntroArticleProps = {
  featured: HomeAnimeItem[];
};

function buildFeaturedLine(items: HomeAnimeItem[]) {
  return items
    .slice(0, 8)
    .map((item) => item.title)
    .join(", ");
}

export function IntroArticle({ featured }: IntroArticleProps) {
  const featuredLine = buildFeaturedLine(featured);

  return (
    <div className="space-y-3">
      <section className="rounded-[10px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.02)] px-3 py-2">
        <p className="flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.18em] text-[var(--gold)]">
          <MaterialIcon className="text-[14px]" name="share" />
          Share RioAnimePlay
        </p>
        <p className="mt-1 text-[0.86rem] text-[var(--text-muted)]">
          Save the titles you want to come back to later.
        </p>
      </section>

      <section className="rounded-[18px] border border-[var(--line-soft)] bg-[rgba(22,27,35,0.9)] px-5 py-5 shadow-[0_16px_34px_rgba(0,0,0,0.22)] sm:px-6">
        <div className="space-y-3">
          <h2 className="text-[2.2rem] leading-tight font-semibold text-[var(--text-primary)] sm:text-[2.6rem]">
            RioAnimePlay is a simple place to start when you want to find something good to watch.
          </h2>
          <p className="text-[1.05rem] leading-8 text-[var(--text-secondary)] sm:text-[1.12rem]">
            This introduction page gives you a clear look at what RioAnimePlay can do right now.
            The catalog is powered by live AniList data, the layout stays easy to read, and the
            focus stays on helping you move from curiosity to an actual title without getting lost
            in extra homepage widgets.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <section className="space-y-2">
            <h3 className="text-[1.28rem] font-semibold text-[var(--text-primary)]">
              1 / What can you do on RioAnimePlay today?
            </h3>
            <p className="text-[1rem] leading-8 text-[var(--text-secondary)]">
              RioAnimePlay is currently built around discovery and watch-entry pages. You can search
              for titles, browse with filters, move through the A-Z list, open a random title when
              you want something unexpected, save bookmarks locally, and view public watch pages for
              titles that are available on the site.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-[1.28rem] font-semibold text-[var(--text-primary)]">
              2 / How does finding something to watch feel here?
            </h3>
            <p className="text-[1rem] leading-8 text-[var(--text-secondary)]">
              Search suggestions come from the live catalog and lead you into the filter page when
              you want to narrow things down. From there, you can browse by season, year, and
              genre. If you already know what you want, the A-Z page gives you a more direct path
              without the extra steps.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-[1.28rem] font-semibold text-[var(--text-primary)]">
              3 / What should you expect from watch pages?
            </h3>
            <p className="text-[1rem] leading-8 text-[var(--text-secondary)]">
              Public titles open normally. Some titles may be marked as locked or private through
              site settings. Locked titles still appear in the catalog but show an unavailable
              state, while private titles are removed from public browsing so the visible catalog
              stays clean and intentional.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="text-[1.28rem] font-semibold text-[var(--text-primary)]">
              4 / What about accounts, bookmarks, and the overall design?
            </h3>
            <p className="text-[1rem] leading-8 text-[var(--text-secondary)]">
              Bookmarks already work as a front-end convenience, which makes it easy to keep a
              short list of titles you want to revisit. Login and register screens are present as
              part of the current UI flow, but they are still a presentation layer rather than a
              fully connected account system. The design side is already theme-aware, so appearance
              presets can change the overall look without rebuilding the layout.
            </p>
          </section>
        </div>

        <div className="mt-6 rounded-[12px] border border-[var(--line-soft)] bg-[rgba(255,255,255,0.03)] p-4">
          <p className="text-[0.82rem] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
            Top search
          </p>
          <p className="mt-2 text-[1rem] leading-8 text-[var(--text-secondary)]">
            Right now, some of the titles people can jump into from this page include {featuredLine || "live catalog entries from AniList"}.
          </p>
        </div>

      </section>
    </div>
  );
}

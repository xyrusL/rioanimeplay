import Link from "next/link";

import type { HomePageData } from "@/entities/anime/model/types";
import { HomeNavigationHeader } from "@/features/home/sections/home-navigation-header";
import { SiteFooter } from "@/features/home/sections/site-footer";
import type { SiteSettings } from "@/shared/lib/site-settings";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";
import { SensitiveImage } from "@/shared/ui/sensitive-image";

const PRINCIPLES = [
  {
    icon: "shield",
    title: "We don't store any information.",
    text: "Your data is safe with you."
  },
  {
    icon: "link",
    title: "We are just a middle platform.",
    text: "We outsource content from other websites and sources."
  },
  {
    icon: "smart_display",
    title: "Some videos have ads.",
    text: "They are placed by the source providers, not by us."
  },
  {
    icon: "favorite",
    title: "Made for anime lovers, by anime lovers.",
    text: "Our goal is simple: make anime more accessible for everyone."
  }
] as const;

type StoryStep = {
  icon: string;
  year?: string;
  title: string;
  text: string;
};

const STORY: StoryStep[] = [
  {
    icon: "rocket_launch",
    year: "2022",
    title: "The Beginning",
    text: "We started small, publishing simple Tagalog anime content with the goal of sharing what we love."
  },
  {
    icon: "monitoring",
    title: "Growth & Milestone",
    text: "Our hard work paid off. We reached 2,000+ viewers per day, motivating us to keep improving and bring more anime to all of you."
  },
  {
    icon: "pause",
    title: "9 Months Hiatus",
    text: "Due to issues with our sources and other challenges, we had to stop working on the site for a while."
  },
  {
    icon: "restart_alt",
    title: "Back for 8 Months",
    text: "We returned with new energy for 8 months, continuing to serve and improve your anime experience."
  },
  {
    icon: "auto_awesome",
    title: "The Story Continues",
    text: "We never stop building. RioAnimePlay continues to evolve, aiming to be a better platform for every anime fan out there."
  }
];

const CONTACTS = [
  {
    icon: "chat",
    label: "Message us on",
    value: "Facebook",
    action: "Send message",
    href: "https://m.me/rioanimeplay",
    cardClass: "hover:border-[#7b83ff]/50 hover:shadow-[0_18px_45px_rgba(99,91,255,.12)]",
    iconClass: "bg-[linear-gradient(135deg,#58a8ff,#755cff_55%,#d852d2)] shadow-[0_0_22px_rgba(100,93,255,.3)]",
    valueClass: "text-[#9b91ff]",
    actionClass: "bg-[#6257d9]/18 text-[#aaa2ff] hover:bg-[#6257d9]/30"
  },
  {
    icon: "mail",
    label: "Email us",
    value: "rioanime@dezely.com",
    action: "Send email",
    href: "mailto:rioanime@dezely.com",
    cardClass: "hover:border-[#e35d91]/50 hover:shadow-[0_18px_45px_rgba(227,93,145,.12)]",
    iconClass: "bg-[linear-gradient(135deg,#f078a6,#c83f76)] shadow-[0_0_22px_rgba(227,93,145,.3)]",
    valueClass: "text-[#f07eaa]",
    actionClass: "bg-[#d54d82]/18 text-[#f18bb1] hover:bg-[#d54d82]/30"
  },
  {
    icon: "public",
    label: "Visit our",
    value: "Facebook Page",
    action: "Go to page",
    href: "https://www.facebook.com/rioanimeplay",
    cardClass: "hover:border-[#438df5]/50 hover:shadow-[0_18px_45px_rgba(67,141,245,.12)]",
    iconClass: "bg-[linear-gradient(135deg,#64afff,#246bd8)] shadow-[0_0_22px_rgba(67,141,245,.3)]",
    valueClass: "text-[#6eafff]",
    actionClass: "bg-[#347ee5]/18 text-[#81b8ff] hover:bg-[#347ee5]/30"
  }
] as const;

type AboutScreenProps = {
  authLockdown: SiteSettings["authLockdown"];
  homePageData: HomePageData;
  member: { name: string; email: string; image: string | null } | null;
};

export function AboutScreen({ authLockdown, homePageData, member }: AboutScreenProps) {
  const visualItems = [...homePageData.featured, ...homePageData.grid]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index)
    .slice(0, 6);
  const heroBackdrop = homePageData.spotlight ?? visualItems[0];

  return (
    <main className="about-page min-h-screen overflow-hidden text-[var(--text-primary)]">
      <div className="site-shell mx-auto w-full max-w-[1280px] px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8">
        <HomeNavigationHeader authLockdown={authLockdown} member={member} />

        <section className="about-hero relative isolate grid min-h-[500px] items-center gap-10 overflow-hidden py-14 lg:grid-cols-[.9fr_1.1fr] lg:py-20">
          {heroBackdrop ? (
            <SensitiveImage
              fill
              priority
              isNsfw={heroBackdrop.isNsfw}
              alt=""
              aria-hidden="true"
              className="-z-30 object-cover opacity-[.12]"
              sizes="1280px"
              src={heroBackdrop.bannerImage ?? heroBackdrop.coverImage}
            />
          ) : null}
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,var(--bg-base)_0%,rgba(12,12,16,.87)_46%,rgba(12,12,16,.44)_100%)]" />

          <div className="relative z-10 max-w-[520px] px-1 sm:px-5 lg:px-8">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">About us</p>
            <h1 className="mt-4 font-display text-[clamp(2.8rem,5.5vw,4.8rem)] font-extrabold leading-[1.03] tracking-[-0.055em] text-white">
              More than just a <span className="text-[var(--accent-strong)]">streaming site.</span>
            </h1>
            <p className="mt-5 max-w-[470px] text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
              RioAnimePlay is built for anime lovers. We&apos;re not the source, we&apos;re the bridge that connects you to content you love.
            </p>
          </div>

          {visualItems.length ? (
            <div aria-label="Anime available through RioAnimePlay" className="about-collage relative mx-auto h-[330px] w-full max-w-[600px] sm:h-[390px] lg:h-[420px]">
              {visualItems.slice(0, 5).map((item, index) => (
                <Link
                  key={item.id}
                  href={`/watch/${encodeURIComponent(item.urlSlug)}`}
                  aria-label={`Open ${item.title}`}
                  className={`about-collage-card about-collage-card--${index + 1} absolute overflow-hidden border border-[var(--line-strong)] bg-[var(--bg-panel)] shadow-[0_18px_50px_rgba(0,0,0,.55)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--accent)]`}
                >
                  <SensitiveImage fill isNsfw={item.isNsfw} overlay="card" alt={item.title} className="object-cover transition-transform duration-[var(--motion-slow)] hover:scale-105" sizes="300px" src={item.bannerImage ?? item.coverImage} />
                </Link>
              ))}
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 z-20 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[var(--accent)] text-white shadow-[0_0_40px_var(--accent-wash)]">
                <MaterialIcon className="text-[38px]" filled name="play_arrow" />
              </span>
            </div>
          ) : null}
        </section>

        <section aria-labelledby="principles-title" className="relative z-10 -mt-3 overflow-hidden rounded-[26px] border border-[var(--line-soft)] bg-[rgba(16,16,20,.86)] shadow-[0_24px_70px_rgba(0,0,0,.35)] backdrop-blur-xl">
          <h2 id="principles-title" className="sr-only">What you should know about RioAnimePlay</h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4">
            {PRINCIPLES.map((principle) => (
              <article key={principle.title} className="about-principle relative px-7 py-8 text-center xl:min-h-[220px]">
                <MaterialIcon className="text-[42px] text-[var(--accent-strong)] drop-shadow-[0_0_12px_var(--accent-wash)]" name={principle.icon} />
                <h3 className="mx-auto mt-5 max-w-[210px] text-sm font-bold leading-5 text-white">{principle.title}</h3>
                <p className="mx-auto mt-3 max-w-[220px] text-xs leading-5 text-[var(--text-muted)]">{principle.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="story-title" className="px-1 py-16 sm:px-5 sm:py-20 lg:px-8">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Our story</p>
          <h2 id="story-title" className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">
            The Journey of <span className="text-[var(--accent-strong)]">RioAnimePlay</span>
          </h2>

          <ol className="about-story mt-10">
            {STORY.map((step, index) => {
              const image = visualItems[index];
              return (
                <li key={step.title} className="about-story-row relative grid gap-5 pb-7 pl-[76px] sm:pl-[96px] md:grid-cols-[minmax(0,.85fr)_minmax(300px,1.15fr)] md:items-stretch md:pb-0">
                  <span className="about-story-icon absolute left-0 top-0 z-10 grid h-14 w-14 place-items-center rounded-full border border-[var(--accent)] bg-[var(--bg-card-strong)] text-[var(--accent-strong)] shadow-[0_0_22px_var(--accent-wash)] sm:left-2">
                    <MaterialIcon className="text-[25px]" filled name={step.icon} />
                  </span>
                  <div className="py-3 md:py-6">
                    {step.year ? <p className="font-display text-2xl font-extrabold text-white">{step.year}</p> : null}
                    <h3 className={`${step.year ? "mt-1" : ""} text-sm font-extrabold text-[var(--accent-strong)] sm:text-base`}>{step.title}</h3>
                    <p className="mt-3 max-w-[520px] text-xs leading-6 text-[var(--text-secondary)] sm:text-sm">{step.text}</p>
                  </div>
                  <div className="relative hidden min-h-[150px] overflow-hidden border-b border-[var(--line-soft)] md:block">
                    {image ? <SensitiveImage fill isNsfw={image.isNsfw} overlay="card" alt="" aria-hidden="true" className="object-cover opacity-60" sizes="560px" src={image.bannerImage ?? image.coverImage} /> : null}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-base)] via-[rgba(14,14,18,.2)] to-[rgba(14,14,18,.15)]" />
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        <section id="how-it-works" className="grid gap-8 overflow-hidden rounded-[26px] border border-[var(--line-strong)] bg-[linear-gradient(110deg,rgba(20,19,24,.98),rgba(16,15,20,.92))] p-7 shadow-[var(--card-shadow)] sm:p-10 lg:grid-cols-[1fr_340px] lg:items-center">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-[-0.035em] text-white sm:text-3xl">We Just Connect You to What <span className="text-[var(--accent-strong)]">You Love</span></h2>
            <p className="mt-5 max-w-[700px] text-sm leading-7 text-[var(--text-secondary)]">
              We don&apos;t own the content that&apos;s shown on this site. We simply organize and connect links from other platforms that host the videos. All rights go to the original owners.
            </p>
          </div>
          <div aria-hidden="true" className="about-source-map relative mx-auto h-[168px] w-full max-w-[340px] text-[var(--accent-strong)]">
            <span className="absolute left-0 top-1/2 grid h-24 w-36 -translate-y-1/2 place-items-center rounded-xl border-2 border-[var(--accent-strong)] bg-[var(--accent-soft)] shadow-[0_0_24px_var(--accent-wash)]">
              <MaterialIcon className="text-[48px]" filled name="laptop_mac" />
            </span>
            <svg className="absolute inset-0 h-full w-full overflow-visible drop-shadow-[0_0_5px_var(--accent-wash)]" viewBox="0 0 340 168" fill="none">
              <path d="M144 84H169M169 28V140M169 28H274M169 84H274M169 140H274" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m266 20 8 8-8 8M266 76l8 8-8 8M266 132l8 8-8 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute right-0 top-0 grid gap-2">
              {["smart_display", "video_library", "live_tv"].map((icon) => (
                <span key={icon} className="grid h-12 w-14 place-items-center rounded-md border-2 border-[var(--accent-strong)] bg-[rgba(26,20,27,.96)] shadow-[0_0_14px_var(--accent-wash)]">
                  <MaterialIcon className="text-[28px]" filled name={icon} />
                </span>
              ))}
            </span>
          </div>
        </section>

        <section aria-labelledby="contact-title" className="px-1 py-16 sm:px-5 sm:py-20 lg:px-8">
          <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-[var(--accent-strong)]">Contact us</p>
          <h2 id="contact-title" className="mt-3 font-display text-3xl font-extrabold tracking-[-0.04em] text-white sm:text-4xl">We&apos;re Here to Help</h2>
          <p className="mt-4 text-sm text-[var(--text-secondary)]">If you have questions, suggestions, or just want to say hi, feel free to reach out.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {CONTACTS.map((contact) => (
              <article key={contact.value} className={`rounded-[22px] border border-[var(--line-soft)] bg-[var(--bg-card)] p-6 transition-[border-color,box-shadow,transform] hover:-translate-y-1 ${contact.cardClass}`}>
                <div className="flex items-center gap-4">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-white ${contact.iconClass}`}><MaterialIcon className="text-[26px]" filled name={contact.icon} /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white">{contact.label}</p>
                    <p className={`mt-1 truncate text-xs font-bold ${contact.valueClass}`}>{contact.value}</p>
                  </div>
                </div>
                <a href={contact.href} target={contact.href.startsWith("http") ? "_blank" : undefined} rel={contact.href.startsWith("http") ? "noreferrer" : undefined} className={`mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-current ${contact.actionClass}`}>
                  {contact.action}<MaterialIcon className="text-[16px]" name="north_east" />
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="relative mb-8 grid min-h-[240px] overflow-hidden rounded-[26px] border border-[var(--line-strong)] bg-[var(--bg-card-strong)] sm:grid-cols-[280px_1fr]">
          {visualItems[5] ? (
            <div className="relative min-h-[220px] sm:min-h-full">
              <SensitiveImage fill isNsfw={visualItems[5].isNsfw} overlay="card" alt="" aria-hidden="true" className="object-cover object-top opacity-80" sizes="300px" src={visualItems[5].coverImage} />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[var(--bg-card-strong)]" />
            </div>
          ) : null}
          <div className="relative flex flex-col justify-center p-7 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,var(--accent-wash),transparent_28%)]" />
            <h2 className="relative font-display text-2xl font-extrabold tracking-[-0.035em] text-white sm:text-3xl">Thank You for Supporting Us!</h2>
            <p className="relative mt-4 max-w-[640px] text-sm leading-7 text-[var(--text-secondary)]">
              Maraming salamat sa inyong suporta at pagtitiwala. Dahil sa inyo, patuloy kaming nagpupursige at nagkakaroon ng inspirasyon na pagbutihin pa ang RioAnimePlay. Sana ay patuloy kayong manatili sa aming journey. Arigatou gozaimasu!
            </p>
          </div>
        </section>

        <SiteFooter variant="landing" />
      </div>
    </main>
  );
}

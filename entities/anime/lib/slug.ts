type SluggableTitle = {
  romaji?: string | null;
  english?: string | null;
  native?: string | null;
  userPreferred?: string | null;
};

export function toAnimeSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function slugToSearchText(slug: string) {
  return slug.replace(/-/g, " ").trim();
}

export function matchesAnimeSlug(title: SluggableTitle, slug: string) {
  return [title.english, title.userPreferred, title.romaji, title.native]
    .filter(Boolean)
    .some((candidate) => toAnimeSlug(candidate as string) === slug);
}

export function formatDecimalScore(score: number | null) {
  if (score === null) {
    return "N/A";
  }

  const tenScale = score / 10;
  const rounded = Math.round(tenScale * 10) / 10;

  return Number.isInteger(rounded) ? `${rounded}` : rounded.toFixed(1);
}

export function titleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function pickTitle(title: {
  romaji: string | null;
  english: string | null;
  native: string | null;
  userPreferred: string | null;
}) {
  return (
    title.english ??
    title.userPreferred ??
    title.romaji ??
    title.native ??
    "Untitled Anime"
  );
}

export function cleanDescription(value: string | null) {
  if (!value) {
    return "A hand-picked anime spotlight for the RioAnime front page.";
  }

  const withoutTags = value.replace(/<[^>]+>/g, " ");
  const withoutEntities = withoutTags
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/<br\s*\/?>/gi, " ");

  return withoutEntities.replace(/\s+/g, " ").trim();
}

export function trimText(value: string, limit: number) {
  if (value.length <= limit) {
    return value;
  }

  return `${value.slice(0, limit - 1).trimEnd()}...`;
}

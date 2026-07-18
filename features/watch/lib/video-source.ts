export type ResolvedVideoSource =
  | { kind: "mp4"; url: string }
  | { kind: "youtube"; videoId: string; url: string }
  | { kind: "iframe"; provider: "gdrive" | "generic"; url: string };

function normalizeGoogleDriveUrl(url: URL) {
  const fileMatch = url.pathname.match(/^\/file\/d\/([^/]+)/);
  if (fileMatch) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  const id = url.searchParams.get("id");
  if (id) {
    return `https://drive.google.com/file/d/${id}/preview`;
  }

  return url.toString();
}

function getYouTubeVideoId(url: URL) {
  const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
  if (hostname === "youtu.be") return url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (hostname !== "youtube.com" && hostname !== "m.youtube.com") return null;
  if (url.pathname === "/watch") return url.searchParams.get("v");

  const pathParts = url.pathname.split("/").filter(Boolean);
  if (["embed", "shorts", "live"].includes(pathParts[0])) return pathParts[1] ?? null;
  return null;
}

export function resolveVideoSource(rawUrl: string): ResolvedVideoSource | null {
  const repairedUrl = rawUrl
    .trim()
    .replace(/^hhttps:\/\//i, "https://")
    .replace(/^https?:\/\/youtube\//i, "https://youtube.com/");
  let url: URL;

  try {
    url = new URL(repairedUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  const hostname = url.hostname.toLowerCase();
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId && /^[a-zA-Z0-9_-]{6,20}$/.test(youtubeId)) {
    return { kind: "youtube", videoId: youtubeId, url: url.toString() };
  }

  if (url.pathname.toLowerCase().endsWith(".mp4")) {
    return { kind: "mp4", url: url.toString() };
  }

  if (hostname === "drive.google.com" || hostname === "docs.google.com") {
    return { kind: "iframe", provider: "gdrive", url: normalizeGoogleDriveUrl(url) };
  }

  return { kind: "iframe", provider: "generic", url: url.toString() };
}

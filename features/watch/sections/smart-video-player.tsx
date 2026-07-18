"use client";

import { useEffect, useRef, useState } from "react";

import { resolveVideoSource, type ResolvedVideoSource } from "@/features/watch/lib/video-source";
import { MaterialIcon } from "@/shared/ui/icons/material-icon";

type SmartVideoPlayerProps = {
  animeId: string;
  episodeNumber: number;
  poster: string;
  title: string;
  className?: string;
  compactControls?: boolean;
  reloadToken?: number;
};

type EpisodeResponse = {
  episode?: {
    episodeNumber: number;
    videoUrl: string;
  };
};

const MINIMUM_LOADING_DURATION_MS = 1300;

function LoadingCover({ episodeNumber, poster }: { episodeNumber: number; poster: string }) {
  return (
    <div className="absolute inset-0 z-10 bg-black">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${poster})` }}
      />
      <div className="relative flex h-full min-h-[240px] items-center justify-center gap-3 text-sm text-[var(--text-secondary)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--accent-strong)]" />
        Loading episode {episodeNumber}
      </div>
    </div>
  );
}

function YouTubePlayer({ source, title }: { source: Extract<ResolvedVideoSource, { kind: "youtube" }>; title: string }) {
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let player: { destroy: () => void } | null = null;

    void import("plyr").then(({ default: Plyr }) => {
      if (disposed || !playerRef.current) return;
      player = new Plyr(playerRef.current, {
        autoplay: false,
        controls: ["play-large", "play", "progress", "current-time", "mute", "volume", "settings", "fullscreen"],
        youtube: { noCookie: true, rel: 0, modestbranding: 1 }
      });
    });

    return () => {
      disposed = true;
      player?.destroy();
    };
  }, [source.videoId]);

  return (
    <div className="rioanime-player h-full w-full bg-black" aria-label={title}>
      <div ref={playerRef} data-plyr-provider="youtube" data-plyr-embed-id={source.videoId} />
    </div>
  );
}

function Mp4Player({
  poster,
  source,
  title
}: {
  poster: string;
  source: Extract<ResolvedVideoSource, { kind: "mp4" }>;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let disposed = false;
    let player: { destroy: () => void } | null = null;

    void import("plyr").then(({ default: Plyr }) => {
      if (disposed || !videoRef.current) return;
      player = new Plyr(videoRef.current, {
        autoplay: false,
        controls: [
          "play-large",
          "restart",
          "rewind",
          "play",
          "fast-forward",
          "progress",
          "current-time",
          "duration",
          "mute",
          "volume",
          "settings",
          "pip",
          "fullscreen"
        ],
        seekTime: 10
      });
    });

    return () => {
      disposed = true;
      player?.destroy();
    };
  }, [source.url]);

  return (
    <div className="rioanime-player h-full w-full bg-black">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        controls
        playsInline
        poster={poster}
        preload="metadata"
        aria-label={title}
      >
        <source src={source.url} type="video/mp4" />
        Your browser does not support HTML video.
      </video>
    </div>
  );
}

export function SmartVideoPlayer({
  animeId,
  episodeNumber,
  poster,
  title,
  className,
  compactControls = false,
  reloadToken = 0
}: SmartVideoPlayerProps) {
  const [source, setSource] = useState<ResolvedVideoSource | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [minimumLoadingComplete, setMinimumLoadingComplete] = useState(false);

  useEffect(() => {
    setMinimumLoadingComplete(false);
    const timer = window.setTimeout(
      () => setMinimumLoadingComplete(true),
      MINIMUM_LOADING_DURATION_MS
    );
    return () => window.clearTimeout(timer);
  }, [animeId, episodeNumber, reloadKey, reloadToken]);

  useEffect(() => {
    const controller = new AbortController();
    setSource(null);
    setError("");
    setIsIframeLoading(false);

    void fetch(
      `/api/watch-episode?animeId=${encodeURIComponent(animeId)}&episode=${episodeNumber}`,
      { cache: "no-store", signal: controller.signal }
    )
      .then(async (response) => {
        if (!response.ok) throw new Error(`Episode lookup failed with status ${response.status}`);
        const payload = (await response.json()) as EpisodeResponse;
        const resolved = payload.episode?.videoUrl
          ? resolveVideoSource(payload.episode.videoUrl)
          : null;
        if (!resolved) throw new Error("Episode source is not a valid web video URL");
        setIsIframeLoading(resolved.kind === "iframe");
        setSource(resolved);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError("This episode source could not be loaded.");
      });

    return () => controller.abort();
  }, [animeId, episodeNumber, reloadKey, reloadToken]);

  const containerClass = `relative isolate w-full overflow-hidden bg-black ${compactControls ? "rioanime-player--compact h-[240px]" : "aspect-video"} ${className ?? ""}`;

  if (error) {
    return (
      <div className={containerClass}>
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: `url(${poster})` }} />
        <div className="relative flex h-full min-h-[240px] flex-col items-center justify-center gap-4 px-6 text-center">
          <MaterialIcon className="text-[38px] text-[var(--accent-strong)]" name="broken_image" />
          <p className="text-sm text-[var(--text-secondary)]">{error}</p>
          <button
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
            className="rounded-full border border-[var(--line-strong)] bg-[var(--accent-soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]"
          >
            Retry source
          </button>
        </div>
      </div>
    );
  }

  if (!source) {
    return (
      <div className={containerClass}>
        <LoadingCover episodeNumber={episodeNumber} poster={poster} />
      </div>
    );
  }

  if (source.kind === "mp4") {
    return (
      <div className={containerClass}>
        <Mp4Player
          key={source.url}
          poster={poster}
          source={source}
          title={`${title} episode ${episodeNumber}`}
        />
        {!minimumLoadingComplete ? (
          <LoadingCover episodeNumber={episodeNumber} poster={poster} />
        ) : null}
      </div>
    );
  }

  if (source.kind === "youtube") {
    return (
      <div className={containerClass}>
        <YouTubePlayer key={source.videoId} source={source} title={`${title} episode ${episodeNumber}`} />
        {!minimumLoadingComplete ? (
          <LoadingCover episodeNumber={episodeNumber} poster={poster} />
        ) : null}
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <iframe
        key={source.url}
        className="h-full w-full border-0 bg-black"
        src={source.url}
        title={`${title} episode ${episodeNumber}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        onLoad={() => setIsIframeLoading(false)}
        referrerPolicy="strict-origin-when-cross-origin"
        sandbox={
          source.provider === "gdrive"
            ? "allow-forms allow-presentation allow-same-origin allow-scripts"
            : undefined
        }
      />
      {isIframeLoading || !minimumLoadingComplete ? (
        <LoadingCover episodeNumber={episodeNumber} poster={poster} />
      ) : null}
      {source.provider === "gdrive" ? (
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 z-20 h-14 w-16 touch-none bg-black/[0.02] select-none sm:h-16 sm:w-20"
          onContextMenu={(event) => event.preventDefault()}
        />
      ) : null}
    </div>
  );
}

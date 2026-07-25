"use client";

import { useEffect } from "react";

export function useWatchDocumentTitle(title: string, episodeNumber: number) {
  useEffect(() => {
    document.title = `${title} - EP ${episodeNumber} | RioAnimePlay`;
  }, [episodeNumber, title]);
}

import { redirect } from "next/navigation";

import {
  parseGenreQuery,
  normalizeGenre,
  serializeGenreQuery
} from "@/features/browse/model/filter-utils";

export const dynamic = "force-dynamic";

type GenrePageProps = {
  params: Promise<{
    genre: string;
  }>;
  searchParams: Promise<{
    q?: string;
    type?: string;
    genres?: string;
    page?: string;
    season?: string;
    year?: string;
  }>;
};

export default async function GenreFilterPage({ params, searchParams }: GenrePageProps) {
  const { genre } = await params;
  const routeGenre = normalizeGenre(genre);
  const query = await searchParams;
  const selectedGenres = [...new Set([routeGenre, ...parseGenreQuery(query.genres)])];
  const nextParams = new URLSearchParams();

  if (query.year) {
    nextParams.set("year", query.year);
  }

  if (query.q) {
    nextParams.set("q", query.q);
  }

  if (query.type) {
    nextParams.set("type", query.type);
  }

  if (query.season) {
    nextParams.set("season", query.season);
  }

  if (query.page) {
    nextParams.set("page", query.page);
  }

  nextParams.set("genres", serializeGenreQuery(selectedGenres));

  redirect(`/filter?${nextParams.toString()}`);
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { SearchResults, SearchFilters } from "@/types/search";

export function useSearch(filters: SearchFilters) {
  const { query, type = "all", calendarIds } = filters;

  return useQuery<SearchResults>({
    queryKey: ["search", query, type, calendarIds],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("type", type);
      if (calendarIds?.length) {
        params.set("calendarIds", calendarIds.join(","));
      }
      return apiGet<SearchResults>(`/search?${params.toString()}`);
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import type { AnalyticsData, AnalyticsRange } from "@/types/analytics";
import type { WeeklyDigest } from "@/types/weeklyDigest";

interface AnalyticsResponse {
  analytics: AnalyticsData;
}

export function useAnalytics(
  range: AnalyticsRange,
  customStart?: string,
  customEnd?: string
) {
  return useQuery<AnalyticsResponse>({
    queryKey: ["analytics", range, customStart, customEnd],
    queryFn: () => {
      const params = new URLSearchParams({ range });
      if (customStart) params.set("start", customStart);
      if (customEnd) params.set("end", customEnd);
      return apiGet<AnalyticsResponse>(`/analytics?${params}`);
    },
  });
}

export function useWeeklyDigest(weekStart: string) {
  return useQuery<{ digest: WeeklyDigest | null }>({
    queryKey: ["weekly-digest", weekStart],
    queryFn: () =>
      apiGet<{ digest: WeeklyDigest | null }>(
        `/analytics/weekly-digest?weekStart=${encodeURIComponent(weekStart)}`
      ),
  });
}

export function useGenerateWeeklyDigest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weekStart: string) =>
      apiPost<{ digest: WeeklyDigest }>("/analytics/weekly-digest", { weekStart }),
    onSuccess: (_data, weekStart) => {
      queryClient.invalidateQueries({ queryKey: ["weekly-digest", weekStart] });
    },
  });
}

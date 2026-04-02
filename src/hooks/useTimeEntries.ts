"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import { useTimerStore } from "@/stores/timerStore";
import type { TimeEntry } from "@/types/timeEntry";

interface TimeEntriesResponse {
  timeEntries: TimeEntry[];
}

interface TimeEntryFilters {
  calendarIds?: string[];
  start?: string;
  end?: string;
  eventId?: string;
  taskId?: string;
  isBillable?: boolean;
}

export function useTimeEntries(filters: TimeEntryFilters = {}) {
  return useQuery<TimeEntriesResponse>({
    queryKey: ["time-entries", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.calendarIds?.length) params.set("calendarIds", filters.calendarIds.join(","));
      if (filters.start) params.set("start", filters.start);
      if (filters.end) params.set("end", filters.end);
      if (filters.eventId) params.set("eventId", filters.eventId);
      if (filters.taskId) params.set("taskId", filters.taskId);
      if (filters.isBillable !== undefined) params.set("isBillable", String(filters.isBillable));
      return apiGet<TimeEntriesResponse>(`/time-entries?${params}`);
    },
  });
}

export function useRunningTimer() {
  const hydrateFromServer = useTimerStore((s) => s.hydrateFromServer);
  return useQuery<{ timeEntry: TimeEntry | null }>({
    queryKey: ["time-entries", "running"],
    queryFn: async () => {
      const result = await apiGet<{ timeEntry: TimeEntry | null }>("/time-entries/running");
      hydrateFromServer(result.timeEntry);
      return result;
    },
    refetchInterval: 60_000,
  });
}

export function useCreateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      description?: string;
      eventId?: string;
      taskId?: string;
      calendarId: string;
      startedAt: string;
      endedAt?: string;
      isBillable?: boolean;
    }) => apiPost<TimeEntry>("/time-entries", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

export function useUpdateTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiPatch<TimeEntry>(`/time-entries/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

export function useDeleteTimeEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/time-entries/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  const stopTimer = useTimerStore((s) => s.stopTimer);
  return useMutation({
    mutationFn: ({ entryId, endedAt }: { entryId: string; endedAt: string }) =>
      apiPost<TimeEntry>("/time-entries/stop", { entryId, endedAt }),
    onSuccess: () => {
      stopTimer();
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();
  const startTimer = useTimerStore((s) => s.startTimer);
  return useMutation({
    mutationFn: (data: {
      label: string;
      calendarId: string;
      startedAt: string;
      description?: string;
      eventId?: string;
      taskId?: string;
      eventEndTime?: Date;
    }) =>
      apiPost<TimeEntry>("/time-entries", {
        calendarId: data.calendarId,
        startedAt: data.startedAt,
        description: data.description ?? data.label,
        eventId: data.eventId,
        taskId: data.taskId,
        isBillable: false,
      }),
    onSuccess: (entry, variables) => {
      startTimer(
        entry.id,
        variables.label,
        new Date(entry.startedAt),
        entry.calendarId,
        variables.eventEndTime
      );
      queryClient.invalidateQueries({ queryKey: ["time-entries"] });
    },
  });
}

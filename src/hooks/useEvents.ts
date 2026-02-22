"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import type { Event, EventOccurrence, CreateEventInput, UpdateEventInput, RecurrenceScope } from "@/types/event";
import type { DateRange } from "@/types/common";

interface EventsResponse {
  events: EventOccurrence[];
}

export function useEvents(range: DateRange, calendarIds: string[]) {
  return useQuery<EventsResponse>({
    queryKey: [
      "events",
      range.start.toISOString(),
      range.end.toISOString(),
      calendarIds.join(","),
    ],
    queryFn: () => {
      const params = new URLSearchParams({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      });
      if (calendarIds.length > 0) {
        params.set("calendarIds", calendarIds.join(","));
      }
      return apiGet<EventsResponse>(`/events?${params}`);
    },
    enabled: calendarIds.length > 0,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEventInput) =>
      apiPost<Event>("/events", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
      scope,
      occurrenceDate,
    }: {
      id: string;
      data: UpdateEventInput;
      scope?: RecurrenceScope;
      occurrenceDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (scope) params.set("scope", scope);
      if (occurrenceDate) params.set("occurrenceDate", occurrenceDate);
      const qs = params.toString();
      return apiPatch<Event>(`/events/${id}${qs ? `?${qs}` : ""}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      scope,
      occurrenceDate,
    }: {
      id: string;
      scope?: RecurrenceScope;
      occurrenceDate?: string;
    }) => {
      const params = new URLSearchParams();
      if (scope) params.set("scope", scope);
      if (occurrenceDate) params.set("occurrenceDate", occurrenceDate);
      const qs = params.toString();
      return apiDelete(`/events/${id}${qs ? `?${qs}` : ""}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

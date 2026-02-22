"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import type { Calendar } from "@/types/calendar";
import type { CreateCalendarInput, UpdateCalendarInput } from "@/lib/validators";

export function useCalendars() {
  return useQuery<Calendar[]>({
    queryKey: ["calendars"],
    queryFn: () => apiGet<Calendar[]>("/calendars"),
  });
}

export function useCreateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCalendarInput) =>
      apiPost<Calendar>("/calendars", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
}

export function useUpdateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCalendarInput;
    }) => apiPatch<Calendar>(`/calendars/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
}

export function useDeleteCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/calendars/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendars"] });
    },
  });
}

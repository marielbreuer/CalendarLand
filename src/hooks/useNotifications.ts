"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api-client";
import type { Notification } from "@/types/notification";

interface NotificationsResponse {
  notifications: Notification[];
}

export function useNotifications(status?: "unread") {
  const params = status ? `?status=${status}` : "";
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", status],
    queryFn: () => apiGet<NotificationsResponse>(`/notifications${params}`),
    staleTime: 15_000,
  });
}

export function useUnreadCount() {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", "unread"],
    queryFn: () => apiGet<NotificationsResponse>("/notifications?status=unread"),
    refetchInterval: 30_000,
    select: (data) => data,
  });
}

export function useDueNotifications() {
  return useQuery<NotificationsResponse>({
    queryKey: ["notifications", "due"],
    queryFn: () => apiGet<NotificationsResponse>("/notifications/due"),
    refetchInterval: 30_000,
  });
}

export function useUpdateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      update,
    }: {
      id: string;
      update: { fired?: boolean; read?: boolean; dismissed?: boolean };
    }) => apiPatch<Notification>(`/notifications/${id}`, update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useBatchUpdateNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      update,
    }: {
      ids: string[];
      update: { read?: boolean; dismissed?: boolean };
    }) => apiPatch<{ updated: number }>("/notifications/batch", { ids, update }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useSyncNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { type: string; eventId?: string }) =>
      apiPost<unknown>("/notifications/sync", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

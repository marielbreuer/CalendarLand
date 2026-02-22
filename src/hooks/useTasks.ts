"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import type { Task, CreateTaskInput, UpdateTaskInput, ReorderTaskInput } from "@/types/task";

interface TasksResponse {
  tasks: Task[];
}

interface TaskFilters {
  status?: string;
  calendarIds?: string[];
  dueBefore?: string;
  dueAfter?: string;
}

export function useTasks(filters: TaskFilters = {}) {
  return useQuery<TasksResponse>({
    queryKey: ["tasks", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.calendarIds?.length) {
        params.set("calendarIds", filters.calendarIds.join(","));
      }
      if (filters.dueBefore) params.set("dueBefore", filters.dueBefore);
      if (filters.dueAfter) params.set("dueAfter", filters.dueAfter);
      const qs = params.toString();
      return apiGet<TasksResponse>(`/tasks${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      apiPost<Task>("/tasks", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskInput }) =>
      apiPatch<Task>(`/tasks/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tasks: ReorderTaskInput[]) =>
      apiPatch<{ success: boolean }>("/tasks/reorder", { tasks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

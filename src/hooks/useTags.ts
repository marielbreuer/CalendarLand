"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";
import type { Tag, CreateTagInput, UpdateTagInput } from "@/types/tag";

interface TagsResponse {
  tags: Tag[];
}

export function useTags(query?: string) {
  return useQuery<TagsResponse>({
    queryKey: ["tags", query ?? ""],
    queryFn: () => {
      const params = query ? `?q=${encodeURIComponent(query)}` : "";
      return apiGet<TagsResponse>(`/tags${params}`);
    },
    staleTime: 60_000,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTagInput) =>
      apiPost<Tag>("/tags", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagInput }) =>
      apiPatch<Tag>(`/tags/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`/tags/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

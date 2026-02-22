import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  SchedulingPage,
  CreateSchedulingPageInput,
  UpdateSchedulingPageInput,
} from "@/types/scheduling";

const PAGES_KEY = ["scheduling-pages"];

async function fetchPages(): Promise<{ pages: SchedulingPage[] }> {
  const res = await fetch("/api/scheduling-pages");
  if (!res.ok) throw new Error("Failed to fetch scheduling pages");
  return res.json();
}

async function createPage(data: CreateSchedulingPageInput): Promise<SchedulingPage> {
  const res = await fetch("/api/scheduling-pages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to create scheduling page");
  }
  return res.json();
}

async function updatePage({
  id,
  data,
}: {
  id: string;
  data: UpdateSchedulingPageInput;
}): Promise<SchedulingPage> {
  const res = await fetch(`/api/scheduling-pages/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update scheduling page");
  }
  return res.json();
}

async function deletePage(id: string): Promise<void> {
  const res = await fetch(`/api/scheduling-pages/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error("Failed to delete scheduling page");
  }
}

export function useSchedulingPages() {
  return useQuery({
    queryKey: PAGES_KEY,
    queryFn: fetchPages,
    select: (data) => data.pages,
  });
}

export function useCreateSchedulingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPage,
    onSuccess: () => qc.invalidateQueries({ queryKey: PAGES_KEY }),
  });
}

export function useUpdateSchedulingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updatePage,
    onSuccess: () => qc.invalidateQueries({ queryKey: PAGES_KEY }),
  });
}

export function useDeleteSchedulingPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePage,
    onSuccess: () => qc.invalidateQueries({ queryKey: PAGES_KEY }),
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserSettings, UpdateSettingsInput } from "@/types/settings";

const SETTINGS_KEY = ["settings"];

async function fetchSettings(): Promise<UserSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function patchSettings(data: UpdateSettingsInput): Promise<UserSettings> {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || "Failed to update settings");
  }
  return res.json();
}

export function useSettings() {
  return useQuery<UserSettings>({
    queryKey: SETTINGS_KEY,
    queryFn: fetchSettings,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: patchSettings,
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_KEY, data);
    },
  });
}

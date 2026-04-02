import { useQuery } from "@tanstack/react-query";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  lifetimePoints: number;
  role: string;
}

async function fetchUserProfile(): Promise<UserProfile> {
  const res = await fetch("/api/users/me");
  if (!res.ok) throw new Error("Failed to fetch user profile");
  return res.json();
}

export function useUserPoints() {
  return useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchUserProfile,
    staleTime: 30_000,
  });
}

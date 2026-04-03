import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { pullSync } from "@/lib/google-calendar";

export async function POST() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const result = await pullSync(userId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}

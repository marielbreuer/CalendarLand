import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { listGoogleCalendars } from "@/lib/google-calendar";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  try {
    const calendars = await listGoogleCalendars(userId);
    return NextResponse.json({ calendars });
  } catch {
    return NextResponse.json({ message: "Failed to list calendars" }, { status: 500 });
  }
}

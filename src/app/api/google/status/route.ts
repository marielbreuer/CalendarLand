import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const conn = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
    select: {
      googleEmail: true,
      googleCalendarId: true,
      calendarId: true,
      lastSyncedAt: true,
    },
  });

  return NextResponse.json({ connected: !!conn, connection: conn ?? null });
}

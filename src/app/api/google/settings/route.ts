import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

/** Update which Google calendar and which Calendar Land calendar to sync. */
export async function PATCH(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const { calendarId, googleCalendarId } = body as {
    calendarId?: string | null;
    googleCalendarId?: string;
  };

  // Verify calendarId belongs to this user
  if (calendarId) {
    const cal = await prisma.calendar.findFirst({ where: { id: calendarId, userId } });
    if (!cal) return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
  }

  const conn = await prisma.googleCalendarConnection.findUnique({ where: { userId } });
  if (!conn) return NextResponse.json({ message: "Not connected" }, { status: 404 });

  const calendarChanged =
    calendarId !== conn.calendarId || (googleCalendarId && googleCalendarId !== conn.googleCalendarId);

  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: {
      ...(calendarId !== undefined && { calendarId }),
      ...(googleCalendarId && { googleCalendarId }),
      // Reset sync token when the target changes so we re-sync
      ...(calendarChanged && { syncToken: null }),
    },
  });

  return NextResponse.json({ success: true });
}

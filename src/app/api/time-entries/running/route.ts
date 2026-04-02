import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";

export async function GET() {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const calendarIds = userCalendars.map((c) => c.id);

  const timeEntry = await prisma.timeEntry.findFirst({
    where: {
      calendarId: { in: calendarIds },
      endedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });

  return NextResponse.json({ timeEntry });
}

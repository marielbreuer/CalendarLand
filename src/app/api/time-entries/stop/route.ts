import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stopTimerSchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";
import { differenceInMinutes } from "date-fns";

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = stopTimerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
  }

  const { entryId, endedAt } = parsed.data;

  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const calendarIds = userCalendars.map((c) => c.id);

  const entry = await prisma.timeEntry.findFirst({
    where: { id: entryId, calendarId: { in: calendarIds }, endedAt: null },
  });
  if (!entry) {
    return NextResponse.json({ message: "Running timer not found" }, { status: 404 });
  }

  const endedAtDate = new Date(endedAt);
  const duration = differenceInMinutes(endedAtDate, entry.startedAt);

  const updated = await prisma.timeEntry.update({
    where: { id: entryId },
    data: { endedAt: endedAtDate, duration },
  });

  return NextResponse.json({ timeEntry: updated });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTimeEntrySchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";
import { differenceInMinutes } from "date-fns";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const sp = request.nextUrl.searchParams;
  const requestedCalendarIds = sp.get("calendarIds")?.split(",").filter(Boolean);
  const start = sp.get("start");
  const end = sp.get("end");
  const eventId = sp.get("eventId");
  const taskId = sp.get("taskId");
  const isBillable = sp.get("isBillable");

  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true },
  });
  const userCalendarIds = userCalendars.map((c) => c.id);

  const effectiveCalendarIds = requestedCalendarIds?.length
    ? requestedCalendarIds.filter((id) => userCalendarIds.includes(id))
    : userCalendarIds;

  const where: Record<string, unknown> = {
    calendarId: { in: effectiveCalendarIds },
  };
  if (start || end) {
    const dateFilter: Record<string, Date> = {};
    if (start) dateFilter.gte = new Date(start);
    if (end) dateFilter.lte = new Date(end);
    where.startedAt = dateFilter;
  }
  if (eventId) where.eventId = eventId;
  if (taskId) where.taskId = taskId;
  if (isBillable !== null && isBillable !== undefined) {
    where.isBillable = isBillable === "true";
  }

  const timeEntries = await prisma.timeEntry.findMany({
    where,
    orderBy: { startedAt: "desc" },
    include: { calendar: { select: { id: true, name: true, color: true } } },
  });

  return NextResponse.json({ timeEntries });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const parsed = createTimeEntrySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
  }

  const { calendarId, startedAt, endedAt, ...rest } = parsed.data;

  const calendar = await prisma.calendar.findFirst({ where: { id: calendarId, userId } });
  if (!calendar) {
    return NextResponse.json({ message: "Calendar not found" }, { status: 404 });
  }

  let duration: number | null = null;
  if (endedAt) {
    duration = differenceInMinutes(new Date(endedAt), new Date(startedAt));
  }

  const timeEntry = await prisma.timeEntry.create({
    data: {
      ...rest,
      calendarId,
      userId,
      startedAt: new Date(startedAt),
      endedAt: endedAt ? new Date(endedAt) : null,
      duration,
    },
  });

  return NextResponse.json({ timeEntry }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-guard";
import { addDays, startOfWeek, endOfWeek } from "date-fns";
import type { WeeklyDigestData } from "@/types/weeklyDigest";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const weekStart = request.nextUrl.searchParams.get("weekStart");
  if (!weekStart) {
    return NextResponse.json({ message: "weekStart is required" }, { status: 400 });
  }

  const digest = await prisma.weeklyDigest.findUnique({
    where: { userId_weekStart: { userId, weekStart: new Date(weekStart) } },
  });

  if (!digest) return NextResponse.json({ digest: null });

  return NextResponse.json({
    digest: {
      ...digest,
      data: JSON.parse(digest.data) as WeeklyDigestData,
    },
  });
}

export async function POST(request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const body = await request.json();
  const weekStartStr: string = body.weekStart;
  if (!weekStartStr) {
    return NextResponse.json({ message: "weekStart is required" }, { status: 400 });
  }

  const weekStartDate = startOfWeek(new Date(weekStartStr), { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const nextWeekStart = addDays(weekEndDate, 1);
  const nextWeekEnd = addDays(nextWeekStart, 6);

  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true, name: true },
  });
  const calendarIds = userCalendars.map((c) => c.id);
  const calendarMap = Object.fromEntries(userCalendars.map((c) => [c.id, c.name]));

  const [timeEntries, events, completedTasks, upcomingEvents] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        calendarId: { in: calendarIds },
        startedAt: { gte: weekStartDate, lte: weekEndDate },
        endedAt: { not: null },
      },
      select: { calendarId: true, duration: true },
    }),
    prisma.event.findMany({
      where: {
        calendarId: { in: calendarIds },
        startTime: { gte: weekStartDate, lte: weekEndDate },
        isException: false,
      },
      select: { id: true },
    }),
    prisma.task.findMany({
      where: {
        calendarId: { in: calendarIds },
        status: "done",
        updatedAt: { gte: weekStartDate, lte: weekEndDate },
      },
      select: { id: true },
    }),
    prisma.event.findMany({
      where: {
        calendarId: { in: calendarIds },
        startTime: { gte: nextWeekStart, lte: nextWeekEnd },
        isException: false,
      },
      orderBy: { startTime: "asc" },
      take: 5,
      select: { title: true, startTime: true, calendarId: true },
    }),
  ]);

  // Aggregate hours per calendar
  const hoursMap = new Map<string, number>();
  for (const e of timeEntries) {
    hoursMap.set(e.calendarId, (hoursMap.get(e.calendarId) ?? 0) + (e.duration ?? 0));
  }
  const hoursPerCalendar = Array.from(hoursMap.entries()).map(([calendarId, minutes]) => ({
    calendarId,
    calendarName: calendarMap[calendarId] ?? calendarId,
    minutes,
  }));

  const data: WeeklyDigestData = {
    weekStart: weekStartDate.toISOString(),
    weekEnd: weekEndDate.toISOString(),
    hoursPerCalendar,
    meetingsAttended: events.length,
    tasksCompleted: completedTasks.length,
    upcomingEvents: upcomingEvents.map((e) => ({
      title: e.title,
      startTime: e.startTime.toISOString(),
      calendarName: calendarMap[e.calendarId] ?? e.calendarId,
    })),
  };

  const digest = await prisma.weeklyDigest.upsert({
    where: { userId_weekStart: { userId, weekStart: weekStartDate } },
    create: { userId, weekStart: weekStartDate, data: JSON.stringify(data) },
    update: { data: JSON.stringify(data), generatedAt: new Date() },
  });

  return NextResponse.json({
    digest: {
      ...digest,
      data,
    },
  });
}

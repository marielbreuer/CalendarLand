import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyticsQuerySchema } from "@/lib/validators";
import { requireAuth } from "@/lib/auth-guard";
import { getAnalyticsRange } from "@/lib/dates";
import {
  buildCalendarHours,
  buildDailyMeetingLoad,
  buildFocusMeeting,
  buildTaskCompletion,
  buildHeatmap,
} from "@/lib/analytics";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { userId } = authResult;

  const sp = request.nextUrl.searchParams;
  const parsed = analyticsQuerySchema.safeParse({
    range: sp.get("range") ?? undefined,
    start: sp.get("start") ?? undefined,
    end: sp.get("end") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.errors[0].message }, { status: 400 });
  }

  const { range, start, end } = parsed.data;
  const { start: rangeStart, end: rangeEnd } = getAnalyticsRange(range, start, end);

  const userCalendars = await prisma.calendar.findMany({
    where: { userId },
    select: { id: true, name: true, color: true },
  });
  const calendarIds = userCalendars.map((c) => c.id);

  const [timeEntries, events, completedTasks] = await Promise.all([
    prisma.timeEntry.findMany({
      where: {
        calendarId: { in: calendarIds },
        startedAt: { gte: rangeStart, lte: rangeEnd },
        endedAt: { not: null },
      },
      select: { calendarId: true, duration: true },
    }),
    prisma.event.findMany({
      where: {
        calendarId: { in: calendarIds },
        startTime: { gte: rangeStart, lte: rangeEnd },
        isException: false,
      },
      select: { startTime: true, endTime: true, isFocusTime: true },
    }),
    prisma.task.findMany({
      where: {
        calendarId: { in: calendarIds },
        status: "done",
        updatedAt: { gte: rangeStart, lte: rangeEnd },
      },
      select: { updatedAt: true },
    }),
  ]);

  const calendarHours = buildCalendarHours(timeEntries, userCalendars);
  const totalTrackedMinutes = calendarHours.reduce((sum, c) => sum + c.totalMinutes, 0);

  const billableEntries = await prisma.timeEntry.findMany({
    where: {
      calendarId: { in: calendarIds },
      startedAt: { gte: rangeStart, lte: rangeEnd },
      endedAt: { not: null },
      isBillable: true,
    },
    select: { duration: true },
  });
  const billableMinutes = billableEntries.reduce((sum, e) => sum + (e.duration ?? 0), 0);

  return NextResponse.json({
    analytics: {
      calendarHours,
      dailyMeetingLoad: buildDailyMeetingLoad(
        events.map((e) => ({
          startTime: e.startTime,
          endTime: e.endTime,
          isFocusTime: e.isFocusTime,
        }))
      ),
      focusMeeting: buildFocusMeeting(
        events.map((e) => ({
          startTime: e.startTime,
          endTime: e.endTime,
          isFocusTime: e.isFocusTime,
        }))
      ),
      taskCompletion: buildTaskCompletion(completedTasks, rangeStart, rangeEnd),
      heatmap: buildHeatmap(events.map((e) => ({ startTime: e.startTime }))),
      totalTrackedMinutes,
      billableMinutes,
      dateRange: {
        start: rangeStart.toISOString(),
        end: rangeEnd.toISOString(),
      },
    },
  });
}
